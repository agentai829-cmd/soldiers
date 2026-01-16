const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkConversations() {
  console.log('🔍 Checking conversations in the database...\n');
  
  const conversations = await prisma.conversation.findMany({
    include: {
      messages: {
        select: {
          id: true,
          role: true,
          content: true,
          messageOrder: true,
          createdAt: true
        },
        orderBy: {
          messageOrder: 'asc'
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  console.log(`📊 Total conversations found: ${conversations.length}\n`);

  conversations.forEach((conv, index) => {
    console.log(`🗨️  Conversation ${index + 1}:`);
    console.log(`   ID: ${conv.id}`);
    console.log(`   Helper ID: ${conv.helperId}`);
    console.log(`   User ID: ${conv.userId}`);
    console.log(`   Workspace ID: ${conv.workspaceId}`);
    console.log(`   Title: ${conv.title || 'No title'}`);
    console.log(`   Messages: ${conv.messages.length}`);
    console.log(`   Created: ${conv.createdAt}`);
    console.log(`   Updated: ${conv.updatedAt}`);
    console.log(`   Archived: ${conv.archived}`);
    
    if (conv.messages.length > 0) {
      console.log('   📝 Messages:');
      conv.messages.forEach((msg, msgIndex) => {
        console.log(`      ${msgIndex + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
      });
    }
    console.log('');
  });

  // Check for potential issues
  const userHelperCombos = {};
  conversations.forEach(conv => {
    const key = `${conv.userId}-${conv.helperId}-${conv.workspaceId}`;
    if (!userHelperCombos[key]) {
      userHelperCombos[key] = [];
    }
    userHelperCombos[key].push(conv.id);
  });

  console.log('🔍 Checking for multiple conversations per user-helper combination:');
  let hasMultipleConversations = false;
  Object.entries(userHelperCombos).forEach(([key, convIds]) => {
    if (convIds.length > 1) {
      hasMultipleConversations = true;
      console.log(`   ✅ ${key}: ${convIds.length} conversations (${convIds.join(', ')})`);
    }
  });

  if (!hasMultipleConversations) {
    console.log('   ✅ No issues found - each user-helper combo has unique conversations');
  }

  await prisma.$disconnect();
}

checkConversations().catch(console.error);