const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAllUsers() {
  try {
    console.log('🔍 Fetching all users from database...\n')
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        clerkId: true,
        subscriptionStatus: true,
        currentPlanName: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found in database')
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`)
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   Status: ${user.subscriptionStatus || 'None'}`)
        console.log(`   Plan: ${user.currentPlanName || 'None'}`)
        console.log(`   Stripe Customer: ${user.stripeCustomerId || 'None'}`)
        console.log(`   Created: ${user.createdAt.toLocaleString()}`)
        console.log('━'.repeat(60))
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllUsers()
