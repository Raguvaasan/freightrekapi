# 📦 Delhivery Shipment API - Tamil Guide

## ✅ என்ன செய்யப்பட்டுள்ளது

Delhivery-ல order create பண்ணவும், track பண்ணவும் 4 APIs உருவாக்கப்பட்டுள்ளது.

## 🔌 API Endpoints

### 1. Shipment Create செய்ய
```
POST /api/shipment/create
```

### 2. ஒரு Order-ஐ பார்க்க
```
GET /api/shipment/order/:orderId
```

### 3. எல்லா Orders-யும் பார்க்க
```
GET /api/shipment/orders?page=1&limit=20
```

### 4. Shipment Track செய்ய
```
GET /api/shipment/track/:waybill
```

---

## 📝 Detailed API Usage

### 1️⃣ Shipment Create செய்வது எப்படி

**Endpoint**: `POST /api/shipment/create`

**Headers**:
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Customer Name",
  "add": "Huda Market, Haryana",
  "pin": "110042",
  "city": "Gurugram",
  "state": "Haryana",
  "country": "India",
  "phone": "9999999999",
  "order": "Test Order 01",
  "paymentMode": "Prepaid",
  "productsDesc": "Electronics",
  "totalAmount": "5000",
  "weight": "500",
  "shippingMode": "Surface",
  "pickupLocation": {
    "name": "warehouse_name"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "WB123456789",
    "status": "created",
    "trackingUrl": "https://staging-express.delhivery.com/track/package/WB123456789"
  }
}
```

---

### 2️⃣ ஒரு Order Details பார்ப்பது எப்படி

**Endpoint**: `GET /api/shipment/order/:orderId`

**Example**:
```
GET /api/shipment/order/ORD_USER123_1738568400000
Headers:
  Authorization: Bearer <your_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "WB123456789",
    "status": "created",
    "consignee": {
      "name": "Customer Name",
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
      "weight": "500"
    }
  }
}
```

---

### 3️⃣ எல்லா Orders List பார்ப்பது எப்படி

**Endpoint**: `GET /api/shipment/orders`

**Query Parameters**:
- `page` - எந்த page (default: 1)
- `limit` - ஒரு page-ல எத்தனை items (default: 20)
- `status` - Status வைத்து filter செய்ய (optional)

**Examples**:
```
GET /api/shipment/orders
GET /api/shipment/orders?page=1&limit=10
GET /api/shipment/orders?status=created
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
      "consigneeName": "Customer Name",
      "city": "Gurugram",
      "paymentMode": "Prepaid",
      "createdAt": "2026-02-03T10:30:00.000Z"
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

### 4️⃣ Shipment Track செய்வது எப்படி

**Endpoint**: `GET /api/shipment/track/:waybill`

**Example**:
```
GET /api/shipment/track/WB123456789
Headers:
  Authorization: Bearer <your_token>
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
      "ShipmentData": [...]
    }
  }
}
```

---

## ⚙️ Setup Instructions

### Step 1: Environment Variables Add செய்யுங்கள்

`.env` file-ல் add செய்யுங்கள்:

```env
# Delhivery API Configuration
DELHIVERY_API_URL=https://staging-express.delhivery.com
DELHIVERY_API_TOKEN=your_delhivery_token_here

# Existing variables
MONGO_URI=mongodb://localhost:27017/freightrek
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Step 2: Server Start செய்யுங்கள்

```bash
# Development Mode
npm run dev

# அல்லது Production Mode
npm run build
npm start
```

---

## 🧪 Postman-ல் Test செய்வது எப்படி

### Test 1: Login செய்து Token வாங்குங்கள்
```
POST http://localhost:3000/admin/auth/login
Body: { "email": "...", "password": "..." }
```

### Test 2: Shipment Create செய்யுங்கள்
```
POST http://localhost:3000/api/shipment/create
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
Body: (மேலே உள்ள request body-ஐ use செய்யுங்கள்)
```

### Test 3: Order Details பாருங்கள்
```
GET http://localhost:3000/api/shipment/order/ORD_123
Headers:
  Authorization: Bearer YOUR_TOKEN
