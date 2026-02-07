# 🔍 Cashfree Integration Debugging Guide

## ✅ Backend Status: WORKING

**Confirmed Working:**
- Cashfree API credentials are valid ✅
- Order creation successful (HTTP 200) ✅  
- Valid session IDs being generated ✅

Example successful response:
```
Session ID: session_IEVZ_GorzEpYB05yZ9VMKT7LGtcmBTS1fG71Ml1qK9YLNoWmGvk...
Order ID: ORDER_694fa71b2d0fb1bb000b078f_1770345920229
Status: 200 OK
```

---

## ❌ Issue: Frontend Integration

Since backend is working, the "invalid sessionId" error is happening on **frontend**. Check:

### 1. **Environment Mismatch**

**Backend:**
```bash
CASHFREE_API_URL=https://api.cashfree.com/pg  # PRODUCTION mode
```

**Frontend must match:**
```javascript
// ❌ WRONG - Sandbox mode
const cashfree = new Cashfree({
  mode: 'sandbox'  // Don't use sandbox with production credentials!
});

// ✅ CORRECT - Production mode
const cashfree = new Cashfree({
  mode: 'production'  // Match backend environment
});
```

### 2. **Session ID Passing**

Check if sessionId is being correctly passed:

```javascript
// Get sessionId from backend
const response = await axios.post('/api/wallet/create-payment-order', {
  amount: 100,
  paymentMethod: 'upi'
});

const sessionId = response.data.sessionId;

// ✅ Verify it's not undefined
console.log('Session ID:', sessionId);

// ✅ Pass to Cashfree
const checkoutOptions = {
  paymentSessionId: sessionId,  // Correct property name
  redirectTarget: '_modal'
};

cashfree.checkout(checkoutOptions);
```

### 3. **Cashfree SDK Version**

**Check installed version:**
```bash
npm list @cashfreepayments/cashfree-js
```

**Recommended:** Use latest version
```bash
npm install @cashfreepayments/cashfree-js@latest
```

### 4. **Common Frontend Mistakes**

#### ❌ Wrong Property Name
```javascript
const checkoutOptions = {
  sessionId: sessionId  // WRONG!
};
```

#### ✅ Correct Property Name  
```javascript
const checkoutOptions = {
  paymentSessionId: sessionId  // CORRECT!
};
```

#### ❌ Mode Mismatch
```javascript
// Backend uses production, frontend uses sandbox
const cashfree = new Cashfree({ mode: 'sandbox' });  // WRONG!
```

#### ✅ Environment Match
```javascript
// Both use production
const cashfree = new Cashfree({ mode: 'production' });  // CORRECT!
```

---

## 🧪 Testing Backend API

Run this to test backend:

```javascript
const axios = require('axios');

async function testBackend() {
  // Login
  const login = await axios.post('http://localhost:3000/admin/auth/login', {
    email: 'admin@freightrek.com',
    password: 'Admin@123'
  });
  
  const token = login.data.token;
  
  // Create order
  const order = await axios.post(
    'http://localhost:3000/api/wallet/create-payment-order',
    {
      amount: 100,
      paymentMethod: 'upi'
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  console.log('✅ Backend Response:', order.data);
  console.log('Session ID:', order.data.sessionId);
  console.log('Session ID Length:', order.data.sessionId.length);
  
  // Session ID should be ~150-200 characters
  if (order.data.sessionId.length > 100) {
    console.log('✅ Session ID looks valid!');
  } else {
    console.log('❌ Session ID too short!');
  }
}

testBackend();
```

---

## 📋 Frontend Checklist

**Before contacting Cashfree support, verify:**

- [ ] Cashfree SDK initialized with correct mode (`production` not `sandbox`)
- [ ] Session ID received from backend (not undefined)
- [ ] Session ID passed as `paymentSessionId` (not `sessionId`)
- [ ] Using latest Cashfree JS SDK version
- [ ] No typos in property names
- [ ] Backend URL pointing to correct server
- [ ] CORS enabled on backend for frontend domain

---

## 🔧 Frontend Example (Correct Implementation)

```javascript
import { Cashfree } from '@cashfreepayments/cashfree-js';

// Initialize Cashfree
const cashfree = new Cashfree({
  mode: 'production'  // Match backend environment
});

async function handlePayment() {
  try {
    // 1. Create order on backend
    const response = await axios.post('/api/wallet/create-payment-order', {
      amount: 100,
      paymentMethod: 'upi'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Backend response:', response.data);
    
    const sessionId = response.data.sessionId;
    
    // 2. Verify session ID exists
    if (!sessionId) {
      throw new Error('No session ID received from backend');
    }
    
    console.log('Session ID received:', sessionId.substring(0, 30) + '...');
    
    // 3. Open Cashfree checkout
    const checkoutOptions = {
      paymentSessionId: sessionId,  // Correct property name
      redirectTarget: '_modal',
      onSuccess: (data) => {
        console.log('Payment successful:', data);
        // Verify payment on backend
        verifyPayment(data.orderId, data.paymentId);
      },
      onFailure: (error) => {
        console.error('Payment failed:', error);
      }
    };
    
    // 4. Start checkout
    await cashfree.checkout(checkoutOptions);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

async function verifyPayment(orderId, paymentId) {
  const response = await axios.post('/api/wallet/verify-payment', {
    orderId,
    paymentId
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Verification result:', response.data);
}
```

---

## 🚨 If Still Not Working

**Enable Debug Mode:**

```javascript
const cashfree = new Cashfree({
  mode: 'production',
  debug: true  // Enable debug logs
});
```

**Check Browser Console:**
- Look for Cashfree error messages
- Check Network tab for failed requests
- Verify sessionId value in Network payload

**Contact Cashfree Support with:**
1. Session ID that's failing
2. Order ID
3. Exact error message from browser console
4. Screenshots of Network tab
5. Cashfree environment (production/sandbox)

---

## 📞 Support Info

**Backend is working fine!** The issue is on frontend integration.

**Need Help?**
- Backend logs show successful Cashfree API calls
- Valid session IDs are being generated
- Check frontend Cashfree SDK integration
- Verify environment mode matches (production vs sandbox)
