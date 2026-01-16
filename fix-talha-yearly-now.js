const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function fixYearlySubscription() {
  try {
    // Find Talha's subscription
    const user = await db.user.findFirst({
      where: {
        email: { contains: 'talha', mode: 'insensitive' }
      }
    })

    if (!user) {
      console.log('❌ Talha not found')
      return
    }

    console.log('👤 Found user:', user.email)

    // Find workspace with subscription
    const workspaces = await db.workspace.findMany({
      where: { creatorId: user.id },
      include: { billingSubscription: true }
    })

    const wsWithSub = workspaces.find(w => w.billingSubscription && w.billingSubscription.status === 'ACTIVE')

    if (!wsWithSub || !wsWithSub.billingSubscription) {
      console.log('❌ No active subscription found')
      return
    }

    const sub = wsWithSub.billingSubscription

    console.log('\n📋 Current Subscription:')
    console.log('   Interval:', sub.interval)
    console.log('   Price ID:', sub.stripePriceId)
    console.log('   Period Start:', sub.currentPeriodStart)
    console.log('   Period End:', sub.currentPeriodEnd)
    console.log('   Soldiers:', sub.unlockedSoldiers)

    // Calculate 1 year from start date
    const yearEnd = new Date(sub.currentPeriodStart)
    yearEnd.setFullYear(yearEnd.getFullYear() + 1)

    console.log('\n🔄 Updating to yearly plan...')
    console.log('   New Price ID: price_1SkvUVGiBK03UQWz6hyKiPvi')
    console.log('   New Period End:', yearEnd)

    const updated = await db.billingSubscription.update({
      where: { id: sub.id },
      data: {
        interval: 'year',
        stripePriceId: 'price_1SkvUVGiBK03UQWz6hyKiPvi',
        currentPeriodEnd: yearEnd
      }
    })

    console.log('\n✅ Successfully updated to yearly plan!')
    console.log('   Interval:', updated.interval)
    console.log('   Price ID:', updated.stripePriceId)
    console.log('   New renewal date:', updated.currentPeriodEnd)
    console.log('   Days until renewal:', Math.ceil((updated.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)))

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

fixYearlySubscription()
