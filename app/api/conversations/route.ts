import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { helperId, clerkId } = body

    // Validate required fields
    if (!helperId || !clerkId) {
      return NextResponse.json(
        { error: 'Missing required fields: helperId or clerkId' },
        { status: 400 }
      )
    }

    const existingBilling = await db.billingSubscription.findFirst({
      where: {
        clerkId,
      },
      include:{
        unlockedSoldiers: true,
      }
    })

    if (!existingBilling) {
      return NextResponse.json(
        { error: 'No active subscription found for this user' },
        { status: 403 }
      )
    }
    // Check if subscription is active and not expired
    const invalidSubscription =
      existingBilling.status !== 'ACTIVE' ||
      existingBilling.currentPeriodEnd < new Date()
    if (invalidSubscription) {
      return NextResponse.json(
        { error: 'Subscription is not active or has expired' },
        { status: 403 }
      )
    }
    // Check if selected helper is part of unlocked soldiers
    const unlockedSoldiers = existingBilling?.unlockedSoldiers?.flatMap((item) => item.unlockedSoldiers) || []
    console.log('Unlocked Soldiers:', unlockedSoldiers)
    console.log('Helper:', helperId)
    if (!unlockedSoldiers.includes(helperId)) {
      return NextResponse.json(
        { error: 'Selected helper is not part of unlocked soldiers' },
        { status: 403 }
      )
    }

    const emptyMessageConveration = await db.conversation.findMany({
      where: {
        userId: clerkId,
        messages: {
          none: {},
        },
      },
    })
    if (emptyMessageConveration.length > 0) {
      console.log('Existing empty conversation found:')
      for (const conversation of emptyMessageConveration) {
        await db.conversation.delete({
          where: {
            id: conversation.id,
          },
        })
      }
    }
    const newConversation = await db.conversation.create({
      data: {
        helperId,
        userId: clerkId,
        archived: false,
        title: 'New Conversation',
      },
    })

    console.log('Conversation created:', newConversation.id)

    return NextResponse.json(
      {
        conversationId: newConversation.id,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Error creating conversation' },
      { status: 500 }
    )
  }
}
