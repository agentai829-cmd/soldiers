/**
 * Quick Fix for Pricing Page Payments
 * 
 * Agar user ne pricing page se Professional/Starter plan ki payment ki
 * but dashboard mein show nahi ho raha, toh ye script chalao
 * 
 * Usage:
 *   node fix-pricing-payment.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixPricingPayment() {
  try {
    console.log('\n💳 FIX PRICING PAGE PAYMENT')
    console.log('═'.repeat(70))
    
    // Get all users without subscriptions
    const allWorkspaces = await prisma.workspace.findMany({
      include: {
        creator: true,
        billingSubscription: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const usersWithoutSubs = allWorkspaces.filter(w => !w.billingSubscription)
    
    if (usersWithoutSubs.length === 0) {
      console.log('\n✅ All users already have subscriptions!')
      return
    }

    console.log(`\n🔍 Found ${usersWithoutSubs.length} users without subscriptions\n`)
    
    usersWithoutSubs.forEach((w, i) => {
      console.log(`${i + 1}. ${w.creator?.name || 'Unknown'} (${w.creator?.email || 'Unknown'})`)
      console.log(`   Workspace: ${w.name} - ID: ${w.id}`)
      console.log(`   Created: ${w.createdAt.toLocaleString()}\n`)
    })

    // Latest user (most recent signup/payment)
    const latestUser = usersWithoutSubs[0]
    
    console.log('─'.repeat(70))
    console.log('\n❓ Which plan did the user purchase?')
    console.log('   1. Starter ($20/month) - 1 Helper (Carl)')
    console.log('   2. Professional ($200/year) - 3 Helpers (Carl, Paul, Olivia)')
    console.log('   3. Soldiers X ($199 one-time) - 5 Helpers (All)')
    console.log('')

    // Default to Soldiers X (most common)
    const planChoice = 3
    
    let soldiers = []
    let planType = ''
    let planName = ''

    switch(planChoice) {
      case 1:
        soldiers = ['Carl']
        planType = 'starter'
        planName = 'Starter'
        break
      case 2:
        soldiers = ['Carl', 'Paul', 'Olivia']
        planType = 'professional'
        planName = 'Professional'
        break
      case 3:
        soldiers = ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
        planType = 'bundle'
        planName = 'Soldiers X Bundle'
        break
    }

    console.log(`📝 Creating ${planName} subscription for: ${latestUser.creator?.name}`)
    console.log(`🎖️  Soldiers to unlock: ${soldiers.join(', ')}`)
    console.log('')

    const subscription = await prisma.billingSubscription.create({
      data: {
        workspaceId: latestUser.id,
        planId: planType,
        planType: planType,
        interval: planChoice === 1 ? 'month' : (planChoice === 2 ? 'year' : 'month'),
        stripeCustomerId: 'manual_pricing_' + Date.now(),
        stripeSubscriptionId: 'manual_pricing_' + Date.now(),
        stripePriceId: 'manual_pricing_' + Date.now(),
        unlockedSoldiers: soldiers,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    })

    console.log('✅ Subscription Created Successfully!')
    console.log('─'.repeat(70))
    console.log('📊 Details:')
    console.log(`   User: ${latestUser.creator?.name}`)
    console.log(`   Email: ${latestUser.creator?.email}`)
    console.log(`   Workspace: ${latestUser.name}`)
    console.log(`   Plan: ${planName}`)
    console.log(`   Status: ${subscription.status}`)
    console.log(`   Soldiers: ${subscription.unlockedSoldiers.join(', ')}`)
    console.log(`   Total Soldiers: ${subscription.unlockedSoldiers.length}`)
    console.log(`   Expires: ${subscription.currentPeriodEnd.toLocaleString()}`)
    console.log('')
    console.log('🔄 Refresh admin dashboard to see the subscription!')
    console.log('🌐 User can now use their unlocked soldiers!')
    console.log('')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixPricingPayment()
