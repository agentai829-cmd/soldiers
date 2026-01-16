import { db } from '@/lib/db'
import { storeStripePaymentInDB } from '@/lib/subscription'
import { verifyWebhook } from '@clerk/backend/webhooks'

export async function POST(request: Request) {
  try {
    const evt = await verifyWebhook(request)

    // Access the event data
    const { id } = evt.data
    const eventType = evt.type

    // Handle specific event types
    if (evt.type === 'user.created') {
      console.log('Creating new user')
      const data = evt.data
      const newUser = await db.user.create({
        data: {
          clerkId: data.id,
          name: data.username || data.first_name,
          email: data.email_addresses[0].email_address,
          imageUrl: data.image_url,
        },
      })
      // Checking if pending payment exist
      const pendingPayment = await db.pendingPayment.findFirst({
        where: {
          emailAddress: data.email_addresses[0].email_address,
        },
      })
      if (pendingPayment) {
        console.log('Found an pending payment syncing user with it.')
        // Create user first workspace manually
        console.log('Updating subscription')
        await storeStripePaymentInDB({
          clerkUserId: newUser.clerkId,
          emailAddress: newUser.email,
          currency: pendingPayment.currency,
          customerId: pendingPayment.customerId,
          totalAmount: pendingPayment.totalAmount,
          paymentIntent: pendingPayment.paymentIntent,
          planId: pendingPayment.planId as
            | 'STARTER'
            | 'PROFESSIONAL'
            | 'SINGLE'
            | 'SOLDIERSX',
          planType: pendingPayment.planType,
          stripeSessionId: pendingPayment.stripeSessionId,
          subscriptionId: pendingPayment.subscriptionId,
          subscriptionStartDate: pendingPayment.subscriptionStartDate,
          subscriptionEndDate: pendingPayment.subscriptionEndDate,
          unlockedAgents: pendingPayment.unlockedAgents,
          priceId: pendingPayment.priceId,
        })
      }
    }

    return new Response('Success', { status: 200 })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Webhook verification failed', { status: 400 })
  }
}
