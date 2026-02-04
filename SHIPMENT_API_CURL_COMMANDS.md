# 🚀 Shipment API - CURL Commands (Live URL)

## 📝 Prerequisites

1. **Login pannunga and JWT token vaangunga:**

```bash
curl --request POST \
  --url https://freightrekapi.vercel.app/admin/auth/login \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

**Response-la irrukura token-a copy pannunga:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { ... }
}
```

---

## 🔧 Environment Variables

`.env` file-la check pannunga:
```env
DELHIVERY_API_URL=https://staging-express.delhivery.com
DELHIVERY_API_TOKEN=your_delhivery_token
```

---

## 📦 1. CREATE ORDER (Shipment Create)

```bash
curl --request POST \
  --url https://freightrekapi.vercel.app/api/shipment/create \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Rajesh Kumar",
    "add": "No 45, Anna Nagar, Chennai",
    "pin": "600040",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "country": "India",
    "phone": "9876543210",
    "order": "ORDER_001",
    "paymentMode": "Prepaid",
    "productsDesc": "Mobile Phone - Samsung Galaxy",
    "hsnCode": "8517",
    "totalAmount": "15000",
    "sellerName": "TechStore",
    "sellerAdd": "Mumbai",
    "sellerInv": "INV_2026_001",
    "quantity": "1",
    "shipmentWidth": "15",
    "shipmentHeight": "10",
    "weight": "500",
    "shippingMode": "Surface",
    "addressType": "home",
    "pickupLocation": {
      "name": "chennai_warehouse"
    }
  }'
```

### Response:
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

---

## 📋 2. GET SINGLE ORDER (Order Details)

```bash
curl --request GET \
  --url https://freightrekapi.vercel.app/api/shipment/order/ORD_USER123_1738568400000 \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE'
```

### Response:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_USER123_1738568400000",
    "waybill": "WB123456789",
    "status": "created",
    "trackingUrl": "https://staging-express.delhivery.com/track/package/WB123456789",
    "consignee": {
      "name": "Rajesh Kumar",
      "address": "No 45, Anna Nagar, Chennai",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pin": "600040",
      "phone": "9876543210"
    },
    "shipmentDetails": {
      "order": "ORDER_001",
      "paymentMode": "Prepaid",
      "shippingMode": "Surface",
      "weight": "500",
      "dimensions": {
        "width": "15",
        "height": "10"
      }
    },
    "pickupLocation": {
      "name": "chennai_warehouse"
    },
    "createdAt": "2026-02-03T10:30:00.000Z",
    "updatedAt": "2026-02-03T10:30:00.000Z"
  }
}
```

---

## 📊 3. GET ALL ORDERS (List Orders with Pagination)

### Basic Request:
```bash
curl --request GET \
  --url https://freightrekapi.vercel.app/api/shipment/orders \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE'
```

### With Pagination:
```bash
curl --request GET \
  --url 'https://freightrekapi.vercel.app/api/shipment/orders?page=1&limit=10' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE'
```

### Filter by Status:
```bash
curl --request GET \
  --url 'https://freightrekapi.vercel.app/api/shipment/orders?status=created' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE'
```

### With Pagination + Status Filter:
```bash
curl --request GET \
  --url 'https://freightrekapi.vercel.app/api/shipment/orders?page=1&limit=20&status=delivered' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE'
```

### Response:
```json
{
  "success": true,
  "data": [
    {
      "orderId": "ORD_USER123_1738568400000",
      "waybill": "WB123456789",
      "status": "created",
      "consigneeName": "Rajesh Kumar",
      "city": "Chennai",
      "paymentMode": "Prepaid",
      "createdAt": "2026-02-03T10:30:00.000Z"
    },
    {
      "orderId": "ORD_USER123_1738568300000",
      "waybill": "WB987654321",
      "status": "delivered",
      "consigneeName": "Priya Sharma",
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

## 🔍 4. TRACK SHIPMENT

```bash
curl --request GET \
  --url https://freightrekapi.vercel.app/api/shipment/track/WB123456789 \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE'
```

### Response:
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
            "Scans": [
              {
                "ScanDetail": {
                  "Scan": "Dispatched",
                  "ScannedLocation": "Chennai_D (Tamil Nadu)"
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

---

## 🎯 Production URLs (Live Deployment)

### Production URL (Live Deployment):
```bash
# Current Production URL
https://freightrekapi.vercel.app
```

### Example with Production URL:

#### Create Order:
```bash
curl --request POST \
  --url https://freightrekapi.vercel.app/api/shipment/create \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{ ... }'
```

#### Get Order:
```bash
curl --request GET \
  --url https://freightrekapi.vercel.app/api/shipment/order/ORD_123 \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 💡 Quick Test Commands

### 1. Login & Save Token to Variable (Bash/Linux/Mac):
```bash
TOKEN=$(curl -s --request POST \
  --url https://freightrekapi.vercel.app/admin/auth/login \
  --header 'Content-Type: application/json' \
  --data '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

echo "Token: $TOKEN"
```

### 2. Create Order with Token Variable:
```bash
curl --request POST \
  --url https://freightrekapi.vercel.app/api/shipment/create \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Test Customer",
    "add": "Test Address",
    "pin": "600001",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "phone": "9999999999",
    "order": "TEST_001",
    "paymentMode": "Prepaid",
    "weight": "500",
    "shippingMode": "Surface",
    "pickupLocation": {"name": "warehouse_1"}
  }'
```

### 3. PowerShell (Windows):
```powershell
# Login and get token
$response = Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/admin/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@example.com","password":"password"}'
$TOKEN = $response.token

# Create order
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/shipment/create" -Method POST -Headers @{"Authorization"="Bearer $TOKEN"} -ContentType "application/json" -Body '{...}'
```

---

## 📝 COD Order Example

```bash
curl --request POST \
  --url https://freightrekapi.vercel.app/api/shipment/create \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Priya Sharma",
    "add": "Flat 12B, Lotus Apartments, Bangalore",
    "pin": "560001",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India",
    "phone": "9988776655",
    "order": "ORDER_COD_001",
    "paymentMode": "COD",
    "codAmount": "2500",
    "productsDesc": "Books - Educational",
    "totalAmount": "2500",
    "quantity": "3",
    "weight": "1200",
    "shippingMode": "Express",
    "pickupLocation": {
      "name": "bangalore_hub"
    }
  }'
```

---

## ⚠️ Common Issues & Solutions

### 401 Unauthorized Error:
```json
{"success": false, "message": "User not authenticated"}
```
**Solution**: JWT token expire aagiruchu. Login panni pudhusa token vaangunga.

### 400 Bad Request (Validation Error):
```json
{"success": false, "message": "PIN code must be 6 digits"}
```
**Solution**: PIN code 6 digits-a irukkanum (e.g., "600001")

### 404 Not Found:
```json
{"success": false, "message": "Shipment not found"}
```
**Solution**: Order ID correct-a irukkha check pannunga.

---

## 🔐 Security Notes

1. **Never commit** JWT tokens to git
2. **Use environment variables** for tokens in production
3. Token-a safe-a store pannunga
4. Production-la HTTPS use pannunga

---

## 📞 Testing Checklist

- [ ] Login API working
- [ ] JWT token received
- [ ] Create order successful
- [ ] Waybill generated
- [ ] Get single order working
- [ ] Get all orders with pagination
- [ ] Track shipment working
- [ ] Delhivery token configured

---

**Created**: February 3, 2026  
**Status**: Ready to Use 🚀  
**Environment**: Development/Production  

All CURL commands ready! Copy & paste pannunga! 📋✨
