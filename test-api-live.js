// Test the actual API endpoint
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function testAPIFlow() {
  try {
    console.log('\n🔍 Simulating API flow for all users with subscriptions...\n')

    // Get all subscriptions with workspace and creator info
    const subscriptions = await db.billingSubscription.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        workspace: {
          include: {
            creator: true
          }
        }
      }
    })

    console.log(`Found ${subscriptions.length} active subscriptions\n`)

    for (const sub of subscriptions) {
      const user = sub.workspace.creator
      console.log('━'.repeat(60))
      console.log(`\n👤 User: ${user.email || 'No email'}`)
      console.log(`   Clerk ID: ${user.clerkId}`)
      console.log(`   Internal User ID: ${user.id}`)
      console.log(`\n🏢 Workspace: ${sub.workspace.name}`)
      console.log(`   Workspace ID: ${sub.workspace.id}`)
      console.log(`   Creator ID: ${sub.workspace.creatorId}`)
      console.log(`\n💳 Subscription:`)
      console.log(`   ID: ${sub.id}`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Plan: ${sub.planType} (${sub.interval})`)
      console.log(`   Soldiers: ${sub.unlockedSoldiers?.length || 0}`)
      console.log(`   Period End: ${sub.currentPeriodEnd}`)
      
      // Check if the mapping works
      const testUser = await db.user.findUnique({
        where: { clerkId: user.clerkId }
      })
      
      const testWorkspace = await db.workspace.findFirst({
        where: { creatorId: testUser.id }
      })
      
      const testSub = await db.billingSubscription.findFirst({
        where: { workspaceId: testWorkspace.id }
      })
      
      if (testSub) {
        console.log(`\n✅ API Flow Test: SUCCESS`)
        console.log(`   ClerkID → User → Workspace → Subscription chain works!`)
      } else {
        console.log(`\n❌ API Flow Test: FAILED`)
      }
    }

    console.log('\n' + '━'.repeat(60))
    console.log('\n📋 Summary:')
    console.log('   If you see ✅ for all users, the API should work')
    console.log('   Login with one of the email accounts shown above')
    console.log('   The Clerk ID in browser should match one from above\n')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

testAPIFlow()
