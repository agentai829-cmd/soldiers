const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkSubscription() {
  try {
    // Find Talha's user
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'talha', mode: 'insensitive' } },
          { clerkId: { contains: 'user_' } }
        ]
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('👤 User:', user.email || user.id)
    console.log('🆔 Clerk ID:', user.clerkId)

    // Find all workspaces
    const workspaces = await db.workspace.findMany({
      where: { creatorId: user.id },
      include: {
        billingSubscription: true
      }
    })

    console.log('\n📊 Found', workspaces.length, 'workspaces')

    for (const ws of workspaces) {
      console.log('\n🏢 Workspace:', ws.name || ws.id)
      
      if (ws.billingSubscription) {
        const sub = ws.billingSubscription
        console.log('💳 Subscription:')
        console.log('   - Status:', sub.status)
        console.log('   - Interval:', sub.interval)
        console.log('   - Stripe Price ID:', sub.stripePriceId)
        console.log('   - Current Period End:', sub.currentPeriodEnd)
        console.log('   - Days until renewal:', Math.ceil((sub.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)))
        console.log('   - Unlocked Soldiers:', sub.unlockedSoldiers.length)
      } else {
        console.log('   No subscription')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkSubscription()
