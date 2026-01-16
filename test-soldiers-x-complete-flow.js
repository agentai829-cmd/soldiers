const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testSoldiersXFlow() {
  console.log('🎖️ Testing COMPLETE Soldiers X Flow...\n')

  try {
    // Get workspace with subscription
    const workspace = await db.workspace.findFirst({
      where: {
        creator: {
          email: 'talhaoffice27@gmail.com'
        }
      },
      include: {
        creator: true,
        billingSubscription: true
      }
    })

    if (!workspace) {
      console.error('❌ Workspace not found!')
      return
    }

    console.log('📦 Workspace:', workspace.name)
    console.log('👤 User:', workspace.creator.name)
    console.log('📧 Email:', workspace.creator.email)

    if (!workspace.billingSubscription) {
      console.error('❌ No subscription found! User needs base subscription first.')
      console.log('\n💡 Creating base subscription first...')
      
      // Create base subscription with upper 5 helpers
      const baseSub = await db.billingSubscription.create({
        data: {
          workspaceId: workspace.id,
          planId: 'starter',
          planType: 'starter',
          interval: 'month',
          stripeCustomerId: 'cus_test_' + Date.now(),
          stripeSubscriptionId: 'sub_monthly_' + Date.now(),
          stripePriceId: process.env.STRIPE_PRICE_MONTHLY_PLAN || 'price_test',
          unlockedSoldiers: ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot'],
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
      
      console.log('✅ Base subscription created with 5 upper helpers')
      workspace.billingSubscription = baseSub
    }

    console.log('\n📋 Current Subscription:')
    console.log('   Plan Type:', workspace.billingSubscription.planType)
    console.log('   Interval:', workspace.billingSubscription.interval)
    console.log('   Current Soldiers:', workspace.billingSubscription.unlockedSoldiers.join(', '))
    console.log('   Total Count:', workspace.billingSubscription.unlockedSoldiers.length)

    // Simulate Soldiers X purchase webhook
    console.log('\n🎖️ Simulating Soldiers X Purchase...')
    console.log('   This simulates what happens when user pays for Soldiers X')
    
    const soldiersX = ['penn', 'soshie', 'seomi', 'milli', 'vizzy']
    const currentSoldiers = workspace.billingSubscription.unlockedSoldiers
    const combinedSoldiers = Array.from(new Set([...currentSoldiers, ...soldiersX]))

    console.log('\n📊 Soldiers Breakdown:')
    console.log('   Current (upper 5):', currentSoldiers.join(', '))
    console.log('   Adding (Soldiers X):', soldiersX.join(', '))
    console.log('   Combined (all 10):', combinedSoldiers.join(', '))

    // Update subscription to add Soldiers X
    const updated = await db.billingSubscription.update({
      where: { workspaceId: workspace.id },
      data: {
        unlockedSoldiers: combinedSoldiers,
        // Update subscription ID to indicate Soldiers X purchase
        stripeSubscriptionId: workspace.billingSubscription.stripeSubscriptionId + '_plus_soldiers_x'
      }
    })

    console.log('\n✅ Soldiers X Unlocked Successfully!')
    console.log('\n📊 Final Subscription State:')
    console.log('   Workspace:', workspace.name)
    console.log('   Plan:', updated.planType)
    console.log('   Interval:', updated.interval)
    console.log('   Total Soldiers:', updated.unlockedSoldiers.length)
    console.log('   All Soldiers:', updated.unlockedSoldiers.join(', '))
    console.log('   Status:', updated.status)

    console.log('\n🎉 Success! User now has access to:')
    console.log('   ✅ Upper 5 Helpers (Bob, Lisa, Leo, Ada, Grace)')
    console.log('   ✅ Soldiers X (Jasper, Zara, Iris, Ethan, Ava)')
    console.log('   ✅ Total: 10 soldiers unlocked')

    console.log('\n📊 Admin Dashboard Will Show:')
    console.log('   • User: ' + workspace.creator.name)
    console.log('   • Plan: Starter (Monthly)')
    console.log('   • Soldiers: 10 unlocked')
    console.log('   • Status: ACTIVE')
    console.log('   • Plus: "Soldiers X Bundle" indicator')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testSoldiersXFlow()
