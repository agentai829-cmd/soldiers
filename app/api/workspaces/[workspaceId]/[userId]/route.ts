import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string; userId: string } }
) {
  try {
    if (!params.workspaceId || !params.userId) {
      return NextResponse.json(
        { message: 'All fields are required' },
        {
          status: 500,
        }
      )
    }
    const workspace = await db.workspace.findUnique({
      where: {
        id: params.workspaceId,
        clerkId: params.userId,
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        description: true,
        billingSubscription: {
          select: {
            unlockedSoldiers: true,
          },
        },
      },
    })
    if (!workspace) {
      return NextResponse.json(
        { message: 'Workspace not found' },
        {
          status: 500,
        }
      )
    }
    const unlockedSoldiers =
      workspace?.billingSubscription?.unlockedSoldiers || []

    return NextResponse.json(
      { unlockedSoldiers, workspace },
      {
        status: 200,
      }
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'Something went wrong' },
      {
        status: 500,
      }
    )
  }
}
