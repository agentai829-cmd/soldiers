// Script to delete the sample content that was added
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteSampleContent() {
  try {
    // Get the workspace ID first
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true
      }
    });

    if (workspaces.length === 0) {
      console.log('❌ No workspaces found.');
      return;
    }

    const workspaceId = workspaces[0].id;
    console.log(`🎯 Using workspace: ${workspaces[0].name} (${workspaceId})`);

    // Delete the specific sample content items by title
    const sampleTitles = [
      'Next.js 14 - The React Framework for Production',
      'OpenAI API Documentation',
      'Company Vision and Mission'
    ];

    console.log('\n🗑️ Deleting sample content...');

    for (const title of sampleTitles) {
      const deleted = await prisma.knowledgeDoc.deleteMany({
        where: {
          workspaceId: workspaceId,
          title: title
        }
      });

      if (deleted.count > 0) {
        console.log(`✅ Deleted: ${title} (${deleted.count} items)`);
      } else {
        console.log(`⚠️ Not found: ${title}`);
      }
    }

    // Also delete any notifications related to these items
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        workspaceId: workspaceId,
        type: 'KNOWLEDGE_ADDED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (deletedNotifications.count > 0) {
      console.log(`🔔 Deleted ${deletedNotifications.count} related notifications`);
    }

    console.log('\n🎉 Sample content deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting sample content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSampleContent();