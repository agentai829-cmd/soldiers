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

async function fixAllSubscriptions() {
  try {
    console.log('\n🔧 Fixing ALL subscription intervals from Stripe...\n')
    
    const subs = await db.billingSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        workspace: {
          include: { creator: true }
        }
      }
    })
    
    console.log(`Found ${subs.length} active subscriptions\n`)
    
    for (const sub of subs) {
      console.log('━'.repeat(60))
      console.log(`User: ${sub.workspace.creator.email}`)
      console.log(`Current interval in DB: ${sub.interval}`)
      console.log(`Stripe Sub ID: ${sub.stripeSubscriptionId}`)
      
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId)
        const stripeInterval = stripeSub.items.data[0]?.price.recurring?.interval
        const stripeAmount = stripeSub.items.data[0]?.price.unit_amount / 100
        
        console.log(`Stripe interval: ${stripeInterval}`)
        console.log(`Stripe amount: $${stripeAmount}`)
        
        if (sub.interval !== stripeInterval) {
          console.log(`❌ MISMATCH! Updating ${sub.interval} → ${stripeInterval}`)
          
          await db.billingSubscription.update({
            where: { id: sub.id },
            data: { 
              interval: stripeInterval,
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000)
            }
          })
          
          console.log('✅ Updated successfully!')
        } else {
          console.log('✓ Already correct')
        }
      } catch (error) {
        console.log(`❌ Stripe Error: ${error.message}`)
      }
      console.log('')
    }
    
    console.log('━'.repeat(60))
    console.log('\n✅ All subscriptions fixed!\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

fixAllSubscriptions()
