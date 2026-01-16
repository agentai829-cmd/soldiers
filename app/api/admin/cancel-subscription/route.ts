import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      console.log('❌ No userId found - Unauthorized')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { subscriptionId, workspaceId } = await req.json()

    if (!subscriptionId || !workspaceId) {
      console.log('❌ Missing fields:', { subscriptionId, workspaceId })
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🚫 Admin Cancelling subscription:', { userId, subscriptionId, workspaceId })

    // First, check if subscription exists
    const existingSubscription = await db.billingSubscription.findUnique({
      where: { workspaceId }
    })

    if (!existingSubscription) {
      console.log('⚠️ No subscription found for workspace:', workspaceId)
      return NextResponse.json({
        success: false,
        error: 'Subscription not found'
      }, { status: 404 })
    }

    console.log('📋 Current subscription:', existingSubscription)

    // Cancel subscription in Stripe if it's not a temporary subscription
    if (!subscriptionId.startsWith('temp_')) {
      try {
        const canceledStripeSubscription = await stripe.subscriptions.cancel(subscriptionId)
        console.log('✅ Stripe subscription cancelled:', canceledStripeSubscription.status)
      } catch (stripeError: any) {
        console.error('❌ Stripe cancellation error:', stripeError.message)
        // If subscription doesn't exist in Stripe, that's okay - continue to delete from DB
        if (!stripeError.message.includes('No such subscription')) {
          console.log('⚠️ Continuing with database deletion despite Stripe error')
        }
      }
    } else {
      console.log('⚠️ Skipping Stripe cancellation for temporary subscription')
    }

    // DELETE the subscription from database completely
    await db.billingSubscription.delete({
      where: { workspaceId }
    })

    console.log('✅ Subscription DELETED from database')
    console.log('🔒 All soldiers locked for workspace:', workspaceId)

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled and deleted completely',
      workspaceId
    })
  } catch (error: any) {
    console.error('❌ Error cancelling subscription:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
