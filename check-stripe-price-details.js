const fs = require('fs')
const path = require('path')

// Load .env
const envPath = path.join(__dirname, '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    process.env[key] = value
  }
})

const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

async function checkPriceDetails() {
  try {
    console.log('\n💰 Checking Stripe Price Details:\n')
    
    const yearlyPriceId = process.env.STRIPE_PROFESSIONAL_PRICE_ID_YEAR
    console.log('Yearly Price ID:', yearlyPriceId)
    
    if (yearlyPriceId) {
      const price = await stripe.prices.retrieve(yearlyPriceId)
      console.log('\n📋 Price Details:')
      console.log('  Amount:', price.unit_amount / 100, price.currency.toUpperCase())
      console.log('  Interval:', price.recurring?.interval || 'one-time')
      console.log('  Interval Count:', price.recurring?.interval_count || 'N/A')
      console.log('  Active:', price.active)
      console.log('\n⚠️  If interval is "month", this is the problem!')
      console.log('     You need to create a NEW price in Stripe for yearly billing.')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkPriceDetails()
