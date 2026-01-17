import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine price ID based on purchase type and plan
    let priceId: string = ''
    let metadata: any = {}

    const { purchaseType, agentName, planId, email, clerkId } = await req.json()

    if (!purchaseType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (purchaseType === 'SOLDIERSX') {
      priceId = process.env.STRIPE_SUBSCRIPTION_FIVE_AGENTS_PLAN_ID!
      metadata = {
        purchaseType: 'BUNDLE',
        planType: 'SOLDIERSX',
        agentName,
        unlockedAgents: agentName,
        clerkId,
        email,
      }
    } else if (purchaseType === 'SUBSCRIPTION' && planId === 'PROFESSIONAL') {
      console.log('Yearly Subscription')
      priceId = process.env.STRIPE_SUBSCRIPTION_TEN_AGENTS_PLAN_ID!
      metadata = {
        purchaseType: 'BUNDLE',
        planType: 'PROFESSIONAL',
        agentName:
          'buddy,pitch-bot,growth-bot,strategy-adviser,penn,builder-bot,dev-bot,pm-bot,commet,soshie',
        unlockedAgents:
          'buddy,pitch-bot,growth-bot,strategy-adviser,penn,builder-bot,dev-bot,pm-bot,commet,soshie',
        clerkId,
        email,
      }
    } else if (purchaseType === 'SUBSCRIPTION' && planId === 'STARTER') {
      console.log('Monthly Subscription')
      priceId = process.env.STRIPE_SUBSCRIPTION_FIVE_AGENTS_PLAN_ID!
      metadata = {
        purchaseType: 'BUNDLE',
        planType: 'STARTER',
        agentName: 'buddy,pitch-bot,growth-bot,strategy-adviser,penn',
        unlockedAgents: 'buddy,pitch-bot,growth-bot,strategy-adviser,penn',
        clerkId,
        email,
      }
    } else {
      return NextResponse.json(
        {
          message: 'Invalid plan information.',
        },
        {
          status: 500,
        }
      )
    }

    // // Check if it's Soldiers X bundle
    // if (
    //   planId === 'SOLDIERSX' ||
    //   (purchaseType === 'BUNDLE' && agentName?.includes('penn'))
    // ) {
    //   console.log('SOLDIERS X BUNDLE PLAN')
    //   priceId = process.env.STRIPE_BUNDLE_SOLDIERS_YEARLY_PLAN_ID!
    //   metadata = {
    //     purchaseType: 'BUNDLE',
    //     planType: 'SOLDIERSX',
    //     agentName: agentName || 'penn,soshie,seomi,milli,vizzy',
    //     unlockedAgents: agentName || 'penn,soshie,seomi,milli,vizzy',
    //     clerkId,
    //     email,
    //   }
    //   console.log('🎖️ Soldiers X Bundle checkout:', metadata)
    // }

    // // STARTER
    // // PROFESSIONAL
    // // ENTERPRISE
    // // SINGLE

    // // Check if it's a professional plan (yearly)
    // else if (planId === 'PROFESSIONAL' && interval === 'YEAR') {
    //   console.log('Yearly Plan')
    //   priceId = process.env.STRIPE_PROFESSIONAL_PRICE_ID_YEAR!
    //   metadata = {
    //     purchaseType: 'BUNDLE',
    //     planType: 'PROFESSIONAL',
    //     agentName: 'buddy,pitch-bot,growth-bot,dev-bot,pm-bot',
    //     unlockedAgents: 'buddy,pitch-bot,growth-bot,dev-bot,pm-bot',
    //     clerkId,
    //     email,
    //   }
    //   console.log('💼 Professional Plan (Yearly) checkout:', metadata)
    // } else if (
    //   purchaseType === 'SINGLE' ||
    //   planId === 'STARTER' ||
    //   interval === 'MONTH'
    // ) {
    //   console.log('Monthly Plan')
    //   // Starter plan - monthly
    //   priceId = process.env.STRIPE_PRICE_MONTHLY_PLAN!
    //   metadata = {
    //     purchaseType: 'BUNDLE',
    //     planType: 'STARTER',
    //     agentName: 'buddy,pitch-bot,growth-bot,dev-bot,pm-bot',
    //     unlockedAgents: 'buddy,pitch-bot,growth-bot,dev-bot,pm-bot',
    //     clerkId,
    //     email,
    //   }
    //   console.log('🎯 Starter Plan (Monthly) checkout:', metadata)
    // } else if (purchaseType === 'BUNDLE') {
    //   // Soldiers X Bundle (fallback)
    //   priceId = process.env.STRIPE_SOLDIERS_BUNDLE_PRICE_ID_YEAR!
    //   metadata = {
    //     purchaseType: 'BUNDLE',
    //     planType: 'SOLDIERSX',
    //     agentName: agentName || 'penn,soshie,seomi,milli,vizzy',
    //     unlockedAgents: agentName || 'penn,soshie,seomi,milli,vizzy',
    //     clerkId,
    //     email,
    //   }
    // } else {
    //   return NextResponse.json(
    //     { error: 'Invalid purchase type' },
    //     { status: 400 }
    //   )
    // }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this purchase type' },
        { status: 400 }
      )
    }

    // // Create or get Stripe customer
    // // const customerId = await createOrGetStripeCustomer(
    // //   workspaceId,
    // //   emailAddress.emailAddress,
    // //   `${user.firstName} ${user.lastName}`.trim()
    // // )

    // // Create checkout session - include Stripe session id so we can verify immediately
    // // Use Stripe placeholder so Stripe appends the session id on redirect
    const successUrl = `${process.env.APP_URL}/dashboard/${userId}?payment=success&type=${purchaseType}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.APP_URL}/pricing/select?cancelled=true`

    const checkoutUrl = await createCheckoutSession(
      priceId,
      successUrl,
      cancelUrl,
      metadata.planType,
      userId,
      metadata.unlockedAgents,
      metadata.clerkId,
      metadata.email,
      planId
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: `Failed to create checkout session ${error}` },
      { status: 500 }
    )
  }
}
