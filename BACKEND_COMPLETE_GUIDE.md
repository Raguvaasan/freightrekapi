# 🚀 BACKEND IMPLEMENTATION GUIDE - CASHFREE WALLET INTEGRATION

## 📋 COMPLETE BACKEND CHECKLIST

This document contains **EVERYTHING** your backend team needs to implement the Cashfree payment gateway integration.

---

## 🔐 CREDENTIALS (Add to .env file)

```env
# Cashfree Payment Gateway - SANDBOX/TEST Environment
CASHFREE_CLIENT_ID=your_cashfree_app_id_here
CASHFREE_CLIENT_SECRET=your_cashfree_secret_key_here
CASHFREE_API_URL=https://sandbox.cashfree.com/pg

# Frontend URL (for payment callback)
FRONTEND_URL=http://localhost:5173

# Your backend URL (for webhooks)
BACKEND_URL=http://localhost:8080
# Or use ngrok for testing: https://your-ngrok-url.ngrok.io

# JWT Secret (if not already present)
JWT_SECRET=your_jwt_secret_here
```

---

## 📦 REQUIRED NPM PACKAGES

```bash
npm install axios crypto
# or
yarn add axios crypto
```

---

## 🗄️ DATABASE SCHEMAS (MongoDB/Mongoose)

### 1. **Wallet Schema**
```javascript
const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Wallet = mongoose.model('Wallet', walletSchema);
```

### 2. **Order Schema**
```javascript
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet'],
    required: true
  },
  type: {
    type: String,
    default: 'wallet_recharge'
  },
  sessionId: {
    type: String
  },
  paymentId: {
    type: String
  },
  cashfreeOrderId: {
    type: String
  },
  metadata: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  }
});

const Order = mongoose.model('Order', orderSchema);
```

### 3. **Transaction Schema**
```javascript
const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'refund', 'reversal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  description: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String
  },
  paymentId: {
    type: String
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  metadata: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
```

---

## 🛠️ API ENDPOINTS TO IMPLEMENT

### 1️⃣ **GET /api/wallet/balance**

**Purpose**: Get user's wallet balance

**Request Headers**:
```javascript
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "balance": 1500.00,
  "currency": "INR"
}
```

**Implementation**:
```javascript
router.get('/api/wallet/balance', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = await Wallet.create({ userId, balance: 0 });
    }
    
    res.json({
      success: true,
      balance: wallet.balance,
      currency: wallet.currency || 'INR'
    });
    
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance'
    });
  }
});
```

---

### 2️⃣ **POST /api/wallet/create-payment-order**

**Purpose**: Create Cashfree payment order

**Request Headers**:
```javascript
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "amount": 500,
  "paymentMethod": "upi"
}
```

**Response**:
```json
{
  "success": true,
  "orderId": "ORDER_USER123_1738568400000",
  "sessionId": "session_abc123xyz",
  "amount": 500,
  "currency": "INR"
}
```

**Implementation**:
```javascript
router.post('/api/wallet/create-payment-order', authenticateUser, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const userId = req.user.id;
    
    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is ₹100'
      });
    }
    
    if (amount > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum amount is ₹100,000'
      });
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate unique order ID
    const orderId = `ORDER_${userId}_${Date.now()}`;
    
    // Create order in database
    const order = await Order.create({
      orderId,
      userId,
      amount,
      status: 'pending',
      paymentMethod,
      type: 'wallet_recharge'
    });
    
    // Create Cashfree payment session
    const cashfreeResponse = await axios.post(
      `${process.env.CASHFREE_API_URL}/orders`,
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_email: user.email || 'user@example.com',
          customer_phone: user.phone || '9999999999',
          customer_name: user.name || 'User'
        },
        order_meta: {
          return_url: `${process.env.FRONTEND_URL}/admin/wallet/payment-callback?order_id={order_id}`,
          notify_url: `${process.env.BACKEND_URL}/webhook/cashfree`,
          payment_methods: paymentMethod === 'card' ? 'cc,dc' : 'upi,nb'
        }
      },
      {
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Save session ID
    order.sessionId = cashfreeResponse.data.payment_session_id;
    order.cashfreeOrderId = cashfreeResponse.data.order_id;
    await order.save();
    
    res.json({
      success: true,
      orderId: orderId,
      sessionId: cashfreeResponse.data.payment_session_id,
      amount: amount,
      currency: 'INR'
    });
    
  } catch (error) {
    console.error('Create payment order error:', error.response?.data || error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to create payment order'
    });
  }
});
```

---

### 3️⃣ **POST /api/wallet/verify-payment**

**Purpose**: Verify payment and credit wallet

**Request Headers**:
```javascript
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "orderId": "ORDER_USER123_1738568400000",
  "paymentId": "payment_abc123"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "status": "SUCCESS",
  "amount": 500,
  "newBalance": 1500.00
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "status": "FAILED",
  "message": "Payment verification failed"
}
```

