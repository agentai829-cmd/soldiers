const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAdminAPI() {
  try {
    console.log('\n=== Testing Admin API Logic ===\n')
    
    // Get all workspaces with subscriptions
    const workspaces = await prisma.workspace.findMany({
      include: {
        billingSubscription: true,
        creator: true
      }
    })
    
    console.log(`Total workspaces: ${workspaces.length}`)
    
    // Filter workspaces with active subscriptions
    const withSubs = workspaces.filter(w => w.billingSubscription)
    console.log(`Workspaces with subscriptions: ${withSubs.length}\n`)
    
    withSubs.forEach(w => {
      const sub = w.billingSubscription
      console.log(`Workspace: ${w.name}`)
      console.log(`  Creator: ${w.creator?.name || 'Unknown'}`)
      console.log(`  Creator Clerk ID: ${w.creator?.clerkId || 'N/A'}`)
      console.log(`  Status: ${sub.status}`)
      console.log(`  Plan: ${sub.planType}`)
      console.log(`  Soldiers: ${sub.unlockedSoldiers.join(', ')}`)
      console.log(`  Stripe ID: ${sub.stripeSubscriptionId}`)
      console.log('---')
    })
    
    // Count stats
    const active = withSubs.filter(w => w.billingSubscription.status === 'ACTIVE').length
    const bundle = withSubs.filter(w => w.billingSubscription.unlockedSoldiers.length === 5).length
    const single = withSubs.filter(w => w.billingSubscription.unlockedSoldiers.length < 5).length
    
    console.log(`\n📊 Stats:`)
    console.log(`  Active: ${active}`)
    console.log(`  Bundle (5): ${bundle}`)
    console.log(`  Single: ${single}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminAPI()
