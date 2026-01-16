// Check all users and their workspaces
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserWorkspaces() {
  try {
    console.log('🔍 Checking all users and workspaces...\n')
    
    // Get all users with their workspaces
    const users = await prisma.user.findMany({
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 Total users: ${users.length}\n`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User: ${user.name || 'No Name'}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Clerk ID: ${user.clerkId}`)
      console.log(`   Workspaces: ${user.createdWorkspaces.length}`)
      
      user.createdWorkspaces.forEach((workspace, wIndex) => {
        console.log(`\n   Workspace ${wIndex + 1}:`)
        console.log(`     Name: ${workspace.name}`)
        console.log(`     ID: ${workspace.id}`)
        console.log(`     Has Subscription: ${workspace.billingSubscription ? 'YES' : 'NO'}`)
        
        if (workspace.billingSubscription) {
          const sub = workspace.billingSubscription
          console.log(`     - Plan: ${sub.planType}`)
          console.log(`     - Interval: ${sub.interval || 'N/A'}`)
          console.log(`     - Status: ${sub.status}`)
          console.log(`     - Soldiers: ${sub.unlockedSoldiers.join(', ')}`)
        }
      })
      console.log('\n' + '='.repeat(60) + '\n')
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserWorkspaces()
