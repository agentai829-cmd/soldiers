// Create test subscription manually for current year plan purchase
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestSubscription() {
  try {
    console.log('🔧 Creating subscription for year plan...\n')
    
    // Get the current logged in user's workspace (most recent workspace)
    const workspace = await prisma.workspace.findFirst({
      include: {
        creator: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (!workspace) {
      console.error('❌ No workspace found!')
      return
    }
    
    console.log('Found workspace:', workspace.name)
    console.log('User:', workspace.creator?.name || 'Unknown')
    console.log('Email:', workspace.creator?.email || 'Unknown')
    
    // Check if subscription already exists
    const existing = await prisma.billingSubscription.findUnique({
      where: { workspaceId: workspace.id }
    })
    
    if (existing) {
      console.log('\n✅ Subscription already exists!')
      console.log('Updating to year plan...')
      
      const updated = await prisma.billingSubscription.update({
        where: { workspaceId: workspace.id },
        data: {
          planType: 'professional',
          interval: 'year',
          unlockedSoldiers: ['buddy', 'pitch-bot', 'growth-bot', 'dev-bot', 'pm-bot'],
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      })
      
      console.log('\n✅ Subscription updated to year plan!')
    } else {
      console.log('\n📝 Creating new subscription...')
      
      const subscription = await prisma.billingSubscription.create({
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
      
      console.log('\n✅ Subscription created successfully!')
      console.log('   Plan: Professional (Yearly)')
      console.log('   Soldiers: Upper 5 helpers unlocked')
      console.log('   Status: ACTIVE')
      console.log('   Valid until:', subscription.currentPeriodEnd.toLocaleDateString())
    }
    
    console.log('\n🎉 Done! Refresh admin dashboard to see the data.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestSubscription()
