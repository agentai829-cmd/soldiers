const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function fixWorkspaceBilling(email) {
  try {
    console.log('🔧 Fixing workspace billing for:', email)
    console.log('')

    // Get user with workspace
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:', user.email)
    console.log('   User Subscription Status:', user.subscriptionStatus)
    console.log('   User Stripe Subscription ID:', user.stripeSubscriptionId)
    console.log('')

    if (!user.stripeSubscriptionId) {
      console.log('❌ No Stripe subscription found for user')
      return
    }

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
    console.log('📋 Stripe Subscription:')
    console.log('   Status:', subscription.status)
    console.log('   Plan:', subscription.items.data[0].price.id)
    console.log('   Amount:', subscription.items.data[0].price.unit_amount / 100, 'USD')
    console.log('   Interval:', subscription.items.data[0].price.recurring.interval)
    console.log('')

    // Check workspace
    if (user.createdWorkspaces.length === 0) {
      console.log('❌ No workspace found')
      return
    }

    const workspace = user.createdWorkspaces[0]
    console.log('📦 Workspace:', workspace.name)
    console.log('   ID:', workspace.id)
    console.log('   Current Billing Status:', workspace.billingSubscription?.status || 'None')
    console.log('')

    // Determine which soldiers to unlock based on plan
    const interval = subscription.items.data[0].price.recurring.interval
    const amount = subscription.items.data[0].price.unit_amount / 100
    
    let unlockedSoldiers = []
    let planType = 'SINGLE'
    
    if (interval === 'year' || amount >= 99) {
      // Yearly or bundle plan - unlock all soldiers
      unlockedSoldiers = ['Carl', 'Marcus', 'Wendy', 'John', 'Sarah']
      planType = 'BUNDLE'
    } else {
      // Monthly plan - unlock one soldier
      unlockedSoldiers = ['Carl']
      planType = 'SINGLE'
    }

    console.log('🎖️  Soldiers to unlock:', unlockedSoldiers.join(', '))
    console.log('   Plan Type:', planType)
    console.log('')

    // Update or create billing subscription
    if (workspace.billingSubscription) {
      console.log('🔄 Updating existing billing subscription...')
      
      await prisma.billingSubscription.update({
        where: { id: workspace.billingSubscription.id },
        data: {
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          stripePriceId: subscription.items.data[0].price.id,
          status: 'ACTIVE',
          planType: planType,
          interval: interval,
          unlockedSoldiers: unlockedSoldiers,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }
      })
    } else {
      console.log('📝 Creating new billing subscription...')
      
      await prisma.billingSubscription.create({
        data: {
          workspaceId: workspace.id,
          planId: subscription.items.data[0].price.id,
          planType: planType,
          interval: interval,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          stripePriceId: subscription.items.data[0].price.id,
          unlockedSoldiers: unlockedSoldiers,
          status: 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }
      })
    }

    console.log('✅ Billing subscription updated!')
    console.log('')

    // Verify the update
    const updated = await prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        billingSubscription: true
      }
    })

    console.log('━'.repeat(60))
    console.log('✅ WORKSPACE BILLING FIXED!')
    console.log('━'.repeat(60))
    console.log('📊 Updated Workspace:')
    console.log('   Name:', updated.name)
    console.log('   Billing Status:', updated.billingSubscription?.status)
    console.log('   Plan Type:', updated.billingSubscription?.planType)
    console.log('   Unlocked Soldiers:', updated.billingSubscription?.unlockedSoldiers.join(', '))
    console.log('   Subscription End:', updated.billingSubscription?.currentPeriodEnd?.toLocaleString())
    console.log('')
    console.log('🎉 User can now access workspace!')
    console.log('━'.repeat(60))

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2] || 'talhaoffice27@gmail.com'
fixWorkspaceBilling(email)
