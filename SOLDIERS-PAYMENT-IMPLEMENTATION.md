# Soldiers Payment System - Implementation Complete ✅

## Overview (خلاصہ)
Ab aapke system mein 2 separate payment flows hain:

### 1. **Carl Button** (Single Soldier Purchase)
- Sirf **Carl** agent unlock hoga
- Price: `STRIPE_SINGLE_SOLDIER_PRICE_ID`
- Database mein sirf "Carl" save hoga

### 2. **Get Soldiers Button** (Bundle Purchase)
- **Saare 5 soldiers** unlock honge: Carl, Paul, Olivia, Wendy, Dave
- Price: `STRIPE_SOLDIERS_BUNDLE_PRICE_ID`
- Database mein saare 5 names save honge

---

## Files Modified (تبدیل شدہ فائلیں)

### 1. `.env` File
```env
# Single Soldier Purchase (Carl only)
STRIPE_SINGLE_SOLDIER_PRICE_ID=price_1ShyLOGiBK03UQWzdzVCNtpg

# Soldiers Bundle (Carl, Paul, Olivia, Wendy, Dave - All 5)
STRIPE_SOLDIERS_BUNDLE_PRICE_ID=price_1ShzQ4GiBK03UQWzJ8Hrlcrv
```

### 2. `components/upgrade-dialog.tsx`
**Changes:**
- Two separate buttons with individual loading states
- Button 1: "Carl" - Single soldier purchase
- Button 2: "Get Soldiers" - Bundle purchase
- Different API payloads for each button

### 3. `app/api/stripe/checkout/route.ts`
**New Logic:**
```typescript
if (purchaseType === 'single') {
  priceId = STRIPE_SINGLE_SOLDIER_PRICE_ID
  unlockedAgents = 'Carl'
} else if (purchaseType === 'bundle') {
  priceId = STRIPE_SOLDIERS_BUNDLE_PRICE_ID
  unlockedAgents = 'Carl,Paul,Olivia,Wendy,Dave'
}
```

### 4. `lib/stripe.ts` - Webhook Handler
**Updated Logic:**
- Webhook ab comma-separated soldiers ko detect karta hai
- Single purchase: `['Carl']`
- Bundle purchase: `['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']`
- Existing subscriptions ko update karta hai (agar user pehle se kuch unlock kar chuka hai)

### 5. `app/api/soldiers/unlocked/route.ts` (NEW)
**Purpose:** Check karo konse soldiers unlocked hain
```typescript
GET /api/soldiers/unlocked?workspaceId=xxx
Response: {
  unlockedSoldiers: ['Carl'],
  isActive: true,
  status: 'ACTIVE'
}
```

---

## Database Schema (Already Exists)
```prisma
model BillingSubscription {
  unlockedSoldiers String[] @default([]) // Array of unlocked soldier names
  // ... other fields
}
```

---

## Testing Instructions (ٹیسٹنگ کی ہدایات)

### 1. Test Single Soldier Purchase (Carl Only)
```bash
1. Click "Carl" button
2. Complete payment on Stripe
3. Webhook should save: unlockedSoldiers = ['Carl']
4. Only Carl should be accessible
```

### 2. Test Bundle Purchase (All 5 Soldiers)
```bash
1. Click "Get Soldiers" button
2. Complete payment on Stripe
3. Webhook should save: unlockedSoldiers = ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
4. All 5 soldiers should be accessible
```

### 3. Check Unlocked Soldiers
```bash
# API call
GET http://localhost:3000/api/soldiers/unlocked?workspaceId=YOUR_WORKSPACE_ID

# Response
{
  "unlockedSoldiers": ["Carl"],
  "isActive": true,
  "status": "ACTIVE"
}
```

---

## Frontend Integration Example

### Check if soldier is unlocked:
```typescript
// In your component
const checkSoldierAccess = async (soldierName: string) => {
  const response = await fetch(`/api/soldiers/unlocked?workspaceId=${workspaceId}`)
  const data = await response.json()
  
  if (data.unlockedSoldiers.includes(soldierName)) {
    // Soldier is unlocked
    return true
  }
  return false
}

// Usage
const canAccessCarl = await checkSoldierAccess('Carl')
if (!canAccessCarl) {
  // Show upgrade dialog
}
```

---

## Important Notes (اہم نوٹس)

1. **Stripe Price IDs**: Currently using same price IDs for both. Aap Stripe dashboard se alag prices bana sakte hain:
   - Single soldier: Lower price (e.g., $9.99/month)
   - Bundle: Higher price (e.g., $29.99/month)

2. **Webhook URL**: Make sure Stripe webhook is configured:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```

3. **Test Mode**: Currently in test mode. Production mein real price IDs use karein.

4. **Multiple Purchases**: Agar user pehle Carl buy karta hai, phir bundle buy karta hai, toh dono combined ho jayenge database mein.

---

## Stripe Dashboard Setup

### Create New Price IDs:
1. Go to Stripe Dashboard → Products
2. Create "Single Soldier (Carl)" product - $9.99/month
3. Create "Soldiers Bundle" product - $29.99/month
4. Copy price IDs to `.env` file

### Webhook Events:
Make sure these events are enabled:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## Status: ✅ Implementation Complete!

Sab kuch ready hai. Ab aap test kar sakte hain! 🚀

### Next Steps:
1. ✅ Update Stripe price IDs (if needed)
2. ✅ Test single soldier purchase
3. ✅ Test bundle purchase
4. ✅ Verify webhook is working
5. ✅ Deploy to production

---

**Questions?** Let me know if you need any clarification! 😊
