# 📦 Shipment Order Management API - cURL Commands (Production)

## 🌐 Production URL
```
BASE_URL=https://freightrekapi.vercel.app
```

---

## 📋 Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shipment/create` | Create new shipment |
| GET | `/api/shipment/order/:orderId` | Get shipment details |
| PUT | `/api/shipment/order/:orderId` | Update shipment |
| DELETE | `/api/shipment/order/:orderId` | Cancel shipment (with refund) |
| GET | `/api/shipment/orders` | Get all shipments |
| GET | `/api/shipment/track/:waybill` | Track shipment |

---

## 1️⃣ Create Shipment

```bash
curl --location 'https://freightrekapi.vercel.app/api/shipment/create' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "name": "John Doe",
  "add": "123 Main Street, Apartment 4B",
  "pin": "400001",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "phone": "9876543210",
  "order": "ORDER123",
  "paymentMode": "Prepaid",
  "totalAmount": "500",
  "weight": "2",
  "shippingMode": "Surface",
  "pickupLocation": {
    "name": "Warehouse A"
  },
  "fromName": "ABC Company",
  "fromAdd": "456 Business Park",
  "fromPin": "400002",
  "fromCity": "Mumbai",
  "fromState": "Maharashtra",
  "fromCountry": "India",
  "fromPhone": "9123456789"
}'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Shipment created successfully",
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "DHL123456789",
    "status": "created",
    "trackingUrl": "https://delhivery.com/track/package/DHL123456789",
    "delhiveryResponse": {}
  }
}
```

---

## 2️⃣ Get Shipment Details

```bash
curl --location 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "DHL123456789",
    "status": "created",
    "trackingUrl": "https://delhivery.com/track/package/DHL123456789",
    "consignee": {
      "name": "John Doe",
      "address": "123 Main Street, Apartment 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pin": "400001",
      "phone": "9876543210"
    },
    "shipmentDetails": {
      "order": "ORDER123",
      "paymentMode": "Prepaid",
      "shippingMode": "Surface",
      "weight": "2",
      "dimensions": {
        "width": "100",
        "height": "100"
      }
    },
    "pickupLocation": {
      "name": "Warehouse A"
    },
    "createdAt": "2026-02-12T10:30:00.000Z",
    "updatedAt": "2026-02-12T10:30:00.000Z"
  }
}
```

---

## 3️⃣ Update Shipment

### Update Consignee Details
```bash
curl --location --request PUT 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "name": "Jane Doe",
  "phone": "9999888877",
  "add": "456 New Address",
  "city": "Delhi",
  "state": "Delhi",
  "pin": "110001"
}'
```

### Update Status
```bash
curl --location --request PUT 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "status": "in_transit"
}'
```

### Update Shipping Details
```bash
curl --location --request PUT 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "weight": "3",
  "shippingMode": "Express",
  "codAmount": "1000"
}'
```

### Update From Address
```bash
curl --location --request PUT 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "fromName": "XYZ Company",
  "fromAdd": "789 Corporate Center",
  "fromPin": "400003",
  "fromCity": "Mumbai",
  "fromState": "Maharashtra",
  "fromPhone": "9111222333"
}'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Shipment updated successfully",
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "DHL123456789",
    "status": "in_transit",
    "updatedAt": "2026-02-12T11:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot update delivered shipment"
}
```

---

## 4️⃣ Delete (Cancel) Shipment with Refund

```bash
curl --location --request DELETE 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Shipment cancelled successfully",
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "status": "cancelled",
    "refunded": true,
    "refundAmount": "500"
  }
}
```

**Important:**
- ✅ Cancels shipment (soft delete - status changes to `cancelled`)
- 💰 **Auto-refunds to wallet** if payment mode is `Prepaid`
- ❌ Cannot cancel shipments with status `delivered`
- 📝 Refund transaction is created automatically

---

## 5️⃣ Get All Shipments

### All Shipments (Paginated)
```bash
curl --location 'https://freightrekapi.vercel.app/api/shipment/orders?page=1&limit=20' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Filter by Status
```bash
curl --location 'https://freightrekapi.vercel.app/api/shipment/orders?page=1&limit=20&status=in_transit' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "ORD_USER123_1738568400000",
      "userId": "USER123",
      "franchiseName": "ABC Franchise",
      "bookingId": "DHL123456789",
      "status": "in_transit",
      "consigneeName": "John Doe",
      "consigneeNumber": "9876543210",
      "city": "Mumbai",
      "paymentMode": "Prepaid",
      "amount": "500",
      "createdAt": "2026-02-12T10:30:00.000Z"
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

**Valid Status Values:**
- `pending` - Shipment created, awaiting processing
- `created` - Shipment created with Delhivery
- `in_transit` - Package in transit
- `delivered` - Package delivered
- `failed` - Shipment creation failed
- `cancelled` - Shipment cancelled

