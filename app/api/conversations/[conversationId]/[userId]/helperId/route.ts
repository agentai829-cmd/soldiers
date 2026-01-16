import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string; userId: string; helperId: string } }
) {
  try {
    const { conversationId, userId, helperId } = params

    // Validate required parameters
    if (!conversationId || !userId || !helperId) {
      return NextResponse.json(
        { 
          validatedUser: false, 
          error: 'Missing required parameters: conversationId, userId, or helperId' 
        },
        { status: 400 }
      )
    }

    // Find user's billing subscription with unlocked soldiers
    const existingBilling = await db.billingSubscription.findFirst({
      where: {
        clerkId: userId,
      },
      include: {
        unlockedSoldiers: true,
      }
    })

    // Check if subscription exists
    if (!existingBilling) {
      return NextResponse.json(
        { 
          validatedUser: false, 
          error: 'No active subscription found for this user',
          details: {
            hasSubscription: false,
            isSubscriptionActive: false,
            isSubscriptionExpired: false,
            hasHelperUnlocked: false,
            isHelperExpired: false
          }
        },
        { status: 200 }
      )
    }

    const now = new Date()

    // Check if main subscription is active and not expired
    const isSubscriptionActive = existingBilling.status === 'ACTIVE'
    const isSubscriptionExpired = existingBilling.currentPeriodEnd < now

    if (!isSubscriptionActive || isSubscriptionExpired) {
      return NextResponse.json(
        { 
          validatedUser: false, 
          error: 'Subscription is not active or has expired',
          details: {
            hasSubscription: true,
            isSubscriptionActive,
            isSubscriptionExpired,
            subscriptionEndDate: existingBilling.currentPeriodEnd,
            hasHelperUnlocked: false,
            isHelperExpired: false
          }
        },
        { status: 200 }
      )
    }

    // Get all valid unlocked soldiers for this user
    const validUnlockedSoldiers = existingBilling.unlockedSoldiers
      ?.filter((item) => {
        const expiryDate = new Date(item.currentPeriodEnd)
        return item.unlockedSoldiers && now < expiryDate
      })
      ?.flatMap((item) => item.unlockedSoldiers) || []

    // Check if the helperId exists in unlocked soldiers
    const hasHelperUnlocked = validUnlockedSoldiers.includes(helperId)

    if (!hasHelperUnlocked) {
      return NextResponse.json(
        { 
          validatedUser: false, 
          error: `Helper '${helperId}' is not unlocked for this user`,
          details: {
            hasSubscription: true,
            isSubscriptionActive: true,
            isSubscriptionExpired: false,
            hasHelperUnlocked: false,
            isHelperExpired: false,
            availableHelpers: validUnlockedSoldiers
          }
        },
        { status: 200 }
      )
    }

    // Find the specific unlock record for this helper to check its expiry
    const helperUnlockRecord = existingBilling.unlockedSoldiers?.find((item) =>
      item.unlockedSoldiers.includes(helperId)
    )

    const isHelperExpired = helperUnlockRecord 
      ? new Date(helperUnlockRecord.currentPeriodEnd) < now
      : true

    if (isHelperExpired) {
      return NextResponse.json(
        { 
          validatedUser: false, 
          error: `Helper '${helperId}' access has expired`,
          details: {
            hasSubscription: true,
            isSubscriptionActive: true,
            isSubscriptionExpired: false,
            hasHelperUnlocked: true,
            isHelperExpired: true,
            helperExpiryDate: helperUnlockRecord?.currentPeriodEnd
          }
        },
        { status: 200 }
      )
    }

    // All validations passed
    return NextResponse.json(
      { 
        validatedUser: true,
        message: `User has valid access to helper '${helperId}'`,
        details: {
          hasSubscription: true,
          isSubscriptionActive: true,
          isSubscriptionExpired: false,
          hasHelperUnlocked: true,
          isHelperExpired: false,
          subscriptionEndDate: existingBilling.currentPeriodEnd,
          helperExpiryDate: helperUnlockRecord?.currentPeriodEnd,
          availableHelpers: validUnlockedSoldiers
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error validating user access:', error)
    return NextResponse.json(
      { 
        validatedUser: false, 
        error: 'Internal server error while validating user access',
        details: {
          hasSubscription: false,
          isSubscriptionActive: false,
          isSubscriptionExpired: false,
          hasHelperUnlocked: false,
          isHelperExpired: false
        }
      },
      { status: 500 }
    )
  }
}
