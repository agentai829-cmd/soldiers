// Find workspace by ID
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findWorkspace() {
  try {
    const workspaceId = 'cmhzel1tv0002s8nr095fb8jq'
    
    console.log('🔍 Checking workspace:', workspaceId, '\n')
    
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        creator: true,
        billingSubscription: true
      }
    })
    
    if (!workspace) {
      console.error('❌ Workspace not found!')
      return
    }
    
    console.log('Workspace Details:')
    console.log('   Name:', workspace.name)
    console.log('   ID:', workspace.id)
    console.log('   Creator:', workspace.creator?.name || 'Unknown')
    console.log('   Email:', workspace.creator?.email || 'Unknown')
    console.log('   Has Subscription:', workspace.billingSubscription ? 'YES' : 'NO')
    
    if (workspace.billingSubscription) {
      const sub = workspace.billingSubscription
      console.log('\n✅ Current Subscription:')
      console.log('   Plan:', sub.planType)
      console.log('   Interval:', sub.interval)
      console.log('   Status:', sub.status)
      console.log('   Soldiers:', sub.unlockedSoldiers.join(', '))
    } else {
      console.log('\n❌ No subscription for this workspace')
      console.log('\n🔧 Creating subscription for this workspace...')
      
      const newSub = await prisma.billingSubscription.create({
        data: {
          workspaceId: workspace.id,
          planId: 'professional',
          planType: 'professional',
          interval: 'year',
          stripeCustomerId: 'manual_' + Date.now(),
          stripeSubscriptionId: 'sub_year_' + Date.now(),
          stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID_YEAR || 'price_year',
          unlockedSoldiers: ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot'],
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      })
      
      console.log('\n✅ Subscription created!')
      console.log('   User:', workspace.creator?.name)
      console.log('   Email:', workspace.creator?.email)
      console.log('   Plan: Professional (Yearly)')
      console.log('   Soldiers: Upper 5 helpers')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

findWorkspace()