```

### Test 4: எல்லா Orders-யும் பாருங்கள்
```
GET http://localhost:3000/api/shipment/orders?page=1&limit=10
Headers:
  Authorization: Bearer YOUR_TOKEN
```

### Test 5: Track செய்யுங்கள்
```
GET http://localhost:3000/api/shipment/track/WB123456789
Headers:
  Authorization: Bearer YOUR_TOKEN
```

---

## 📋 Required Fields (கட்டாயமாக தேவை)

Shipment create செய்யும் போது:

✅ **name** - Customer name  
✅ **add** - முழு address  
✅ **pin** - 6 digits PIN code  
✅ **city** - City name  
✅ **state** - State name  
✅ **phone** - 10 digits phone number  
✅ **order** - Order reference number  
✅ **paymentMode** - "Prepaid" or "COD"  
✅ **pickupLocation.name** - Warehouse name  

---

## 📊 Status Types

- **pending** - Order database-ல create ஆச்சு, Delhivery-க்கு இன்னும் send ஆகலை
- **created** - Delhivery-ல successfully create ஆச்சு
- **in_transit** - Delivery-க்கு போய்கிட்டு இருக்கு
- **delivered** - Delivered ஆச்சு
- **failed** - Failed ஆச்சு
- **cancelled** - Cancel ஆச்சு

---

## 🔐 Security Features

✅ JWT Authentication - எல்லா endpoints-லும்  
✅ User Isolation - உங்க orders மட்டும் நீங்க பார்க்க முடியும்  
✅ Input Validation - எல்லா fields-யும் validate பண்ணும்  
✅ Phone validation - 10 digits கட்டாயம்  
✅ PIN validation - 6 digits கட்டாயம்  

---

## 📁 உருவாக்கப்பட்ட Files

1. `src/models/shipment/shipment.model.ts` - Database schema
2. `src/services/shipment.service.ts` - Business logic
3. `src/controllers/shipment.controller.ts` - API handlers
4. `src/validators/shipment.validator.ts` - Validation
5. `src/routes/shipment.routes.ts` - Routes
6. `src/app.ts` - Updated (routes registered)

---

## 🚀 Production-க்கு போகும் முன்

- [ ] Production Delhivery token வாங்குங்கள்
- [ ] API URL மாற்றுங்கள்: `https://track.delhivery.com`
- [ ] Real shipment-உடன் test செய்யுங்கள்
- [ ] Error monitoring setup செய்யுங்கள்
- [ ] Rate limiting enable செய்யுங்கள்
- [ ] Database backup setup செய்யுங்கள்

---

## ❓ Issues வந்தால்

1. Delhivery token valid-ஆ இருக்கிறதா check செய்யுங்கள்
2. Required fields எல்லாம் send பண்றீங்களா பாருங்கள்
3. Console logs பாருங்கள்
4. MongoDB running-ல் இருக்கிறதா பாருங்கள்
5. JWT token expire ஆகலையா check செய்யுங்கள்

---

## 📚 Reference Files

- **English Guide**: `SHIPMENT_API_GUIDE.md`
- **Wallet APIs**: `WALLET_IMPLEMENTATION_TAMIL.md`

---

**Status**: ✅ முழுமையாக Complete  
**Date**: பிப்ரவரி 3, 2026  
**Environment**: TEST/STAGING  

எல்லா Shipment APIs-யும் ready! 🚀

## 🎯 Next Steps

1. `.env` file-ல் Delhivery token add செய்யுங்கள்
2. Server start செய்யுங்கள்: `npm run dev`
3. Postman-ல் test செய்யுங்கள்
4. Frontend-உடன் integrate செய்யுங்கள்

Happy Shipping! 📦✨
