# 🚨 Payment Not Working - Quick Fix

## Problem
Payment link se payment kar di lekin:
- ❌ Database update nahi hua
- ❌ Website open nahi hui
- ❌ Soldiers unlock nahi hue

## Root Cause
**Stripe webhook listener nahi chal raha!**

Jab aap payment karte ho:
1. Stripe payment process karta hai ✅
2. Stripe webhook event bhejta hai 📡
3. **Webhook listener nahi chal raha** ❌
4. Event receive nahi hota ❌
5. Database update nahi hota ❌
6. Website access nahi milti ❌

---

## ✅ COMPLETE FIX (2 Steps)

### Step 1: Start Webhook Listener (NEW TERMINAL)

```powershell
# Run ye command ek NEW terminal window mein:
.\start-webhook-fix.ps1
```

**Ya manual:**
```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Output dikhai dega:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**⚠️ IMPORTANT:** 
- Yeh terminal window **OPEN rakhna hai**
- Jab tak yeh chal raha hai, payments work karengi
- Close kiya to phir se payments fail hongi

---

### Step 2: Start Dev Server (IF NOT RUNNING)

```powershell
# Ek aur NEW terminal mein:
npm run dev
```

---

## 🧪 Test Payment Again

### 1. Browser mein jao:
```
http://localhost:3000/pricing
```

### 2. Payment karo test card se:
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### 3. Terminal dekho (webhook listener wala):
```
🔔 Received event: checkout.session.completed
💳 Processing payment...
✅ Subscription created
✅ Soldiers unlocked
```

### 4. Check database:
```powershell
node check-all-users-quick.js
```

**Ab dikhai dega:**
```
✅ Found 1 user(s):

1. your-email@example.com
   Status: active
   Plan: yearly
   Stripe Customer: cus_xxxxx
```

---

## 🎯 Expected Flow After Fix

```
User payment karta hai
    ↓
Stripe webhook listener event receive karta hai ✅
    ↓
Database mein subscription create hoti hai ✅
    ↓
User ka subscriptionStatus = 'active' ✅
    ↓
Website/soldiers unlock ho jaate hain ✅
```

---

## 🔍 Troubleshooting

### Issue: "Stripe CLI not found"
```powershell
# Install manually:
# Download from: https://stripe.com/docs/stripe-cli
# Or use script above
```

### Issue: "Webhook listener stops"
```powershell
# Terminal close ho gaya hoga
# Phir se start karo:
.\start-webhook-fix.ps1
```

### Issue: "Event not receiving"
```powershell
# Check:
1. Webhook listener chal raha hai? (terminal check karo)
2. Dev server chal raha hai? (npm run dev)
3. Port 3000 available hai?
```

---

## 📋 Quick Checklist

Before testing payment:
- [ ] Webhook listener running (stripe listen...)
- [ ] Dev server running (npm run dev)
- [ ] Both terminals OPEN hain
- [ ] Port 3000 accessible hai

After payment:
- [ ] Webhook terminal mein event dikha?
- [ ] Database mein user status 'active'?
- [ ] Website pe login karke access mil raha?

---

## 💡 Pro Tip

**2 terminals always open rakho:**

**Terminal 1 - Dev Server:**
```powershell
npm run dev
```

**Terminal 2 - Webhook Listener:**
```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Jab tak develop kar rahe ho, dono terminals open rakho!

---

## ✅ Success!

Agar sab kuch sahi chal raha hai to:
- ✅ Payment complete hogi
- ✅ Webhook event receive hoga
- ✅ Database update hoga
- ✅ Website unlock hogi
- ✅ Soldiers accessible honge

Ab test karo! 🚀
