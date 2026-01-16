const fs = require('fs')
const path = require('path')

// Load .env manually
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
const { PrismaClient } = require('@prisma/client')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})
const db = new PrismaClient()

async function fixSubscriptionIntervals() {
  try {
    console.log('\n🔧 Fixing subscription intervals from Stripe...\n')
    
    const subs = await db.billingSubscription.findMany({
      where: { status: 'ACTIVE' }
    })
    
    for (const sub of subs) {
      console.log(`Checking: ${sub.stripeSubscriptionId}`)
      
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId)
        const stripeInterval = stripeSub.items.data[0]?.price.recurring?.interval || 'month'
        
        if (sub.interval !== stripeInterval) {
          console.log(`  ❌ Database: ${sub.interval}, Stripe: ${stripeInterval}`)
          console.log(`  ✅ Updating to: ${stripeInterval}`)
          
          await db.billingSubscription.update({
            where: { id: sub.id },
            data: { interval: stripeInterval }
          })
        } else {
          console.log(`  ✓ Already correct: ${stripeInterval}`)
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
      }
      console.log('')
    }
    
    console.log('✅ Done!\n')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

fixSubscriptionIntervals()
