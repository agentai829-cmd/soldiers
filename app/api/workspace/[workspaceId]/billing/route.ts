import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getWorkspaceBillingStatus } from '@/lib/stripe'

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getWorkspaceBillingStatus(params.workspaceId)
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching billing status:', error)
    return NextResponse.json({ error: 'Failed to get billing status' }, { status: 500 })
  }
}
