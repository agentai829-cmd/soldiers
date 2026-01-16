import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { PlanType } from '@prisma/client'
import { storeStripePaymentInDB } from '@/lib/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    console.log('🎯 Stripe webhook endpoint hit')
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature found' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const stripeEmailAddress = session.customer_details?.email
        const stripeSessionId = session.id
        const totalAmount = session.amount_total
        const currency = session.currency
        const metadata = session.metadata || {}
        const clerkUserId = metadata?.clerkUserId
        const emailAddress = metadata?.emailAddress
        const isPaymentLink = !!metadata?.paymentLink
        const planId = metadata?.planId as
          | 'STARTER'
          | 'PROFESSIONAL'
          | 'SINGLE'
          | 'SOLDIERSX'
          | "LIFETIME"
        const planType = metadata?.planType
        const customerId = session.customer

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId as string,
          status: 'active',
          limit: 1,
        })
        const subscription = subscriptions.data[0]

        const subscriptionStartDate = new Date(
          subscription.current_period_start * 1000
        )
        const subscriptionEndDate = new Date(
          subscription.current_period_end * 1000
        )

        const unlockedAgents = (metadata?.unlockedAgents as string)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)

        if (!stripeEmailAddress) {
          console.log('Stripe Email address not exist!')
        }

        if (isPaymentLink && stripeEmailAddress) {
          console.log('This transaction is from link')
          const existingUser = await db.user.findFirst({
            where: {
              email: stripeEmailAddress,
            },
            select: {
              id: true,
              clerkId: true,
              email: true,
              name: true,
            },
          })
          if (existingUser) {
            console.log("We found a user updating it's subscription")
            // We have a user with this emai
            // We can just add an subscription

            await storeStripePaymentInDB({
              clerkUserId: existingUser.clerkId,
              emailAddress: existingUser.email,
              currency: currency as string,
              customerId: customerId as string,
              totalAmount: totalAmount as number,
              paymentIntent: session.payment_intent as string,
              planId,
              planType,
              stripeSessionId,
              subscriptionId: subscription.id,
              subscriptionStartDate,
              subscriptionEndDate,
              unlockedAgents,
              priceId: subscription.items.data[0].price.id,
            })
          } else {
            await db.pendingPayment.create({
              data: {
                emailAddress: stripeEmailAddress,
                paymentIntent: (session.payment_intent as string) || '',
                planId,
                planType,
                subscriptionId: subscription.id,
                stripeSessionId,
                totalAmount: totalAmount as number,
                customerId: customerId as string,
                currency: currency as string,
                unlockedAgents,
                priceId: subscription.items.data[0].price.id,
                subscriptionStartDate,
                subscriptionEndDate,
              },
            })
          }
        } else {
          if (planType === 'STARTER' || planType === 'PROFESSIONAL') {
            console.log('✅ Payment successful:', {
              emailAddress,
              clerkUserId,
              sessionId: stripeSessionId,
              amount: totalAmount,
            })
            // Store payment in database
            if (stripeEmailAddress && clerkUserId) {
              await storeStripePaymentInDB({
                clerkUserId,
                emailAddress,
                currency: currency as string,
                customerId: customerId as string,
                totalAmount: totalAmount as number,
                paymentIntent: session.payment_intent as string,
                planId,
                planType,
                stripeSessionId,
                subscriptionId: subscription.id,
                subscriptionStartDate,
                subscriptionEndDate,
                unlockedAgents,
                priceId: subscription.items.data[0].price.id,
              })

              console.log('💾 Payment saved to database for:', emailAddress)
            }
          } else if (planType === 'SOLDIERSX') {
            console.log('✅ Unlocked more soldiers:', {
              unlockedAgents,
            })
            const existingBilling = await db.billingSubscription.findFirst({
              where: {
                clerkId: clerkUserId,
              },
              select: {
                id: true,
                unlockedSoldiers: true,
              },
            })
            if (existingBilling) {
              const prevUnlockedSoldiers = existingBilling?.unlockedSoldiers?.flatMap((item) => item.unlockedSoldiers) || []
              let mergedSoldiers = [...prevUnlockedSoldiers, ...unlockedAgents]
              let filteredRepeatedSoldiers: string[] = []
              for (let i = 0; i < mergedSoldiers.length; i++) {
                const soldier = mergedSoldiers[i]
                if (!filteredRepeatedSoldiers.includes(soldier)) {
                  filteredRepeatedSoldiers.push(soldier)
                }
              }
                await db.unlockSoldiers.create({
    data:{
      billingSubscriptionId: existingBilling.id,
      unlockedSoldiers: filteredRepeatedSoldiers,
      clerkId: clerkUserId,
      currentPeriodStart: subscriptionStartDate,
      currentPeriodEnd: subscriptionEndDate,
      stripeSubscriptionId: subscription.id,
      interval: planId === "LIFETIME" ? "LIFETIME" : planId === 'STARTER' ? 'MONTH' : 'YEAR',
      stripeCustomerId: customerId as string,
      stripePriceId: subscription.items.data[0].price.id,
    }
  })
            }
          }
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
