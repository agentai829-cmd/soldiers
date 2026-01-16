// Unlock Wendy for the current workspace in browser
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function unlockWendyForWorkspace(workspaceId) {
  try {
    console.log('🔓 Unlocking Wendy for workspace:', workspaceId)
    
    // Check if subscription exists
    let subscription = await db.billingSubscription.findUnique({
      where: { workspaceId }
    })
    
    if (!subscription) {
      console.log('📝 Creating new subscription...')
      // Create subscription if doesn't exist
      subscription = await db.billingSubscription.create({
        data: {
          workspaceId,
          planId: 'starter',
          planType: 'starter',
          stripeCustomerId: 'manual_' + workspaceId,
          stripeSubscriptionId: 'manual_sub_' + Date.now(),
          stripePriceId: 'manual_price',
          unlockedSoldiers: ['Wendy'],
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
      })
      console.log('✅ New subscription created with Wendy unlocked!')
    } else {
      const currentSoldiers = subscription.unlockedSoldiers || []
      console.log('Current soldiers:', currentSoldiers)
      
      if (!currentSoldiers.includes('Wendy')) {
        const updatedSoldiers = [...currentSoldiers, 'Wendy']
        
        await db.billingSubscription.update({
          where: { workspaceId },
          data: {
            unlockedSoldiers: updatedSoldiers
          }
        })
        
        console.log('✅ Wendy unlocked!')
        console.log('New soldiers:', updatedSoldiers)
      } else {
        console.log('✅ Wendy already unlocked!')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

// Get workspace ID from command line or use default
const workspaceId = process.argv[2] || 'cmhzel1tv0002s8nr095fb8jq'
unlockWendyForWorkspace(workspaceId)
