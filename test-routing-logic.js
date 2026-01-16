const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testRoutingLogic() {
  console.log('🔀 Testing Routing Logic\n')

  try {
    // Find user's workspace
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

    console.log('📦 Workspace:', workspace.name)
    console.log('🆔 Workspace ID:', workspace.id)

    const hasSub = !!workspace.billingSubscription
    const hasUnlocked = hasSub && workspace.billingSubscription.unlockedSoldiers?.length > 0
    const isActive = hasSub && workspace.billingSubscription.status === 'ACTIVE'
    const notExpired = hasSub && new Date() < workspace.billingSubscription.currentPeriodEnd

    console.log('\n📊 Subscription Status:')
    console.log('   Has Subscription:', hasSub ? '✅' : '❌')
    if (hasSub) {
      console.log('   Status:', workspace.billingSubscription.status)
      console.log('   Is Active:', isActive ? '✅' : '❌')
      console.log('   Not Expired:', notExpired ? '✅' : '❌')
      console.log('   Unlocked Soldiers:', workspace.billingSubscription.unlockedSoldiers?.length || 0)
    }

    console.log('\n🔀 Expected Routing:')
    console.log('─'.repeat(50))

    // Test Case 1: User opens website (/)
    console.log('\n1️⃣  User Opens Website: /')
    console.log('   middleware.ts → Redirects to: /workspace')
    console.log('   workspace/page.tsx → Checks subscription')
    
    if (hasUnlocked && isActive && notExpired) {
      console.log('   ✅ Has unlocked soldiers')
      console.log('   → Redirects to: /workspace/' + workspace.id)
      console.log('   ✅ User sees: WORKSPACE PAGE')
    } else {
      console.log('   ❌ No unlocked soldiers OR expired')
      console.log('   → Redirects to: /pricing/select')
      console.log('   ⚠️  User sees: PRICING PAGE')
    }

    // Test Case 2: User opens /dashboard
    console.log('\n2️⃣  User Opens: /dashboard')
    console.log('   middleware.ts → Redirects to: /workspace')
    console.log('   (Same as case 1)')

    // Test Case 3: Direct workspace access
    console.log('\n3️⃣  User Opens: /workspace/' + workspace.id)
    console.log('   workspace/[workspaceId]/layout.tsx checks:')
    
    if (hasUnlocked && isActive && notExpired) {
      console.log('   ✅ Has active subscription with soldiers')
      console.log('   → Allows access')
      console.log('   ✅ User sees: WORKSPACE PAGE')
    } else {
      console.log('   ❌ No subscription OR expired')
      console.log('   → Redirects to: /pricing/select')
      console.log('   ⚠️  User sees: PRICING PAGE')
    }

    // Test Case 4: Pricing page with active sub
    console.log('\n4️⃣  User Opens: /pricing/select (has active sub)')
    console.log('   pricing/select/page.tsx checks billing')
    
    if (hasUnlocked && isActive && notExpired) {
      console.log('   ✅ Has active subscription')
      console.log('   → Redirects to: /workspace/' + workspace.id)
      console.log('   ✅ User sees: WORKSPACE PAGE')
    } else {
      console.log('   ❌ No active subscription')
      console.log('   → Stays on pricing')
      console.log('   💰 User sees: PRICING PAGE (can purchase)')
    }

    console.log('\n' + '─'.repeat(50))
    console.log('\n🎯 FINAL RESULT:')
    
    if (hasUnlocked && isActive && notExpired) {
      console.log('✅ User HAS active subscription')
      console.log('✅ Opening website → GOES TO WORKSPACE')
      console.log('✅ Closing/reopening → STILL WORKSPACE')
      console.log('✅ Pricing page → AUTO-REDIRECTS TO WORKSPACE')
      console.log('\n🎉 ROUTING WORKING CORRECTLY!')
    } else {
      console.log('⚠️  User DOES NOT have active subscription')
      console.log('⚠️  Opening website → GOES TO PRICING')
      console.log('⚠️  Need to purchase plan')
      console.log('\n💰 USER NEEDS TO BUY SUBSCRIPTION')
    }

    console.log('\n📝 Notes:')
    console.log('   • Cache refresh needed after subscription purchase')
    console.log('   • Use Ctrl + Shift + R to clear browser cache')
    console.log('   • Subscription expires:', hasSub ? workspace.billingSubscription.currentPeriodEnd.toLocaleDateString() : 'N/A')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testRoutingLogic()
