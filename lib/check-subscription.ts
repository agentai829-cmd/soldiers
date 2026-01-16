import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

/**
 * Check if the current user has an active subscription
 */
export async function checkUserSubscription() {
  try {
    const user = await currentUser()
    
    if (!user || !user.emailAddresses[0]?.emailAddress) {
      return {
        hasActiveSubscription: false,
        userEmail: null,
        plan: null,
        startDate: null,
        endDate: null,
        error: 'User not authenticated'
      }
    }

    const email = user.emailAddresses[0].emailAddress
    
    // Find user in database
    const dbUser = await db.user.findUnique({
      where: { email },
      select: {
        email: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        currentPlanName: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        cancelAtPeriodEnd: true,
      }
    })

    if (!dbUser) {
      return {
        hasActiveSubscription: false,
        userEmail: email,
        plan: null,
        startDate: null,
        endDate: null,
        error: 'User not found in database'
      }
    }

    // Check if subscription is active
    const hasActiveSubscription = 
      dbUser.subscriptionStatus === 'active' || 
      dbUser.subscriptionStatus === 'trialing'

    return {
      hasActiveSubscription,
      userEmail: dbUser.email,
      plan: dbUser.currentPlanName,
      startDate: dbUser.subscriptionStartDate,
      endDate: dbUser.subscriptionEndDate,
      subscriptionStatus: dbUser.subscriptionStatus,
      cancelAtPeriodEnd: dbUser.cancelAtPeriodEnd,
    }
  } catch (error) {
    console.error('Error checking user subscription:', error)
    return {
      hasActiveSubscription: false,
      userEmail: null,
      plan: null,
      startDate: null,
      endDate: null,
      error: 'Error checking subscription'
    }
  }
}

/**
 * Get user subscription details by email
 */
export async function getUserSubscriptionByEmail(email: string) {
  try {
    const dbUser = await db.user.findUnique({
      where: { email },
      select: {
        email: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        currentPlanName: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        cancelAtPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!dbUser) {
      return null
    }

    const hasActiveSubscription = 
      dbUser.subscriptionStatus === 'active' || 
      dbUser.subscriptionStatus === 'trialing'

    return {
      ...dbUser,
      hasActiveSubscription
    }
  } catch (error) {
    console.error('Error getting user subscription:', error)
    return null
  }
}