---

## 6️⃣ Track Shipment

```bash
curl --location 'https://freightrekapi.vercel.app/api/shipment/track/DHL123456789' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "DHL123456789",
    "status": "in_transit",
    "tracking": {
      "Scans": [
        {
          "ScanDateTime": "2026-02-12T10:30:00",
          "ScanType": "UD",
          "Scan": "Shipment Picked",
          "StatusDateTime": "2026-02-12T10:30:00"
        },
        {
          "ScanDateTime": "2026-02-12T14:00:00",
          "ScanType": "IT",
          "Scan": "In Transit",
          "StatusDateTime": "2026-02-12T14:00:00"
        }
      ]
    }
  }
}
```

---

## 🔄 Complete Shipment Lifecycle Example

```bash
# Set your JWT token
TOKEN="YOUR_JWT_TOKEN_HERE"

# Step 1: Create shipment
echo "📦 Creating shipment..."
ORDER_RESPONSE=$(curl -s --location 'https://freightrekapi.vercel.app/api/shipment/create' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $TOKEN" \
--data '{
  "name": "John Doe",
  "add": "123 Main Street",
  "pin": "400001",
  "city": "Mumbai",
  "state": "Maharashtra",
  "phone": "9876543210",
  "order": "ORDER123",
  "paymentMode": "Prepaid",
  "totalAmount": "500",
  "weight": "2",
  "shippingMode": "Surface",
  "pickupLocation": {"name": "Warehouse A"}
}')

echo "$ORDER_RESPONSE" | jq '.'

# Extract order ID and waybill
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.orderId')
WAYBILL=$(echo "$ORDER_RESPONSE" | jq -r '.data.waybill')
echo "Order ID: $ORDER_ID"
echo "Waybill: $WAYBILL"

# Step 2: Get shipment details
echo -e "\n📋 Getting shipment details..."
curl -s --location "https://freightrekapi.vercel.app/api/shipment/order/$ORDER_ID" \
--header "Authorization: Bearer $TOKEN" | jq '.'

# Step 3: Update shipment
echo -e "\n✏️ Updating shipment..."
curl -s --location --request PUT "https://freightrekapi.vercel.app/api/shipment/order/$ORDER_ID" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $TOKEN" \
--data '{"status": "in_transit"}' | jq '.'

# Step 4: Track shipment
echo -e "\n🔍 Tracking shipment..."
curl -s --location "https://freightrekapi.vercel.app/api/shipment/track/$WAYBILL" \
--header "Authorization: Bearer $TOKEN" | jq '.'

# Step 5: Cancel shipment (if needed)
echo -e "\n❌ Cancelling shipment..."
curl -s --location --request DELETE "https://freightrekapi.vercel.app/api/shipment/order/$ORDER_ID" \
--header "Authorization: Bearer $TOKEN" | jq '.'

# Step 6: Verify cancellation and refund
echo -e "\n✅ Verifying cancellation..."
curl -s --location "https://freightrekapi.vercel.app/api/shipment/order/$ORDER_ID" \
--header "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 🔐 Authentication

All endpoints require JWT authentication:

```bash
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get JWT Token
```bash
curl --location 'https://freightrekapi.vercel.app/admin/auth/login' \
--header 'Content-Type: application/json' \
--data '{
  "email": "user@example.com",
  "password": "your_password"
}'
```

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Shipment not found"
}
```

### 400 Bad Request - Cannot Update
```json
{
  "success": false,
  "message": "Cannot update delivered shipment"
}
```

### 400 Bad Request - Cannot Delete
```json
{
  "success": false,
  "message": "Cannot delete delivered shipment"
}
```

### 400 Bad Request - Insufficient Balance
```json
{
  "success": false,
  "message": "Insufficient wallet balance. Available: ₹100, Required: ₹500"
}
```

---

## 📊 Status Code Reference

| HTTP Code | Description |
|-----------|-------------|
| 200 | Success - Request completed successfully |
| 201 | Created - Shipment created successfully |
| 400 | Bad Request - Validation error or business rule violation |
| 401 | Unauthorized - Invalid or missing JWT token |
| 404 | Not Found - Shipment not found or doesn't belong to user |
| 500 | Server Error - Internal server error |

---

## 🎯 Use Cases

### Use Case 1: Create and Track Shipment
```bash
# Create shipment
ORDER_ID=$(curl -s 'https://freightrekapi.vercel.app/api/shipment/create' \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{"name":"John","add":"123 St","pin":"400001","city":"Mumbai","state":"Maharashtra","phone":"9876543210","order":"ORD123","paymentMode":"COD","weight":"1","pickupLocation":{"name":"WH1"}}' \
| jq -r '.data.orderId')

# Track immediately
curl -s "https://freightrekapi.vercel.app/api/shipment/order/$ORDER_ID" \
-H "Authorization: Bearer $TOKEN" | jq '.'
```

### Use Case 2: Update Address Before Delivery
```bash
# Update consignee address
curl -s -X PUT "https://freightrekapi.vercel.app/api/shipment/order/$ORDER_ID" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "add": "New Address 789",
  "pin": "400020",
  "city": "Navi Mumbai"
}' | jq '.'
```

### Use Case 3: Cancel and Get Refund
```bash
# Cancel prepaid shipment and get auto-refund
curl -s -X DELETE "https://freightrekapi.vercel.app/api/shipment/order/$ORDER_ID" \
-H "Authorization: Bearer $TOKEN" | jq '.'

