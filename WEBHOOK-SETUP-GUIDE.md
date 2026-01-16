# Stripe Webhook Setup for Production

## Issue
Payment ho rahi hai but soldiers unlock nahi ho rahe kyunki Stripe webhook trigger nahi ho raha production mein.

## Solution

### Step 1: Add Webhook Endpoint in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
   For local testing with Stripe CLI:
   ```
   http://localhost:3000/api/webhooks/stripe
   ```

4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

5. Copy the **Signing secret** (starts with `whsec_`)

6. Add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Step 2: Test with Stripe CLI (Local Development)

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```powershell
# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook secret, add it to .env:
# STRIPE_WEBHOOK_SECRET=whsec_...

# Test the webhook
stripe trigger checkout.session.completed
```

### Step 3: Test Payment Flow

1. Go to pricing page
2. Click "Soldiers X" (bundle)
3. Complete test payment with card: `4242 4242 4242 4242`
4. Check terminal logs for webhook events
5. Verify soldiers are unlocked

### Step 4: For Production

1. Deploy to Vercel/your hosting
2. Add webhook endpoint with your production URL
3. Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
4. Test with real Stripe test mode payment

## Quick Test Script

For testing without real payment, use:

```bash
node test-webhook-simulation.js <workspaceId> bundle
```

This will simulate the webhook and unlock all 5 soldiers immediately.

## Debugging

Check webhook logs in Stripe Dashboard:
https://dashboard.stripe.com/test/webhooks
