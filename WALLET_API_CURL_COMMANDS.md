# 💰 Wallet API - cURL Commands (Production)

## 🌐 Production URL
```
BASE_URL=https://freightrekapi.vercel.app
```

**Live Production URL is ready to use!**

---

## 1️⃣ Get Wallet Balance

```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/balance' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Response:**
```json
{
  "success": true,
  "balance": 1500.00,
  "currency": "INR"
}
```

---

## 2️⃣ Create Payment Order

```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/create-payment-order' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "amount": 500,
  "paymentMethod": "upi"
}'
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORDER_USER123_1738568400000",
  "sessionId": "session_abc123xyz",
  "amount": 500,
  "currency": "INR"
}
```

**Payment Methods:**
- `upi` - UPI Payment
- `card` - Credit/Debit Card
- `netbanking` - Net Banking
- `wallet` - Digital Wallets

---

## 3️⃣ Verify Payment

```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/verify-payment' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "orderId": "ORDER_USER123_1738568400000",
  "paymentId": "payment_abc123"
}'
```

**Response:**
```json
{
  "success": true,
  "status": "SUCCESS",
  "amount": 500,
  "newBalance": 1500.00
}
```

---

## 4️⃣ Get Transaction History

### All Transactions
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/transactions?page=1&limit=20' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Filter by Type (Credit Only)
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/transactions?page=1&limit=20&type=credit' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Filter by Type (Debit Only)
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/transactions?page=1&limit=20&type=debit' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "TXN_123",
      "amount": 500,
      "type": "credit",
      "status": "completed",
      "description": "Wallet Recharge",
      "createdAt": "2026-02-03T10:30:00.000Z",
      "balanceBefore": 1000,
      "balanceAfter": 1500
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

## 5️⃣ Cashfree Webhook (Automatic - No Manual Call Needed)

```bash
curl --location 'https://freightrekapi.vercel.app/webhook/cashfree' \
--header 'Content-Type: application/json' \
--header 'x-webhook-signature: CASHFREE_SIGNATURE' \
--header 'x-webhook-timestamp: TIMESTAMP' \
--data '{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "ORDER_USER123_1738568400000",
      "order_status": "PAID"
    },
    "payment": {
      "cf_payment_id": "payment_abc123",
      "payment_status": "SUCCESS"
    }
  }
}'
```

---

## 🔐 Getting JWT Token

### Login to Get Token
```bash
curl --location 'https://freightrekapi.vercel.app/admin/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "user@example.com",
  "password": "your_password"
}'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "USER123",
    "email": "user@example.com"
  }
}
```

**Use the token in subsequent requests:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Quick Test Flow

### Step 1: Login and Get Token
```bash
TOKEN=$(curl -s --location 'https://freightrekapi.vercel.app/admin/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "user@example.com",
  "password": "your_password"
}' | jq -r '.token')

echo "Token: $TOKEN"
```

### Step 2: Check Wallet Balance
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/balance' \
--header "Authorization: Bearer $TOKEN"
```

### Step 3: Create Payment Order
```bash
ORDER_RESPONSE=$(curl -s --location 'https://freightrekapi.vercel.app/api/wallet/create-payment-order' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $TOKEN" \
--data '{
  "amount": 500,
  "paymentMethod": "upi"
}')

echo "$ORDER_RESPONSE"

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.orderId')
SESSION_ID=$(echo "$ORDER_RESPONSE" | jq -r '.sessionId')
```

### Step 4: Complete Payment (Use Cashfree UI/SDK)
```
# User completes payment on Cashfree
# Payment ID will be returned by Cashfree
```

### Step 5: Verify Payment
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/verify-payment' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $TOKEN" \
--data "{
  \"orderId\": \"$ORDER_ID\",
  \"paymentId\": \"payment_from_cashfree\"
}"
```

### Step 6: Get Transaction History
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/transactions?page=1&limit=10' \
--header "Authorization: Bearer $TOKEN"
```

---

## 🌍 Environment-Specific URLs

### Production
```bash
BASE_URL=https://freightrekapi.vercel.app
```

### Staging
```bash
BASE_URL=https://staging-api.freightrek.com
```

### Local Development
```bash
BASE_URL=http://localhost:3000
```

---

## ⚙️ Production Configuration

Update your `.env` file for production:

```env
# Production Cashfree Credentials
CASHFREE_CLIENT_ID=your_production_cashfree_app_id
CASHFREE_CLIENT_SECRET=your_production_cashfree_secret
CASHFREE_API_URL=https://api.cashfree.com/pg

# Production URLs
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://freightrekapi.vercel.app

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/freightrek

# Security
JWT_SECRET=your_strong_production_secret
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=production
```

---

## 🔒 Security Headers for Production

All production requests should include:

```bash
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--header 'Content-Type: application/json' \
--header 'User-Agent: FreightrekMobileApp/1.0' \
--header 'X-Request-ID: unique-request-id'
```

---

## 📊 Response Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200  | Success | Request successful |
| 201  | Created | Resource created successfully |
| 400  | Bad Request | Validation error or invalid data |
| 401  | Unauthorized | Missing or invalid JWT token |
| 403  | Forbidden | Insufficient permissions |
| 404  | Not Found | Resource not found |
| 500  | Server Error | Internal server error |

---

## 🧪 Testing with Different Amounts

### Minimum Amount (₹100)
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/create-payment-order' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "amount": 100,
  "paymentMethod": "upi"
}'
```

### Medium Amount (₹5,000)
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/create-payment-order' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "amount": 5000,
  "paymentMethod": "card"
}'
```

### Maximum Amount (₹100,000)
```bash
curl --location 'https://freightrekapi.vercel.app/api/wallet/create-payment-order' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "amount": 100000,
  "paymentMethod": "netbanking"
}'
```

---

## 🔍 Error Response Examples

### Invalid Amount
```json
{
  "success": false,
  "message": "Amount must be between ₹100 and ₹100,000"
}
```

### Invalid Token
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Payment Failed
```json
{
  "success": false,
  "message": "Payment verification failed"
}
```

### Insufficient Balance (for debit)
```json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
```

---

## 📱 Mobile App Integration

For mobile apps, use the same endpoints with:

```javascript
// React Native / Flutter
const response = await fetch('https://freightrekapi.vercel.app/api/wallet/balance', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🌐 CORS Configuration

Production CORS settings in your backend:

```javascript
// app.ts
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',
    'https://admin.your-domain.com'
  ],
  credentials: true
};
```

---

## 📞 Webhook Setup in Cashfree Dashboard

1. Login to Cashfree Production Dashboard
2. Go to Developers → Webhooks
3. Add webhook URL: `https://freightrekapi.vercel.app/webhook/cashfree`
4. Select events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`
5. Save webhook configuration

---

**Production Ready** ✅  
**Date**: February 4, 2026  
**Status**: All endpoints tested and ready for production deployment
