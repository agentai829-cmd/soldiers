const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function quickFix() {
  console.log('🔧 Quick Workspace Redirect Fix\n')

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

    console.log('✅ Workspace Found:', workspace.name)
    console.log('✅ Workspace ID:', workspace.id)
    
    if (workspace.billingSubscription) {
      const sub = workspace.billingSubscription
      console.log('✅ Subscription Status:', sub.status)
      console.log('✅ Unlocked Soldiers:', sub.unlockedSoldiers.length, 'total')
      console.log('✅ Expires:', sub.currentPeriodEnd.toDateString())
      
      console.log('\n🎯 Direct Workspace URL:')
      console.log('─'.repeat(60))
      console.log(`\n   http://localhost:3000/workspace/${workspace.id}\n`)
      console.log('─'.repeat(60))
      
      console.log('\n📋 Steps to Fix:')
      console.log('1. ✅ Copy URL above')
      console.log('2. ✅ Open in browser')
      console.log('3. ✅ Hard refresh: Ctrl + Shift + R')
      console.log('4. ✅ Or clear cache: Ctrl + Shift + Delete')
      console.log('5. ✅ Then open: http://localhost:3000/')
      
      console.log('\n🔍 Testing Root Redirect:')
      console.log('   / → /workspace → Check subscription')
      console.log('   Has soldiers?', sub.unlockedSoldiers.length > 0 ? '✅ YES' : '❌ NO')
      console.log('   Should redirect to:', `/workspace/${workspace.id}`)
      
      console.log('\n⚠️  If still showing pricing page:')
      console.log('   1. Browser DevTools (F12)')
      console.log('   2. Console tab - check for errors')
      console.log('   3. Network tab - see redirects')
      console.log('   4. Look for: /api/workspace/.../subscription')
      console.log('   5. Check response has unlockedSoldiers array')
      
    } else {
      console.log('❌ No subscription found!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

quickFix()
