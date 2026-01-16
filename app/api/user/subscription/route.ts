import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET() {
  try {
    const { userId } = await auth()
    console.log('🔐 Auth userId (Clerk ID):', userId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get the user from our database using Clerk ID
    const user = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    })

    console.log(
      '👤 User found:',
      user ? { id: user.id, email: user.email } : 'NOT FOUND'
    )

    if (!user) {
      return NextResponse.json({
        subscription: null,
        message: 'User not found',
      })
    }

    // Find subscription in any of the user's workspaces

    const subscription = await db.billingSubscription.findFirst({
      where: {
        clerkId: userId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(
      '💳 Subscription found:',
      subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            unlockedSoldiers: subscription.unlockedSoldiers,
            planType: subscription.planType,
          }
        : 'NOT FOUND'
    )

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
      })
    }

    // Don't fetch price from Stripe API - use hardcoded prices on frontend
    // Stripe API price may not match our bundle pricing logic

    // Format subscription data
    const subscriptionData = {
      id: subscription.id,
      planType: subscription.planType,
      interval: subscription.interval,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      unlockedSoldiers: subscription.unlockedSoldiers || [],
      createdAt: subscription.createdAt,
    }

    console.log('✅ Returning subscription data:', subscriptionData)

    return NextResponse.json({
      subscription: subscriptionData,
    })
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
