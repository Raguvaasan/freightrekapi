# ✅ Delhivery Shipment API Implementation

## 📋 APIs Implemented

### 1. Create Shipment/Order
```
POST /api/shipment/create
```

### 2. Get Single Order
```
GET /api/shipment/order/:orderId
```

### 3. Get All Orders (with pagination)
```
GET /api/shipment/orders?page=1&limit=20&status=created
```

### 4. Track Shipment
```
GET /api/shipment/track/:waybill
```

---

## 🔌 API Details

### 1️⃣ Create Shipment

**Endpoint**: `POST /api/shipment/create`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Consignee name",
  "add": "Huda Market, Haryana",
  "pin": "110042",
  "city": "Gurugram",
  "state": "Haryana",
  "country": "India",
  "phone": "9999999999",
  "order": "Test Order 01",
  "paymentMode": "Prepaid",
  "returnPin": "",
  "returnCity": "",
  "returnPhone": "",
  "returnAdd": "",
  "returnState": "",
  "returnCountry": "",
  "productsDesc": "Electronics",
  "hsnCode": "8517",
  "codAmount": "",
  "orderDate": null,
  "totalAmount": "5000",
  "sellerAdd": "Mumbai",
  "sellerName": "Store Name",
  "sellerInv": "INV001",
  "quantity": "1",
  "waybill": "",
  "shipmentWidth": "100",
  "shipmentHeight": "100",
  "weight": "500",
  "shippingMode": "Surface",
  "addressType": "home",
  "pickupLocation": {
    "name": "warehouse_name"
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "WB123456789",
    "status": "created",
    "trackingUrl": "https://staging-express.delhivery.com/track/package/WB123456789",
    "delhiveryResponse": {
      "success": true,
      "packages": [...]
    }
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

### 2️⃣ Get Single Order

**Endpoint**: `GET /api/shipment/order/:orderId`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Example**:
```
GET /api/shipment/order/ORD_USER123_1738568400000
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "WB123456789",
    "status": "created",
    "trackingUrl": "https://staging-express.delhivery.com/track/package/WB123456789",
    "consignee": {
      "name": "Consignee name",
      "address": "Huda Market, Haryana",
      "city": "Gurugram",
      "state": "Haryana",
      "pin": "110042",
      "phone": "9999999999"
    },
    "shipmentDetails": {
      "order": "Test Order 01",
      "paymentMode": "Prepaid",
      "shippingMode": "Surface",
      "weight": "500",
      "dimensions": {
        "width": "100",
        "height": "100"
      }
    },
    "pickupLocation": {
      "name": "warehouse_name"
    },
    "createdAt": "2026-02-03T10:30:00.000Z",
    "updatedAt": "2026-02-03T10:30:00.000Z"
  }
}
```

---

### 3️⃣ Get All Orders (Paginated)

**Endpoint**: `GET /api/shipment/orders`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (pending, created, in_transit, delivered, failed, cancelled)

**Examples**:
```
GET /api/shipment/orders
GET /api/shipment/orders?page=1&limit=10
GET /api/shipment/orders?status=created
GET /api/shipment/orders?page=2&limit=20&status=delivered
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "orderId": "ORD_USER123_1738568400000",
      "waybill": "WB123456789",
      "status": "created",
      "consigneeName": "Consignee name",
      "city": "Gurugram",
      "paymentMode": "Prepaid",
      "createdAt": "2026-02-03T10:30:00.000Z"
    },
    {
      "orderId": "ORD_USER123_1738568300000",
      "waybill": "WB987654321",
      "status": "delivered",
      "consigneeName": "Another Customer",
      "city": "Mumbai",
      "paymentMode": "COD",
      "createdAt": "2026-02-02T15:20:00.000Z"
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

### 4️⃣ Track Shipment

**Endpoint**: `GET /api/shipment/track/:waybill`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Example**:
```
GET /api/shipment/track/WB123456789
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "WB123456789",
    "status": "in_transit",
    "tracking": {
      "ShipmentData": [
        {
          "Shipment": {
            "Status": {
              "Status": "In Transit"
            },
            "Scans": [...]
          }
        }
      ]
    }
  }
}
```

---

## ⚙️ Environment Variables

Add these to your `.env` file:

```env
# Delhivery API Configuration
DELHIVERY_API_URL=https://staging-express.delhivery.com
DELHIVERY_API_TOKEN=your_delhivery_api_token_here

