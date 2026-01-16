import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { analyzeImage } from '@/lib/openai'
import { extractTextFromFile } from '@/lib/pdf-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check workspace access
    const hasAccess = await hasWorkspaceAccess(resolvedParams.workspaceId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const analysisPrompt = formData.get('prompt') as string || "What's in this image?"

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    console.log(`📁 Processing ${files.length} files`)

    const results = []

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      
      if (isImage) {
        try {
          // Convert file to base64 data URL
          const arrayBuffer = await file.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const dataUrl = `data:${file.type};base64,${base64}`

          // Analyze image with GPT Vision
          const analysis = await analyzeImage(dataUrl, analysisPrompt)

          results.push({
            filename: file.name,
            type: 'image',
            size: file.size,
            mimeType: file.type,
            analysis,
            dataUrl, // Include for preview
          })
        } catch (error) {
          console.error(`Error analyzing image ${file.name}:`, error)
          results.push({
            filename: file.name,
            type: 'image',
            size: file.size,
            mimeType: file.type,
            error: 'Failed to analyze image',
          })
        }
      } else {
        // For non-image files, handle based on type
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        
        // Check if it's a supported document type (PDF, DOCX, TXT, MD)
        const supportedDocs = ['pdf', 'docx', 'txt', 'md']
        const isDocument = supportedDocs.includes(fileExtension || '') || 
                          file.type === 'application/pdf' ||
                          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                          file.type.startsWith('text/')
        
        if (isDocument) {
          try {
            console.log(`📄 Processing document: ${file.name} (${file.type})`)
            
            // Extract text from document
            const extractedText = await extractTextFromFile(file)
            
            console.log(`✅ Successfully extracted ${extractedText.length} characters from ${file.name}`)
            
            results.push({
              filename: file.name,
              type: 'document',
              size: file.size,
              mimeType: file.type,
              content: extractedText.slice(0, 2000), // First 2000 characters for preview
              fullContent: extractedText, // Include full content
              truncated: extractedText.length > 2000,
              wordCount: extractedText.split(/\s+/).length,
              characterCount: extractedText.length,
            })
          } catch (extractError) {
            console.error(`❌ Error extracting text from ${file.name}:`, extractError)
            results.push({
              filename: file.name,
              type: 'document',
              size: file.size,
              mimeType: file.type,
              error: extractError instanceof Error ? extractError.message : 'Failed to extract text from document',
              content: `Failed to process document: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`,
            })
          }
        } else if (file.type === 'application/pdf') {
          // Legacy PDF handling with OpenAI (fallback)
          try {
            const openai = await import('@/lib/openai').then(m => m.openai)
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const openaiFile = new File([buffer], file.name, { type: file.type })
            
            const uploadedFile = await openai.files.create({
              file: openaiFile,
              purpose: 'assistants'
            })
            
            console.log(`📄 PDF uploaded to OpenAI with ID: ${uploadedFile.id}`)
            
            results.push({
              filename: file.name,
              type: 'document',
              size: file.size,
              mimeType: file.type,
              content: `PDF file "${file.name}" has been uploaded to OpenAI for analysis. The AI can now read and analyze the full content.`,
              isPdf: true,
              openaiFileId: uploadedFile.id,
            })
          } catch (error) {
            console.error(`Error with PDF fallback:`, error)
            results.push({
              filename: file.name,
              type: 'document',
              size: file.size,
              mimeType: file.type,
              error: 'Failed to process PDF',
              content: `Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
          }
        } else if (file.type.startsWith('text/') || file.type === 'application/json') {
          // Plain text files
          try {
            const arrayBuffer = await file.arrayBuffer()
            const text = new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer)
            results.push({
              filename: file.name,
              type: 'document',
              size: file.size,
              mimeType: file.type,
              content: text.slice(0, 2000),
              fullContent: text,
              truncated: text.length > 2000,
            })
          } catch (decodeError) {
            results.push({
              filename: file.name,
              type: 'document',
              size: file.size,
              mimeType: file.type,
              content: `Binary data - cannot decode as text`,
              error: 'Binary file',
            })
          }
        } else {
          results.push({
            filename: file.name,
            type: 'document',
            size: file.size,
            mimeType: file.type,
            content: `Unsupported file type: ${file.type}. Supported: PDF, DOCX, TXT, MD, images`,
            unsupportedType: true,
          })
        }
      }
    }

    return NextResponse.json({
      files: results,
      totalFiles: files.length,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error processing files:', error)
    return NextResponse.json(
      { error: 'Failed to process files' },
      { status: 500 }
    )
  }
}