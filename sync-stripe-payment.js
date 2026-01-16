const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function syncStripePayment(email) {
  try {
    console.log('🔍 Searching for payments for:', email)
    console.log('')

    // Search for customer in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      console.log('❌ No Stripe customer found with this email')
      return
    }

    const customer = customers.data[0]
    console.log('✅ Found Stripe customer:', customer.id)
    console.log('   Email:', customer.email)
    console.log('')

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10
    })

    if (subscriptions.data.length === 0) {
      console.log('❌ No active subscriptions found')
      return
    }

    console.log(`✅ Found ${subscriptions.data.length} subscription(s)`)
    console.log('')

    // Get the most recent active subscription
    const subscription = subscriptions.data[0]
    
    console.log('📋 Subscription Details:')
    console.log('   ID:', subscription.id)
    console.log('   Status:', subscription.status)
    console.log('   Plan:', subscription.items.data[0].price.id)
    console.log('   Amount:', subscription.items.data[0].price.unit_amount / 100, 'USD')
    console.log('   Interval:', subscription.items.data[0].price.recurring.interval)
    console.log('   Start:', new Date(subscription.current_period_start * 1000).toLocaleString())
    console.log('   End:', new Date(subscription.current_period_end * 1000).toLocaleString())
    console.log('')

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email }
    })

    if (!user) {
      console.log('❌ User not found in database')
      return
    }

    console.log('✅ Found user in database:', user.email)
    console.log('')

    // Determine plan name
    const interval = subscription.items.data[0].price.recurring.interval
    const amount = subscription.items.data[0].price.unit_amount / 100
    
    let planName = 'monthly'
    if (interval === 'year') {
      planName = 'yearly'
    } else if (amount >= 99) {
      planName = 'bundle'
    }

    // Update user in database
    console.log('🔄 Updating database...')
    const updated = await prisma.user.update({
      where: { email: email },
      data: {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        subscriptionStatus: subscription.status,
        currentPlanName: planName,
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    })

    console.log('✅ Database updated successfully!')
    console.log('')
    console.log('📊 Updated User Data:')
    console.log('   Email:', updated.email)
    console.log('   Status:', updated.subscriptionStatus)
    console.log('   Plan:', updated.currentPlanName)
    console.log('   Stripe Customer:', updated.stripeCustomerId)
    console.log('   Subscription ID:', updated.stripeSubscriptionId)
    console.log('   End Date:', updated.subscriptionEndDate?.toLocaleString())
    console.log('')
    console.log('━'.repeat(60))
    console.log('✅ PAYMENT SYNCED! User can now access the website! 🎉')
    console.log('━'.repeat(60))

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line
const email = process.argv[2] || 'talhaoffice27@gmail.com'
syncStripePayment(email)
