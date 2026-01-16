const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testAPI() {
  console.log('🧪 Testing Workspace Subscription API\n')

  try {
    const workspace = await db.workspace.findFirst({
      where: {
        creator: {
          email: 'talhaoffice27@gmail.com'
        }
      },
      include: {
        billingSubscription: true
      }
    })

    if (!workspace) {
      console.error('❌ Workspace not found!')
      return
    }

    console.log('📦 Workspace ID:', workspace.id)
    console.log('📦 Workspace Name:', workspace.name)

    if (!workspace.billingSubscription) {
      console.error('❌ No subscription!')
      return
    }

    const sub = workspace.billingSubscription
    console.log('\n✅ Database Subscription:')
    console.log('   Unlocked Soldiers:', sub.unlockedSoldiers)
    console.log('   Total Count:', sub.unlockedSoldiers.length)

    console.log('\n📡 API Should Return:')
    console.log('   {')
    console.log('     hasSubscription: true,')
    console.log('     unlockedSoldiers: [')
    sub.unlockedSoldiers.forEach(s => console.log(`       "${s}",`))
    console.log('     ]')
    console.log('   }')

    console.log('\n🔍 Workspace Page Checks:')
    const checks = {
      'penn (Carl)': sub.unlockedSoldiers.includes('penn'),
      'soshie (Paul)': sub.unlockedSoldiers.includes('soshie'),
      'seomi (Olivia)': sub.unlockedSoldiers.includes('seomi'),
      'milli (Wendy)': sub.unlockedSoldiers.includes('milli'),
      'vizzy (Dave)': sub.unlockedSoldiers.includes('vizzy')
    }

    Object.entries(checks).forEach(([name, unlocked]) => {
      console.log(`   ${unlocked ? '✅' : '❌'} ${name}`)
    })

    const allUnlocked = Object.values(checks).every(v => v === true)
    
    if (allUnlocked) {
      console.log('\n🎉 ALL SOLDIERS X SHOULD BE UNLOCKED!')
      console.log('\n⚠️  If still locked in browser:')
      console.log('   1. Open DevTools (F12)')
      console.log('   2. Go to Console')
      console.log('   3. Look for: "🎖️ Unlocked soldiers from API"')
      console.log('   4. Check if array has all 10 soldiers')
      console.log('   5. If not, API is not returning correct data')
    }

    console.log('\n🔧 Quick Fixes:')
    console.log('   1. Hard refresh: Ctrl + Shift + R')
    console.log('   2. Clear localStorage: localStorage.clear()')
    console.log('   3. Clear all site data in DevTools')
    console.log('   4. Restart dev server: npm run dev')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testAPI()
