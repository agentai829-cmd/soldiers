const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearConversations() {
  try {
    console.log('🗑️ Clearing all conversations and messages...')
    
    // Delete all messages first (because of foreign key constraint)
    const deletedMessages = await prisma.message.deleteMany({})
    console.log(`✅ Deleted ${deletedMessages.count} messages`)
    
    // Delete all conversations
    const deletedConversations = await prisma.conversation.deleteMany({})
    console.log(`✅ Deleted ${deletedConversations.count} conversations`)
    
    console.log('🎉 Database cleared successfully!')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearConversations()