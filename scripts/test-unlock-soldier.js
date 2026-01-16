const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testUnlockSoldier() {
  try {
    console.log('🔍 Checking current workspace subscriptions...\n')

    // Get all workspaces
    const workspaces = await db.workspace.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        billingSubscription: true
      }
    })

    console.log('📋 Available Workspaces:')
    workspaces.forEach(ws => {
      console.log(`  - ID: ${ws.id}`)
      console.log(`    Name: ${ws.name}`)
      console.log(`    Slug: ${ws.slug}`)
      console.log(`    Has Subscription: ${ws.billingSubscription ? '✅ Yes' : '❌ No'}`)
      if (ws.billingSubscription) {
        console.log(`    Unlocked Soldiers: ${ws.billingSubscription.unlockedSoldiers.join(', ') || 'None'}`)
      }
      console.log('')
    })

    // Ask user to manually enter workspace ID
    console.log('\n📝 To unlock a soldier, run:')
    console.log('node scripts/test-unlock-soldier.js <workspaceId> <soldierName>')
    console.log('\nExample:')
    console.log('node scripts/test-unlock-soldier.js cm5xyz123 Paul')
    console.log('node scripts/test-unlock-soldier.js cm5xyz123 all')

    // Check if args provided
    const workspaceId = process.argv[2]
    const soldierName = process.argv[3]

    if (!workspaceId || !soldierName) {
      console.log('\n⚠️  No workspace ID or soldier name provided. Showing info only.')
      return
    }

    console.log(`\n🔓 Unlocking ${soldierName} for workspace ${workspaceId}...`)

    // Determine unlocked soldiers
    const unlockedSoldiers = soldierName === 'all' 
      ? ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
      : [soldierName]

    // Check if subscription exists
    const existing = await db.billingSubscription.findUnique({
      where: { workspaceId }
    })

    if (existing) {
      // Update existing subscription
      const updated = await db.billingSubscription.update({
        where: { workspaceId },
        data: {
          unlockedSoldiers: {
            set: [...new Set([...existing.unlockedSoldiers, ...unlockedSoldiers])]
          }
        }
      })
      console.log('✅ Updated subscription:')
      console.log('   Unlocked Soldiers:', updated.unlockedSoldiers.join(', '))
    } else {
      // Create new subscription
      const currentDate = new Date()
      const endDate = new Date(currentDate)
      endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

      const subscription = await db.billingSubscription.create({
        data: {
          workspaceId,
          planId: 'test-plan',
          planType: soldierName === 'all' ? 'professional' : 'starter',
          stripeSubscriptionId: `test_${Date.now()}`,
          stripePriceId: soldierName === 'all' ? 'price_professional' : 'price_starter',
          unlockedSoldiers,
          status: 'ACTIVE',
          currentPeriodStart: currentDate,
          currentPeriodEnd: endDate
        }
      })

      console.log('✅ Created new subscription:')
      console.log('   Plan Type:', subscription.planType)
      console.log('   Unlocked Soldiers:', subscription.unlockedSoldiers.join(', '))
      console.log('   Status:', subscription.status)
      console.log('   Valid Until:', subscription.currentPeriodEnd.toLocaleDateString())
    }

    console.log('\n🎉 Done! Refresh your workspace page to see unlocked soldiers.')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testUnlockSoldier()
