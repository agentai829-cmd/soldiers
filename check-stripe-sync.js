const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function checkAllUsersWithStripe() {
  try {
    console.log('🔍 Checking all users and their Stripe data...\n')

    const users = await prisma.user.findMany({
      include: {
        createdWorkspaces: {
          include: {
            billingSubscription: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    for (const user of users) {
      console.log('━'.repeat(70))
      console.log(`📧 ${user.email}`)
      console.log(`   Created: ${user.createdAt.toLocaleString()}`)
      console.log(`   Database Status: ${user.subscriptionStatus || 'None'}`)
      console.log(`   Stripe Customer: ${user.stripeCustomerId || 'None'}`)
      
      // Check in Stripe for any payments
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        })

        if (customers.data.length > 0) {
          const customer = customers.data[0]
          console.log(`   ✅ FOUND IN STRIPE:`)
          console.log(`      Customer ID: ${customer.id}`)
          
          // Get subscriptions
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 10
          })

          if (subscriptions.data.length > 0) {
            console.log(`      Subscriptions: ${subscriptions.data.length}`)
            subscriptions.data.forEach((sub, i) => {
              console.log(`      ${i + 1}. ${sub.id}`)
              console.log(`         Status: ${sub.status}`)
              console.log(`         Amount: $${sub.items.data[0].price.unit_amount / 100}`)
              console.log(`         Interval: ${sub.items.data[0].price.recurring.interval}`)
            })

            // Check workspace
            if (user.createdWorkspaces.length > 0) {
              const ws = user.createdWorkspaces[0]
              console.log(`   📦 Workspace: ${ws.name}`)
              if (ws.billingSubscription) {
                console.log(`      Billing Status: ${ws.billingSubscription.status}`)
                console.log(`      Soldiers: ${ws.billingSubscription.unlockedSoldiers.join(', ')}`)
              } else {
                console.log(`      ⚠️  NO BILLING SUBSCRIPTION IN DATABASE!`)
              }
            }

            // If subscription exists in Stripe but not in DB, this is the issue!
            if (subscriptions.data[0].status === 'active' && (!user.subscriptionStatus || user.subscriptionStatus === 'canceled')) {
              console.log(`   🚨 ISSUE FOUND: Payment in Stripe but NOT in database!`)
            }
          } else {
            console.log(`      No subscriptions`)
          }
        } else {
          console.log(`   ⚠️  Not in Stripe`)
        }
      } catch (err) {
        console.log(`   ❌ Error checking Stripe:`, err.message)
      }
      
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllUsersWithStripe()
