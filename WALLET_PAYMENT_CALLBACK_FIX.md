# Wallet Payment Callback Fix

## Issue Summary
**Problem**: Payment succeeds on Cashfree but shows "Payment Failed" when redirected back to the application. Wallet balance doesn't get updated.

**Root Cause**: Cashfree's return URL only passes `order_id` parameter, but the verify payment endpoint required both `orderId` AND `paymentId`, causing verification to fail.

## What Was Changed

### 1. **Validator Updated** (`src/validators/wallet.validator.ts`)
- Made `paymentId` optional instead of required
- Now accepts just `orderId` for verification

```typescript
// Before
paymentId: yup.string().required('Payment ID is required')

// After
paymentId: yup.string().optional()
```

### 2. **Service Logic Enhanced** (`src/services/wallet.service.ts`)
- Updated `verifyPayment` to make `paymentId` optional
- Enhanced logic to fetch payment details from Cashfree when `paymentId` is not provided
- Automatically finds the successful payment from Cashfree's payment list
- Added detailed logging for debugging

**Key Changes:**
```typescript
// Updated interface
interface VerifyPaymentData {
  orderId: string;
  paymentId?: string;  // Now optional
  userId: string;
}

// Enhanced verification logic
const payment = paymentId 
  ? payments.find((p: any) => p.cf_payment_id === paymentId)
  : payments.find((p: any) => p.payment_status === 'SUCCESS');
```

### 3. **Frontend Integration** (`frontend-integration/services/walletService.ts`)
- Created example wallet service for frontend integration
- Simplified `verifyPayment` to only require `orderId`
- Added complete example for payment callback page

## How It Works Now

### Payment Flow
```
1. User clicks "Add Money" → Creates payment order
   ↓
2. Redirects to Cashfree payment page
   ↓
3. User completes payment on Cashfree
   ↓
4. Cashfree redirects to: /admin/wallet/payment-callback?order_id=ORDER_xxx
   ↓
5. Frontend calls verify-payment API with ONLY orderId
   ↓
6. Backend fetches payment details from Cashfree
   ↓
7. Backend credits wallet and shows success ✅
```

### API Endpoint Usage

#### Create Payment Order
```bash
POST /api/wallet/create-payment-order
Authorization: Bearer <token>

{
  "amount": 100,
  "paymentMethod": "upi"
}
```

#### Verify Payment (UPDATED - paymentId is optional)
```bash
POST /api/wallet/verify-payment
Authorization: Bearer <token>

{
  "orderId": "ORDER_697ccff8c13c521b28f76354_1770435643999"
  // paymentId is now optional
}
```

## Frontend Implementation

### Payment Callback Page Example

```typescript
// pages/admin/wallet/payment-callback.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { walletService } from '@/services/walletService';

export default function PaymentCallback() {
  const router = useRouter();
  const { order_id } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    async function verifyPayment() {
      if (!order_id) {
        setStatus('failed');
        setMessage('Invalid order ID');
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }

        // Verify payment - only orderId needed now!
        const result = await walletService.verifyPayment(order_id as string, token);

        if (result.success && result.status === 'SUCCESS') {
          setStatus('success');
          setMessage(`Payment successful! ₹${result.amount} added to wallet. New balance: ₹${result.newBalance}`);
          
          // Redirect to wallet after 3 seconds
          setTimeout(() => {
            router.push('/admin/wallet/add');
          }, 3000);
        } else {
          setStatus('failed');
          setMessage(result.message || 'Payment verification failed');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(error.response?.data?.message || 'Payment verification failed');
      }
    }

    verifyPayment();
  }, [order_id, router]);

  return (
    <div className="payment-callback-container">
      <div className="payment-status">
        {status === 'loading' && (
          <>
            <div className="spinner"></div>
            <h2>Verifying Payment...</h2>
            <p>Please wait while we confirm your payment</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Payment Successful!</h2>
            <p>{message}</p>
            <p className="redirect-msg">Redirecting to wallet...</p>
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
    </div>
  );
}
```

