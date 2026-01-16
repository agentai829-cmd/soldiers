/**
 * Manual fix: Create workspace and billing for users with payment but no workspace
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixUserWorkspaces() {
  try {
    console.log('🔧 Fixing users with payment but no workspace...\n')
    
    // Get all users with payment but no workspace
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { stripeCustomerId: { not: null } },
          { createdWorkspaces: { none: {} } }
        ]
      }
    })
    
    if (users.length === 0) {
      console.log('✅ All users have workspaces!')
      return
    }
    
    console.log(`Found ${users.length} user(s) needing workspace:\n`)
    
    for (const user of users) {
      console.log(`👤 Creating workspace for: ${user.email}`)
      
      // Determine unlocked soldiers based on plan
      const isYearly = user.currentPlanName === 'yearly'
      const unlockedSoldiers = isYearly 
        ? ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot']
        : ['buddy']
      
      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: `${user.name}'s Workspace`,
          slug: `${user.email.split('@')[0]}-workspace-${Date.now()}`,
          description: 'Your personal workspace',
          creatorId: user.id,
          stripeCustomerId: user.stripeCustomerId,
          members: {
            create: {
              userId: user.id,
              role: 'ADMIN'
            }
          },
          billingSubscription: {
            create: {
              planId: user.stripePriceId || 'unknown',
              stripeCustomerId: user.stripeCustomerId,
              stripeSubscriptionId: user.stripeSubscriptionId,
              stripePriceId: user.stripePriceId,
              status: 'ACTIVE',
              planType: isYearly ? 'BUNDLE' : 'SINGLE',
              interval: isYearly ? 'year' : 'month',
              unlockedSoldiers: unlockedSoldiers,
              currentPeriodStart: user.subscriptionStartDate,
              currentPeriodEnd: user.subscriptionEndDate
            }
          }
        }
      })
      
      console.log(`   ✅ Workspace created: ${workspace.name}`)
      console.log(`   ✅ Billing subscription created`)
      console.log(`   ✅ Unlocked soldiers: ${unlockedSoldiers.join(', ')}`)
      console.log()
    }
    
    console.log('✅ All users fixed!\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserWorkspaces()
