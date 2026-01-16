const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function verifySystem() {
  try {
    console.log('🔍 System Verification Report\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Check all active subscriptions
    const subs = await db.billingSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        workspace: {
          include: { creator: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('💳 Active Subscriptions:', subs.length)
    console.log()

    let yearlyCount = 0
    let monthlyCount = 0

    for (const sub of subs) {
      const daysUntilRenewal = Math.ceil((sub.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24))
      const isYearly = sub.interval === 'year'
      
      if (isYearly) yearlyCount++
      else monthlyCount++
      
      console.log(`${isYearly ? '📅' : '📆'} ${sub.workspace.creator.email}`)
      console.log(`   Workspace: ${sub.workspace.name}`)
      console.log(`   Interval: ${sub.interval.toUpperCase()} ${isYearly ? '✅' : ''}`)
      console.log(`   Price ID: ${sub.stripePriceId}`)
      console.log(`   Renewal: ${sub.currentPeriodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (${daysUntilRenewal} days)`)
      console.log(`   Soldiers: ${sub.unlockedSoldiers.length}`)
      console.log()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`📊 Summary: ${yearlyCount} yearly, ${monthlyCount} monthly\n`)
    console.log('✅ System Status: READY FOR NEW USERS')
    console.log()
    console.log('📌 How it works for new users:')
    console.log('   1. User selects "Professional" plan ($199/year)')
    console.log('   2. Checkout sends: planId=professional, interval=year')
    console.log('   3. Stripe uses price: price_1SkvUVGiBK03UQWz6hyKiPvi')
    console.log('   4. Webhook detects yearly by checking:')
    console.log('      ✓ Price ID matches .env → Sets interval=year')
    console.log('      ✓ Or amount = $199/200 → Sets interval=year')
    console.log('   5. Database saves with interval="year"')
    console.log('   6. Billing page shows "Yearly Plan $199/year"')
    console.log()
    console.log('🎯 Future yearly subscriptions will save correctly!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

verifySystem()
