// Check all workspaces in database
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkAllWorkspaces() {
  try {
    const workspaces = await db.workspace.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('📂 All Workspaces:')
    workspaces.forEach(ws => {
      console.log(`  - ${ws.id} | ${ws.name}`)
    })
    
    const subscriptions = await db.billingSubscription.findMany({
      select: {
        workspaceId: true,
        unlockedSoldiers: true,
      }
    })
    
    console.log('\n💳 Subscriptions:')
    subscriptions.forEach(sub => {
      console.log(`  - ${sub.workspaceId}: ${sub.unlockedSoldiers.join(', ')}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkAllWorkspaces()
