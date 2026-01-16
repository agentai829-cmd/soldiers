// Check specifically for Talha's subscription
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkTalhaSubscription() {
  try {
    const clerkId = 'user_35UGhA1N2FMheIE0VVOBwu5Timb' // talhaoffice27@gmail.com
    
    console.log('\n🔍 Checking Talha subscription flow...\n')
    console.log('Step 1: Finding user by Clerk ID:', clerkId)
    
    const user = await db.user.findUnique({
      where: { clerkId: clerkId }
    })
    
    if (!user) {
      console.log('❌ User not found with Clerk ID')
      return
    }
    
    console.log('✅ User found:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Clerk ID:', user.clerkId)
    
    console.log('\nStep 2: Finding workspace by creator ID:', user.id)
    
    const workspace = await db.workspace.findFirst({
      where: { creatorId: user.id }
    })
    
    if (!workspace) {
      console.log('❌ Workspace not found')
      return
    }
    
    console.log('✅ Workspace found:')
    console.log('   ID:', workspace.id)
    console.log('   Name:', workspace.name)
    console.log('   Creator ID:', workspace.creatorId)
    
    console.log('\nStep 3: Finding subscription by workspace ID:', workspace.id)
    
    const subscription = await db.billingSubscription.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!subscription) {
      console.log('❌ Subscription not found')
      return
    }
    
    console.log('✅ Subscription found:')
    console.log('   ID:', subscription.id)
    console.log('   Status:', subscription.status)
    console.log('   Plan:', subscription.planType)
    console.log('   Interval:', subscription.interval)
    console.log('   Workspace ID:', subscription.workspaceId)
    console.log('   Soldiers:', subscription.unlockedSoldiers)
    console.log('   Period End:', subscription.currentPeriodEnd)
    
    console.log('\n✅ Complete chain works! API should return this data.\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkTalhaSubscription()
