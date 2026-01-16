/**
 * Manual Soldiers Unlock Script
 * 
 * Use this after making a payment if webhooks are not working
 * 
 * Usage:
 *   node manual-unlock-after-payment.js <workspaceId> <type>
 * 
 * Examples:
 *   node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq bundle
 *   node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq single Carl
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function unlockSoldiers(workspaceId, type = 'bundle', soldierName = 'Carl') {
  try {
    console.log('\n🔓 MANUAL SOLDIER UNLOCK TOOL')
    console.log('=' .repeat(50))
    console.log('📦 Workspace ID:', workspaceId)
    console.log('🎯 Type:', type)
    console.log('')

    // Determine which soldiers to unlock
    let soldiersToUnlock = []
    
    if (type === 'bundle' || type === 'soldiers-x') {
      soldiersToUnlock = ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
      console.log('🎖️  Unlocking ALL 5 SOLDIERS (Bundle/Soldiers X)')
    } else if (type === 'single') {
      soldiersToUnlock = [soldierName]
      console.log('🎖️  Unlocking SINGLE SOLDIER:', soldierName)
    } else {
      console.error('❌ Invalid type. Use "bundle" or "single"')
      process.exit(1)
    }

    console.log('   Soldiers:', soldiersToUnlock.join(', '))
    console.log('')

    // Check existing subscription
    const existing = await prisma.billingSubscription.findUnique({
      where: { workspaceId }
    })

    if (existing) {
      console.log('📋 Found existing subscription:')
      console.log('   ID:', existing.id)
      console.log('   Current soldiers:', existing.unlockedSoldiers.join(', ') || 'None')
      console.log('   Status:', existing.status)
      console.log('')

      // Merge with existing soldiers
      const merged = Array.from(new Set([
        ...existing.unlockedSoldiers,
        ...soldiersToUnlock
      ]))

      console.log('🔄 Updating subscription...')
      const updated = await prisma.billingSubscription.update({
        where: { id: existing.id },
        data: {
          unlockedSoldiers: merged,
          status: 'ACTIVE',
          planType: type === 'bundle' ? 'bundle' : existing.planType,
          interval: 'month',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })

      console.log('✅ Subscription updated!')
      console.log('   New soldiers:', updated.unlockedSoldiers.join(', '))
      console.log('   Total unlocked:', updated.unlockedSoldiers.length)
    } else {
      console.log('📝 No subscription found. Creating new one...')
      
      const created = await prisma.billingSubscription.create({
        data: {
          workspaceId,
          planId: type === 'bundle' ? 'bundle' : 'single',
          planType: type === 'bundle' ? 'bundle' : 'single',
          interval: 'month',
          stripeCustomerId: 'manual_' + Date.now(),
          stripeSubscriptionId: 'manual_' + Date.now(),
          stripePriceId: 'manual_' + Date.now(),
          unlockedSoldiers: soldiersToUnlock,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })

      console.log('✅ Subscription created!')
      console.log('   Soldiers:', created.unlockedSoldiers.join(', '))
      console.log('   Total unlocked:', created.unlockedSoldiers.length)
    }

    console.log('')
    console.log('=' .repeat(50))
    console.log('🎉 SUCCESS! Soldiers unlocked!')
    console.log('🔄 Refresh your browser to see the changes')
    console.log('🌐 http://localhost:3000/workspace/' + workspaceId)
    console.log('')

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('\nStack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('\n❌ Missing workspace ID')
  console.log('\nUsage:')
  console.log('  node manual-unlock-after-payment.js <workspaceId> <type> [soldierName]')
  console.log('\nExamples:')
  console.log('  node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq bundle')
  console.log('  node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq single Carl')
  console.log('')
  process.exit(1)
}

const workspaceId = args[0]
const type = args[1] || 'bundle'
const soldierName = args[2] || 'Carl'

unlockSoldiers(workspaceId, type, soldierName)