**Implementation**:
```javascript
router.post('/api/wallet/verify-payment', authenticateUser, async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    const userId = req.user.id;
    
    // Find order
    const order = await Order.findOne({ orderId, userId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if already processed
    if (order.status === 'completed') {
      const wallet = await Wallet.findOne({ userId });
      return res.json({
        success: true,
        status: 'SUCCESS',
        amount: order.amount,
        newBalance: wallet.balance,
        message: 'Payment already processed'
      });
    }
    
    // Verify payment with Cashfree
    const verifyResponse = await axios.get(
      `${process.env.CASHFREE_API_URL}/orders/${orderId}/payments`,
      {
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'x-api-version': '2023-08-01'
        }
      }
    );
    
    const payments = verifyResponse.data;
    let paymentSuccess = false;
    
    // Find the specific payment
    if (Array.isArray(payments)) {
      const payment = payments.find(p => p.cf_payment_id === paymentId);
      paymentSuccess = payment && payment.payment_status === 'SUCCESS';
    }
    
    if (paymentSuccess) {
      // Update order status
      order.status = 'completed';
      order.paymentId = paymentId;
      order.completedAt = new Date();
      await order.save();
      
      // Get current balance
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = await Wallet.create({ userId, balance: 0 });
      }
      
      const balanceBefore = wallet.balance;
      
      // Credit wallet
      wallet.balance += order.amount;
      wallet.updatedAt = new Date();
      await wallet.save();
      
      // Create transaction record
      await Transaction.create({
        transactionId: `TXN_${Date.now()}_${userId}`,
        userId,
        orderId,
        amount: order.amount,
        type: 'credit',
        status: 'completed',
        description: 'Wallet Recharge',
        paymentMethod: order.paymentMethod,
        paymentId,
        balanceBefore,
        balanceAfter: wallet.balance,
        metadata: {
          source: 'cashfree',
          orderType: 'wallet_recharge'
        }
      });
      
      res.json({
        success: true,
        status: 'SUCCESS',
        amount: order.amount,
        newBalance: wallet.balance
      });
      
    } else {
      // Payment failed
      order.status = 'failed';
      order.failedAt = new Date();
      await order.save();
      
      res.status(400).json({
        success: false,
        status: 'FAILED',
        message: 'Payment verification failed'
      });
    }
    
  } catch (error) {
    console.error('Verify payment error:', error.response?.data || error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});
```

---

### 4️⃣ **GET /api/wallet/transactions**

**Purpose**: Get user's transaction history

**Request Headers**:
```javascript
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:
```
?page=1&limit=20&type=credit
```

**Response**:
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_123",
      "amount": 500,
      "type": "credit",
      "status": "completed",
      "description": "Wallet Recharge",
      "paymentMethod": "upi",
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

**Implementation**:
```javascript
router.get('/api/wallet/transactions', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    
    const query = { userId };
    if (type) {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    const total = await Transaction.countDocuments(query);
    
    // Format response
    const formattedTransactions = transactions.map(txn => ({
      id: txn.transactionId,
      amount: txn.amount,
      type: txn.type,
      status: txn.status,
      description: txn.description,
      paymentMethod: txn.paymentMethod,
      orderId: txn.orderId,
      createdAt: txn.createdAt,
      balanceBefore: txn.balanceBefore,
      balanceAfter: txn.balanceAfter
    }));
    
    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});
```

---

### 5️⃣ **POST /webhook/cashfree** (IMPORTANT!)

**Purpose**: Receive real-time payment updates from Cashfree

**Request Headers**:
```javascript
x-webhook-signature: <signature>
x-webhook-timestamp: <timestamp>
Content-Type: application/json
```

**Request Body**:
```json
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "ORDER_USER123_1738568400000",
      "order_amount": 500,
      "order_status": "PAID"
    },
    "payment": {
      "cf_payment_id": "payment_abc123",
      "payment_status": "SUCCESS",
      "payment_amount": 500
    }
  }
}
```

**Implementation**:
```javascript
router.post('/webhook/cashfree', async (req, res) => {
  try {
    // Verify webhook signature (IMPORTANT for security)
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = JSON.stringify(req.body);
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_CLIENT_SECRET)
      .update(`${timestamp}${rawBody}`)
      .digest('base64');
    
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }
    
    const { data, type } = req.body;
    
    if (type === 'PAYMENT_SUCCESS_WEBHOOK' && data.order.order_status === 'PAID') {
      const orderId = data.order.order_id;
      const paymentId = data.payment.cf_payment_id;
      const amount = data.payment.payment_amount;
      
      // Find order
      const order = await Order.findOne({ orderId });
      
      if (!order) {
        console.error('Order not found:', orderId);
        return res.status(404).send('Order not found');
      }
      
      // Check if already processed
      if (order.status === 'completed') {
        return res.status(200).send('Already processed');
      }
      
      // Update order
      order.status = 'completed';
      order.paymentId = paymentId;
      order.completedAt = new Date();
      await order.save();
      
      // Get wallet
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = await Wallet.create({ userId: order.userId, balance: 0 });
      }
      
      const balanceBefore = wallet.balance;
      
      // Credit wallet
      wallet.balance += amount;
      wallet.updatedAt = new Date();
      await wallet.save();
      
      // Create transaction
      await Transaction.create({
        transactionId: `TXN_${Date.now()}_${order.userId}`,
        userId: order.userId,
        orderId,
        amount: amount,
        type: 'credit',
        status: 'completed',
        description: 'Wallet Recharge',
        paymentMethod: order.paymentMethod,
        paymentId,
        balanceBefore,
        balanceAfter: wallet.balance,
        metadata: {
          source: 'cashfree_webhook',
          orderType: 'wallet_recharge'
        }
      });
      
      console.log(`✅ Wallet credited: User ${order.userId}, Amount ₹${amount}`);
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});
```

---

## 🔐 AUTHENTICATION MIDDLEWARE

```javascript
const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticateUser };
```

---

## 🧪 TESTING INSTRUCTIONS

### 1. **Test with Postman/Thunder Client**

#### Test 1: Get Balance
```
GET http://localhost:8080/api/wallet/balance
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