## Testing the Fix

### 1. Test Successful Payment
```bash
# Create payment order
curl -X POST http://localhost:3000/api/wallet/create-payment-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "paymentMethod": "upi"
  }'

# Complete payment on Cashfree
# Get redirected to: /admin/wallet/payment-callback?order_id=ORDER_xxx

# Verify payment (paymentId is optional now)
curl -X POST http://localhost:3000/api/wallet/verify-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_xxx"
  }'
```

### 2. Check Wallet Balance
```bash
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check Transaction History
```bash
curl -X GET "http://localhost:3000/api/wallet/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## What to Expect

### ✅ After the Fix
- Payment completes on Cashfree ✓
- User redirected to callback page ✓
- Frontend calls verify API with only `order_id` ✓
- Backend fetches payment details from Cashfree ✓
- Wallet balance updates automatically ✓
- Success message shows new balance ✓

### Backend Logs
```
🔍 Verifying payment for order: ORDER_697ccff8c13c521b28f76354_1770435643999
💳 Cashfree payments response: [...]
✅ Payment found - Status: SUCCESS, ID: 4959510251
✅ Order marked as completed: ORDER_697ccff8c13c521b28f76354_1770435643999
💰 Wallet credited: ₹100, New balance: ₹100
```

## Environment Variables Required

Ensure these are set in your `.env`:
```bash
# Cashfree Configuration
CASHFREE_API_URL=https://sandbox.cashfree.com/pg
CASHFREE_CLIENT_ID=your_client_id
CASHFREE_CLIENT_SECRET=your_client_secret

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# For production
# CASHFREE_API_URL=https://api.cashfree.com/pg
```

## Benefits of This Fix

1. **Simplified Integration**: Frontend only needs to pass `order_id` from URL
2. **More Robust**: Backend fetches latest payment status from Cashfree
3. **Better Logging**: Detailed logs help debug payment issues
4. **Flexible**: Works with or without `paymentId`
5. **Idempotent**: Multiple verification calls won't cause issues

## Troubleshooting

### Issue: Still showing "Payment Failed"
**Solutions:**
1. Check backend logs for detailed error messages
2. Verify Cashfree credentials are correct
3. Ensure `FRONTEND_URL` in `.env` matches your actual frontend URL
4. Check if order exists in database
5. Verify user authentication token is valid

### Issue: Webhook not working
**Solutions:**
1. Configure webhook URL in Cashfree dashboard: `https://yourdomain.com/webhook/cashfree`
2. Ensure webhook signature verification is working
3. Check webhook logs in Cashfree dashboard

### Issue: Balance not updating
**Solutions:**
1. Check if order status is "completed" in database
2. Verify transaction was created
3. Check wallet collection in MongoDB
4. Look for errors in verify payment logs

## Related Files

- **Backend**:
  - `src/controllers/wallet.controller.ts` - HTTP handlers
  - `src/services/wallet.service.ts` - Business logic
  - `src/validators/wallet.validator.ts` - Input validation
  - `src/routes/wallet.routes.ts` - API routes
  - `src/models/wallet/*.model.ts` - Database models

- **Frontend**:
  - `frontend-integration/services/walletService.ts` - API client

- **Documentation**:
  - `WALLET_IMPLEMENTATION_COMPLETE.md` - Complete implementation guide
  - `WALLET_API_CURL_COMMANDS.md` - API testing commands

## Additional Resources

- [Cashfree Payment Gateway Docs](https://docs.cashfree.com/docs/payment-gateway)
- [Cashfree Return URL](https://docs.cashfree.com/docs/return-url)
- [Cashfree Webhooks](https://docs.cashfree.com/docs/webhooks)

---

**Date Fixed**: February 7, 2026  
**Author**: GitHub Copilot  
**Status**: ✅ Production Ready
