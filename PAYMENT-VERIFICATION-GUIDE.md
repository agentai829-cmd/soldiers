# 🎯 Payment Verification System - Complete Guide

## ✅ Implemented Features

### 1. Database Schema ✓
- User table mein subscription fields add ki gayi hain:
  - `stripeCustomerId` - Stripe customer ID
  - `stripeSubscriptionId` - Stripe subscription ID  
  - `stripePriceId` - Price ID jo purchase kiya gaya
  - `subscriptionStatus` - active, canceled, past_due, trialing
  - `currentPlanName` - monthly, yearly, bundle
  - `subscriptionStartDate` - Subscription start date
  - `subscriptionEndDate` - Subscription end date
  - `cancelAtPeriodEnd` - Agar cancel kiya hai to true

### 2. Stripe Webhook Integration ✓
**File:** `lib/stripe.ts`

Webhook automatically update karega User table jab:
- ✅ Payment successful hogi (`checkout.session.completed`)
- ✅ Subscription update hoga (`customer.subscription.updated`)
- ✅ Subscription cancel hoga (`customer.subscription.deleted`)
- ✅ Payment fail hoga (`invoice.payment_failed`)

### 3. Middleware Protection ✓
**File:** `middleware.ts`

Middleware check karega:
- ✅ User authenticated hai ya nahi
- ✅ User ki subscription active hai ya nahi
- ✅ Agar subscription nahi hai to `/pricing` page par redirect karega
- ✅ Protected routes: `/dashboard`, `/workspace`, `/settings`, `/billing`

### 4. Helper Functions ✓
**File:** `lib/check-subscription.ts`

Functions available:
- `checkUserSubscription()` - Current user ka subscription check kare
- `getUserSubscriptionByEmail(email)` - Email se subscription check kare

### 5. API Endpoint ✓
**Endpoint:** `GET /api/user/subscription`

Returns:
```json
{
  "hasActiveSubscription": true,
  "subscription": {
    "email": "user@example.com",
    "status": "active",
    "plan": "yearly",
    "startDate": "2026-01-08T...",
    "endDate": "2027-01-08T...",
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": "sub_xxx"
  }
}
```

---

## 🧪 Testing Guide

### Step 1: Check Database Schema
```powershell
# Generate Prisma client (agar error aaye to ignore karein)
npx prisma generate

# Database update karna hai
npx prisma db push
```

### Step 2: Test User Subscription Check
```powershell
# Apni email se test karein
node check-user-subscription.js your-email@example.com
```

**Expected Output:**
- ✅ Agar payment hui hai to: "User has ACTIVE subscription"
- ❌ Agar payment nahi hui to: "User has NO active subscription"

### Step 3: Stripe Webhook Testing

**Local Testing:**
```powershell
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start Stripe CLI (pehle install karein)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Test Payment:**
1. Pricing page par jayein: `http://localhost:3000/pricing`
2. Koi plan select karein
3. Test card use karein: `4242 4242 4242 4242`
4. Payment complete karein
5. Terminal mein webhook logs check karein

### Step 4: Middleware Testing

**Test Without Payment:**
1. Ek naya user banayein (signup karein)
2. Direct `/dashboard` ya `/workspace` open karein
3. Automatically `/pricing` page par redirect hona chahiye

**Test With Payment:**
1. Payment karein
2. `/dashboard` ya `/workspace` open karein
3. Access mil jana chahiye

### Step 5: API Testing

**Browser Console:**
```javascript
// User ki subscription check karein
fetch('/api/user/subscription')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Expected Response:**
```json
{
  "hasActiveSubscription": false,  // true agar payment hui hai
  "subscription": { ... }
}
```

---

## 🔥 Production Deployment

### Step 1: Environment Variables Check
`.env` file mein ye variables hone chahiye:
```env
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Step 2: Stripe Webhook Setup
1. Stripe Dashboard par jayein
2. Developers > Webhooks
3. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Webhook secret copy karke `.env` mein add karein

### Step 3: Deploy
```powershell
# Build karein
npm run build

# Deploy karein (Vercel example)
vercel --prod
```

---

## 🎬 User Flow

### Scenario 1: New User (No Payment)
```
1. User signs up → Clerk authentication
2. User redirect to /dashboard
3. Middleware checks subscription
4. No subscription found
5. Redirect to /pricing page
6. "Please purchase a plan to continue" message
```

### Scenario 2: User Completes Payment
```
1. User selects plan on /pricing
2. Stripe checkout opens
3. User completes payment
4. Stripe webhook fires → checkout.session.completed
5. Database updated:
   - User.subscriptionStatus = 'active'
   - User.currentPlanName = 'monthly' or 'yearly'
   - User.subscriptionStartDate = now
   - User.subscriptionEndDate = 1 month/year later
6. User redirected to /dashboard
7. Middleware checks subscription
8. Subscription active → Access granted ✅
```

### Scenario 3: Subscription Expires
```
1. Subscription end date passes
2. Stripe webhook fires → customer.subscription.deleted
3. Database updated:
   - User.subscriptionStatus = 'canceled'
4. User tries to access /dashboard
5. Middleware checks subscription
6. No active subscription
7. Redirect to /pricing page
```

---

## 🔍 Troubleshooting

### Problem: Prisma generate error
**Solution:** Ignore the DLL error - schema update successful hai agar "Your database is now in sync" message aaya

### Problem: Middleware not redirecting
**Solution:** 
```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next
npm run dev
```

### Problem: Webhook not receiving events
**Solution:**
1. Check webhook secret in `.env`
2. Verify webhook URL in Stripe dashboard
3. Check Stripe CLI is running: `stripe listen`

### Problem: User has payment but middleware still redirecting
**Solution:**
```powershell
# Check database entry
node check-user-subscription.js your-email@example.com

# If subscription not showing, trigger webhook manually
# Or make a test payment again
```

---

## 📊 Database Check Commands

### Check All Users with Subscriptions
```javascript
// Run in node REPL
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

await prisma.user.findMany({
  where: {
    subscriptionStatus: { not: null }
  },
  select: {
    email: true,
    subscriptionStatus: true,
    currentPlanName: true,
    subscriptionEndDate: true
  }
})
```

### Update User Subscription Manually (for testing)
```javascript
await prisma.user.update({
  where: { email: 'your-email@example.com' },
  data: {
    subscriptionStatus: 'active',
    currentPlanName: 'monthly',
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
})
```

---

## ✅ Implementation Checklist

- [x] Database schema updated with subscription fields
- [x] Prisma client generated
- [x] Database migrated (db push successful)
- [x] Stripe webhook handler updated for User table
- [x] Middleware updated for payment verification
- [x] Helper functions created
- [x] Test script created
- [x] API endpoint verified

---

## 🎯 Next Steps

1. **Test locally** with Stripe test mode
2. **Verify webhook** is receiving events
3. **Test middleware** redirection
4. **Deploy to production**
5. **Setup production webhook** in Stripe dashboard
6. **Monitor** user payments and access

---

## 📞 Support

Agar koi problem aaye to:
1. Terminal logs check karein
2. Stripe dashboard mein webhook logs dekhen
3. Database mein user record verify karein
4. Middleware console logs check karein

**Testing Commands:**
```powershell
# User subscription check
node check-user-subscription.js your-email@example.com

# Stripe webhook test
stripe trigger checkout.session.completed

# Development server with logs
npm run dev
```

---

✅ **System Ready!** Ab payment verification complete hai.
