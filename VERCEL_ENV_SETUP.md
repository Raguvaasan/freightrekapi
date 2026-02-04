# 🔧 Vercel Environment Variables Setup Guide

## ⚡ Quick Setup (5 நிமிடம்)

### Step 1: Vercel Dashboard Open பண்ணுங்க
```
https://vercel.com/dashboard
```

### Step 2: Project Select பண்ணுங்க
1. Dashboard-ல **freightrekapi** project-ஐ கண்டுபிடியுங்க
2. அதை click செய்யுங்க

### Step 3: Settings → Environment Variables
1. Top-ல **Settings** tab click செய்யுங்க
2. Left sidebar-ல **Environment Variables** click செய்யுங்க

### Step 4: இந்த 3 Variables-ஐ Add பண்ணுங்க

#### Variable 1: CASHFREE_CLIENT_ID
```
Name: CASHFREE_CLIENT_ID
Value: TEST108720629f172329f064a997a5da26027801
Environment: ✅ Production ✅ Preview ✅ Development
```
**Add Variable** button click செய்யுங்க

#### Variable 2: CASHFREE_CLIENT_SECRET
```
Name: CASHFREE_CLIENT_SECRET
Value: cfsk_ma_test_df28d4f268eaf1f8b065f1ce553de5c3_4b5d9985
Environment: ✅ Production ✅ Preview ✅ Development
```
**Add Variable** button click செய்யுங்க

#### Variable 3: CASHFREE_API_URL
```
Name: CASHFREE_API_URL
Value: https://sandbox.cashfree.com/pg
Environment: ✅ Production ✅ Preview ✅ Development
```
**Add Variable** button click செய்யுங்க

### Step 5: Verify Existing Variables (Already இருக்கா check பண்ணுங்க)

இந்த variables already இருக்கணும்:
- ✅ `MONGO_URI`
- ✅ `JWT_SECRET`
- ✅ `JWT_EXPIRES_IN`
- ✅ `BACKEND_URL` (value: `https://freightrekapi.vercel.app`)

இல்லனா add பண்ணுங்க!

### Step 6: Redeploy Your App

Environment variables add பண்ணின பிறகு **அவசியம் redeploy பண்ணணும்**:

#### Option A: Git Commit Push (Recommended)
```powershell
# Empty commit to trigger redeploy
git commit --allow-empty -m "Add Cashfree environment variables"
git push origin main
```

#### Option B: Manual Redeploy from Dashboard
1. Vercel Dashboard-ல **Deployments** tab click செய்யுங்க
2. Latest deployment-ல **... (three dots)** click செய்யுங்க
3. **Redeploy** select பண்ணுங்க
4. **Redeploy** button click செய்யுங்க

---

## ✅ Verification (2-3 minutes பிறகு)

Deployment முடிஞ்ச பிறகு இந்த command run பண்ணி test பண்ணுங்க:

```powershell
# PowerShell
$headers = @{
    Authorization='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5N2NjZmY4YzEzYzUyMWIyOGY3NjM1NCIsImlhdCI6MTc3MDIxODk1MCwiZXhwIjoxNzcwODIzNzUwfQ.ieinkwjdJ__zFw4pIpSATQFURZqLa7eSExT1JKMiQTw'
    'Content-Type'='application/json'
}
$body = @{amount=500; paymentMethod='upi'} | ConvertTo-Json
Invoke-RestMethod -Uri 'https://freightrekapi.vercel.app/api/wallet/create-payment-order' -Method POST -Headers $headers -Body $body
```

### Expected Success Response:
```json
{
  "success": true,
  "orderId": "ORDER_697ccff8c13c521b28f76354_1738613000000",
  "sessionId": "session_abc123xyz456",
  "amount": 500,
  "currency": "INR"
}
```

---

## 📸 Screenshot Reference

### Environment Variables Page இப்படி இருக்கும்:

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Add New] ← இதை click பண்ணுங்க                       │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Name:  [________________________]              │   │
│  │ Value: [________________________]              │   │
│  │ Environments:                                  │   │
│  │  ☑ Production  ☑ Preview  ☑ Development      │   │
│  │              [Add Variable]                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Existing Variables:                                    │
│  • MONGO_URI          [Edit] [Remove]                  │
│  • JWT_SECRET         [Edit] [Remove]                  │
│  • CASHFREE_CLIENT_ID [Edit] [Remove] ← Add பண்ணியது   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

### Problem: API still returning "Failed to create payment order"
**Solution:**
1. Vercel Dashboard-ல deployment status check பண்ணுங்க
2. **Settings → Environment Variables** போய் மறுபடியும் verify பண்ணுங்க
3. Manual-ஆ redeploy பண்ணுங்க
4. 2-3 minutes wait பண்ணுங்க

### Problem: Variable add ஆகல
**Solution:**
1. Browser refresh பண்ணுங்க
2. Logout → Login பண்ணி மறுபடியும் try பண்ணுங்க
3. அல்லது Vercel CLI use பண்ணுங்க (கீழே பாருங்க)

---

## 🖥️ Alternative: Vercel CLI Method (Advanced)

### Install Vercel CLI
```powershell
npm install -g vercel
```

### Login to Vercel
```powershell
vercel login
```

### Add Environment Variables via CLI
```powershell
cd g:\freightrekapi\freightrekapi

# Add CASHFREE_CLIENT_ID
vercel env add CASHFREE_CLIENT_ID production
# Paste: TEST108720629f172329f064a997a5da26027801

# Add CASHFREE_CLIENT_SECRET
vercel env add CASHFREE_CLIENT_SECRET production
# Paste: cfsk_ma_test_df28d4f268eaf1f8b065f1ce553de5c3_4b5d9985

# Add CASHFREE_API_URL
vercel env add CASHFREE_API_URL production
# Paste: https://sandbox.cashfree.com/pg
```

### Redeploy
```powershell
vercel --prod
```

---

## 📋 Checklist

Environment Variables Setup:
- [ ] Vercel Dashboard-ல login பண்ணினேன்
- [ ] freightrekapi project open பண்ணினேன்
- [ ] Settings → Environment Variables போனேன்
- [ ] CASHFREE_CLIENT_ID add பண்ணினேன்
- [ ] CASHFREE_CLIENT_SECRET add பண்ணினேன்
- [ ] CASHFREE_API_URL add பண்ணினேன்
- [ ] எல்லா variables-க்கும் Production, Preview, Development select பண்ணினேன்
- [ ] Redeploy trigger பண்ணினேன்
- [ ] 2-3 minutes wait பண்ணினேன்
- [ ] API test பண்ணினேன் - ✅ Success!

---

## 📞 Support

Setup-ல ஏதாவது problem-னா:
1. இந்த guide-ஐ மறுபடியும் படிச்சு follow பண்ணுங்க
2. Screenshot எடுத்து error-ஐ share பண்ணுங்க
3. Vercel deployment logs check பண்ணுங்க

**Status:** Setup Complete! 🎉
