const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUserWorkspaces() {
  try {
    console.log('🔍 Checking workspaces for: talhaoffice27@gmail.com\n')
    
    const user = await prisma.user.findUnique({
      where: { email: 'talhaoffice27@gmail.com' },
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:', user.email)
    console.log('   Subscription Status:', user.subscriptionStatus)
    console.log('   Plan:', user.currentPlanName)
    console.log('')
    console.log('📦 Workspaces:', user.createdWorkspaces.length)
    console.log('')

    if (user.createdWorkspaces.length === 0) {
      console.log('⚠️  NO WORKSPACE FOUND! This is the problem!')
      console.log('   User needs a workspace to access the site')
    } else {
      user.createdWorkspaces.forEach((ws, index) => {
        console.log(`${index + 1}. Workspace: ${ws.name}`)
        console.log(`   ID: ${ws.id}`)
        console.log(`   Has Billing: ${ws.billingSubscription ? 'Yes' : 'No'}`)
        if (ws.billingSubscription) {
          console.log(`   Billing Status: ${ws.billingSubscription.status}`)
          console.log(`   Unlocked Soldiers: ${ws.billingSubscription.unlockedSoldiers.join(', ') || 'None'}`)
        }
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserWorkspaces()