# Check wallet balance to verify refund
curl -s 'https://freightrekapi.vercel.app/api/wallet/balance' \
-H "Authorization: Bearer $TOKEN" | jq '.'
```

### Use Case 4: Bulk Status Check
```bash
# Get all pending shipments
curl -s 'https://freightrekapi.vercel.app/api/shipment/orders?status=pending&limit=50' \
-H "Authorization: Bearer $TOKEN" | jq '.data[] | {orderId, status, consigneeName}'
```

---

## 💰 Payment Mode & Refund Logic

### Prepaid
- Amount is **deducted from wallet** at shipment creation
- **Auto-refunded to wallet** when shipment is cancelled
- Transaction records are created for both debit and refund

### COD (Cash on Delivery)
- **No wallet deduction** at creation
- **No refund** when cancelled (nothing was charged)

---

## 📱 Mobile Integration Example

### React Native / JavaScript
```javascript
// Create shipment
const createShipment = async (shipmentData) => {
  const response = await fetch(
    'https://freightrekapi.vercel.app/api/shipment/create',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shipmentData)
    }
  );
  return await response.json();
};

// Update shipment
const updateShipment = async (orderId, updateData) => {
  const response = await fetch(
    `https://freightrekapi.vercel.app/api/shipment/order/${orderId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    }
  );
  return await response.json();
};

// Cancel shipment with auto-refund
const cancelShipment = async (orderId) => {
  const response = await fetch(
    `https://freightrekapi.vercel.app/api/shipment/order/${orderId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

// Get shipment details
const getShipment = async (orderId) => {
  const response = await fetch(
    `https://freightrekapi.vercel.app/api/shipment/order/${orderId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};
```

---

## 🔒 Security & Validation

### Field Validations
- **PIN codes**: Must be exactly 6 digits
- **Phone numbers**: Must be exactly 10 digits
- **Payment mode**: Only `Prepaid` or `COD`
- **Shipping mode**: Only `Surface` or `Express`
- **Status**: Must be valid status value

### Business Rules
- ✅ Can update: `pending`, `created`, `in_transit`, `failed`, `cancelled`
- ❌ Cannot update: `delivered`
- 💰 Auto-refund only for `Prepaid` shipments
- 👤 Users can only access their own shipments

---

## 🌐 Environment URLs

### Production
```
https://freightrekapi.vercel.app
```

### Local Development
```
http://localhost:3000
```

---

## 📝 Updateable Fields

When updating a shipment, you can modify:

**Consignee Details:**
- `name`, `add`, `pin`, `city`, `state`, `country`, `phone`

**From Address:**
- `fromName`, `fromAdd`, `fromPin`, `fromCity`, `fromState`, `fromCountry`, `fromPhone`

**Return Address:**
- `returnPin`, `returnCity`, `returnPhone`, `returnAdd`, `returnState`, `returnCountry`

**Shipment Details:**
- `paymentMode`, `status`, `productsDesc`, `codAmount`, `totalAmount`
- `weight`, `shippingMode`

**Note:** Cannot update `orderId`, `waybill`, `userId`, or delivered shipments

---

## 🎬 Quick Test Commands

```bash
# Set token
TOKEN="YOUR_JWT_TOKEN"

# Create
curl -s -X POST 'https://freightrekapi.vercel.app/api/shipment/create' \
-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
-d '{"name":"Test","add":"123 St","pin":"400001","city":"Mumbai","state":"Maharashtra","phone":"9876543210","order":"TEST123","paymentMode":"COD","weight":"1","pickupLocation":{"name":"WH1"}}' | jq '.'

# Get
curl -s 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
-H "Authorization: Bearer $TOKEN" | jq '.'

# Update
curl -s -X PUT 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
-d '{"status":"in_transit"}' | jq '.'

# Delete
curl -s -X DELETE 'https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000' \
-H "Authorization: Bearer $TOKEN" | jq '.'
```

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 12, 2026  
**Features**: Create, Get, Update, Delete with Auto-Refund  
**Endpoints**: 6 (Create, Get, GetAll, Update, Delete, Track)
