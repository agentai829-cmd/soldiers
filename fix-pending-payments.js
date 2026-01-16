const Stripe = require('stripe')
const { PrismaClient } = require('@prisma/client')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const db = new PrismaClient()

async function fixPendingPayments() {
  console.log('🔧 Fixing Pending Soldiers X Payments\n')

  try {
    // Get all recent subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      limit: 20,
      status: 'active'
    })

    console.log(`📦 Found ${subscriptions.data.length} active Stripe subscriptions\n`)

    let fixed = 0
    let skipped = 0

    for (const sub of subscriptions.data) {
      // Check if it has Soldiers X metadata
      const metadata = sub.metadata || {}
      const unlockedAgents = metadata.unlockedAgents || ''
      const workspaceId = metadata.workspaceId

      if (!workspaceId) {
        console.log(`⏭️  Skipping subscription ${sub.id} - no workspaceId`)
        skipped++
        continue
      }

      // Check if subscription already exists in DB
      const existing = await db.billingSubscription.findUnique({
        where: { workspaceId }
      })

      if (existing && existing.stripeSubscriptionId === sub.id) {
        console.log(`✅ Already exists: ${workspaceId}`)
        skipped++
        continue
      }

      // Check if this is Soldiers X or regular subscription
      const soldiers = unlockedAgents.split(',').map(s => s.trim()).filter(Boolean)
      
      if (soldiers.length === 0) {
        console.log(`⏭️  Skipping subscription ${sub.id} - no soldiers`)
        skipped++
        continue
      }

      console.log(`\n🔧 Processing subscription: ${sub.id}`)
      console.log(`   Workspace: ${workspaceId}`)
      console.log(`   Soldiers: ${soldiers.join(', ')}`)
      console.log(`   Plan Type: ${metadata.planType || 'unknown'}`)

      if (existing) {
        // Update existing subscription
        const combined = Array.from(new Set([
          ...existing.unlockedSoldiers,
          ...soldiers
        ]))

        await db.billingSubscription.update({
          where: { workspaceId },
          data: {
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0].price.id,
            interval: sub.items.data[0].price.recurring?.interval || 'month',
            unlockedSoldiers: combined,
            status: 'ACTIVE',
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000)
          }
        })

        console.log(`   ✅ Updated with ${combined.length} soldiers`)
        fixed++
      } else {
        // Create new subscription
        await db.billingSubscription.create({
          data: {
            workspaceId,
            planId: metadata.planType || 'soldiers-x',
            planType: metadata.planType || 'soldiers-x',
            interval: sub.items.data[0].price.recurring?.interval || 'month',
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0].price.id,
            unlockedSoldiers: soldiers,
            status: 'ACTIVE',
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000)
          }
        })

        console.log(`   ✅ Created with ${soldiers.length} soldiers`)
        fixed++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Fixed: ${fixed}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`\n🎉 Done! Check dashboard now.`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

fixPendingPayments()
