/**
 * Create Subscription for New User After Payment
 * 
 * Agar naya user signup kare aur payment kare but subscription show na ho,
 * toh ye script use karo.
 * 
 * Usage:
 *   node create-subscription-for-user.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSubscriptionForNewUser() {
  try {
    console.log('\n🆕 CREATE SUBSCRIPTION FOR NEW USER')
    console.log('═'.repeat(60))
    
    // Get latest user without subscription
    const allWorkspaces = await prisma.workspace.findMany({
      include: {
        creator: true,
        billingSubscription: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`\n📊 Found ${allWorkspaces.length} total workspaces`)
    
    // Find users without subscriptions
    const usersWithoutSubs = allWorkspaces.filter(w => !w.billingSubscription)
    
    if (usersWithoutSubs.length === 0) {
      console.log('\n✅ All users already have subscriptions!')
      console.log('\nIf a user just paid, their workspace ID might not be found.')
      console.log('Check if they logged in and created a workspace first.\n')
      
      // Show all users
      console.log('\n📋 All Users:')
      allWorkspaces.forEach((w, i) => {
        console.log(`\n${i + 1}. ${w.creator?.name || 'Unknown'}`)
        console.log(`   Email: ${w.creator?.email || 'Unknown'}`)
        console.log(`   Workspace: ${w.name}`)
        console.log(`   Workspace ID: ${w.id}`)
        console.log(`   Has Subscription: ${w.billingSubscription ? '✅ Yes' : '❌ No'}`)
      })
      
      return
    }

    console.log(`\n🔍 Found ${usersWithoutSubs.length} users without subscriptions:\n`)
    
    usersWithoutSubs.forEach((w, i) => {
      console.log(`${i + 1}. ${w.creator?.name || 'Unknown'} (${w.creator?.email || 'Unknown'})`)
      console.log(`   Workspace: ${w.name}`)
      console.log(`   Workspace ID: ${w.id}`)
      console.log(`   Created: ${w.createdAt.toLocaleString()}`)
      console.log('')
    })

    // Get the latest user (most recent signup)
    const latestUser = usersWithoutSubs[0]
    
    console.log('─'.repeat(60))
    console.log('\n❓ Creating subscription for latest user:')
    console.log(`👤 ${latestUser.creator?.name || 'Unknown'}`)
    console.log(`📧 ${latestUser.creator?.email || 'Unknown'}`)
    console.log(`📦 Workspace: ${latestUser.name}`)
    console.log('')

    // Ask user for confirmation (auto-confirm for now)
    console.log('💳 What type of subscription?')
    console.log('   1. Single Soldier (Carl)')
    console.log('   2. Bundle (All 5 Soldiers)')
    console.log('')
    
    // Default to bundle for now
    const purchaseType = 'bundle'
    const soldiers = purchaseType === 'bundle' 
      ? ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
      : ['Carl']

    console.log(`📝 Creating ${purchaseType} subscription...\n`)

    const subscription = await prisma.billingSubscription.create({
      data: {
        workspaceId: latestUser.id,
        planId: purchaseType,
        planType: purchaseType,
        interval: 'month',
        stripeCustomerId: 'manual_' + Date.now(),
        stripeSubscriptionId: 'manual_' + Date.now(),
        stripePriceId: 'manual_' + Date.now(),
        unlockedSoldiers: soldiers,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    })

    console.log('✅ Subscription Created Successfully!')
    console.log('─'.repeat(60))
    console.log('📊 Details:')
    console.log(`   ID: ${subscription.id}`)
    console.log(`   Plan: ${subscription.planType}`)
    console.log(`   Status: ${subscription.status}`)
    console.log(`   Soldiers: ${subscription.unlockedSoldiers.join(', ')}`)
    console.log(`   Expires: ${subscription.currentPeriodEnd.toLocaleString()}`)
    console.log('')
    console.log('🔄 Refresh admin dashboard to see the new subscription!')
    console.log('🌐 Refresh user workspace to see unlocked soldiers!')
    console.log('')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nStack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

createSubscriptionForNewUser()
