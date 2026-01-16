/**
 * Fix billing for talhaoffice27
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixTalhaOfficeBilling() {
  try {
    console.log('🔧 Fixing billing for talhaoffice27...\n')
    
    const user = await prisma.user.findUnique({
      where: { email: 'talhaoffice27@gmail.com' },
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      }
    })
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    if (user.createdWorkspaces.length === 0) {
      console.log('❌ No workspace found!')
      return
    }
    
    const workspace = user.createdWorkspaces[0]
    
    if (workspace.billingSubscription) {
      console.log('✅ Billing subscription already exists!')
      return
    }
    
    console.log(`👤 User: ${user.email}`)
    console.log(`   Workspace: ${workspace.name} (${workspace.id})`)
    
    const isYearly = user.currentPlanName === 'yearly'
    const unlockedSoldiers = isYearly 
      ? ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot']
      : ['buddy']
    
    const billing = await prisma.billingSubscription.create({
      data: {
        workspaceId: workspace.id,
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
    })
    
    console.log('   ✅ Billing subscription created!')
    console.log(`   ✅ Unlocked soldiers: ${unlockedSoldiers.join(', ')}`)
    console.log('\n✅ Done!\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixTalhaOfficeBilling()
