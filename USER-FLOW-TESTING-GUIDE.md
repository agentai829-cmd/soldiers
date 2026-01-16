# 🎯 User Payment Flow - Testing Guide

## ✅ Implementation Complete

### 📋 Flow Summary

```
User Opens Website (/)
    ↓
Check Authentication
    ↓
Authenticated? 
    ├─ NO → Redirect to /sign-in
    └─ YES → Check Payment Status
              ↓
         Has Active Payment?
              ├─ YES → Redirect to /workspace ✅
              └─ NO  → Redirect to /pricing/select 💳
```

---

## 🎬 User Scenarios

### Scenario 1: New User (No Payment)
```
1. User opens → http://localhost:3000/
2. Not logged in → Redirect to /sign-in
3. User signs up/logs in
4. System checks payment status
5. No payment found
6. ✅ Redirect to /pricing/select
7. User sees pricing page with 2 plans:
   - Professional ($200/year)
   - Starter ($20/month)
```

### Scenario 2: Existing User (Has Payment)
```
1. User opens → http://localhost:3000/
2. Already logged in
3. System checks payment status
4. Active subscription found ✅
5. ✅ Redirect to /workspace
6. User can access all features
```

### Scenario 3: User Makes Payment
```
1. User on /pricing/select
2. Selects plan (Professional or Starter)
3. Clicks "Choose Plan"
4. Stripe checkout opens
5. User completes payment
6. Webhook fires → User.subscriptionStatus = 'active'
7. User redirected back to website
8. Next time opens site → Direct to /workspace ✅
```

### Scenario 4: Payment Expired
```
1. User subscription expires
2. Webhook updates → User.subscriptionStatus = 'canceled'
3. User tries to access /workspace
4. Middleware checks subscription
5. No active subscription
6. ✅ Redirect to /pricing/select
7. User must pay again
```

---

## 🧪 Testing Steps

### Test 1: New User Flow
```powershell
# 1. Start server
npm run dev

# 2. Open browser in incognito mode
http://localhost:3000/

# Expected: Redirect to /sign-in
```

### Test 2: Sign Up & See Pricing
```
1. Click "Sign Up"
2. Create new account
3. After signup → Should see /pricing/select page ✅
4. Two plans visible:
   - Professional $200/year
   - Starter $20/month
```

### Test 3: Make Test Payment
```
1. Click "Choose Plan" on any plan
2. Enter test card: 4242 4242 4242 4242
3. Expiry: 12/34, CVC: 123
4. Complete payment
5. Check webhook logs in terminal
6. Database should update automatically
```

### Test 4: Verify Database Update
```powershell
# Check user subscription in database
node check-user-subscription.js your-email@example.com
```

Expected output:
```
✅ User Found:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: your-email@example.com
📊 Status: active
📦 Plan: monthly (or yearly)
✅ User has ACTIVE subscription
🌐 User can access the website
```

### Test 5: Access After Payment
```
1. Open http://localhost:3000/ again
2. Should redirect to /workspace ✅
3. No pricing page shown
4. Direct access to dashboard
```

### Test 6: Direct URL Access
```
# Try accessing protected routes directly

# Without payment:
http://localhost:3000/workspace
→ Should redirect to /pricing/select

# With payment:
http://localhost:3000/workspace
→ Should show workspace page ✅
```

---

## 🔍 Debugging

### Check Logs
```powershell
# Terminal should show:
🔐 Auth userId (Clerk ID): user_xxxxx
👤 User found: { id: '...', email: '...' }
💳 Subscription found: { status: 'ACTIVE', ... }
```

### If Stuck on Pricing Page After Payment
```powershell
# 1. Check database
node check-user-subscription.js your-email@example.com

# 2. If no subscription showing, trigger webhook manually
stripe trigger checkout.session.completed

# 3. Or update database manually for testing
node
> const { PrismaClient } = require('@prisma/client')
> const prisma = new PrismaClient()
> await prisma.user.update({
    where: { email: 'your-email@example.com' },
    data: {
      subscriptionStatus: 'active',
      currentPlanName: 'monthly',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30*24*60*60*1000)
    }
  })
```

### Clear Next.js Cache
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 📊 Pricing Page Configuration

The pricing page shows two plans as per your requirements:

### Plan 1: Professional
- **Price:** $200/year
- **Features:**
  - 5 AI Helpers
  - 25+ Power-Ups
  - Unlimited Conversations
  - Email Support
  - Standard AI Models
  - Basic Workflows

### Plan 2: Starter
- **Price:** $20/month
- **Features:**
  - 5 AI Helpers
  - 10+ Power-Ups
  - 100 Conversations/month
  - Email Support
  - Basic AI Models

---

## ✅ What Changed

### 1. Root Page (/) - [app/page.tsx](app/page.tsx)
```typescript
- Before: Always redirect to /workspace
+ After: Check payment → redirect accordingly
  - Has payment → /workspace
  - No payment → /pricing/select
```

### 2. Middleware - [middleware.ts](middleware.ts)
```typescript
+ Added /pricing/select to public routes
+ Simplified redirect logic
+ Protected /workspace route
```

### 3. Database Schema - Already done ✅
- User table has all subscription fields
- Webhook updates automatically

---

## 🎯 Production Checklist

- [ ] Test signup flow
- [ ] Test pricing page display
- [ ] Test payment with Stripe test card
- [ ] Verify webhook updates database
- [ ] Test redirect after payment
- [ ] Test direct workspace access
- [ ] Test expired subscription flow
- [ ] Setup production Stripe webhook
- [ ] Update environment variables
- [ ] Deploy to production

---

## 🚀 Quick Commands

```powershell
# Start development server
npm run dev

# Check user subscription
node check-user-subscription.js your-email@example.com

# Start Stripe webhook listener (optional)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Clear cache and restart
Remove-Item -Recurse -Force .next; npm run dev
```

---

## 🎉 Ready to Test!

1. Open http://localhost:3000/
2. Sign up with new account
3. See pricing page automatically
4. Choose a plan
5. Complete payment
6. Next visit → Direct workspace access! ✅
