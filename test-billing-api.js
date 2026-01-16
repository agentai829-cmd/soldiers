// Test billing API directly
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testBillingAPI() {
  try {
    console.log('\n🔍 Testing Billing API Data Flow...\n')

    // Step 1: Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
      },
    })

    console.log('📊 Total Users:', users.length)
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || 'No email'} (Clerk: ${user.clerkId?.slice(0, 15)}...)`)
    })

    if (users.length === 0) {
      console.log('❌ No users found in database!')
      return
    }

    // Test with first user
    const testUser = users[0]
    console.log(`\n🧪 Testing with user: ${testUser.email || testUser.id}`)
    console.log(`   Clerk ID: ${testUser.clerkId}`)
    console.log(`   User ID: ${testUser.id}`)

    // Step 2: Find workspace
    const workspace = await db.workspace.findFirst({
      where: {
        creatorId: testUser.id,
      },
    })

    if (!workspace) {
      console.log('❌ No workspace found for this user')
      return
    }

    console.log(`\n🏢 Workspace Found:`)
    console.log(`   ID: ${workspace.id}`)
    console.log(`   Name: ${workspace.name}`)

    // Step 3: Find subscription
    const subscription = await db.billingSubscription.findFirst({
      where: {
        workspaceId: workspace.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!subscription) {
      console.log('❌ No subscription found for this workspace')
      return
    }

    console.log(`\n💳 Subscription Found:`)
    console.log(`   ID: ${subscription.id}`)
    console.log(`   Status: ${subscription.status}`)
    console.log(`   Plan: ${subscription.planType}`)
    console.log(`   Interval: ${subscription.interval}`)
    console.log(`   Soldiers: ${subscription.unlockedSoldiers?.join(', ') || 'None'}`)
    console.log(`   Current Period End: ${subscription.currentPeriodEnd}`)
    console.log(`   Stripe Sub ID: ${subscription.stripeSubscriptionId}`)

    console.log('\n✅ Data flow is working correctly!')
    console.log('\n🔧 If billing page shows "No Subscription", check:')
    console.log('   1. Browser console for errors')
    console.log('   2. Is user logged in with correct account?')
    console.log('   3. Check Network tab for /api/user/subscription response')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testBillingAPI()
