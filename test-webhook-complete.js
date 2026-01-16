const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testWebhookFlow() {
  console.log('🧪 Testing complete webhook flow...\n')

  try {
    // Get the user's workspace
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

    console.log('📦 Workspace found:', workspace.name)
    console.log('👤 User:', workspace.creator.name, '(' + workspace.creator.email + ')')
    console.log('💳 Current subscription:', workspace.billingSubscription ? 'EXISTS' : 'NONE')

    // Simulate monthly subscription creation
    console.log('\n📝 Creating monthly subscription (Starter Plan)...')
    
    const monthlyData = {
      workspaceId: workspace.id,
      planId: 'starter',
      planType: 'starter',
      interval: 'month',
      stripeCustomerId: 'cus_test_' + Date.now(),
      stripeSubscriptionId: 'sub_monthly_' + Date.now(),
      stripePriceId: process.env.STRIPE_PRICE_MONTHLY_PLAN,
      unlockedSoldiers: ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot'],
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }

    console.log('📋 Subscription data:', {
      planType: monthlyData.planType,
      interval: monthlyData.interval,
      unlockedSoldiers: monthlyData.unlockedSoldiers
    })

    if (workspace.billingSubscription) {
      console.log('🔄 Updating existing subscription...')
      const updated = await db.billingSubscription.update({
        where: { workspaceId: workspace.id },
        data: monthlyData
      })
      console.log('✅ Updated subscription:', updated.id)
    } else {
      console.log('➕ Creating new subscription...')
      const created = await db.billingSubscription.create({
        data: monthlyData
      })
      console.log('✅ Created subscription:', created.id)
    }

    // Verify the subscription
    console.log('\n🔍 Verifying subscription...')
    const verification = await db.billingSubscription.findUnique({
      where: { workspaceId: workspace.id }
    })

    if (verification) {
      console.log('✅ Subscription verified!')
      console.log('   Plan Type:', verification.planType)
      console.log('   Interval:', verification.interval)
      console.log('   Status:', verification.status)
      console.log('   Unlocked Soldiers:', verification.unlockedSoldiers.join(', '))
      console.log('   Period End:', verification.currentPeriodEnd)
      console.log('\n✨ Monthly subscription created successfully!')
      console.log('📊 This should now appear in the admin dashboard!')
    } else {
      console.error('❌ Subscription verification failed!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

testWebhookFlow()
