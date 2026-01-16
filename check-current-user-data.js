/**
 * Check current user's complete data
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUserData() {
  try {
    console.log('🔍 Checking database for user data...\n')
    
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      }
    })
    
    if (users.length === 0) {
      console.log('❌ No users found in database!')
      return
    }
    
    console.log(`Found ${users.length} user(s):\n`)
    
    for (const user of users) {
      console.log('👤 User:', user.email)
      console.log('   Clerk ID:', user.clerkId)
      console.log('   Name:', user.name)
      console.log('   Subscription Status:', user.subscriptionStatus || '❌ NULL')
      console.log('   Current Plan:', user.currentPlanName || '❌ NULL')
      console.log('   Stripe Customer ID:', user.stripeCustomerId || '❌ NULL')
      console.log('   Stripe Subscription ID:', user.stripeSubscriptionId || '❌ NULL')
      console.log('   Stripe Price ID:', user.stripePriceId || '❌ NULL')
      
      if (user.subscriptionStartDate) {
        console.log('   Subscription Start:', user.subscriptionStartDate)
        console.log('   Subscription End:', user.subscriptionEndDate)
      } else {
        console.log('   Subscription Dates: ❌ NULL')
      }
      
      console.log('\n   📁 Workspaces:', user.createdWorkspaces.length)
      
      for (const workspace of user.createdWorkspaces) {
        console.log('      - Workspace:', workspace.name, `(${workspace.id})`)
        
        if (workspace.billingSubscription) {
          const billing = workspace.billingSubscription
          console.log('        💳 Billing Status:', billing.status)
          console.log('        💳 Plan Type:', billing.planType)
          console.log('        💳 Interval:', billing.interval)
          console.log('        💳 Unlocked Soldiers:', billing.unlockedSoldiers.length)
          console.log('        💳 Soldiers:', billing.unlockedSoldiers.join(', '))
          console.log('        💳 Stripe Subscription ID:', billing.stripeSubscriptionId || '❌ NULL')
        } else {
          console.log('        ❌ NO BILLING SUBSCRIPTION!')
        }
      }
      
      console.log('\n' + '='.repeat(80) + '\n')
    }
    
    // Summary
    const withPayment = users.filter(u => u.stripeCustomerId).length
    const withoutPayment = users.filter(u => !u.stripeCustomerId).length
    
    console.log('📊 Summary:')
    console.log(`   ✅ Users with payment data: ${withPayment}`)
    console.log(`   ❌ Users without payment data: ${withoutPayment}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserData()
