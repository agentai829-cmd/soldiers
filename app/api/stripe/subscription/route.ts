import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      )
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        billingSubscription: true,
      },
    })

    if (!workspace) {
      console.log('⚠️ Workspace not found:', workspaceId)
      return NextResponse.json({ subscription: null })
    }

    // Check database subscription status first
    const dbSubscription = workspace.billingSubscription

    // If NO subscription in database, return null
    if (!dbSubscription) {
      console.log('✅ No subscription in database for workspace:', workspaceId)
      return NextResponse.json({ subscription: null })
    }

    // If subscription is CANCELLED in database, return null regardless of Stripe status
    if (dbSubscription.status === 'CANCELLED') {
      console.log('🚫 Subscription cancelled in database, returning null')
      return NextResponse.json({ subscription: null })
    }

    // If no Stripe customer ID, check if there's a local subscription
    if (!workspace.stripeCustomerId) {
      if (dbSubscription.status === 'ACTIVE') {
        // Return local subscription details
        console.log('✅ Returning local subscription')
        return NextResponse.json({
          subscription: {
            id: dbSubscription.stripeSubscriptionId,
            status: 'active',
            planName:
              dbSubscription.planType === 'SINGLE'
                ? 'Single Soldier'
                : 'All Soldiers',
            amount: dbSubscription.planType === 'SINGLE' ? 9 : 99,
            interval: dbSubscription.interval || 'month',
            currentPeriodEnd: dbSubscription.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: false,
          },
        })
      }
      return NextResponse.json({ subscription: null })
    }

    // Get subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: workspace.stripeCustomerId,
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      console.log('⚠️ No Stripe subscriptions found, deleting DB subscription')
      // Clean up database if Stripe has no subscription
      await db.billingSubscription
        .delete({
          where: { workspaceId },
        })
        .catch(() => {})
      return NextResponse.json({ subscription: null })
    }

    const subscription = subscriptions.data[0]

    // If Stripe subscription is cancelled, delete from database
    if (
      subscription.status === 'canceled' ||
      subscription.status === 'cancelled'
    ) {
      console.log('🚫 Stripe subscription cancelled, deleting from database')
      await db.billingSubscription
        .delete({
          where: { workspaceId },
        })
        .catch(() => {})
      return NextResponse.json({ subscription: null })
    }

    const planName =
      subscription.items.data[0]?.price.nickname || 'Unknown Plan'
    const amount = (subscription.items.data[0]?.price.unit_amount || 0) / 100
    const interval =
      subscription.items.data[0]?.price.recurring?.interval || 'month'

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName,
        amount,
        interval,
        currentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
