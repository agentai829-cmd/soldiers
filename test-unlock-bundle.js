const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function unlockAllSoldiers() {
  try {
    console.log('🧪 Unlocking all 5 soldiers for bundle test...\n')
    
    // Your current workspace
    const workspaceId = 'cmhzel1tv0002s8nr095fb8jq'
    
    console.log('📦 Testing for workspace:', workspaceId)
    
    // All 5 soldiers
    const allSoldiers = ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
    
    // Check if subscription exists
    let subscription = await prisma.billingSubscription.findUnique({
      where: { workspaceId }
    })
    
    if (subscription) {
      console.log('📋 Existing subscription found:', {
        id: subscription.id,
        status: subscription.status,
        unlockedSoldiers: subscription.unlockedSoldiers
      })
      
      // Update with all 5 soldiers
      const updated = await prisma.billingSubscription.update({
        where: { id: subscription.id },
        data: {
          unlockedSoldiers: allSoldiers,
          status: 'ACTIVE',
          interval: 'month',
          planType: 'bundle',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      })
      
      console.log('✅ Updated subscription with ALL 5 soldiers:', {
        id: updated.id,
        unlockedSoldiers: updated.unlockedSoldiers,
        status: updated.status,
        soldierCount: updated.unlockedSoldiers.length
      })
    } else {
      console.log('📝 No subscription found, creating new one with all 5 soldiers...')
      
      // Create new subscription with all 5 soldiers
      const created = await prisma.billingSubscription.create({
        data: {
          workspaceId,
          planId: 'bundle',
          planType: 'bundle',
          interval: 'month',
          stripeCustomerId: 'cus_bundle_' + Date.now(),
          stripeSubscriptionId: 'sub_bundle_' + Date.now(),
          stripePriceId: 'price_bundle_' + Date.now(),
          unlockedSoldiers: allSoldiers,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
      
      console.log('✅ Created subscription with ALL 5 soldiers:', {
        id: created.id,
        workspaceId: created.workspaceId,
        unlockedSoldiers: created.unlockedSoldiers,
        status: created.status,
        soldierCount: created.unlockedSoldiers.length
      })
    }
    
    console.log('\n🎉 ALL 5 SOLDIERS UNLOCKED:')
    allSoldiers.forEach((soldier, index) => {
      console.log(`   ${index + 1}. ${soldier} ✅`)
    })
    console.log('\n🔄 Refresh your browser to see all soldiers unlocked!')
    console.log('🌐 http://localhost:3000/workspace/' + workspaceId)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

unlockAllSoldiers()
