import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

/**
 * Manual sync endpoint to fetch subscription from Stripe and save to database
 * This is a backup when webhook listener is not running
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const { sessionId, workspaceId } = await request.json()

    if (!sessionId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing sessionId or workspaceId' },
        { status: 400 }
      )
    }

    console.log('🔄 AUTO SYNC - Payment detected for session:', sessionId)
    console.log('   Workspace ID:', workspaceId)
    console.log('   User ID:', userId)

    // Fetch the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (!session.subscription) {
      return NextResponse.json(
        { error: 'No subscription found in session' },
        { status: 404 }
      )
    }

    const subscription = session.subscription as Stripe.Subscription
    const metadata = session.metadata || {}
    const interval =
      subscription.items.data[0]?.price?.recurring?.interval || 'month'
    const amount = subscription.items.data[0]?.price?.unit_amount || 0
    const isYearly = interval === 'year' || amount >= 19900 // $199+

    // Determine unlocked soldiers based on plan
    let unlockedAgents =
      metadata.unlockedAgents?.split(',').map((s) => s.trim()) || []
    if (unlockedAgents.length === 0) {
      // Fallback: determine from price
      unlockedAgents = isYearly
        ? ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot']
        : ['buddy']
    }

    console.log('📦 Fetched from Stripe:', {
      subscriptionId: subscription.id,
      interval,
      amount: amount / 100,
      unlockedAgents,
      status: subscription.status,
    })

    // 1. Update User subscription data
    const customerEmail = session.customer_details?.email
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'No customer email found' },
        { status: 400 }
      )
    }

    console.log('👤 Updating user subscription for:', customerEmail)

    const dbUser = await db.user.findUnique({
      where: { email: customerEmail },
      include: {
        createdWorkspaces: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Update user table
    await db.user.update({
      where: { email: customerEmail },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        subscriptionStatus: subscription.status,
        currentPlanName: isYearly ? 'yearly' : 'monthly',
        subscriptionStartDate: new Date(
          subscription.current_period_start * 1000
        ),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
    console.log('✅ User table updated successfully')

    // 2. Check if workspace exists, if not create it
    let actualWorkspaceId = workspaceId
    let workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      console.log('⚠️ Workspace not found, creating new workspace...')

      // Create workspace for user
      workspace = await db.workspace.create({
        data: {
          name: `${dbUser.name}'s Workspace`,
          slug: `${customerEmail.split('@')[0]}-workspace-${Date.now()}`,
          description: 'Your personal workspace',
          creatorId: dbUser.id,
          stripeCustomerId: session.customer as string,
          members: {
            create: {
              userId: dbUser.id,
              role: 'ADMIN',
            },
          },
        },
      })

      actualWorkspaceId = workspace.id
      console.log('✅ Workspace created:', workspace.name)
    }

    // 3. Check if billing subscription exists
    const existing = await db.billingSubscription.findUnique({
      where: { workspaceId: actualWorkspaceId },
    })

    if (existing) {
      // Update existing subscription
      const combinedSoldiers = Array.from(
        new Set([...existing.unlockedSoldiers, ...unlockedAgents])
      )

      await db.billingSubscription.update({
        where: { workspaceId: actualWorkspaceId },
        data: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0]?.price?.id,
          status: subscription.status.toUpperCase() as any,
          planType: isYearly ? 'BUNDLE' : 'SINGLE',
          interval: interval as any,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          unlockedSoldiers: combinedSoldiers,
        },
      })

      console.log(
        '✅ Updated billing subscription with',
        combinedSoldiers.length,
        'soldiers'
      )

      return NextResponse.json({
        success: true,
        unlockedSoldiers: combinedSoldiers,
        workspaceId: actualWorkspaceId,
        message: 'Payment synced successfully',
      })
    } else {
      // Create new billing subscription
      const priceId = subscription.items.data[0]?.price?.id || 'unknown'

      await db.billingSubscription.create({
        data: {
          workspaceId: actualWorkspaceId,
          planId: priceId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: priceId,
          status: subscription.status.toUpperCase() as any,
          planType: isYearly ? 'BUNDLE' : 'SINGLE',
          interval: interval as any,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          unlockedSoldiers: unlockedAgents,
        },
      })

      console.log(
        '✅ Created new billing subscription with',
        unlockedAgents.length,
        'soldiers'
      )

      return NextResponse.json({
        success: true,
        unlockedSoldiers: unlockedAgents,
        workspaceId: actualWorkspaceId,
        message: 'Payment synced successfully',
      })
    }
  } catch (error: any) {
    console.error('❌ Sync error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync subscription',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
