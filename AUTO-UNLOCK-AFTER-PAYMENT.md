# 🎯 AUTO UNLOCK SOLDIERS AFTER PAYMENT

## Problem
Payment ho rahi hai but Stripe webhook locally trigger nahi ho raha, isliye soldiers unlock nahi ho rahe.

## Temporary Solution (Use This Every Time After Payment)

### Step 1: Payment Complete Karo
Stripe checkout se payment complete karo.

### Step 2: Immediately Run This Command
Terminal mein ye command chalao (payment hone ke turant baad):

```bash
node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq bundle
```

Agar different workspace hai, toh workspace ID change karo:
```bash
node manual-unlock-after-payment.js YOUR_WORKSPACE_ID bundle
```

### Step 3: Browser Refresh
Browser refresh karo - soldiers unlock ho jayenge!

---

## Permanent Solution (Production Deployment)

### Option 1: Deploy to Production
1. Deploy app to Vercel/production
2. Stripe webhook automatically kaam karega
3. No manual unlock needed

### Option 2: Setup Stripe CLI (Local Development)
```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook secret (whsec_...) and update .env
STRIPE_WEBHOOK_SECRET=whsec_your_new_secret

# Restart dev server
npm run dev
```

---

## Quick Commands

### Unlock All 5 Soldiers (Bundle)
```bash
node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq bundle
```

### Unlock Single Soldier
```bash
node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq single Carl
node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq single Paul
node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq single Wendy
```

### Check Current Unlocked Soldiers
```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.billingSubscription.findUnique({where:{workspaceId:'cmhzel1tv0002s8nr095fb8jq'}}).then(s=>console.log('Unlocked:',s?.unlockedSoldiers)).finally(()=>p.$disconnect())"
```

### Delete All Test Subscriptions
```bash
node delete-test-subscriptions.js
```

---

## Why This Happens

Local development mein Stripe webhooks ko forward karne ke liye Stripe CLI ki zaroorat hoti hai. Bina Stripe CLI ke:
- ✅ Payment successfully hoti hai Stripe mein
- ❌ Webhook event local server tak nahi pohanchta
- ❌ Database update nahi hota
- ❌ Soldiers unlock nahi hote

Production mein ye problem nahi hogi kyunki Stripe webhook directly aapke deployed server ko call karega.

---

## Testing Workflow

1. **Make Payment** → Stripe Checkout
2. **Run Manual Script** → `node manual-unlock-after-payment.js ...`
3. **Refresh Browser** → Soldiers unlocked! ✅

Ye workflow fast aur reliable hai testing ke liye.
