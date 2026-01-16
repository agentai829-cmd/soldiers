// Quick script to check subscriptions in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSubscriptions() {
  try {
    console.log('🔍 Checking database for subscriptions...\n')
    
    // Get all subscriptions
    const subscriptions = await prisma.billingSubscription.findMany({
      include: {
        workspace: {
          include: {
            creator: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 Total subscriptions found: ${subscriptions.length}\n`)
    
    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions in database!')
      console.log('\nPossible reasons:')
      console.log('1. Payment not completed yet')
      console.log('2. Webhook not triggered')
      console.log('3. Webhook failed to process')
      console.log('\nCheck webhook logs: stripe listen --forward-to localhost:3000/api/webhooks/stripe')
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`\n${index + 1}. Subscription Details:`)
        console.log('   ID:', sub.id)
        console.log('   Workspace:', sub.workspace.name)
        console.log('   User:', sub.workspace.creator?.name || 'Unknown')
        console.log('   Email:', sub.workspace.creator?.email || 'Unknown')
        console.log('   Plan Type:', sub.planType)
        console.log('   Interval:', sub.interval)
        console.log('   Status:', sub.status)
        console.log('   Unlocked Soldiers:', sub.unlockedSoldiers.join(', ') || 'None')
        console.log('   Stripe Sub ID:', sub.stripeSubscriptionId)
        console.log('   Created:', sub.createdAt)
        console.log('   Period End:', sub.currentPeriodEnd)
      })
    }
    
    console.log('\n✅ Check complete!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSubscriptions()
