import { db } from './db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

/**
 * AUTO-SYNC SERVICE
 * Automatically syncs all users with incomplete payment data
 * Can be called by cron job or on-demand
 */
export async function autoSyncAllUsers() {
  try {
    console.log('🔄 AUTO-SYNC SERVICE: Starting...')
    
    const users = await db.user.findMany({
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      }
    })

    let syncedCount = 0
    let skippedCount = 0

    for (const user of users) {
      try {
        // Skip if already properly synced
        if (user.subscriptionStatus === 'active' && 
            user.createdWorkspaces[0]?.billingSubscription?.status === 'ACTIVE') {
          skippedCount++
          continue
        }

        // Check Stripe
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        })

        if (customers.data.length === 0) continue

        const customer = customers.data[0]
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1
        })

        if (subscriptions.data.length === 0) continue

        const subscription = subscriptions.data[0]
        const interval = subscription.items.data[0].price.recurring?.interval || 'month'
        const amount = subscription.items.data[0].price.unit_amount! / 100

        console.log(`✅ Syncing: ${user.email}`)

        // Update User
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

        // Update Workspace Billing
        if (user.createdWorkspaces.length > 0) {
          const workspace = user.createdWorkspaces[0]
          const unlockedSoldiers = (interval === 'year' || amount >= 99) 
            ? ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot']
            : ['buddy']

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
        }

        syncedCount++
      } catch (error) {
        console.error(`Error syncing ${user.email}:`, error)
      }
    }

    console.log(`✅ AUTO-SYNC COMPLETE: ${syncedCount} synced, ${skippedCount} skipped`)
    
    return { syncedCount, skippedCount, total: users.length }
  } catch (error) {
    console.error('Auto-sync service error:', error)
    throw error
  }
}
