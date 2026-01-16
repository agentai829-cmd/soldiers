# 🚨 PAYMENT HO GAYI BUT SOLDIERS UNLOCK NAHI HO RAHE?

## Quick Fix (Manual Unlock)

Agar aapne payment kar di hai but soldiers unlock nahi ho rahe, toh ye command chalao:

### For Soldiers X (All 5 Soldiers)
```bash
node manual-unlock-after-payment.js YOUR_WORKSPACE_ID bundle
```

### For Single Soldier
```bash
node manual-unlock-after-payment.js YOUR_WORKSPACE_ID single SoldierName
```

### Example:
```bash
node manual-unlock-after-payment.js cmhzel1tv0002s8nr095fb8jq bundle
```

---

## Why is this happening?

Stripe webhooks ko local development mein test karne ke liye **Stripe CLI** ki zaroorat hai. Production mein ye automatically kaam karega.

## Long-term Solution (Stripe CLI Setup)

### 1. Install Stripe CLI

**Windows:**
```powershell
# Download from: https://github.com/stripe/stripe-cli/releases/latest
# Or use Scoop:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

### 2. Login
```bash
stripe login
```

### 3. Start Webhook Listener
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Ye command output mein ek webhook secret dega (whsec_...). Isko copy karo.

### 4. Update .env
```
STRIPE_WEBHOOK_SECRET=whsec_your_new_secret_from_step_3
```

### 5. Restart Dev Server
```bash
npm run dev
```

Ab payment karne se automatically soldiers unlock ho jayenge! 🎉

---

## Testing Without Real Payment

Testing ke liye bina payment kiye soldiers unlock karna ho toh:

```bash
# Bundle (All 5 soldiers)
node test-unlock-bundle.js

# OR with specific workspace
node test-webhook-simulation.js YOUR_WORKSPACE_ID bundle
```

---

## Get Your Workspace ID

Browser mein workspace page kholo, URL dekho:
```
http://localhost:3000/workspace/cmhzel1tv0002s8nr095fb8jq
                                  ^^^^^^^^^^^^^^^^^^^^^^^^
                                  This is your workspace ID
```

---

## Need Help?

1. Check terminal logs for errors
2. Check Stripe Dashboard: https://dashboard.stripe.com/test/payments
3. Run manual unlock script (fastest solution)

