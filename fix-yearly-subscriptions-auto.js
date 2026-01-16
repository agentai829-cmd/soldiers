const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function fixYearlySubscription() {
  try {
    // Find subscription with Feb 2026 renewal (31 days from now)
    const subscriptions = await db.billingSubscription.findMany({
      where: {
        status: 'ACTIVE',
        interval: 'month' // Currently showing as month but should be year
      },
      include: {
        workspace: {
          include: { creator: true }
        }
      }
    })

    console.log(`Found ${subscriptions.length} monthly subscriptions\n`)

    for (const sub of subscriptions) {
      const daysUntilRenewal = Math.ceil((sub.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24))
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('👤 User:', sub.workspace.creator.email)
      console.log('🏢 Workspace:', sub.workspace.name)
      console.log('💰 Current interval:', sub.interval)
      console.log('📅 Renewal:', sub.currentPeriodEnd)
      console.log('📆 Days until renewal:', daysUntilRenewal)
      console.log('🔑 Price ID:', sub.stripePriceId)

      // If renewal is exactly 31 days from creation, it's monthly
      // If it's around 365 days, it should be yearly
      const daysFromStart = Math.ceil((sub.currentPeriodEnd - sub.currentPeriodStart) / (1000 * 60 * 60 * 24))
      
      console.log('📊 Period length:', daysFromStart, 'days')
      
      // Check if this should actually be yearly (period > 300 days)
      if (daysFromStart > 300) {
        console.log('✅ This should be YEARLY - fixing...')
        
        const updated = await db.billingSubscription.update({
          where: { id: sub.id },
          data: { interval: 'year' }
        })
        
        console.log('✅ FIXED: Updated to yearly')
      } else {
        console.log('ℹ️  This is correctly monthly (period < 300 days)')
      }
      console.log()
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

fixYearlySubscription()
