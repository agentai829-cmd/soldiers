const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function testConversationFlow() {
  try {
    console.log('🧪 Testing conversation flow...\n');
    
    // Find the most recent conversation for buddy
    const conversation = await db.conversation.findFirst({
      where: { helperId: 'buddy' },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { messageOrder: 'asc' }
        }
      }
    });

    if (!conversation) {
      console.log('❌ No conversations found');
      return;
    }

    console.log('✅ Found conversation:', conversation.id);
    console.log('📊 Total messages:', conversation.messages.length);
    console.log('\n📝 Message Flow:');
    console.log('=' .repeat(80));
    
    conversation.messages.forEach((msg, idx) => {
      console.log(`\n[Message #${idx + 1}] Order: ${msg.messageOrder} | Role: ${msg.role}`);
      console.log(`Created: ${msg.createdAt.toLocaleString()}`);
      console.log(`Content: ${msg.content.substring(0, 200)}...`);
      console.log('-'.repeat(80));
    });

    // Check if conversation history would be retrieved correctly
    console.log('\n🔍 Testing conversation history retrieval:');
    const messages = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { messageOrder: 'desc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        messageOrder: true
      }
    });

    console.log(`✅ Retrieved ${messages.length} messages in reverse order`);
    
    // Simulate token limit filtering
    let totalTokens = 0;
    const maxTokens = 8000;
    const validMessages = [];

    for (const message of messages) {
      const messageTokens = Math.ceil(message.content.length / 4);
      if (totalTokens + messageTokens > maxTokens) break;

      totalTokens += messageTokens;
      validMessages.unshift(message);
    }

    console.log(`📊 Messages within token limit: ${validMessages.length}`);
    console.log(`📊 Total tokens used: ~${totalTokens}`);
    
    console.log('\n✅ Conversation history would include:');
    validMessages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. [${msg.role}] ${msg.content.substring(0, 60)}...`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

testConversationFlow();
