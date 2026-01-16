import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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

    const { workspaceId, soldierName } = await req.json()

    if (!workspaceId || !soldierName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`🔒 Admin removing soldier: ${soldierName} from workspace: ${workspaceId}`)

    // Get the subscription
    const subscription = await db.billingSubscription.findFirst({
      where: { workspaceId }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Remove the soldier from unlockedSoldiers array
    const updatedSoldiers = subscription.unlockedSoldiers.filter(
      soldier => soldier !== soldierName
    )

    console.log(`📊 Current soldiers: ${subscription.unlockedSoldiers.join(', ')}`)
    console.log(`📊 Updated soldiers: ${updatedSoldiers.join(', ')}`)

    // Update the subscription
    await db.billingSubscription.update({
      where: { id: subscription.id },
      data: {
        unlockedSoldiers: updatedSoldiers
      }
    })

    console.log(`✅ Successfully removed ${soldierName}`)

    return NextResponse.json({
      success: true,
      message: `${soldierName} has been removed`,
      remainingSoldiers: updatedSoldiers
    })
  } catch (error) {
    console.error('❌ Error removing soldier:', error)
    return NextResponse.json(
      { error: 'Failed to remove soldier' },
      { status: 500 }
    )
  }
}
