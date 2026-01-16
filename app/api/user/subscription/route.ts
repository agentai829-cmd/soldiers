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
      include: {
        unlockedSoldiers: true,
      },
    })

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
      })
    }

    // Don't fetch price from Stripe API - use hardcoded prices on frontend
    // Stripe API price may not match our bundle pricing logic

    // Format subscription data

    // Map all unlocked soldiers name where expiry date is in the future
    const now = new Date()
    // const initialsSoldiers = [
    //   "builder-bot",
    //   "dev-bot",
    //   "pm-bot",
    //   "commet",
    //   "soshie",
    // ]
    // const addOnsSoldiers = [
    //   "buddy",
    //   "pitch-bot",
    //   "growth-bot",
    //   "strategy-adviser",
    //   "penn",
    // ]

    const initialUnlockedSoldiers = subscription.unlockedSoldiers
      .filter((soldier) => {
        if (
          soldier.interval === 'LIFETIME' &&
          soldier.type === 'WITHOUT_ADDONS'
        ) {
          return true
        }
        const validExpiry = (soldier.currentPeriodEnd || new Date(0)) > now

        const withoutAddOns = soldier.type === 'WITHOUT_ADDONS'

        return validExpiry && withoutAddOns
      })
      .flatMap((soldier) => soldier.unlockedSoldiers)

    const addOnUnlockedSoldiers = subscription.unlockedSoldiers
      .filter((soldier) => {
        if (soldier.interval === 'LIFETIME' && soldier.type === 'ADDONS') {
          return true
        }
        const validExpiry = (soldier.currentPeriodEnd || new Date(0)) > now

        const withAddOns = soldier.type === 'ADDONS'

        return validExpiry && withAddOns
      })
      .flatMap((soldier) => ({
        addOnUnlockedSoldiers: soldier.unlockedSoldiers,
        expiryDate: soldier.currentPeriodEnd,
        interval: soldier.interval,
        amount: soldier.amount,
      }))

    const subscriptionData = {
      id: subscription.id,
      planType: subscription.planType,
      interval: subscription.interval,
      status: subscription.status,
      amount: subscription.amount,
      currentPeriodEnd: subscription.currentPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      unlockedSoldiers: initialUnlockedSoldiers || [],
      addOnUnlockedSoldiers: addOnUnlockedSoldiers || [],
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
