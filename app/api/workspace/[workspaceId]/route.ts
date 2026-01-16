import { NextRequest, NextResponse } from 'next/server'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Check workspace access using helper function first
    const hasAccess = await hasWorkspaceAccess(resolvedParams.workspaceId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get workspace data
    const workspace = await db.workspace.findUnique({
      where: {
        id: resolvedParams.workspaceId
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        brandVoice: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      workspace
    })

  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
