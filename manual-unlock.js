// Manually create billing record for testing
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createBilling() {
  try {
    const workspaceId = 'cmhzel1tv0002s8nr095fb8jq'
    
    console.log('🔧 Creating billing record for workspace:', workspaceId)
    
    const billing = await prisma.billingSubscription.create({
      data: {
        workspaceId: workspaceId,
        planId: 'starter',
        planType: 'bundle',
        interval: 'month',
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_test_123',
        stripePriceId: 'price_1SkVpcGiBK03UQWzZB3oYNIr',
        unlockedSoldiers: ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot'],
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    })
    
    console.log('\n✅ Billing record created!')
    console.log('   Unlocked Soldiers:', billing.unlockedSoldiers)
    console.log('   Status:', billing.status)
    console.log('\n🎉 Now refresh browser - workspace should open!')
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Billing record already exists - updating...')
      
      const billing = await prisma.billingSubscription.update({
        where: { workspaceId: 'cmhzel1tv0002s8nr095fb8jq' },
        data: {
          unlockedSoldiers: ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot'],
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
      
      console.log('✅ Updated! Unlocked soldiers:', billing.unlockedSoldiers)
    } else {
      console.error('Error:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createBilling()
