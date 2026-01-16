import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage } from '@/lib/openai'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    console.log('🔍 Image analysis API called')
    
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { imageUrl, prompt } = await request.json()
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    console.log('📸 Analyzing image:', imageUrl)
    console.log('📝 Analysis prompt:', prompt)

    const analysis = await analyzeImage(imageUrl, prompt || "Describe this image in detail, including all visual elements, objects, people, colors, and scene information.")
    
    console.log('✅ Analysis result:', analysis.substring(0, 100) + '...')

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('❌ Error in image analysis API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}