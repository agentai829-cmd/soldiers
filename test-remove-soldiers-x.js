const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testRemoveSoldiersX() {
  console.log('🧪 Testing Remove Soldiers X Functionality\n')

  try {
    const workspace = await db.workspace.findFirst({
      where: {
        creator: {
          email: 'talhaoffice27@gmail.com'
        }
      },
      include: {
        creator: true,
        billingSubscription: true
      }
    })

    if (!workspace || !workspace.billingSubscription) {
      console.error('❌ No subscription found!')
      return
    }

    const sub = workspace.billingSubscription
    console.log('📊 BEFORE REMOVAL:')
    console.log('   Total Soldiers:', sub.unlockedSoldiers.length)
    console.log('   Soldiers:', sub.unlockedSoldiers.join(', '))

    // Simulate removing Soldiers X
    const soldiersX = ['penn', 'soshie', 'seomi', 'milli', 'vizzy']
    const remainingSoldiers = sub.unlockedSoldiers.filter(s => !soldiersX.includes(s))

    console.log('\n🗑️  SIMULATING SOLDIERS X REMOVAL:')
    console.log('   Removing:', soldiersX.join(', '))
    console.log('   Keeping:', remainingSoldiers.join(', '))

    console.log('\n📊 AFTER REMOVAL (Simulated):')
    console.log('   Total Soldiers:', remainingSoldiers.length)
    console.log('   Remaining:', remainingSoldiers.join(', '))

    console.log('\n✅ EXPECTED DASHBOARD VIEW:')
    if (remainingSoldiers.length === 5) {
      console.log('   Badge: "Bundle (5 Soldiers)" (Purple)')
      console.log('   No "+ Soldiers X" indicator')
      console.log('   Subscription still ACTIVE')
    }

    console.log('\n💡 TO ACTUALLY REMOVE:')
    console.log('   1. Login to admin dashboard')
    console.log('   2. Click X on "Monthly" badge - Cancels entire subscription')
    console.log('   3. Click X on "+ Soldiers X" badge - Removes only Soldiers X')
    console.log('   4. Individual soldier X buttons - Remove specific soldiers')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testRemoveSoldiersX()
