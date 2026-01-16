import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
// import { handleStripeWebhook } from '@/lib/stripe'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

// export async function POST(request: NextRequest) {
//   console.log('🎯 Webhook endpoint hit!')

//   try {
//     const body = await request.text()
//     const signature = headers().get('stripe-signature')

//     console.log('📨 Webhook received:', {
//       hasBody: !!body,
//       hasSignature: !!signature,
//       bodyLength: body.length
//     })

//     if (!signature) {
//       console.error('❌ Missing Stripe signature')
//       return NextResponse.json(
//         { error: 'Missing signature' },
//         { status: 400 }
//       )
//     }

//     let event: Stripe.Event

//     try {
//       event = stripe.webhooks.constructEvent(
//         body,
//         signature,
//         process.env.STRIPE_WEBHOOK_SECRET!
//       )
//       console.log('✅ Event verified:', event.type)
//     } catch (error) {
//       console.error('❌ Webhook signature verification failed:', error)
//       return NextResponse.json(
//         { error: 'Invalid signature' },
//         { status: 400 }
//       )
//     }

//     // Handle the event
//     console.log('🔄 Processing event...')
//     await handleStripeWebhook(event)
//     console.log('✅ Event processed successfully')

//     return NextResponse.json({ received: true })
//   } catch (error) {
//     console.error('❌ Stripe webhook error:', error)
//     return NextResponse.json(
//       { error: 'Webhook handler failed' },
//       { status: 500 }
//     )
//   }
// }
