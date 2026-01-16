import { CurrentPlanName, PlanType } from '@prisma/client'
import { db } from './db'

/**
 * Check if specific soldier is unlocked
 */
// export async function isSoldierUnlocked(
//   workspaceId: string,
//   soldierName: string
// ): Promise<boolean> {
//   try {
//     const subscription = await db.billingSubscription.findUnique({
//       where: { workspaceId },
//     })

//     // If no subscription exists, soldier is locked
//     if (!subscription) {
//       return false
//     }

//     // Check if subscription is active (not cancelled) and not expired
//     const isActive = subscription.status === 'ACTIVE'
//     const notExpired = new Date() < subscription.currentPeriodEnd

//     if (!isActive || !notExpired) {
//       return false
//     }

//     // Check if this specific soldier is unlocked
//     return subscription.unlockedSoldiers?.includes(soldierName) || false
//   } catch (error) {
//     console.error('Error checking soldier unlock:', error)
//     return false
//   }
// }

/**
 * Check if workspace has active subscription
 */
// export async function hasActiveSubscription(
//   workspaceId: string
// ): Promise<boolean> {
//   try {
//     const subscription = await db.billingSubscription.findUnique({
//       where: { workspaceId },
//     })

//     // If no subscription exists, return false
//     if (!subscription) {
//       return false
//     }

//     // Check if subscription is active (not cancelled) and not expired
//     const isActive = subscription.status === 'ACTIVE'
//     const notExpired = new Date() < subscription.currentPeriodEnd

//     return isActive && notExpired
//   } catch (error) {
//     console.error('Error checking subscription:', error)
//     return false
//   }
// }

/**
 * Get workspace subscription details
 */
// export async function getSubscription(workspaceId: string) {
//   try {
//     return await db.billingSubscription.findUnique({
//       where: { workspaceId },
//     })
//   } catch (error) {
//     console.error('Error getting subscription:', error)
//     return null
//   }
// }

/**
 * Get unlocked soldiers for workspace
 */
export async function getUnlockedSoldiers(userId: string): Promise<string[]> {
  try {
    const subscription = await db.billingSubscription.findUnique({
      where: { clerkId: userId },
      include: {
        unlockedSoldiers: true,
      },
    })

    // If no subscription exists, return empty array
    if (!subscription) {
      return []
    }

    const unlockedSoldiers =
      subscription.unlockedSoldiers?.flatMap((item) => {
        const expiryDate = new Date(item?.currentPeriodEnd || 0)
        const now = new Date()

        if (item.unlockedSoldiers && item.interval === 'LIFETIME') {
          return item.unlockedSoldiers
        } else if (item.unlockedSoldiers && now < expiryDate) {
          // ensure it's an array
          return item.unlockedSoldiers
        } else {
          return []
        }
      }) ?? []

    return unlockedSoldiers || []
  } catch (error) {
    console.error('Error getting unlocked soldiers:', error)
    return []
  }
}

/**
 * Check if workspace can access premium features
 */
// export async function canAccessPremiumFeatures(
//   workspaceId: string
// ): Promise<boolean> {
//   return await hasActiveSubscription(workspaceId)
// }

interface StoreStripePaymentInDB {
  clerkUserId: string
  customerId?: string | null
  stripeSessionId?: string | null
  totalAmount: number
  paymentIntent?: string | null
  emailAddress: string
  currency: string
  subscriptionId?: string | null
  subscriptionStartDate: Date | null
  subscriptionEndDate: Date | null
  unlockedAgents: string[]
  planType: string
  planId: 'STARTER' | 'PROFESSIONAL' | 'SINGLE' | 'SOLDIERSX' | 'LIFETIME'
  priceId?: string | null
  unlockedSoldiersType: 'WITHOUT_ADDONS' | 'ADDONS'
}

export const storeStripePaymentInDB = async ({
  clerkUserId,
  customerId,
  emailAddress,
  currency,
  subscriptionEndDate,
  subscriptionStartDate,
  paymentIntent,
  stripeSessionId,
  subscriptionId,
  totalAmount,
  unlockedAgents,
  planId,
  planType,
  priceId,
  unlockedSoldiersType,
}: StoreStripePaymentInDB) => {
  await db.payment.create({
    data: {
      email: emailAddress,
      clerkId: clerkUserId,
      stripeCustomerId: customerId as string,
      stripeSessionId: stripeSessionId,
      amount: totalAmount || 0,
      currency: currency || 'usd',
      status: 'SUCCEEDED',
      paymentIntentId: paymentIntent || null,
    },
  })
  const billing = await db.billingSubscription.upsert({
    where: {
      clerkId: clerkUserId,
    },
    update: {
      planId: planId,
      planType: planType as PlanType,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: 'ACTIVE',
      amount: totalAmount,
      currentPeriodStart: subscriptionStartDate,
      currentPeriodEnd: subscriptionEndDate,
      clerkId: clerkUserId,
      cancelAtPeriodEnd: planId === 'LIFETIME' ? false : true,
      interval: planId === 'LIFETIME' ? 'LIFETIME' : 'MONTH',
    },
    create: {
      planId: planId,
      planType: planType as PlanType,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: 'ACTIVE',
      amount: totalAmount,
      currentPeriodStart: subscriptionStartDate,
      currentPeriodEnd: subscriptionEndDate,
      clerkId: clerkUserId,
      cancelAtPeriodEnd: planId === 'LIFETIME' ? false : true,
      email: emailAddress || '',
      interval: planId === 'LIFETIME' ? 'LIFETIME' : 'MONTH',
    },
  })
  await db.unlockSoldiers.create({
    data: {
      billingSubscriptionId: billing.id,
      unlockedSoldiers: unlockedAgents,
      clerkId: clerkUserId,
      currentPeriodStart: subscriptionStartDate,
      currentPeriodEnd: subscriptionEndDate,
      stripeSubscriptionId: subscriptionId,
      interval: planId === 'LIFETIME' ? 'LIFETIME' : 'MONTH',
      stripeCustomerId: customerId,
      amount: totalAmount,
      stripePriceId: priceId,
      type:
        unlockedSoldiersType === 'WITHOUT_ADDONS' ? 'WITHOUT_ADDONS' : 'ADDONS',
    },
  })
}
