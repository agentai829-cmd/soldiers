const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testSoldiersXUnlock() {
  console.log('🎖️ Testing Soldiers X unlock flow...\n')

  try {
    // Get the user's workspace with subscription
    const workspace = await db.workspace.findFirst({
      where: {
        creator: {
          email: 'talhaoffice27@gmail.com'
        }
      },
      include: {
        creator: true,
        billingSubscription: true
      }
    })

    if (!workspace) {
      console.error('❌ Workspace not found!')
      return
    }

    console.log('📦 Workspace:', workspace.name)
    console.log('👤 User:', workspace.creator.name)

    if (!workspace.billingSubscription) {
      console.error('❌ No subscription found! User needs to subscribe first.')
      return
    }

    console.log('\n📋 Current subscription:')
    console.log('   Plan Type:', workspace.billingSubscription.planType)
    console.log('   Interval:', workspace.billingSubscription.interval)
    console.log('   Unlocked Soldiers:', workspace.billingSubscription.unlockedSoldiers.join(', '))

    // Check if Soldiers X are already unlocked
    const soldiersX = ['penn', 'soshie', 'seomi', 'milli', 'vizzy']
    const alreadyUnlocked = soldiersX.every(s => 
      workspace.billingSubscription.unlockedSoldiers.includes(s)
    )

    if (alreadyUnlocked) {
      console.log('\n✅ Soldiers X are already unlocked!')
      console.log('   All 10 soldiers:', workspace.billingSubscription.unlockedSoldiers.join(', '))
      return
    }

    // Simulate Soldiers X purchase webhook
    console.log('\n🎖️ Simulating Soldiers X bundle purchase...')
    
    const currentSoldiers = workspace.billingSubscription.unlockedSoldiers
    const newSoldiers = [...new Set([...currentSoldiers, ...soldiersX])]

    console.log('   Current:', currentSoldiers.join(', '))
    console.log('   Adding:', soldiersX.join(', '))
    console.log('   Total:', newSoldiers.join(', '))

    // Update subscription with Soldiers X
    const updated = await db.billingSubscription.update({
      where: { workspaceId: workspace.id },
      data: {
        unlockedSoldiers: newSoldiers,
        // Keep existing subscription data
        stripeSubscriptionId: workspace.billingSubscription.stripeSubscriptionId || 'sub_soldiers_' + Date.now(),
        stripePriceId: process.env.STRIPE_SOLDIERS_BUNDLE_PRICE_ID_YEAR || 'price_soldiers_test',
      }
    })

    console.log('\n✅ Soldiers X unlocked successfully!')
    console.log('📊 Total unlocked soldiers:', updated.unlockedSoldiers.length)
    console.log('🎉 All soldiers:', updated.unlockedSoldiers.join(', '))
    console.log('\n✨ User should now see all 10 soldiers in workspace!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

testSoldiersXUnlock()
