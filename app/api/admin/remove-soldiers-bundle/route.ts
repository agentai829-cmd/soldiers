import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { workspaceId, soldierNames } = await req.json()

    if (!workspaceId || !soldierNames || !Array.isArray(soldierNames)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🗑️  Removing soldiers bundle:', { workspaceId, soldierNames })

    // Get current subscription
    const subscription = await db.billingSubscription.findUnique({
      where: { workspaceId }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Remove specified soldiers from unlocked list
    const updatedSoldiers = subscription.unlockedSoldiers.filter(
      soldier => !soldierNames.includes(soldier)
    )

    console.log('📝 Before:', subscription.unlockedSoldiers)
    console.log('📝 After:', updatedSoldiers)

    // Update subscription
    await db.billingSubscription.update({
      where: { workspaceId },
      data: {
        unlockedSoldiers: updatedSoldiers
      }
    })

    console.log('✅ Soldiers bundle removed successfully')

    return NextResponse.json({
      success: true,
      removedCount: soldierNames.length,
      remainingSoldiers: updatedSoldiers
    })
  } catch (error) {
    console.error('Error removing soldiers bundle:', error)
    return NextResponse.json(
      { error: 'Failed to remove soldiers bundle' },
      { status: 500 }
    )
  }
}
