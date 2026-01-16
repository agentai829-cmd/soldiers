import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateImage } from '@/lib/openai'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { z } from 'zod'

const generateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional(),
})

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

    const body = await request.json()
    const { prompt, size, quality, style } = generateImageSchema.parse(body)

    console.log('🎨 Image generation request:', { prompt, size, quality, style })

    // Generate image using OpenAI DALL-E
    const imageUrl = await generateImage(prompt, { size, quality, style })

    return NextResponse.json({
      imageUrl,
      prompt,
      metadata: {
        size: size || '1024x1024',
        quality: quality || 'standard',
        style: style || 'vivid',
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}