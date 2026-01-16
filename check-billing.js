// Check billing status after payment
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBilling() {
  try {
    const workspaceId = 'cmhzel1tv0002s8nr095fb8jq'
    
    console.log('🔍 Checking billing for workspace:', workspaceId)
    
    const billing = await prisma.billingSubscription.findUnique({
      where: { workspaceId }
    })
    
    if (!billing) {
      console.log('❌ No billing record found!')
      console.log('\n💡 Solution: Webhook not triggered or failed')
      console.log('   Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe')
    } else {
      console.log('\n✅ Billing record found!')
      console.log('   Status:', billing.status)
      console.log('   Unlocked Soldiers:', billing.unlockedSoldiers)
      console.log('   Price ID:', billing.stripePriceId)
      console.log('   Period End:', billing.currentPeriodEnd)
      
      if (!billing.unlockedSoldiers || billing.unlockedSoldiers.length === 0) {
        console.log('\n⚠️  WARNING: No soldiers unlocked!')
        console.log('   Webhook metadata issue - check agent names')
      } else {
        console.log('\n✅ Soldiers properly unlocked!')
      }
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkBilling()
