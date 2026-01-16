const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestSubscription() {
  try {
    // Get first workspace
    const workspace = await prisma.workspace.findFirst()
    
    if (!workspace) {
      console.log('❌ No workspace found! Create a workspace first.')
      return
    }
    
    console.log(`📦 Creating test subscription for workspace: ${workspace.name}`)
    console.log(`   Workspace ID: ${workspace.id}\n`)
    
    // Check if subscription already exists
    const existingSub = await prisma.billingSubscription.findUnique({
      where: { workspaceId: workspace.id }
    })
    
    if (existingSub) {
      console.log('⚠️  Subscription already exists! Updating it...\n')
      
      const updated = await prisma.billingSubscription.update({
        where: { workspaceId: workspace.id },
        data: {
          unlockedSoldiers: ['Carl'],
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        }
      })
      
      console.log('✅ Subscription updated!')
      console.log(`   Unlocked Soldiers: ${updated.unlockedSoldiers.join(', ')}`)
      console.log(`   Status: ${updated.status}`)
      console.log(`   Expires: ${updated.currentPeriodEnd.toLocaleDateString()}`)
    } else {
      // Create new subscription
      const subscription = await prisma.billingSubscription.create({
        data: {
          workspaceId: workspace.id,
          planId: 'single-soldier',
          planType: 'single',
          stripeCustomerId: 'test_customer_123',
          stripeSubscriptionId: 'test_sub_' + Date.now(),
          stripePriceId: process.env.STRIPE_SINGLE_SOLDIER_PRICE_ID || 'test_price',
          unlockedSoldiers: ['Carl'], // Unlock Carl for testing
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        }
      })
      
      console.log('✅ Test subscription created successfully!\n')
      console.log(`   Subscription ID: ${subscription.id}`)
      console.log(`   Unlocked Soldiers: ${subscription.unlockedSoldiers.join(', ')}`)
      console.log(`   Status: ${subscription.status}`)
      console.log(`   Expires: ${subscription.currentPeriodEnd.toLocaleDateString()}`)
    }
    
    console.log('\n🎉 Carl should now be unlocked!')
    console.log('💡 Refresh your browser to see the changes.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Get command line arguments
const args = process.argv.slice(2)
const soldierName = args[0] || 'Carl'

if (args.includes('--bundle')) {
  console.log('🎖️  Creating bundle subscription (all 5 soldiers)...\n')
  createBundleSubscription()
} else {
  console.log(`🎖️  Creating single soldier subscription (${soldierName})...\n`)
  createTestSubscription()
}

async function createBundleSubscription() {
  try {
    const workspace = await prisma.workspace.findFirst()
    
    if (!workspace) {
      console.log('❌ No workspace found!')
      return
    }
    
    console.log(`📦 Creating bundle subscription for: ${workspace.name}\n`)
    
    const existingSub = await prisma.billingSubscription.findUnique({
      where: { workspaceId: workspace.id }
    })
    
    const allSoldiers = ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
    
    if (existingSub) {
      const updated = await prisma.billingSubscription.update({
        where: { workspaceId: workspace.id },
        data: {
          unlockedSoldiers: allSoldiers,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
      
      console.log('✅ Bundle subscription updated!')
      console.log(`   Unlocked Soldiers: ${updated.unlockedSoldiers.join(', ')}`)
    } else {
      const subscription = await prisma.billingSubscription.create({
        data: {
          workspaceId: workspace.id,
          planId: 'soldiers-bundle',
          planType: 'bundle',
          stripeCustomerId: 'test_customer_bundle',
          stripeSubscriptionId: 'test_sub_bundle_' + Date.now(),
          stripePriceId: process.env.STRIPE_SOLDIERS_BUNDLE_PRICE_ID || 'test_price_bundle',
          unlockedSoldiers: allSoldiers,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
      
      console.log('✅ Bundle subscription created!')
      console.log(`   Unlocked Soldiers: ${subscription.unlockedSoldiers.join(', ')}`)
    }
    
    console.log('\n🎉 All 5 soldiers are now unlocked!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}
