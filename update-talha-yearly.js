const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function updateTalhaToYearly() {
  try {
    const updated = await db.billingSubscription.update({
      where: { stripeSubscriptionId: 'sub_1SkvGVGiBK03UQWz7i1L4fOM' },
      data: {
        interval: 'year',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    })
    
    console.log('✅ Updated Talha subscription to yearly!')
    console.log('   Interval:', updated.interval)
    console.log('   Expires:', updated.currentPeriodEnd)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

updateTalhaToYearly()
