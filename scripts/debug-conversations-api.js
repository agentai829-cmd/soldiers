// Debug script to test the conversations API directly
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugConversationsAPI() {
  console.log('🔍 Testing conversations API functionality...\n');
  
  try {
    // Test the getRecentConversations function directly
    const workspaceId = 'cmhtjnygo0006cvslenlarte8';
    const userId = 'user_35If2ED9vkZtr9flNl759sXk2Xa';
    
    console.log('📞 Testing getRecentConversations function...');
    
    const conversations = await prisma.conversation.findMany({
      where: {
        workspaceId,
        userId,
        archived: false
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        helperId: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      }
    });

    console.log(`✅ Found ${conversations.length} conversations\n`);
    
    conversations.forEach((conv, index) => {
      console.log(`🗨️  Conversation ${index + 1}:`);
      console.log(`   ID: ${conv.id}`);
      console.log(`   Title: ${conv.title || 'Untitled'}`);
      console.log(`   Helper ID: ${conv.helperId}`);
      console.log(`   Updated: ${conv.updatedAt}`);
      console.log(`   Message Count: ${conv._count.messages}`);
      console.log('');
    });

    // Test the API response format
    const apiResponse = {
      conversations: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        helperId: conv.helperId,
        updatedAt: conv.updatedAt,
        messageCount: conv._count.messages
      }))
    };

    console.log('📡 API Response Format:');
    console.log(JSON.stringify(apiResponse, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugConversationsAPI();