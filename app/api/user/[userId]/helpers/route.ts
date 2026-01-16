import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { z } from 'zod'

const createHelperSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  prompt: z.string().min(10),
  config: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
  }).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check workspace access
    const hasAccess = await hasWorkspaceAccess(params.workspaceId, 'EDITOR')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createHelperSchema.parse(body)

    const helper = await db.helper.create({
      data: {
        ...validatedData,
        workspaceId: params.workspaceId,
      },
    })

    return NextResponse.json(helper)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating helper:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check workspace access
    const hasAccess = await hasWorkspaceAccess(params.workspaceId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return local helpers instead of database helpers
    const { getAllHelpers } = await import('@/lib/helpers')
    const helpers = getAllHelpers()

    return NextResponse.json(helpers)
  } catch (error) {
    console.error('Error fetching helpers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}