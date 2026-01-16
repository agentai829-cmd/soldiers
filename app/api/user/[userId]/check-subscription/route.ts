import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const existingSubscription = await db.billingSubscription.findFirst({
      where: {
        clerkId: params.userId,
      },
    })

    const subscriptionStatus = () => {
      const subscriptionNotFound = !existingSubscription

      const subscriptionExpired =
        existingSubscription &&
        existingSubscription.currentPeriodEnd < new Date()

      const validSubscription =
        existingSubscription &&
        existingSubscription.status === 'ACTIVE' &&
        !subscriptionExpired

      if (subscriptionNotFound) {
        return false
      } else if (subscriptionExpired) {
        return false
      } else if (validSubscription) {
        return true
      }
      return false
    }

    return new Response(
      JSON.stringify({ hasValidSubscription: subscriptionStatus() }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking subscription:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    })
  }
}
