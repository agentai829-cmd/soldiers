const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMessagesAPI() {
  const conversationId = 'cmhv23mlq0001ck39q02fg4ps';
  const workspaceId = 'cmhtjnygo0006cvslenlarte8';
  
  console.log('🔍 Testing messages API for conversation:', conversationId);
  
  try {
    // First, check if the conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: {
            messageOrder: 'asc'
          }
        }
      }
    });

    if (!conversation) {
      console.log('❌ Conversation not found');
      return;
    }

    console.log('✅ Conversation found:');
    console.log('   ID:', conversation.id);
    console.log('   Title:', conversation.title);
    console.log('   User ID:', conversation.userId);
    console.log('   Workspace ID:', conversation.workspaceId);
    console.log('   Helper ID:', conversation.helperId);
    console.log('   Messages:', conversation.messages.length);
    
    if (conversation.messages.length > 0) {
      console.log('\n📝 Messages:');
      conversation.messages.forEach((msg, index) => {
        console.log(`   ${index + 1}. [${msg.role}] Order: ${msg.messageOrder}`);
        console.log(`      Content: ${msg.content.substring(0, 100)}...`);
        console.log(`      Created: ${msg.createdAt}`);
      });
    }

    // Test what the API would return using the same logic
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { messageOrder: 'desc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        messageOrder: true
      }
    });

    // Reverse to get proper order
    const orderedMessages = messages.reverse();

    console.log('\n🔄 API Response format:');
    console.log('   Messages count:', orderedMessages.length);
    orderedMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}] Order: ${msg.messageOrder}`);
      console.log(`      ID: ${msg.id}`);
      console.log(`      Content: ${msg.content.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMessagesAPI();