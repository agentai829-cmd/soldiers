import Stripe from 'stripe'
import { db } from './db'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export interface StripeCustomer {
  id: string
  email: string
  name?: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  priceId: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: [
      '1 Workspace',
      '3 AI Helpers',
      '100 Automations/month',
      '1,000 Knowledge docs',
      'Basic integrations',
    ],
    priceId:
      process.env.STRIPE_STARTER_PRICE_ID_MONTH ||
      process.env.STRIPE_STARTER_PRICE_ID_YEAR ||
      process.env.STRIPE_STARTER_PRICE_ID ||
      '',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'month',
    features: [
      '5 Workspaces',
      'Unlimited AI Helpers',
      '500 Automations/month',
      '10,000 Knowledge docs',
      'All integrations',
      'Priority support',
    ],
    priceId:
      process.env.STRIPE_PROFESSIONAL_PRICE_ID_MONTH ||
      process.env.STRIPE_PROFESSIONAL_PRICE_ID_YEAR ||
      process.env.STRIPE_PROFESSIONAL_PRICE_ID ||
      '',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    features: [
      'Unlimited Workspaces',
      'Unlimited AI Helpers',
      'Unlimited Automations',
      'Unlimited Knowledge docs',
      'Custom integrations',
      'Dedicated support',
      'SSO & advanced security',
    ],
    priceId:
      process.env.STRIPE_ENTERPRISE_PRICE_ID_MONTH ||
      process.env.STRIPE_ENTERPRISE_PRICE_ID_YEAR ||
      process.env.STRIPE_ENTERPRISE_PRICE_ID ||
      '',
  },
]

/**
 * Create or get Stripe customer
 */
// export async function createOrGetStripeCustomer(
//   workspaceId: string,
//   email: string,
//   name?: string
// ): Promise<string> {
//   try {
//     const workspace = await db.workspace.findUnique({
//       where: { id: workspaceId },
//     })

//     if (!workspace) {
//       throw new Error('Workspace not found')
//     }

//     // Return existing customer ID if available
//     if (workspace.stripeCustomerId) {
//       return workspace.stripeCustomerId
//     }

//     // Create new Stripe customer
//     const customer = await stripe.customers.create({
//       email,
//       name,
//       metadata: {
//         workspaceId,
//       },
//     })

//     // Update workspace with customer ID
//     await db.workspace.update({
//       where: { id: workspaceId },
//       data: { stripeCustomerId: customer.id },
//     })

//     return customer.id
//   } catch (error) {
//     console.error('Error creating Stripe customer:', error)
//     throw new Error('Failed to create Stripe customer')
//   }
// }

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  planType: string,
  userId: string,
  unlockedAgents: string,
  clerkUserId: string,
  emailAddress: string,
  planId: string
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      // customer: customerId,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planType,
        unlockedAgents,
        clerkUserId,
        emailAddress,
        planId,
      },
      subscription_data: {
        metadata: {
          planType,
          unlockedAgents,
          clerkUserId,
          emailAddress,
          planId,
        },
      },
    })

    return session.url || ''
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw new Error(`Failed to create checkout session: ${error}`)
  }
}

/**
 * Create Stripe billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return session.url
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    throw new Error('Failed to create billing portal session')
  }
}

/**
 * Handle Stripe webhook events
 */
// export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
//   try {
//     console.log('🔔 Webhook received:', event.type)
//     switch (event.type) {
//       case 'checkout.session.completed': {
//         const session = event.data.object as Stripe.Checkout.Session
//         const workspaceId = session.metadata?.workspaceId
//         const unlockedAgents = session.metadata?.unlockedAgents
//         const agentNames = session.metadata?.agentName

//         const email = session.customer_details?.email
//         const stripeSubscriptionId = session.subscription as string // Fixed: This should be subscription ID, not session ID
//         const stripeCustomerId = session.customer as string
//         const planName = session?.metadata?.planType as string
//         const amount = session.amount_total || 0
//         const currency = session.currency || 'usd'

//         if (!stripeSubscriptionId) {
//           console.log('❌ No subscription ID in session')
//           return
//         }

//         // Get the actual subscription details
//         const subscription =
//           await stripe.subscriptions.retrieve(stripeSubscriptionId)
//         if (!subscription) {
//           console.log('❌ No active subscription found')
//           return
//         }

//         const priceId = subscription.items.data[0].price.id
//         const subscriptionStartDate = new Date(
//           subscription.current_period_start * 1000
//         )
//         const subscriptionEndDate = new Date(
//           subscription.current_period_end * 1000
//         )
//         const interval =
//           subscription.items.data[0].price.recurring?.interval || 'month'

//         console.log('💳 Checkout session completed')
//         console.log('   Workspace ID:', workspaceId)
//         console.log('   Customer:', session.customer)
//         console.log('   Subscription:', subscription.id)
//         console.log('   Customer Email:', session.customer_details?.email)
//         console.log('   Plan:', planName)
//         console.log('   Interval:', interval)
//         console.log('   AgentName:', agentNames)
//         console.log('   unlockAgent:', unlockedAgents)

//         if (
//           !email ||
//           !stripeSubscriptionId ||
//           !stripeCustomerId ||
//           !planName ||
//           !priceId ||
//           !unlockedAgents ||
//           !agentNames
//         ) {
//           console.error('❌ Missing required session data')
//           return
//         }

//         // Check if pending payment already exists
//         const existingPending = await db.pendingPayment.findFirst({
//           where: {
//             email: email!,
//             stripeCustomerId,
//             isUsed: false,
//           },
//         })

//         // if (!existingPending) {
//         //   await db.pendingPayment.create({
//         //     data: {
//         //       email: email!,
//         //       stripeSessionId: session.id,
//         //       stripeCustomerId,
//         //       planName,
//         //       amount,
//         //       currency,
//         //       subscriptionStartDate,
//         //       subscriptionEndDate,
//         //       priceId,
//         //       isUsed: false,
//         //     },
//         //   })
//         //   console.log('✅ Pending payment record created successfully')
//         // } else {
//         //   console.log('⚠️ Pending payment already exists for this customer')
//         // }
//         break
//       }

//       case 'invoice.payment_succeeded': {
//         const invoice = event.data.object as Stripe.Invoice
//         const subscriptionId = invoice.subscription as string
//         const customerId = invoice.customer as string

//         if (!subscriptionId) return

//         // Update pending payment with successful payment status if exists
//         const pendingPayment = await db.pendingPayment.findFirst({
//           where: {
//             stripeCustomerId: customerId,
//             isUsed: false,
//           },
//         })

//         if (pendingPayment) {
//           console.log(
//             '💰 Payment succeeded for pending payment:',
//             pendingPayment.email
//           )
//         }
//         break
//       }

//       case 'customer.subscription.updated':
//       case 'customer.subscription.deleted': {
//         const subscription = event.data.object as Stripe.Subscription
//         const customerId = subscription.customer as string

//         // Update any pending payments if subscription changes
//         console.log('🔄 Subscription updated/deleted:', subscription.id)

//         // If subscription is cancelled, we might want to handle pending payments differently
//         if (subscription.status === 'canceled') {
//           await db.pendingPayment.updateMany({
//             where: {
//               stripeCustomerId: customerId,
//               isUsed: false,
//             },
//             data: {
//               isUsed: true, // Mark as used so they don't get auto-activated
//             },
//           })
//         }
//         break
//       }
//     }
//   } catch (error) {
//     console.error('Error handling Stripe webhook:', error)
//     throw error
//   }
// }

/**
 * Check workspace billing status
 */
// export async function getWorkspaceBillingStatus(workspaceId: string): Promise<{
//   isActive: boolean
//   plan: string | null
//   status: string | null
//   currentPeriodEnd: Date | null
//   unlockedSoldiers: string[]
// }> {
//   try {
//     const subscription = await db.billingSubscription.findUnique({
//       where: { workspaceId },
//     })

//     if (!subscription) {
//       return {
//         isActive: false,
//         plan: null,
//         status: null,
//         currentPeriodEnd: null,
//         unlockedSoldiers: [],
//       }
//     }

//     return {
//       isActive: subscription.status === 'ACTIVE',
//       plan: subscription.planId,
//       status: subscription.status,
//       currentPeriodEnd: subscription.currentPeriodEnd,
//       unlockedSoldiers: subscription.unlockedSoldiers,
//     }
//   } catch (error) {
//     console.error('Error getting workspace billing status:', error)
//     return {
//       isActive: false,
//       plan: null,
//       status: null,
//       currentPeriodEnd: null,
//       unlockedSoldiers: [],
//     }
//   }
// }

/**
 * Check if a specific soldier is unlocked for a workspace
 */
// export async function isSoldierUnlocked(
//   workspaceId: string,
//   soldierName: string
// ): Promise<boolean> {
//   try {
//     const subscription = await db.billingSubscription.findUnique({
//       where: { workspaceId },
//       select: { unlockedSoldiers: true, status: true },
//     })

//     if (!subscription || subscription.status !== 'ACTIVE') {
//       return false
//     }

//     return subscription.unlockedSoldiers.includes(soldierName)
//   } catch (error) {
//     console.error('Error checking soldier unlock status:', error)
//     return false
//   }
// }

export { stripe }
