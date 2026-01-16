const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUnlockedSoldiers() {
  try {
    console.log('🔍 Checking unlocked soldiers in database...\n')
    
    // Get all billing subscriptions
    const subscriptions = await prisma.billingSubscription.findMany({
      include: {
        workspace: {
          select: {
            name: true,
            id: true
          }
        }
      }
    })
    
    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found in database!')
      console.log('💡 This means webhook has not created any subscription yet.')
      console.log('\n📝 Possible issues:')
      console.log('   1. Payment not completed')
      console.log('   2. Webhook not configured in Stripe')
      console.log('   3. Webhook URL not accessible')
      console.log('   4. Webhook secret mismatch')
      return
    }
    
    console.log(`✅ Found ${subscriptions.length} subscription(s)\n`)
    
    subscriptions.forEach((sub, index) => {
      console.log(`📦 Subscription ${index + 1}:`)
      console.log(`   Workspace: ${sub.workspace.name} (${sub.workspace.id})`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Plan: ${sub.planId}`)
      console.log(`   Unlocked Soldiers: ${sub.unlockedSoldiers.length > 0 ? sub.unlockedSoldiers.join(', ') : 'NONE'}`)
      console.log(`   Current Period: ${sub.currentPeriodStart.toLocaleDateString()} - ${sub.currentPeriodEnd.toLocaleDateString()}`)
      console.log(`   Stripe Subscription ID: ${sub.stripeSubscriptionId}`)
      console.log('')
      
      if (sub.unlockedSoldiers.length === 0) {
        console.log('   ⚠️  WARNING: No soldiers unlocked!')
        console.log('   💡 Check webhook logs to see if helperName is being passed correctly\n')
      }
    })
    
    // Check if there are any expired subscriptions
    const now = new Date()
    const expiredSubs = subscriptions.filter(sub => sub.currentPeriodEnd < now)
    
    if (expiredSubs.length > 0) {
      console.log(`⚠️  WARNING: ${expiredSubs.length} subscription(s) expired!`)
      expiredSubs.forEach(sub => {
        console.log(`   - ${sub.workspace.name}: Expired on ${sub.currentPeriodEnd.toLocaleDateString()}`)
      })
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUnlockedSoldiers()
