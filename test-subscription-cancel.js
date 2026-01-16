// Test script to verify subscription cancellation
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function testSubscriptionCancellation() {
  console.log('🧪 Testing Subscription Cancellation Logic\n')
  
  try {
    // Get all workspaces with subscriptions
    const workspaces = await db.workspace.findMany({
      include: {
        billingSubscription: true,
        creator: true
      }
    })
    
    console.log(`📊 Total workspaces: ${workspaces.length}\n`)
    
    for (const workspace of workspaces) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`📦 Workspace: ${workspace.name}`)
      console.log(`🆔 ID: ${workspace.id}`)
      console.log(`👤 Creator: ${workspace.creator?.name || 'Unknown'}`)
      
      if (workspace.billingSubscription) {
        const sub = workspace.billingSubscription
        console.log(`\n💳 SUBSCRIPTION EXISTS:`)
        console.log(`   Status: ${sub.status}`)
        console.log(`   Plan: ${sub.planType}`)
        console.log(`   Stripe ID: ${sub.stripeSubscriptionId}`)
        console.log(`   Period End: ${sub.currentPeriodEnd}`)
        console.log(`   Unlocked Soldiers: ${sub.unlockedSoldiers.join(', ') || 'None'}`)
        
        // Check if expired
        const isExpired = new Date() > sub.currentPeriodEnd
        console.log(`   Expired: ${isExpired ? '❌ YES' : '✅ NO'}`)
        
        // Check if should be active
        const shouldBeActive = sub.status === 'ACTIVE' && !isExpired
        console.log(`   Should Work: ${shouldBeActive ? '✅ YES' : '❌ NO'}`)
      } else {
        console.log(`\n❌ NO SUBSCRIPTION`)
        console.log(`   Should show pricing page: ✅ YES`)
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testSubscriptionCancellation()
