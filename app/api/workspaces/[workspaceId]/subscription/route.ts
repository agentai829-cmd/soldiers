import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { hasActiveSubscription } from '@/lib/subscription'

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const workspaceId = params.workspaceId
    
    // Check if workspace has active subscription
    const hasSubscription = await hasActiveSubscription(workspaceId)

    return NextResponse.json({
      hasActiveSubscription: hasSubscription,
      workspaceId,
    })
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription', hasActiveSubscription: false },
      { status: 500 }
    )
  }
}
