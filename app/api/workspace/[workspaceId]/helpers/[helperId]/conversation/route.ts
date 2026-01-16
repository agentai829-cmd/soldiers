import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; helperId: string }> }
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

    // Get most recent conversation for this user/workspace/helper
    const conversation = await db.conversation.findFirst({
      where: {
        workspaceId: resolvedParams.workspaceId,
        helperId: resolvedParams.helperId,
        userId: userId,
        archived: false
      },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ 
      conversation: conversation ? {
        id: conversation.id,
        title: conversation.title,
        helperId: conversation.helperId,
        updatedAt: conversation.updatedAt,
        messageCount: conversation._count.messages
      } : null 
    })
  } catch (error) {
    console.error('Error fetching current conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}