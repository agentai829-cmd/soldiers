const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkSubscriptionFields() {
  try {
    const sub = await db.billingSubscription.findFirst({
      where: { status: 'ACTIVE' }
    })
    
    if (sub) {
      console.log('Subscription Fields:', Object.keys(sub))
      console.log('\nSample Data:')
      console.log('Plan Type:', sub.planType)
      console.log('Interval:', sub.interval)
      console.log('Price:', sub.price)
      console.log('Amount:', sub.amount)
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

checkSubscriptionFields()
