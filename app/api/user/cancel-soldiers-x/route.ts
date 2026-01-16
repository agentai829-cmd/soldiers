import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    // Get the subscription with workspace and creator info
    const subscription = await db.billingSubscription.findUnique({
      where: {
        id: subscriptionId,
      },
      include: {
        workspace: {
          include: {
            creator: true,
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Verify the user owns this subscription
    if (subscription.workspace.creator.clerkId !== userId) {
      return NextResponse.json({ error: 'Not authorized to cancel this subscription' }, { status: 403 })
    }

    // Remove Soldiers X from unlockedSoldiers array
    const soldiersX = ['penn', 'soshie', 'seomi', 'milli', 'vizzy']
    const updatedSoldiers = subscription.unlockedSoldiers.filter(
      soldier => !soldiersX.includes(soldier)
    )

    // Update subscription to remove Soldiers X
    await db.billingSubscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        unlockedSoldiers: updatedSoldiers,
      },
    })

    console.log('✅ Soldiers X removed from subscription:', subscriptionId)

    return NextResponse.json({
      success: true,
      message: 'Soldiers X cancelled successfully',
      remainingSoldiers: updatedSoldiers,
    })

  } catch (error) {
    console.error('❌ Error cancelling Soldiers X:', error)
    return NextResponse.json(
      { error: 'Failed to cancel Soldiers X' },
      { status: 500 }
    )
  }
}