# For Production
# DELHIVERY_API_URL=https://track.delhivery.com
```

---

## 📁 Files Created

1. **Model**: `src/models/shipment/shipment.model.ts`
2. **Service**: `src/services/shipment.service.ts`
3. **Controller**: `src/controllers/shipment.controller.ts`
4. **Validator**: `src/validators/shipment.validator.ts`
5. **Routes**: `src/routes/shipment.routes.ts`
6. **App**: Updated `src/app.ts` with shipment routes

---

## 🧪 Testing with Postman

### Step 1: Login and Get Token
```
POST http://localhost:3000/admin/auth/login
Body: { "email": "admin@example.com", "password": "password" }
```

### Step 2: Create Shipment
```
POST http://localhost:3000/api/shipment/create
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body: (see request body above)
```

### Step 3: Get Single Order
```
GET http://localhost:3000/api/shipment/order/ORD_USER123_1738568400000
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

### Step 4: Get All Orders
```
GET http://localhost:3000/api/shipment/orders?page=1&limit=10
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

### Step 5: Track Shipment
```
GET http://localhost:3000/api/shipment/track/WB123456789
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📊 Database Schema

### Shipment Model Fields:

- **userId**: User who created the shipment
- **orderId**: Unique order ID (auto-generated)
- **waybill**: Delhivery tracking number
- **name**: Consignee name
- **add**: Delivery address
- **pin**: PIN code
- **city**: City
- **state**: State
- **country**: Country (default: India)
- **phone**: Phone number
- **order**: Order reference
- **paymentMode**: Prepaid or COD
- **status**: pending | created | in_transit | delivered | failed | cancelled
- **pickupLocation**: Warehouse/pickup details
- **delhiveryResponse**: Full Delhivery API response
- **trackingUrl**: Direct tracking link

### Indexes:
- `orderId` (unique)
- `userId`
- `waybill`
- `userId + createdAt` (compound)
- `userId + status` (compound)
- `status`

---

## 🔐 Security Features

✅ JWT authentication required for all endpoints  
✅ Input validation with Yup  
✅ User isolation (can only access own shipments)  
✅ Phone number validation (10 digits)  
✅ PIN code validation (6 digits)  
✅ Payment mode validation (Prepaid/COD)  

---

## 📝 Field Validations

### Required Fields:
- name (consignee name)
- add (address)
- pin (6 digits)
- city
- state
- phone (10 digits)
- order (order reference)
- paymentMode (Prepaid or COD)
- pickupLocation.name

### Optional Fields:
- All return address fields
- Product details (description, HSN code)
- Seller details
- Shipment dimensions
- Weight
- COD amount (required if paymentMode is COD)

---

## 🚀 Production Checklist

- [ ] Update `DELHIVERY_API_URL` to production URL
- [ ] Get production Delhivery API token
- [ ] Test with real shipments
- [ ] Set up error monitoring
- [ ] Configure rate limiting
- [ ] Set up webhook for status updates (if needed)
- [ ] Backup database regularly

---

## 🔍 Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found
- `500`: Internal Server Error

---

## 📞 Support

If you encounter issues:
1. Check Delhivery API token is valid
2. Verify all required fields are provided
3. Check console logs for detailed errors
4. Ensure MongoDB is running
5. Verify JWT token is not expired

---

**Implementation Status**: ✅ Complete  
**Date**: February 3, 2026  
**Environment**: Staging/Test  

All shipment APIs are ready to use! 🎉
