import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

/**
 * BULLETPROOF Auto-Sync Endpoint
 * This endpoint checks and syncs ANY user's payment from Stripe
 * Called automatically on workspace page load
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('🔄 AUTO-CHECK: Verifying subscription for:', email)

    // Check database first
    const user = await db.user.findUnique({
      where: { email },
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user already has active subscription, return it
    if (user.subscriptionStatus === 'active' && user.createdWorkspaces[0]?.billingSubscription?.status === 'ACTIVE') {
      console.log('✅ Subscription already synced')
      return NextResponse.json({ 
        synced: true, 
        alreadyActive: true,
        subscription: user.subscriptionStatus,
        soldiers: user.createdWorkspaces[0]?.billingSubscription?.unlockedSoldiers || []
      })
    }

    console.log('⚠️ Subscription not synced, checking Stripe...')

    // Check Stripe for payment
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      console.log('❌ No Stripe customer found')
      return NextResponse.json({ 
        synced: false, 
        message: 'No payment found in Stripe' 
      })
    }

    const customer = customers.data[0]
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      console.log('❌ No active subscription found')
      return NextResponse.json({ 
        synced: false, 
        message: 'No active subscription in Stripe' 
      })
    }

    const subscription = subscriptions.data[0]
    console.log('✅ Found active subscription in Stripe:', subscription.id)

    // SYNC NOW!
    const interval = subscription.items.data[0].price.recurring?.interval || 'month'
    const amount = subscription.items.data[0].price.unit_amount! / 100

    // Update User table
    await db.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        subscriptionStatus: subscription.status,
        currentPlanName: interval === 'year' ? 'yearly' : 'monthly',
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    })
    console.log('✅ User table updated')

    // Determine soldiers
    let unlockedSoldiers = []
    if (interval === 'year' || amount >= 99) {
      unlockedSoldiers = ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot']
    } else {
      unlockedSoldiers = ['buddy']
    }

    // Update/Create workspace billing
    if (user.createdWorkspaces.length > 0) {
      const workspace = user.createdWorkspaces[0]
      
      if (workspace.billingSubscription) {
        await db.billingSubscription.update({
          where: { id: workspace.billingSubscription.id },
          data: {
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            status: 'ACTIVE',
            planType: interval === 'year' || amount >= 99 ? 'BUNDLE' : 'SINGLE',
            interval: interval,
            unlockedSoldiers: unlockedSoldiers,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          }
        })
      } else {
        await db.billingSubscription.create({
          data: {
            workspaceId: workspace.id,
            planId: subscription.items.data[0].price.id,
            planType: interval === 'year' || amount >= 99 ? 'BUNDLE' : 'SINGLE',
            interval: interval,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            unlockedSoldiers: unlockedSoldiers,
            status: 'ACTIVE',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          }
        })
      }
      console.log('✅ Workspace billing updated')
    }

    console.log('🎉 SYNC COMPLETE!')

    return NextResponse.json({ 
      synced: true,
      subscription: subscription.status,
      plan: interval === 'year' ? 'yearly' : 'monthly',
      soldiers: unlockedSoldiers,
      message: 'Payment synced successfully'
    })

  } catch (error: any) {
    console.error('❌ Auto-sync error:', error)
    return NextResponse.json({ 
      error: 'Sync failed',
      details: error.message 
    }, { status: 500 })
  }
}
