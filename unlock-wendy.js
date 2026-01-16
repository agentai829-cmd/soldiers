const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function unlockWendy() {
  try {
    const workspaceId = 'cmhv7mv6b000211p8vq739du6' // Your workspace ID
    
    console.log('🔓 Unlocking Wendy for workspace:', workspaceId)
    
    const subscription = await db.billingSubscription.findUnique({
      where: { workspaceId }
    })
    
    if (!subscription) {
      console.log('❌ No subscription found!')
      return
    }
    
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
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

unlockWendy()
