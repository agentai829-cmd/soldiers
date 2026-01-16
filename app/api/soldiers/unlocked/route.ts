import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getWorkspaceBillingStatus } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      )
    }

    // Get billing status with unlocked soldiers
    const billingStatus = await getWorkspaceBillingStatus(workspaceId)

    return NextResponse.json({
      unlockedSoldiers: billingStatus.unlockedSoldiers,
      isActive: billingStatus.isActive,
      status: billingStatus.status,
    })
  } catch (error) {
    console.error('Error fetching unlocked soldiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unlocked soldiers' },
      { status: 500 }
    )
  }
}
