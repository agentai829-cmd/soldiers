const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkTalhaPrice() {
  try {
    const user = await db.user.findUnique({
      where: { clerkId: 'user_35UGhA1N2FMheIE0VVOBwu5Timb' }
    })
    
    const workspace = await db.workspace.findFirst({
      where: { creatorId: user.id }
    })
    
    const sub = await db.billingSubscription.findFirst({
      where: { workspaceId: workspace.id, status: 'ACTIVE' }
    })
    
    console.log('Subscription Details:')
    console.log('Plan Type:', sub.planType)
    console.log('Interval:', sub.interval)
    console.log('Stripe Price ID:', sub.stripePriceId)
    console.log('Unlocked Soldiers:', sub.unlockedSoldiers)
    console.log('Soldiers Count:', sub.unlockedSoldiers.length)
    
    const hasSoldiersX = sub.unlockedSoldiers.some(s => 
      ['penn', 'soshie', 'seomi', 'milli', 'vizzy'].includes(s)
    )
    console.log('Has Soldiers X?', hasSoldiersX)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

checkTalhaPrice()
