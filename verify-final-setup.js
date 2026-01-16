const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function verifyFinalSetup() {
  console.log('🎯 FINAL VERIFICATION - Soldiers X Setup\n')

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

    if (!workspace) {
      console.error('❌ Workspace not found!')
      return
    }

    console.log('📦 WORKSPACE INFO:')
    console.log('   Name:', workspace.name)
    console.log('   ID:', workspace.id)
    console.log('   User:', workspace.creator.name)
    console.log('   Email:', workspace.creator.email)

    if (!workspace.billingSubscription) {
      console.error('\n❌ NO SUBSCRIPTION FOUND!')
      return
    }

    const sub = workspace.billingSubscription
    console.log('\n💳 SUBSCRIPTION INFO:')
    console.log('   Plan Type:', sub.planType)
    console.log('   Interval:', sub.interval)
    console.log('   Status:', sub.status)
    console.log('   Period End:', sub.currentPeriodEnd)

    console.log('\n🎖️  UNLOCKED SOLDIERS:')
    console.log('   Total Count:', sub.unlockedSoldiers.length)
    console.log('   Soldiers:', sub.unlockedSoldiers.join(', '))

    // Check which soldiers are unlocked
    const upperHelpers = ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot']
    const soldiersX = ['penn', 'soshie', 'seomi', 'milli', 'vizzy']

    const hasUpper = upperHelpers.filter(s => sub.unlockedSoldiers.includes(s))
    const hasSoldiersX = soldiersX.filter(s => sub.unlockedSoldiers.includes(s))

    console.log('\n📊 BREAKDOWN:')
    console.log('   Upper 5 Helpers:', hasUpper.length, '/', upperHelpers.length)
    console.log('   └─', hasUpper.join(', '))
    console.log('   Soldiers X:', hasSoldiersX.length, '/', soldiersX.length)
    console.log('   └─', hasSoldiersX.join(', '))

    console.log('\n✅ WHAT USER WILL SEE IN WORKSPACE:')
    
    const soldierNames = {
      'buddy': 'Bob (Buzz Builder)',
      'pitch-bot': 'Lisa (Investor Deck Planner)',
      'growth-bot': 'Leo (Growth & Marketing Planner)',
      'dev-bot': 'Ada (Developer & Code Expert)',
      'pm-bot': 'Grace (Project Manager)',
      'penn': 'Carl/Jasper (Copywriting) - Soldiers X',
      'soshie': 'Paul/Zara (Social Media) - Soldiers X',
      'seomi': 'Olivia/Iris (SEO) - Soldiers X',
      'milli': 'Wendy/Ethan (Sales) - Soldiers X',
      'vizzy': 'Dave/Ava (Virtual Assistant) - Soldiers X'
    }

    sub.unlockedSoldiers.forEach((soldierID, index) => {
      const name = soldierNames[soldierID] || soldierID
      const status = soldiersX.includes(soldierID) ? '🎖️ ' : '👤'
      console.log(`   ${status} ${index + 1}. ${name}`)
    })

    console.log('\n🎉 STATUS:')
    if (sub.unlockedSoldiers.length >= 10) {
      console.log('   ✅ ALL SOLDIERS UNLOCKED! (Upper 5 + Soldiers X)')
      console.log('   ✅ Dashboard will show: "All Soldiers (10)" badge')
      console.log('   ✅ Dashboard will show: "+ Soldiers X" indicator')
      console.log('   ✅ Workspace will show all 10 soldiers UNLOCKED')
    } else if (hasUpper.length === 5 && hasSoldiersX.length === 0) {
      console.log('   ✅ Upper 5 helpers unlocked')
      console.log('   ⚠️  Soldiers X still locked (need to purchase)')
    } else {
      console.log('   ⚠️  Partial unlock:', sub.unlockedSoldiers.length, 'soldiers')
    }

    console.log('\n📱 NEXT STEPS:')
    console.log('   1. Open browser: http://localhost:3000')
    console.log('   2. Login with:', workspace.creator.email)
    console.log('   3. Go to workspace:', workspace.name)
    console.log('   4. All soldiers should be UNLOCKED (no lock icons)')
    console.log('   5. Go to admin dashboard to see subscription')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

verifyFinalSetup()
