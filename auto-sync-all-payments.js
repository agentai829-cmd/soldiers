const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function autoSyncAllPayments() {
  try {
    console.log('🔍 AUTO SYNC - Checking for incomplete subscriptions...\n')

    // Get all users with Stripe customer IDs but no active subscription
    const users = await prisma.user.findMany({
      where: {
        stripeCustomerId: { not: null },
        OR: [
          { subscriptionStatus: null },
          { subscriptionStatus: 'canceled' }
        ]
      },
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      }
    })

    if (users.length === 0) {
      console.log('✅ No incomplete subscriptions found')
      return
    }

    console.log(`📊 Found ${users.length} user(s) with incomplete subscriptions:\n`)

    for (const user of users) {
      console.log('━'.repeat(60))
      console.log(`👤 User: ${user.email}`)
      console.log(`   Stripe Customer: ${user.stripeCustomerId}`)
      
      try {
        // Get subscriptions from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
          limit: 10
        })

        if (subscriptions.data.length === 0) {
          console.log('   ⚠️  No active subscriptions in Stripe')
          continue
        }

        const subscription = subscriptions.data[0]
        console.log(`   ✅ Found active subscription in Stripe:`, subscription.id)
        console.log(`   💰 Amount: $${subscription.items.data[0].price.unit_amount / 100}`)
        console.log(`   📅 Interval: ${subscription.items.data[0].price.recurring.interval}`)

        // Update user subscription
        const interval = subscription.items.data[0].price.recurring.interval
        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            subscriptionStatus: subscription.status,
            currentPlanName: interval === 'year' ? 'yearly' : 'monthly',
            subscriptionStartDate: new Date(subscription.current_period_start * 1000),
            subscriptionEndDate: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        })
        console.log('   ✅ User subscription updated')

        // Update workspace billing
        if (user.createdWorkspaces.length > 0) {
          const workspace = user.createdWorkspaces[0]
          console.log(`   📦 Workspace: ${workspace.name}`)

          // Determine unlocked soldiers based on plan
          const amount = subscription.items.data[0].price.unit_amount / 100
          let unlockedSoldiers = []
          
          if (interval === 'year' || amount >= 99) {
            unlockedSoldiers = ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot']
            console.log('   🎖️  All 5 soldiers unlocked (yearly/bundle)')
          } else {
            unlockedSoldiers = ['buddy']
            console.log('   🎖️  1 soldier unlocked (monthly)')
          }

          if (workspace.billingSubscription) {
            // Update existing
            await prisma.billingSubscription.update({
              where: { id: workspace.billingSubscription.id },
              data: {
                stripeCustomerId: user.stripeCustomerId,
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
            console.log('   ✅ Workspace billing updated')
          } else {
            // Create new
            await prisma.billingSubscription.create({
              data: {
                workspaceId: workspace.id,
                planId: subscription.items.data[0].price.id,
                planType: interval === 'year' || amount >= 99 ? 'BUNDLE' : 'SINGLE',
                interval: interval,
                stripeCustomerId: user.stripeCustomerId,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                unlockedSoldiers: unlockedSoldiers,
                status: 'ACTIVE',
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              }
            })
            console.log('   ✅ Workspace billing created')
          }
        }

        console.log('   🎉 SYNC COMPLETE!')
      } catch (error) {
        console.error(`   ❌ Error syncing ${user.email}:`, error.message)
      }
    }

    console.log('\n━'.repeat(60))
    console.log('✅ AUTO SYNC COMPLETED!')
    console.log('━'.repeat(60))

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

autoSyncAllPayments()
