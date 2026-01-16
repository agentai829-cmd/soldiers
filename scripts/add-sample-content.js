// Check existing workspaces and add sample content
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndAddContent() {
  try {
    // First, get existing workspaces
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        creatorId: true
      }
    });

    console.log('📋 Found workspaces:');
    workspaces.forEach((workspace, index) => {
      console.log(`${index + 1}. ${workspace.name} (ID: ${workspace.id})`);
    });

    if (workspaces.length === 0) {
      console.log('❌ No workspaces found. Please create a workspace first.');
      return;
    }

    // Use the first workspace
    const workspaceId = workspaces[0].id;
    console.log(`\n🎯 Using workspace: ${workspaces[0].name} (${workspaceId})`);

    const sampleContent = [
      {
        title: 'Next.js 14 - The React Framework for Production',
        sourceType: 'URL',
        sourceUrl: 'https://nextjs.org',
        content: 'Next.js is a React framework that gives you building blocks to create web applications. By framework, we mean Next.js handles the tooling and configuration needed for React, and provides additional structure, features, and optimizations for your application.',
        metadata: {
          image: 'https://nextjs.org/static/twitter-cards/nextjs.jpg',
          favicon: 'https://nextjs.org/favicon.ico',
          domain: 'nextjs.org',
          description: 'Next.js is a React framework that gives you building blocks to create web applications.',
          aiDescription: 'A comprehensive React framework offering server-side rendering, static site generation, and full-stack capabilities for modern web development.'
        }
      },
      {
        title: 'OpenAI API Documentation',
        sourceType: 'URL',
        sourceUrl: 'https://platform.openai.com/docs',
        content: 'The OpenAI API can be applied to virtually any task that involves understanding or generating natural language, code, or images. We offer a spectrum of models with different levels of power suitable for different tasks.',
        metadata: {
          image: 'https://platform.openai.com/images/twitter-card.png',
          favicon: 'https://platform.openai.com/favicon-32x32.png',
          domain: 'platform.openai.com',
          description: 'The OpenAI API can be applied to virtually any task that involves understanding or generating natural language, code, or images.',
          aiDescription: 'Comprehensive API documentation for OpenAI\'s suite of AI models including GPT-4, DALL-E, and Whisper for various AI applications.'
        }
      },
      {
        title: 'Company Vision and Mission',
        sourceType: 'MANUAL',
        sourceUrl: null,
        content: 'To revolutionize how businesses leverage AI to enhance productivity and streamline operations. We believe in making AI accessible and practical for everyday business needs, focusing on automation, intelligent assistance, and data-driven insights.',
        metadata: {
          type: 'company_info',
          category: 'vision'
        }
      }
    ];

    for (const item of sampleContent) {
      await prisma.knowledgeDoc.create({
        data: {
          workspaceId,
          title: item.title,
          sourceType: item.sourceType,
          sourceUrl: item.sourceUrl,
          content: item.content,
          metadata: item.metadata
        }
      });
      console.log(`✅ Added: ${item.title}`);
    }
    
    console.log('\n🎉 Sample rich content added successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndAddContent();