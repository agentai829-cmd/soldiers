require('dotenv').config()
const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

async function checkAllStripePrices() {
  console.log('\n💰 Checking all Stripe prices...\n')
  
  const priceIds = {
    'Monthly Plan': process.env.STRIPE_PRICE_MONTHLY_PLAN,
    'Yearly Professional': process.env.STRIPE_PROFESSIONAL_PRICE_ID_YEAR,
    'Yearly Bundle': process.env.STRIPE_SOLDIERS_BUNDLE_PRICE_ID_YEAR,
    'Single Soldier Monthly': process.env.STRIPE_SINGLE_SOLDIER_PRICE_ID_MONTH,
  }

  for (const [name, priceId] of Object.entries(priceIds)) {
    if (priceId) {
      try {
        const price = await stripe.prices.retrieve(priceId)
        const amount = price.unit_amount ? price.unit_amount / 100 : 0
        const currency = price.currency.toUpperCase()
        const interval = price.recurring?.interval || 'one-time'
        
        console.log(`${name}:`)
        console.log(`  Price ID: ${priceId}`)
        console.log(`  Amount: ${currency} $${amount}/${interval}`)
        console.log(`  Product: ${price.product}`)
        console.log('')
      } catch (error) {
        console.log(`${name}: Error - ${error.message}\n`)
      }
    }
  }
  
  // Check all active prices
  console.log('━'.repeat(60))
  console.log('\n📋 All Active Prices in Stripe:\n')
  
  const allPrices = await stripe.prices.list({ 
    active: true,
    limit: 20 
  })
  
  for (const price of allPrices.data) {
    const amount = price.unit_amount ? price.unit_amount / 100 : 0
    const interval = price.recurring?.interval || 'one-time'
    console.log(`${price.currency.toUpperCase()} $${amount}/${interval}`)
    console.log(`  ID: ${price.id}`)
    console.log(`  Product: ${price.product}`)
    console.log('')
  }
}

checkAllStripePrices()
