import { NextRequest, NextResponse } from 'next/server'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params

    // Get knowledge documents for this workspace
    const knowledge = await db.knowledgeDoc.findMany({
      where: {
        userId: resolvedParams.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        content: true,
        sourceUrl: true,
        sourceType: true,
        createdAt: true,
        metadata: true,
      },
    })

    // Helper function to extract domain from URL
    const extractDomain = (url: string) => {
      try {
        const parsedUrl = new URL(url)
        return parsedUrl.hostname.replace('www.', '')
      } catch {
        return url
      }
    }

    // Format knowledge items with all required data
    const formattedKnowledge = knowledge.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.sourceType.toLowerCase(),
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl,
      content: item.content,
      description:
        item.sourceType === 'MANUAL'
          ? item.content?.substring(0, 100) +
            (item.content && item.content.length > 100 ? '...' : '')
          : item.sourceType === 'URL'
            ? (item.metadata as any)?.description ||
              extractDomain(item.sourceUrl || '')
            : `${item.sourceType} document`,
      createdAt: item.createdAt,
      metadata: item.metadata,
      // Extract specific metadata fields for easier access
      image: item.metadata ? (item.metadata as any).image : null,
      favicon: item.metadata ? (item.metadata as any).favicon : null,
      domain: item.metadata
        ? (item.metadata as any).domain
        : item.sourceUrl
          ? extractDomain(item.sourceUrl)
          : null,
    }))

    return NextResponse.json({
      knowledge: formattedKnowledge,
      total: knowledge.length,
    })
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params

    const { searchParams } = new URL(request.url)
    const knowledgeId = searchParams.get('id')

    if (!knowledgeId) {
      return NextResponse.json(
        { error: 'Knowledge ID is required' },
        { status: 400 }
      )
    }

    // Verify the knowledge document belongs to this workspace
    const knowledgeDoc = await db.knowledgeDoc.findFirst({
      where: {
        id: knowledgeId,
        userId: resolvedParams.userId,
      },
    })

    if (!knowledgeDoc) {
      return NextResponse.json(
        { error: 'Knowledge document not found' },
        { status: 404 }
      )
    }

    // Delete the knowledge document (this will cascade delete embeddings due to onDelete: Cascade)
    await db.knowledgeDoc.delete({
      where: {
        id: knowledgeId,
      },
    })

    return NextResponse.json({
      message: 'Knowledge document deleted successfully',
      deletedId: knowledgeId,
    })
  } catch (error) {
    console.error('Error deleting knowledge:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
