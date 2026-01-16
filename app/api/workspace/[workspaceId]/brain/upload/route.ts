import { NextRequest, NextResponse } from 'next/server'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { db } from '@/lib/db'
import { generateEmbedding } from '@/lib/openai'
import { chunkText, storeEmbedding } from '@/lib/pgvector'
import { scrapeWebsite, isValidWebUrl, extractDomain } from '@/lib/web-scraper'
import { createNotification } from '@/lib/notifications'
import { enhanceKnowledgeWithAI } from '@/lib/ai-enhancer'
import { generateBatchImageDescriptions } from '@/lib/image-ai'
import { extractTextFromFile } from '@/lib/pdf-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Check workspace access using helper function
    const hasAccess = await hasWorkspaceAccess(resolvedParams.workspaceId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const type = formData.get('type') as string
    let title = formData.get('title') as string
    
    if (!type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let content = ''
    let sourceUrl: string | null = null
    let sourceType: 'FILE' | 'URL' | 'MANUAL' = 'MANUAL'
    let scrapedResult: any = null
    
    if (type === 'text') {
      content = formData.get('content') as string
      sourceType = 'MANUAL'
      
      // Title is required for text type
      if (!title) {
        return NextResponse.json({ error: 'Title is required for text content' }, { status: 400 })
      }
    } else if (type === 'url') {
      sourceUrl = formData.get('url') as string
      sourceType = 'URL'
      
      if (!sourceUrl) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
      }

      // Validate URL
      if (!isValidWebUrl(sourceUrl)) {
        return NextResponse.json({ 
          error: 'Invalid or unsafe URL. Please provide a valid HTTP/HTTPS URL.' 
        }, { status: 400 })
      }

      console.log('🕷️ Scraping website content from:', sourceUrl)
      
      // Scrape website content
      scrapedResult = await scrapeWebsite(sourceUrl)
      
      if (!scrapedResult.success) {
        return NextResponse.json({ 
          error: `Failed to scrape website: ${scrapedResult.error}` 
        }, { status: 400 })
      }

      // Use scraped content
      content = scrapedResult.content
      
      // Update title with scraped title if not provided or use domain as fallback
      if (!title || title.trim() === '') {
        title = scrapedResult.title || `Content from ${extractDomain(sourceUrl)}`
      }

      console.log(`✅ Successfully scraped ${scrapedResult.wordCount} words from ${extractDomain(sourceUrl)}`)
      
    } else if (type === 'file') {
      const file = formData.get('file') as File
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      
      sourceType = 'FILE'
      
      // Use filename as title if no title provided
      if (!title) {
        title = file.name
      }
      
      // Extract text based on file type
      try {
        console.log(`📁 Processing file: ${file.name} (${file.type})`)
        content = await extractTextFromFile(file)
        console.log(`✅ Successfully extracted ${content.length} characters from ${file.name}`)
      } catch (extractError) {
        console.error('❌ Error extracting text from file:', extractError)
        return NextResponse.json({ 
          error: `Failed to extract text from file: ${extractError instanceof Error ? extractError.message : 'Unknown error'}` 
        }, { status: 400 })
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Prepare metadata for storage
    let metadata: any = {}
    if (sourceType === 'URL' && scrapedResult) {
      metadata = {
        image: scrapedResult.image,
        favicon: scrapedResult.favicon,
        description: scrapedResult.description,
        wordCount: scrapedResult.wordCount,
        domain: extractDomain(sourceUrl || '')
      }

      console.log(`🖼️ Scraped result contains ${scrapedResult.images?.length || 0} images`);
      console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
      
      if (scrapedResult.images && scrapedResult.images.length > 0) {
        console.log('🖼️ Sample images found:');
        scrapedResult.images.slice(0, 3).forEach((img: any, index: number) => {
          console.log(`  ${index + 1}. ${img.src} (alt: "${img.alt}")`);
        });
      }

      // Process images with AI descriptions if available - store for main document metadata
      if (scrapedResult.images && scrapedResult.images.length > 0 && process.env.OPENAI_API_KEY) {
        try {
          console.log(`🖼️ Processing ${scrapedResult.images.length} images with AI descriptions...`)
          
          // Limit to first 10 images to avoid excessive API calls
          const imagesToProcess = scrapedResult.images.slice(0, 10)
          const imagesWithDescriptions = await generateBatchImageDescriptions(imagesToProcess)
          
          metadata.processedImages = imagesWithDescriptions
          console.log(`✅ Generated AI descriptions for ${imagesWithDescriptions.length} images`)
        } catch (error) {
          console.error('Error processing images with AI:', error)
          // Store images without AI descriptions as fallback
          metadata.processedImages = scrapedResult.images.slice(0, 10).map((img: any) => ({
            ...img,
            aiDescription: img.alt || 'Image from website'
          }))
        }
      } else if (scrapedResult.images && scrapedResult.images.length > 0) {
        // Store images without AI descriptions if OpenAI is not configured
        metadata.processedImages = scrapedResult.images.slice(0, 10).map((img: any) => ({
          ...img,
          aiDescription: img.alt || 'Image from website'
        }))
      }
    }

    // Enhance knowledge with AI description if it's a URL or has substantial content
    const normalizedSourceUrl: string | null = sourceUrl || null
    let enhancedKnowledge = { title, content, sourceUrl: normalizedSourceUrl, metadata }
    if ((sourceType === 'URL' || content.length > 100) && process.env.OPENAI_API_KEY) {
      try {
        enhancedKnowledge = await enhanceKnowledgeWithAI({
          title,
          content,
          sourceUrl: normalizedSourceUrl,
          metadata
        })
        console.log('🤖 Enhanced knowledge with AI description')
      } catch (error) {
        console.error('Failed to enhance with AI, using original data:', error)
      }
    }

    // Check if a document with the same title already exists
    const existingDoc = await db.knowledgeDoc.findFirst({
      where: {
        workspaceId: resolvedParams.workspaceId,
        title: enhancedKnowledge.title
      }
    })

    let knowledgeDoc
    
    if (existingDoc) {
      // Update existing document instead of creating a new one
      knowledgeDoc = await db.knowledgeDoc.update({
        where: {
          id: existingDoc.id
        },
        data: {
          content: enhancedKnowledge.content,
          sourceUrl: enhancedKnowledge.sourceUrl,
          sourceType,
          metadata: Object.keys(enhancedKnowledge.metadata || {}).length > 0 ? enhancedKnowledge.metadata : null,
          updatedAt: new Date(),
        },
      })
      console.log('📄 Updated existing knowledge document')
    } else {
      // Create new knowledge document
      knowledgeDoc = await db.knowledgeDoc.create({
        data: {
          title: enhancedKnowledge.title,
          content: enhancedKnowledge.content,
          sourceUrl: enhancedKnowledge.sourceUrl,
          sourceType,
          metadata: Object.keys(enhancedKnowledge.metadata || {}).length > 0 ? enhancedKnowledge.metadata : null,
          workspaceId: resolvedParams.workspaceId,
        },
      })
      console.log('📄 Created new knowledge document')
    }

    // Generate embeddings for better knowledge retrieval
    console.log('🔍 Generating embeddings for knowledge document...')
    let chunks: any[] = []
    let embeddingsCreated = 0
    
    try {
      // Chunk the content into smaller pieces for better embeddings
      chunks = chunkText(enhancedKnowledge.content, 1000, 200)
      console.log(`📄 Created ${chunks.length} chunks for embedding`)
      
      for (const chunk of chunks) {
        try {
          // Generate embedding for this chunk
          const embedding = await generateEmbedding(chunk.content)
          
          // Store the embedding with metadata
          await storeEmbedding(
            knowledgeDoc.id,
            chunk.content,
            embedding,
            {
              chunkIndex: chunk.index,
              title: enhancedKnowledge.title,
              sourceUrl: enhancedKnowledge.sourceUrl,
              sourceType
            }
          )
          
          embeddingsCreated++
        } catch (chunkError) {
          console.error(`Error processing chunk ${chunk.index}:`, chunkError)
          // Continue with other chunks even if one fails
        }
      }
      
      console.log(`✅ Successfully created ${embeddingsCreated} embeddings for knowledge document`)
    } catch (error) {
      console.error('Error generating embeddings:', error)
      console.log('📄 Knowledge document saved but embeddings failed - helpers will use text search fallback')
    }

    // Create individual knowledge documents for each image if we have images from a URL
    let imageKnowledgeDocs: any[] = []
    if (sourceType === 'URL' && metadata.processedImages && metadata.processedImages.length > 0) {
      console.log(`🖼️ Creating individual knowledge documents for ${metadata.processedImages.length} images...`)
      
      for (let i = 0; i < metadata.processedImages.length; i++) {
        const image = metadata.processedImages[i]
        
        try {
          // Extract filename from URL
          const imageUrl = new URL(image.src)
          const pathname = imageUrl.pathname
          let imageName = pathname.split('/').pop() || `image-${i + 1}`
          
          // Ensure it has an extension
          if (!imageName.includes('.')) {
            // Try to guess extension from URL or use jpg as default
            const urlStr = image.src.toLowerCase()
            if (urlStr.includes('.png')) imageName += '.png'
            else if (urlStr.includes('.gif')) imageName += '.gif'
            else if (urlStr.includes('.webp')) imageName += '.webp'
            else if (urlStr.includes('.svg')) imageName += '.svg'
            else imageName += '.jpg' // default
          }
          
          // Clean the filename
          imageName = imageName.replace(/[^\w\-_.]/g, '-').replace(/--+/g, '-')
          
          // Check if image document already exists with this title
          const existingImageDoc = await db.knowledgeDoc.findFirst({
            where: {
              workspaceId: resolvedParams.workspaceId,
              title: imageName,
              sourceType: 'URL',
              sourceUrl: image.src
            }
          })
          
          let imageDoc
          if (existingImageDoc) {
            // Update existing image document
            imageDoc = await db.knowledgeDoc.update({
              where: { id: existingImageDoc.id },
              data: {
                content: image.aiDescription || image.alt || 'Image from website',
                metadata: {
                  imageUrl: image.src,
                  altText: image.alt,
                  width: image.width,
                  height: image.height,
                  fromWebsite: sourceUrl,
                  websiteTitle: enhancedKnowledge.title,
                  isImage: true
                },
                updatedAt: new Date()
              }
            })
            console.log(`📸 Updated existing image document: ${imageName}`)
          } else {
            // Create new image document
            imageDoc = await db.knowledgeDoc.create({
              data: {
                title: imageName,
                content: image.aiDescription || image.alt || 'Image from website',
                sourceUrl: image.src,
                sourceType: 'URL',
                workspaceId: resolvedParams.workspaceId,
                metadata: {
                  imageUrl: image.src,
                  altText: image.alt,
                  width: image.width,
                  height: image.height,
                  fromWebsite: sourceUrl,
                  websiteTitle: enhancedKnowledge.title,
                  isImage: true
                }
              }
            })
            console.log(`📸 Created new image document: ${imageName}`)
          }
          
          imageKnowledgeDocs.push(imageDoc)
          
        } catch (error) {
          console.error(`Error creating knowledge document for image ${i + 1}:`, error)
          // Continue with next image
        }
      }
      
      console.log(`✅ Successfully created/updated ${imageKnowledgeDocs.length} image knowledge documents`)
    }

    // Create notification for knowledge addition/update
    const actionType = existingDoc ? 'updated' : 'added'
    await createNotification(
      resolvedParams.workspaceId,
      'KNOWLEDGE_ADDED',
      `Knowledge ${actionType} in Brain AI`,
      `${sourceType === 'URL' ? 'Website' : sourceType === 'FILE' ? 'File' : 'Content'} ${actionType}: ${enhancedKnowledge.title}`,
      {
        knowledgeDocId: knowledgeDoc.id,
        sourceType,
        sourceUrl,
        contentLength: enhancedKnowledge.content.length,
        wordCount: enhancedKnowledge.content.split(/\s+/).length,
        action: actionType
      },
      undefined, // userId (general notification)
      'vizzy', // default helper for knowledge management
      knowledgeDoc.id
    )

    // Prepare response message based on type
    const responseAction = existingDoc ? 'updated' : 'saved'
    let message = `Knowledge ${responseAction} successfully with embeddings for enhanced AI retrieval.`
    if (sourceType === 'URL') {
      const domain = extractDomain(sourceUrl || '')
      const wordCount = enhancedKnowledge.content.split(/\s+/).length
      const imageCount = imageKnowledgeDocs.length
      message = `Successfully scraped and ${responseAction} ${wordCount} words from ${domain}. ${imageCount > 0 ? `Also created ${imageCount} individual image documents. ` : ''}${message}`
    }

    return NextResponse.json({
      knowledgeDoc,
      imageKnowledgeDocs,
      chunks: chunks?.length || 0,
      embeddingsCreated: embeddingsCreated || 0,
      message,
      ...(sourceType === 'URL' && {
        scrapedData: {
          domain: extractDomain(sourceUrl || ''),
          wordCount: enhancedKnowledge.content.split(/\s+/).length,
          contentLength: enhancedKnowledge.content.length,
          imagesProcessed: metadata.processedImages?.length || 0,
          imageDocumentsCreated: imageKnowledgeDocs.length
        }
      })
    })

  } catch (error) {
    console.error('Error uploading to brain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

