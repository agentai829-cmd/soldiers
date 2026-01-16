const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testUnlockSoldier() {
  try {
    console.log('🧪 Testing soldier unlock directly in database...\n')
    
    // Get the latest workspace
    const workspaces = await prisma.workspace.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' }
    })
    
    if (workspaces.length === 0) {
      console.log('❌ No workspaces found')
      return
    }
    
    const workspace = workspaces[0]
    console.log('📦 Found workspace:', workspace.id, workspace.name)
    
    // Check if subscription exists
    let subscription = await prisma.billingSubscription.findUnique({
      where: { workspaceId: workspace.id }
    })
    
    if (subscription) {
      console.log('📋 Existing subscription found:', {
        id: subscription.id,
        status: subscription.status,
        unlockedSoldiers: subscription.unlockedSoldiers
      })
      
      // Update with Wendy unlocked
      const updated = await prisma.billingSubscription.update({
        where: { id: subscription.id },
        data: {
          unlockedSoldiers: ['Wendy'],
          status: 'ACTIVE',
          interval: 'month',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      })
      
      console.log('✅ Updated subscription:', {
        id: updated.id,
        unlockedSoldiers: updated.unlockedSoldiers,
        status: updated.status,
        currentPeriodEnd: updated.currentPeriodEnd
      })
    } else {
      console.log('📝 No subscription found, creating new one...')
      
      // Create new subscription with Wendy unlocked
      const created = await prisma.billingSubscription.create({
        data: {
          workspaceId: workspace.id,
          planId: 'single',
          planType: 'single',
          interval: 'month',
          stripeCustomerId: 'temp_customer_' + Date.now(),
          stripeSubscriptionId: 'temp_sub_' + Date.now(),
          stripePriceId: 'temp_price_' + Date.now(),
          unlockedSoldiers: ['Wendy'],
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      })
      
      console.log('✅ Created subscription:', {
        id: created.id,
        workspaceId: created.workspaceId,
        unlockedSoldiers: created.unlockedSoldiers,
        status: created.status,
        currentPeriodEnd: created.currentPeriodEnd
      })
    }
    
    console.log('\n✅ Test complete! Now refresh your browser to see Wendy unlocked.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUnlockSoldier()
