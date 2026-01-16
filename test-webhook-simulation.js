const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Simulate Stripe webhook event data
const simulateCheckoutCompleted = async (workspaceId, purchaseType = 'bundle') => {
  try {
    console.log('🧪 Simulating Stripe checkout.session.completed webhook...\n')
    console.log('📦 Workspace ID:', workspaceId)
    console.log('🛒 Purchase Type:', purchaseType)
    console.log('')

    // Simulate webhook metadata
    const metadata = {
      workspaceId,
      planType: purchaseType,
      unlockedAgents: purchaseType === 'bundle' 
        ? 'Carl,Paul,Olivia,Wendy,Dave'
        : 'Carl'
    }

    console.log('📋 Webhook Metadata:')
    console.log('   workspaceId:', metadata.workspaceId)
    console.log('   planType:', metadata.planType)
    console.log('   unlockedAgents:', metadata.unlockedAgents)
    console.log('')

    // Parse soldiers from metadata (same logic as webhook)
    const unlockedAgentsData = metadata.unlockedAgents
    let unlockedSoldiers = []
    
    if (unlockedAgentsData.includes(',')) {
      unlockedSoldiers = unlockedAgentsData.split(',').map(s => s.trim())
      console.log('🎖️  Bundle detected - multiple soldiers:', unlockedSoldiers)
    } else {
      unlockedSoldiers = [unlockedAgentsData]
      console.log('🎖️  Single soldier:', unlockedSoldiers)
    }
    console.log('   Total soldiers to unlock:', unlockedSoldiers.length)
    console.log('')

    // Check if subscription exists
    const existingSubscription = await prisma.billingSubscription.findUnique({
      where: { workspaceId }
    })

    if (existingSubscription) {
      console.log('📝 Updating existing subscription...')
      console.log('   Current soldiers:', existingSubscription.unlockedSoldiers)
      
      // Combine with existing
      const combinedSoldiers = Array.from(new Set([
        ...existingSubscription.unlockedSoldiers,
        ...unlockedSoldiers
      ]))
      
      console.log('   Combined soldiers:', combinedSoldiers)
      console.log('')

      const updated = await prisma.billingSubscription.update({
        where: { workspaceId },
        data: {
          stripeSubscriptionId: 'sub_simulated_' + Date.now(),
          stripePriceId: 'price_simulated_' + Date.now(),
          interval: 'month',
          unlockedSoldiers: combinedSoldiers,
          status: 'ACTIVE',
          planType: metadata.planType,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      console.log('✅ Subscription updated successfully:')
      console.log('   ID:', updated.id)
      console.log('   Status:', updated.status)
      console.log('   Plan Type:', updated.planType)
      console.log('   Unlocked Soldiers:', updated.unlockedSoldiers)
      console.log('   Total Count:', updated.unlockedSoldiers.length)
    } else {
      console.log('📝 Creating new subscription...')
      
      const created = await prisma.billingSubscription.create({
        data: {
          workspaceId,
          planId: metadata.planType,
          planType: metadata.planType,
          interval: 'month',
          stripeCustomerId: 'cus_simulated_' + Date.now(),
          stripeSubscriptionId: 'sub_simulated_' + Date.now(),
          stripePriceId: 'price_simulated_' + Date.now(),
          unlockedSoldiers,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      console.log('✅ Subscription created successfully:')
      console.log('   ID:', created.id)
      console.log('   Status:', created.status)
      console.log('   Plan Type:', created.planType)
      console.log('   Unlocked Soldiers:', created.unlockedSoldiers)
      console.log('   Total Count:', created.unlockedSoldiers.length)
    }

    console.log('')
    console.log('🎉 Webhook simulation complete!')
    console.log('🔄 Refresh browser: http://localhost:3000/workspace/' + workspaceId)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get workspace ID from command line or use default
const workspaceId = process.argv[2] || 'cmhzel1tv0002s8nr095fb8jq'
const purchaseType = process.argv[3] || 'bundle' // 'bundle' or 'single'

simulateCheckoutCompleted(workspaceId, purchaseType)
