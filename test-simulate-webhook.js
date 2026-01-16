const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function simulateWebhookPayment() {
  try {
    console.log('🧪 Simulating Stripe webhook payment...\n')
    
    // Get the workspace that you're testing with
    const workspaceId = 'cmhzel1tv0002s8nr095fb8jq' // Your current workspace from logs
    
    console.log('📦 Testing for workspace:', workspaceId)
    
    // Check if subscription exists
    let subscription = await prisma.billingSubscription.findUnique({
      where: { workspaceId }
    })
    
    const soldierToUnlock = 'Wendy' // Change this to test different soldiers
    
    if (subscription) {
      console.log('📋 Existing subscription found:', {
        id: subscription.id,
        status: subscription.status,
        unlockedSoldiers: subscription.unlockedSoldiers
      })
      
      // Add the soldier to unlocked list
      const currentSoldiers = subscription.unlockedSoldiers || []
      const newSoldiers = [...new Set([...currentSoldiers, soldierToUnlock])]
      
      const updated = await prisma.billingSubscription.update({
        where: { id: subscription.id },
        data: {
          unlockedSoldiers: newSoldiers,
          status: 'ACTIVE',
          interval: 'month',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      })
      
      console.log('✅ Updated subscription:', {
        id: updated.id,
        unlockedSoldiers: updated.unlockedSoldiers,
        status: updated.status
      })
    } else {
      console.log('📝 No subscription found, creating new one...')
      
      // Create new subscription
      const created = await prisma.billingSubscription.create({
        data: {
          workspaceId,
          planId: 'single',
          planType: 'single',
          interval: 'month',
          stripeCustomerId: 'cus_test_' + Date.now(),
          stripeSubscriptionId: 'sub_test_' + Date.now(),
          stripePriceId: 'price_test_' + Date.now(),
          unlockedSoldiers: [soldierToUnlock],
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
      
      console.log('✅ Created subscription:', {
        id: created.id,
        workspaceId: created.workspaceId,
        unlockedSoldiers: created.unlockedSoldiers,
        status: created.status
      })
    }
    
    console.log(`\n✅ ${soldierToUnlock} is now unlocked!`)
    console.log('🔄 Refresh your browser at: http://localhost:3000/workspace/' + workspaceId)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simulateWebhookPayment()
