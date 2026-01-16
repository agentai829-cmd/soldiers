// Cleanup script to delete all CANCELLED subscriptions
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function cleanupCancelledSubscriptions() {
  console.log('🧹 Cleaning up CANCELLED subscriptions from database\n')
  
  try {
    // Find all cancelled subscriptions
    const cancelledSubs = await db.billingSubscription.findMany({
      where: {
        status: 'CANCELLED'
      },
      include: {
        workspace: true
      }
    })
    
    console.log(`📊 Found ${cancelledSubs.length} CANCELLED subscriptions\n`)
    
    if (cancelledSubs.length === 0) {
      console.log('✅ No cancelled subscriptions to clean up!')
      return
    }
    
    for (const sub of cancelledSubs) {
      console.log(`🗑️  Deleting subscription for workspace: ${sub.workspace.name}`)
      console.log(`   Workspace ID: ${sub.workspaceId}`)
      console.log(`   Stripe ID: ${sub.stripeSubscriptionId}`)
      
      await db.billingSubscription.delete({
        where: { id: sub.id }
      })
      
      console.log(`   ✅ Deleted!\n`)
    }
    
    console.log(`\n✅ Successfully deleted ${cancelledSubs.length} cancelled subscription(s)!`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

cleanupCancelledSubscriptions()
