const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAllSubscriptions() {
  try {
    console.log('\n📊 Checking All Subscriptions in Database\n')
    
    const subscriptions = await prisma.billingSubscription.findMany({
      include: {
        workspace: {
          include: {
            creator: true
          }
        }
      }
    })

    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found in database')
      return
    }

    console.log('═'.repeat(80))
    subscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. Subscription Details:`)
      console.log('─'.repeat(80))
      console.log('👤 User:', sub.workspace?.creator?.name || 'Unknown')
      console.log('📧 Email:', sub.workspace?.creator?.email || 'Unknown')
      console.log('🏢 Workspace:', sub.workspace?.name || 'Unknown')
      console.log('📦 Workspace ID:', sub.workspaceId)
      console.log('💳 Plan Type:', sub.planType)
      console.log('⏱️  Interval:', sub.interval || 'NOT SET')
      console.log('📊 Status:', sub.status)
      console.log('🎖️  Unlocked Soldiers:', sub.unlockedSoldiers.join(', ') || 'None')
      console.log('📅 Created:', sub.createdAt.toLocaleString())
      console.log('⏰ Expires:', sub.currentPeriodEnd.toLocaleString())
      console.log('🔗 Stripe Sub ID:', sub.stripeSubscriptionId)
    })
    console.log('\n═'.repeat(80))
    console.log(`\n✅ Total Subscriptions: ${subscriptions.length}`)
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllSubscriptions()
