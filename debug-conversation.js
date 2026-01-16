const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function debugConversation() {
  try {
    // Check if conversation exists
    const conversation = await db.conversation.findUnique({
      where: { id: 'cmi9iqape0001m6ytnaz2c7sl' },
      include: {
        messages: {
          orderBy: { messageOrder: 'asc' }
        }
      }
    });

    if (!conversation) {
      console.log('❌ Conversation not found with ID: cmi9iqape0001m6ytnaz2c7sl');
      
      // Let's check all conversations in this workspace
      const allConvs = await db.conversation.findMany({
        where: { workspaceId: 'cmi9iqape0001m6ytnaz2c7sl' },
        include: {
          messages: {
            orderBy: { messageOrder: 'asc' }
          }
        }
      });
      
      console.log('\n📋 All conversations in workspace:');
      console.log(JSON.stringify(allConvs, null, 2));
    } else {
      console.log('✅ Found conversation:');
      console.log(JSON.stringify(conversation, null, 2));
      
      console.log('\n📊 Message Summary:');
      console.log(`Total messages: ${conversation.messages.length}`);
      conversation.messages.forEach((msg, idx) => {
        console.log(`\n[${idx + 1}] Order: ${msg.messageOrder} | Role: ${msg.role}`);
        console.log(`Content: ${msg.content.substring(0, 100)}...`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

debugConversation();
