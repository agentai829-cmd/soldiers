// Fix existing subscription with proper data
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSubscription() {
  try {
    console.log('🔧 Fixing subscription data...\n')
    
    // Get the subscription
    const sub = await prisma.billingSubscription.findFirst({
      where: {
        interval: null
      }
    })
    
    if (!sub) {
      console.log('✅ No subscriptions need fixing!')
      return
    }
    
    console.log('Found subscription with null interval:', sub.id)
    
    // Update with proper data
    const updated = await prisma.billingSubscription.update({
      where: { id: sub.id },
      data: {
        interval: 'month', // Default to month if not set
        unlockedSoldiers: ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot'] // Upper 5 helpers
      }
    })
    
    console.log('\n✅ Subscription updated:')
    console.log('   ID:', updated.id)
    console.log('   Interval:', updated.interval)
    console.log('   Unlocked Soldiers:', updated.unlockedSoldiers.join(', '))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixSubscription()
