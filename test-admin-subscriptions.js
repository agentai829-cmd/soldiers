const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSubscriptions() {
  try {
    console.log('\n=== Checking Billing Subscriptions ===\n')
    
    const subscriptions = await prisma.billingSubscription.findMany({
      include: {
        workspace: {
          include: {
            creator: true
          }
        }
      }
    })
    
    console.log(`Total subscriptions found: ${subscriptions.length}\n`)
    
    subscriptions.forEach(sub => {
      console.log(`Subscription ID: ${sub.id}`)
      console.log(`Workspace: ${sub.workspace.name}`)
      console.log(`Creator: ${sub.workspace.creator?.name || 'Unknown'}`)
      console.log(`Status: ${sub.status}`)
      console.log(`Plan Type: ${sub.planType}`)
      console.log(`Unlocked Soldiers: ${sub.unlockedSoldiers.join(', ')}`)
      console.log(`Stripe Sub ID: ${sub.stripeSubscriptionId}`)
      console.log('---')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSubscriptions()
