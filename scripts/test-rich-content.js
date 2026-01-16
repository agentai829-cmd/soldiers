// Test script to add sample rich content to the brain for demonstration
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleRichContent() {
  const workspaceId = 'user_2pbVTIBP9Q7aebllJLr2kJWWbXB'; // Replace with actual workspace ID

  const sampleContent = [
    {
      title: 'Next.js 14 - The React Framework for Production',
      sourceType: 'URL',
      sourceUrl: 'https://nextjs.org',
      content: 'Next.js is a React framework that gives you building blocks to create web applications. By framework, we mean Next.js handles the tooling and configuration needed for React, and provides additional structure, features, and optimizations for your application.',
      metadata: {
        image: 'https://nextjs.org/api/og?title=Next.js%20-%20The%20React%20Framework%20for%20Production',
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
        image: 'https://platform.openai.com/api/docs/og-image.png',
        favicon: 'https://platform.openai.com/favicon-32x32.png',
        domain: 'platform.openai.com',
        description: 'The OpenAI API can be applied to virtually any task that involves understanding or generating natural language, code, or images.',
        aiDescription: 'Comprehensive API documentation for OpenAI\'s suite of AI models including GPT-4, DALL-E, and Whisper for various AI applications.'
      }
    },
    {
      title: 'Tailwind CSS - Rapidly build modern websites',
      sourceType: 'URL',
      sourceUrl: 'https://tailwindcss.com',
      content: 'Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.',
      metadata: {
        image: 'https://tailwindcss.com/api/og?path=/docs',
        favicon: 'https://tailwindcss.com/favicons/favicon-32x32.png',
        domain: 'tailwindcss.com',
        description: 'A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.',
        aiDescription: 'A utility-first CSS framework that enables rapid UI development with pre-built classes and responsive design capabilities.'
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

  try {
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
    console.error('❌ Error adding sample content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleRichContent();