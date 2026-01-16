const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function fixUnlockIssue() {
  console.log('🔧 FIXING PAYMENT UNLOCK ISSUE\n')

  try {
    // Get all workspaces with billing but check actual state
    const workspaces = await db.workspace.findMany({
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

    if (workspaces.length === 0) {
      console.error('❌ No workspace found!')
      return
    }

    const workspace = workspaces[0]
    console.log('📦 Workspace:', workspace.name)
    console.log('👤 User:', workspace.creator.name)

    if (!workspace.billingSubscription) {
      console.log('\n⚠️  No subscription found!')
      console.log('User needs to subscribe first.')
      return
    }

    const sub = workspace.billingSubscription
    console.log('\n💳 Current Subscription:')
    console.log('   Plan:', sub.planType)
    console.log('   Status:', sub.status)
    console.log('   Soldiers:', sub.unlockedSoldiers.length)
    console.log('   List:', sub.unlockedSoldiers.join(', '))

    // Check if Soldiers X are present
    const soldiersX = ['penn', 'soshie', 'seomi', 'milli', 'vizzy']
    const hasSoldiersX = soldiersX.every(s => sub.unlockedSoldiers.includes(s))

    if (hasSoldiersX) {
      console.log('\n✅ Soldiers X already unlocked in database!')
      console.log('\n🔄 If they\'re still locked in browser:')
      console.log('   1. Press Ctrl + Shift + R (hard refresh)')
      console.log('   2. Clear browser cache')
      console.log('   3. Logout and login again')
      console.log('   4. Check workspace page')
    } else {
      console.log('\n⚠️  Soldiers X not found in database!')
      console.log('   Adding them now...')
      
      const upperHelpers = ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot']
      const allSoldiers = [...upperHelpers, ...soldiersX]
      
      await db.billingSubscription.update({
        where: { workspaceId: workspace.id },
        data: {
          unlockedSoldiers: allSoldiers
        }
      })
      
      console.log('✅ Soldiers X added to subscription!')
      console.log('📊 Total soldiers now:', allSoldiers.length)
    }

    console.log('\n🎯 NEXT STEPS:')
    console.log('   1. Close browser completely')
    console.log('   2. Open fresh browser window')
    console.log('   3. Go to workspace: http://localhost:3000')
    console.log('   4. Login')
    console.log('   5. All soldiers should be unlocked!')

    console.log('\n💡 FOR FUTURE PAYMENTS:')
    console.log('   Run: start-webhook.bat')
    console.log('   Keep it running while testing payments')
    console.log('   Then payments will auto-unlock! ✅')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

fixUnlockIssue()