#### Test 2: Create Order
```
POST http://localhost:8080/api/wallet/create-payment-order
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "amount": 500,
  "paymentMethod": "upi"
}
```

#### Test 3: Verify Payment (after completing payment)
```
POST http://localhost:8080/api/wallet/verify-payment
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "orderId": "ORDER_123",
  "paymentId": "payment_456"
}
```

#### Test 4: Get Transactions
```
GET http://localhost:8080/api/wallet/transactions?page=1&limit=10
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. **Test Payment Flow with Frontend**

1. Start backend: `npm start`
2. Start frontend: `npm run dev`
3. Go to: http://localhost:5173/admin/wallet/add
4. Enter amount: ₹500
5. Click "Proceed to Payment"
6. Use test credentials:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - OTP: `123456`
7. Verify wallet is credited

### 3. **Test Webhook (Using ngrok)**

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 8080

# Copy the https URL and update in:
# 1. Backend .env file: BACKEND_URL=https://your-ngrok-url.ngrok.io
# 2. Cashfree dashboard: Developers > Webhooks > Add URL
```

---

## 📊 DATABASE INDEXES (For Performance)

```javascript
// Add these indexes
db.wallets.createIndex({ userId: 1 }, { unique: true });
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.transactions.createIndex({ userId: 1, createdAt: -1 });
db.transactions.createIndex({ transactionId: 1 }, { unique: true });
db.transactions.createIndex({ orderId: 1 });
```

---

## ⚠️ ERROR HANDLING

### Common Errors and Solutions:

1. **401 Unauthorized from Cashfree**
   - Check CLIENT_ID and CLIENT_SECRET are correct
   - Verify API version header: `x-api-version: 2023-08-01`

2. **Order creation fails**
   - Check user email/phone format
   - Verify amount is >= 100
   - Check Cashfree API URL is correct

3. **Payment verification fails**
   - Check orderId matches exactly
   - Verify payment was actually successful in Cashfree dashboard

4. **Webhook not received**
   - Use ngrok for local testing
   - Verify webhook URL in Cashfree dashboard
   - Check signature verification logic

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Install required packages (axios, crypto)
- [ ] Add environment variables to .env
- [ ] Create database schemas (Wallet, Order, Transaction)
- [ ] Create authentication middleware
- [ ] Implement GET /api/wallet/balance
- [ ] Implement POST /api/wallet/create-payment-order
- [ ] Implement POST /api/wallet/verify-payment
- [ ] Implement GET /api/wallet/transactions
- [ ] Implement POST /webhook/cashfree
- [ ] Add database indexes
- [ ] Test all endpoints with Postman
- [ ] Test payment flow with frontend
- [ ] Test webhook with ngrok
- [ ] Add error logging
- [ ] Add success logging

---

## 🚀 DEPLOYMENT NOTES

### Before Production:
1. Switch to production Cashfree credentials
2. Update CASHFREE_API_URL to production URL
3. Set up proper webhook URL (not ngrok)
4. Add rate limiting to endpoints
5. Add request validation
6. Set up monitoring and alerts
7. Add database backups
8. Test with small real transaction first

---

## 📞 SUPPORT

If you face any issues:
1. Check Cashfree dashboard for payment status
2. Check backend logs for errors
3. Verify all environment variables are set
4. Test each endpoint individually
5. Refer to Cashfree docs: https://docs.cashfree.com/

---

**Created Date**: February 3, 2026
**Environment**: SANDBOX/TEST
**Frontend**: Already completed and ready
**Status**: Backend implementation required

