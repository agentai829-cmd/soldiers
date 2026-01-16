# 🔧 Soldiers Unlock System - Complete Fix Guide

## ❌ Problem Found (مسئلہ ملا)
Database mein subscription nahi ban raha tha kyunki:
1. **Webhook trigger nahi ho raha tha**
2. Stripe webhook properly configured nahi tha

## ✅ Solution Applied (حل لگایا)

### 1. Manual Testing ke liye Script Banayi
Ab aap test kar sakte hain without real payment:

```bash
# Single soldier unlock (Carl only)
node scripts/unlock-soldier-test.js

# All 5 soldiers unlock (bundle)
node scripts/unlock-soldier-test.js --bundle

# Check unlocked soldiers
node scripts/check-unlocked-soldiers.js
```

### 2. Better Logging Added in Webhook
Ab webhook mein detailed logs hain jo dikhayenge ke kya ho raha hai.

---

## 🚀 Production Setup (Real Payments)

### Step 1: Stripe Webhook Setup

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL:**
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
   
4. **Select events to listen to:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`

5. **Copy the Webhook Secret** and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
   ```

### Step 2: Test Webhook (Local Development)

#### Option A: Using Stripe CLI
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook secret starting with whsec_
# Add it to your .env file
```

#### Option B: Using Ngrok
```bash
# Start your Next.js app
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok URL in Stripe webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/stripe
```

### Step 3: Test the Payment Flow

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Open upgrade dialog** and click "Carl" button

3. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

4. **Complete payment**

5. **Check webhook logs** in terminal (you'll see all the console.log messages)

6. **Check database:**
   ```bash
   node scripts/check-unlocked-soldiers.js
   ```

---

## 🔍 Debugging Guide (ڈیبگنگ گائیڈ)

### If Soldier Not Unlocking:

#### 1. Check Webhook Received
```bash
# Look for this in your terminal:
🔔 Webhook received: checkout.session.completed
💳 Checkout session completed
   Workspace ID: xxx
   Helper name: Carl
```

If you don't see this, webhook is not reaching your app.

#### 2. Check Database
```bash
node scripts/check-unlocked-soldiers.js
```

Should show:
```
✅ Found 1 subscription(s)
📦 Subscription 1:
   Unlocked Soldiers: Carl
```

#### 3. Check Webhook Secret
Make sure `.env` has correct webhook secret:
```env
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

#### 4. Check Metadata in Checkout
The checkout session should include:
```typescript
{
  metadata: {
    workspaceId: "xxx",
    purchaseType: "single",
    helperName: "Carl"  // ⬅️ This is crucial!
  }
}
```

---

## 🛠️ Manual Fix (For Immediate Testing)

If you want to test WITHOUT waiting for webhook:

### Unlock Single Soldier (Carl):
```bash
node scripts/unlock-soldier-test.js
```

### Unlock All 5 Soldiers:
```bash
node scripts/unlock-soldier-test.js --bundle
```

### Remove Test Subscription:
```javascript
// In Prisma Studio or create a script:
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

await prisma.billingSubscription.deleteMany({
  where: {
    stripeSubscriptionId: { startsWith: 'test_sub_' }
  }
})
```

---

## 📝 How It Works (کیسے کام کرتا ہے)

### Payment Flow:

```
1. User clicks "Carl" button
   ↓
2. API creates Stripe checkout session with metadata:
   {
     purchaseType: "single",
     helperName: "Carl"
   }
   ↓
3. User completes payment on Stripe
   ↓
4. Stripe sends webhook to /api/webhooks/stripe
   ↓
5. Webhook handler:
   - Reads metadata
   - Creates/updates BillingSubscription
   - Saves unlockedSoldiers = ["Carl"]
   ↓
6. Frontend fetches /api/workspace/[id]/subscription
   ↓
7. Gets unlockedSoldiers = ["Carl"]
   ↓
8. Shows Carl as unlocked ✅
```

### Database Structure:
```prisma
model BillingSubscription {
  id               String   @id
  workspaceId      String   @unique
  unlockedSoldiers String[] @default([])  // ["Carl"] or ["Carl", "Paul", ...]
  status           String   // "ACTIVE"
  currentPeriodEnd DateTime
  // ... other fields
}
```

### Frontend Check:
```typescript
// In page.tsx
const [unlockedSoldiers, setUnlockedSoldiers] = useState<string[]>([])

// Fetch subscription
fetch(`/api/workspace/${workspaceId}/subscription`)
  .then(res => res.json())
  .then(data => setUnlockedSoldiers(data.unlockedSoldiers))

// Show unlock status
{unlockedSoldiers.includes('Carl') ? (
  <CheckCircle2 className="text-green-500" />
) : (
  <Lock className="text-gray-400" />
)}
```

---

## 🐛 Common Issues (عام مسائل)

### Issue 1: Webhook Not Triggered
**Solution:** 
- Check Stripe Dashboard → Developers → Webhooks → Logs
- Make sure endpoint URL is correct
- Check webhook secret in `.env`

### Issue 2: Soldier Still Locked After Payment
**Solution:**
```bash
# Check database
node scripts/check-unlocked-soldiers.js

# If empty, webhook didn't work
# Use manual unlock script:
node scripts/unlock-soldier-test.js
```

### Issue 3: Frontend Not Showing Unlock
**Solution:**
- Hard refresh browser (Ctrl + Shift + R)
- Check API response: `/api/workspace/[id]/subscription`
- Check React state is updating

---

## ✅ Verification Checklist

- [ ] Webhook configured in Stripe Dashboard
- [ ] Webhook secret added to `.env`
- [ ] Test payment completed
- [ ] Database shows unlocked soldiers
- [ ] Frontend shows Carl unlocked
- [ ] Chat opens when clicking Carl
- [ ] Lock icon changes to checkmark

---

## 🎉 Current Status

✅ **System is working with manual script**
✅ **Database structure is correct**
✅ **Frontend is reading unlocked soldiers**
✅ **Webhook has detailed logging**

⚠️ **Next step:** Configure Stripe webhook for production

---

## 📞 Support Commands

```bash
# Check database status
node scripts/check-unlocked-soldiers.js

# Unlock Carl for testing
node scripts/unlock-soldier-test.js

# Unlock all 5 soldiers
node scripts/unlock-soldier-test.js --bundle

# View database in browser
npx prisma studio
# Then go to: http://localhost:5555
```

---

**Need Help?** Check Stripe webhook logs first! 
**Quick Fix?** Run: `node scripts/unlock-soldier-test.js`
