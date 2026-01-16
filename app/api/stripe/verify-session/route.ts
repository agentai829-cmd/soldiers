import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      )
    }

    console.log('🔍 Verifying session:', sessionId)

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    console.log('📦 Session data:', {
      paymentStatus: session.payment_status,
      metadata: session.metadata,
      subscription: session.subscription
    })

    if (session.payment_status === 'paid') {
      // Get metadata
      const workspaceId = session.metadata?.workspaceId
      const unlockedAgents = session.metadata?.unlockedAgents || ''
      
      console.log('💳 Payment successful!')
      console.log('   Workspace:', workspaceId)
      console.log('   Agents to unlock:', unlockedAgents)

      if (workspaceId && unlockedAgents && session.subscription) {
        // Parse soldiers to unlock
        let soldiersToUnlock: string[] = []
        if (unlockedAgents.includes(',')) {
          soldiersToUnlock = unlockedAgents.split(',').map((s: string) => s.trim())
        } else {
          soldiersToUnlock = [unlockedAgents]
        }

        console.log('🎖️  Soldiers to unlock:', soldiersToUnlock)

        // Get subscription details
        const subscription = session.subscription as Stripe.Subscription

        // Check if subscription already exists
        const existingSubscription = await db.billingSubscription.findUnique({
          where: { workspaceId }
        })

        if (existingSubscription) {
          console.log('📝 Updating existing subscription')
          // Merge with existing soldiers
          const combinedSoldiers = Array.from(new Set([
            ...existingSubscription.unlockedSoldiers,
            ...soldiersToUnlock
          ]))
          
          console.log('   Combined soldiers:', combinedSoldiers)
          
          await db.billingSubscription.update({
            where: { workspaceId },
            data: {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              unlockedSoldiers: combinedSoldiers,
              status: subscription.status.toUpperCase() as any,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })
          console.log('✅ Subscription updated!')
        } else {
          console.log('📝 Creating new subscription')
          await db.billingSubscription.create({
            data: {
              workspaceId,
              planId: session.metadata?.planType || 'starter',
              planType: session.metadata?.planType || 'starter',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              unlockedSoldiers: soldiersToUnlock,
              status: subscription.status.toUpperCase() as any,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })
          console.log('✅ Subscription created!')
        }
      }

      return NextResponse.json({
        success: true,
        customerId: session.customer,
        subscriptionId: session.subscription,
        unlockedSoldiers: unlockedAgents.split(',').map((s: string) => s.trim())
      })
    }

    return NextResponse.json(
      { error: 'Payment not completed' },
      { status: 400 }
    )
  } catch (error) {
    console.error('❌ Session verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}
