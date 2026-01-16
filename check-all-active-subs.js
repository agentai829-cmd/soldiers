const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkAllSubs() {
  try {
    // Find all active subscriptions
    const subscriptions = await db.billingSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        workspace: {
          include: {
            creator: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('💳 Found', subscriptions.length, 'active subscriptions\n')

    for (const sub of subscriptions) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('👤 User:', sub.workspace.creator.email || sub.workspace.creator.id)
      console.log('🏢 Workspace:', sub.workspace.name)
      console.log('💰 Interval:', sub.interval)
      console.log('📅 Period End:', sub.currentPeriodEnd)
      console.log('📆 Days until renewal:', Math.ceil((sub.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)))
      console.log('🔑 Stripe Price ID:', sub.stripePriceId)
      console.log('🪖 Soldiers:', sub.unlockedSoldiers.length)
      console.log()
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkAllSubs()
