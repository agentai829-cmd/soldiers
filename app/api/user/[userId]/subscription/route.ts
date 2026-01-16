import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUnlockedSoldiers } from '@/lib/subscription'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingSubscription = await db.billingSubscription.findFirst({
      where: {
        clerkId: params.userId,
      },
      select: {
        id: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        status: true,
        interval: true,
      },
    })
    const existingUnlockedSoldiers = await db.unlockSoldiers.findMany({
      where: {
        billingSubscriptionId: existingSubscription?.id,
      },
      select: {
        unlockedSoldiers: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        interval: true,
      },
    })

    const unlockedSoldiers =
      existingUnlockedSoldiers?.flatMap((item) => {
        if (item.interval === 'LIFETIME') {
          return item.unlockedSoldiers || []
        }
        const expiryDate = new Date(item?.currentPeriodEnd || 0)
        const now = new Date()
        if (item.unlockedSoldiers && now < expiryDate) {
          // ensure it's an array
          return item.unlockedSoldiers
        } else {
          return []
        }
      }) || []

    const subscriptionStatus = () => {
      if (
        existingSubscription &&
        existingSubscription.interval === 'LIFETIME'
      ) {
        return 'VALID'
      }
      const subscriptionNotFound = !existingSubscription

      const subscriptionExpired =
        existingSubscription &&
        (existingSubscription.currentPeriodEnd || 0) < new Date()

      const validSubscription =
        existingSubscription &&
        existingSubscription.status === 'ACTIVE' &&
        !subscriptionExpired

      if (subscriptionNotFound) {
        return 'NOT_FOUND'
      } else if (subscriptionExpired) {
        return 'EXPIRED'
      } else if (validSubscription) {
        return 'VALID'
      }
      return 'NOT_FOUND'
    }

    return NextResponse.json({
      unlockedSoldiers,
      hasValidSubscription: subscriptionStatus(),
    })
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    )
  }
}
