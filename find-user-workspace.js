const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findUserWorkspace() {
  try {
    console.log('\n🔍 Finding workspace for: talhaoffice27@gmail.com\n')
    
    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: 'talhaoffice27@gmail.com'
      }
    })

    if (!user) {
      console.log('❌ User not found with this email')
      return
    }

    console.log('✅ User Found:')
    console.log('   Name:', user.name)
    console.log('   Email:', user.email)
    console.log('   Clerk ID:', user.clerkId)
    console.log('')

    // Find workspaces for this user
    const workspaces = await prisma.workspace.findMany({
      where: {
        creatorId: user.id
      },
      include: {
        billingSubscription: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (workspaces.length === 0) {
      console.log('❌ No workspaces found for this user')
      return
    }

    console.log(`📦 Found ${workspaces.length} workspace(s):\n`)
    
    workspaces.forEach((w, i) => {
      console.log(`${i + 1}. ${w.name}`)
      console.log(`   Workspace ID: ${w.id}`)
      console.log(`   Created: ${w.createdAt.toLocaleString()}`)
      console.log(`   Has Subscription: ${w.billingSubscription ? '✅ Yes' : '❌ No'}`)
      
      if (w.billingSubscription) {
        console.log(`   Plan: ${w.billingSubscription.planType}`)
        console.log(`   Status: ${w.billingSubscription.status}`)
        console.log(`   Soldiers: ${w.billingSubscription.unlockedSoldiers.join(', ')}`)
      }
      console.log('')
    })

    // Return the latest workspace ID
    const latestWorkspace = workspaces[0]
    console.log('─'.repeat(70))
    console.log('\n🎯 Use this workspace ID for payment:')
    console.log(`   ${latestWorkspace.id}`)
    console.log('\n📝 To create subscription, run:')
    console.log(`   node manual-unlock-after-payment.js ${latestWorkspace.id} bundle`)
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

findUserWorkspace()
