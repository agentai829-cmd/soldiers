/**
 * RESET DATABASE - Clears all data from PostgreSQL
 * WARNING: This will delete ALL data. Use with caution!
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetDatabase() {
  try {
    console.log('🗑️  Starting database reset...\n')
    
    // Delete in correct order (respecting foreign keys)
    console.log('1️⃣  Deleting conversations...')
    const conversations = await prisma.conversation.deleteMany({})
    console.log(`   ✅ Deleted ${conversations.count} conversations`)
    
    console.log('2️⃣  Deleting messages...')
    const messages = await prisma.message.deleteMany({})
    console.log(`   ✅ Deleted ${messages.count} messages`)
    
    console.log('3️⃣  Deleting helpers...')
    const helpers = await prisma.helper.deleteMany({})
    console.log(`   ✅ Deleted ${helpers.count} helpers`)
    
    console.log('4️⃣  Deleting billing subscriptions...')
    const billings = await prisma.billingSubscription.deleteMany({})
    console.log(`   ✅ Deleted ${billings.count} billing records`)
    
    console.log('5️⃣  Deleting workspace members...')
    const members = await prisma.member.deleteMany({})
    console.log(`   ✅ Deleted ${members.count} workspace members`)
    
    console.log('6️⃣  Deleting workspaces...')
    const workspaces = await prisma.workspace.deleteMany({})
    console.log(`   ✅ Deleted ${workspaces.count} workspaces`)
    
    console.log('7️⃣  Deleting users...')
    const users = await prisma.user.deleteMany({})
    console.log(`   ✅ Deleted ${users.count} users`)
    
    console.log('\n✅ DATABASE RESET COMPLETE!')
    console.log('\n📝 Next steps:')
    console.log('   1. Go to Clerk dashboard and delete test users')
    console.log('   2. Redeploy to Vercel')
    console.log('   3. Sign up with fresh account\n')
    
  } catch (error) {
    console.error('❌ Error resetting database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()
