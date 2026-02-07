# Frontend Payment Callback Fix - Tamil Guide

## பிரச்சினை (Problem)
Payment Cashfree-ல் success ஆகுது, ஆனா website-க்கு redirect ஆகும்போது "Payment Failed" காட்டுது.

## காரணம் (Root Cause)
உங்க **frontend code** (heydeliver.vercel.app) தான் issue. Backend API fix ஆகிடுச்சு, ஆனா frontend-ல update பண்ணல.

## என்ன செய்யனும் (What to Do)

### 1. உங்க frontend project-ல pod

உங்க heydeliver frontend code இருக்கற folder-க்கு போங்க:
```bash
cd path/to/your/heydeliver-frontend
```

### 2. Payment callback page-ஐ மாற்றுங்க

உங்க payment callback page இங்க இருக்கும்:
- Next.js: `pages/admin/wallet/payment-callback.tsx` அல்லது
- App Router: `app/admin/wallet/payment-callback/page.tsx`

அத்த file-ஐ கண்டுபிடிச்சு, கீழ இருக்கற code-ல replace பண்ணுங்க:

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // or 'next/navigation' for App Router
import axios from 'axios';

export default function PaymentCallback() {
  const router = useRouter();
  const { order_id } = router.query; // or useSearchParams() for App Router
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Payment verify பண்றோம்...');

  useEffect(() => {
    async function verifyPayment() {
      if (!order_id) {
        setStatus('failed');
        setMessage('Invalid payment link');
        return;
      }

      try {
        // Token எடுக்கிறது (உங்க app-ல எங்க store பண்ணிருக்கீங்களோ அங்க இருந்து)
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('token');

        if (!token) {
          setStatus('failed');
          setMessage('Please login and try again');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log('🔍 Verifying payment:', order_id);

        // API call - இப்போ paymentId வேணாம், orderId மட்டும் போதும்!
        const response = await axios.post(
          'https://freightrekapi.vercel.app/api/wallet/verify-payment',
          {
            orderId: order_id, // paymentId வேணாம்!
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ Response:', response.data);

        if (response.data.success && response.data.status === 'SUCCESS') {
          setStatus('success');
          setMessage(`Payment success! ₹${response.data.amount} added. New balance: ₹${response.data.newBalance}`);
          
          // 3 seconds-க்கு பிறகு wallet page-க்கு redirect
          setTimeout(() => {
            router.push('/admin/wallet/add');
          }, 3000);
        } else {
          setStatus('failed');
          setMessage(response.data.message || 'Payment verification failed');
        }
        
      } catch (error: any) {
        console.error('❌ Error:', error);
        setStatus('failed');
        setMessage(error.response?.data?.message || 'Payment verification failed');
      }
    }

    verifyPayment();
  }, [order_id, router]);

  return (
    <div className="payment-callback">
      {status === 'loading' && (
        <>
          <div className="spinner"></div>
          <h2>Payment Verify பண்றோம்...</h2>
          <p>கொஞ்சம் wait பண்ணுங்க</p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <div className="success-icon">✓</div>
          <h2>Payment Success! 🎉</h2>
          <p>{message}</p>
        </>
      )}
      
      {status === 'failed' && (
        <>
          <div className="error-icon">✗</div>
          <h2>Payment Failed</h2>
          <p>{message}</p>
          <button onClick={() => router.push('/admin/wallet/add')}>
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
```

### 3. முக்கியமான Changes

**பழைய code (தப்பு):**
```typescript
// ❌ இது தப்பு - paymentId கிடைக்காது!
const response = await axios.post('/api/wallet/verify-payment', {
  orderId: order_id,
  paymentId: payment_id, // payment_id URL-ல வராது!
});
```

**புதிய code (சரி):**
```typescript
// ✅ இது சரி - orderId மட்டும் போதும்!
const response = await axios.post(
  'https://freightrekapi.vercel.app/api/wallet/verify-payment',
  {
    orderId: order_id, // paymentId வேண்டாம்!
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`, // Token-ஐ மறக்காதீங்க!
    }
  }
);
```

### 4. Deploy பண்ணுங்க

Frontend changes செஞ்சதும், deploy பண்ணுங்க:

```bash
# Git commit பண்ணுங்க
git add .
git commit -m "Fix payment callback - remove paymentId requirement"
git push

# Vercel auto deploy ஆகும், அல்லது manual-ஆ:
vercel --prod
```

### 5. Test பண்ணுங்க

1. **Wallet page போங்க**: https://heydeliver.vercel.app/admin/wallet/add
2. **Money add பண்ணுங்க**: ₹100
3. **Cashfree-ல payment complete பண்ணுங்க**
4. **இப்போ work ஆகனும்**: ✅ Success காட்டனும், balance update ஆகனும்

## எங்க token store பண்ணிருக்கீங்க?

உங்க app-ல token எங்க இருக்கோ அங்க இருந்து எடுங்க:

```typescript
// Option 1: localStorage
const token = localStorage.getItem('authToken');

// Option 2: sessionStorage
const token = sessionStorage.getItem('authToken');

// Option 3: Cookies
import Cookies from 'js-cookie';
const token = Cookies.get('token');

// Option 4: Redux/Context
const token = useSelector(state => state.auth.token);
```

## இன்னும் work ஆகலைனா (Still Not Working?)

### Check பண்ண வேண்டியவை:

1. **Console-ஐ பாருங்க** (Browser DevTools → Console):
   - Errors இருக்கா?
   - API call போகுதா?
   - Response என்ன வருது?

2. **Network tab பாருங்க** (DevTools → Network):
   - `/api/wallet/verify-payment` call போகுதா?
   - Status code என்ன? (200 = Success, 401 = No token, 400 = Error)
   - Response data என்ன?

3. **Token check பண்ணுங்க**:
   ```javascript
   console.log('Token:', localStorage.getItem('authToken'));
   ```
   - Token இருக்கா?
   - Valid-ஆ இருக்கா?

4. **API URL check பண்ணுங்க**:
   ```typescript
   // ✅ Full URL use பண்ணுங்க
   'https://freightrekapi.vercel.app/api/wallet/verify-payment'
   
   // ❌ Relative path use பண்ணாதீங்க (unless proxy configured)
   '/api/wallet/verify-payment'
   ```

## Common Errors & Solutions

### Error 1: "User not authenticated"
**Problem**: Token missing or invalid
**Solution**: 
```typescript
const token = localStorage.getItem('authToken');
console.log('Token:', token ? 'Found' : 'Missing');
```

### Error 2: "Order not found"
**Problem**: Wrong order_id
**Solution**: 
```typescript
console.log('Order ID:', order_id);
// Check URL has the correct order_id parameter
```

### Error 3: CORS Error
**Problem**: API URL wrong
**Solution**: Use full URL:
```typescript
'https://freightrekapi.vercel.app/api/wallet/verify-payment'
```

## Help வேணுமா?

1. Browser console-ல உள்ள errors-ஐ screenshot எடுத்து அனுப்புங்க
2. Network tab-ல verify-payment request-ஐ screenshot எடுத்து அனுப்புங்க
3. உங்க payment callback code-ஐ share பண்ணுங்க

---

**NOTE**: Backend fix ஆகிடுச்சு ✅. Frontend மட்டும் update பண்ணா போதும்!
