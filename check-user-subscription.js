// Test script to check user subscription
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testUserSubscription(email) {
  try {
    console.log('🔍 Checking subscription for email:', email)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        clerkId: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        currentPlanName: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        cancelAtPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('\n✅ User Found:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:', user.email)
    console.log('👤 Name:', user.name || 'N/A')
    console.log('🔑 Clerk ID:', user.clerkId)
    console.log('💳 Stripe Customer ID:', user.stripeCustomerId || 'N/A')
    console.log('📋 Subscription ID:', user.stripeSubscriptionId || 'N/A')
    console.log('📊 Status:', user.subscriptionStatus || 'No subscription')
    console.log('📦 Plan:', user.currentPlanName || 'N/A')
    console.log('📅 Start Date:', user.subscriptionStartDate ? user.subscriptionStartDate.toLocaleDateString() : 'N/A')
    console.log('📅 End Date:', user.subscriptionEndDate ? user.subscriptionEndDate.toLocaleDateString() : 'N/A')
    console.log('🚫 Cancel at Period End:', user.cancelAtPeriodEnd || false)
    console.log('🕐 Created:', user.createdAt.toLocaleString())
    console.log('🕐 Updated:', user.updatedAt.toLocaleString())
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const hasActiveSubscription = 
      user.subscriptionStatus === 'active' || 
      user.subscriptionStatus === 'trialing'
    
    if (hasActiveSubscription) {
      console.log('\n✅ User has ACTIVE subscription')
      console.log('🌐 User can access the website')
    } else {
      console.log('\n❌ User has NO active subscription')
      console.log('💰 User should be redirected to payment page')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: node check-user-subscription.js <email>')
  console.log('Example: node check-user-subscription.js user@example.com')
  process.exit(1)
}

testUserSubscription(email)
