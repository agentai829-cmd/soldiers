// Find which user has subscription
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function findUserWithSubscription() {
  try {
    console.log('\n🔍 Finding users with active subscriptions...\n')

    // Get all subscriptions
    const subscriptions = await db.billingSubscription.findMany({
      include: {
        workspace: {
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                clerkId: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 Total Subscriptions: ${subscriptions.length}\n`)

    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. Subscription ID: ${sub.id}`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Plan: ${sub.planType} (${sub.interval})`)
      console.log(`   Workspace: ${sub.workspace.name} (${sub.workspace.id})`)
      console.log(`   Owner: ${sub.workspace.creator.email || 'No email'}`)
      console.log(`   Clerk ID: ${sub.workspace.creator.clerkId}`)
      console.log(`   Soldiers: ${sub.unlockedSoldiers?.join(', ') || 'None'}`)
      console.log(`   Period End: ${sub.currentPeriodEnd}`)
      console.log(`   Stripe Sub: ${sub.stripeSubscriptionId}`)
      console.log('')
    })

    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found in database!')
      console.log('\n💡 You need to create a subscription first through Stripe checkout')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

findUserWithSubscription()
