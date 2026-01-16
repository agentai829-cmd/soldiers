const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkSubscriptions() {
  try {
    const subscriptions = await db.billingSubscription.findMany({
      select: {
        workspaceId: true,
        unlockedSoldiers: true,
        status: true,
        currentPeriodEnd: true,
      }
    })
    
    console.log('📊 Database Subscriptions:')
    console.log(JSON.stringify(subscriptions, null, 2))
    
    if (subscriptions.length === 0) {
      console.log('\n⚠️  No subscriptions found in database!')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkSubscriptions()
