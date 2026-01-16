const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkTalhaAllSubs() {
  const subs = await db.billingSubscription.findMany({
    where: {
      workspace: {
        creator: {
          email: 'talhaoffice27@gmail.com'
        }
      }
    },
    include: { workspace: true },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('\nTalha subscriptions (newest first):\n')
  subs.forEach(s => {
    console.log(`Created: ${s.createdAt}`)
    console.log(`Interval: ${s.interval}`)
    console.log(`Status: ${s.status}`)
    console.log(`Stripe Sub: ${s.stripeSubscriptionId}`)
    console.log(`Workspace: ${s.workspace.name}`)
    console.log('')
  })
  
  await db.$disconnect()
}

checkTalhaAllSubs()
