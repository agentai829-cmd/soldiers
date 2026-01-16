import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { getConversationMessages } from '@/lib/conversation'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; conversationId: string }> }
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

    // Verify conversation belongs to user
    const conversation = await db.conversation.findUnique({
      where: {
        id: resolvedParams.conversationId,
        workspaceId: resolvedParams.workspaceId,
        userId: userId
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get conversation messages
    const messages = await getConversationMessages(resolvedParams.conversationId, 8000)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}