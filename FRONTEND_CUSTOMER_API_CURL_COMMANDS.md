# Frontend Customer API - Curl Commands (Live)

> All protected endpoints require `Authorization: Bearer <TOKEN>` header.
> Get your token via **verify-otp** login flow.

**Live URL:** `https://freightrekapi.vercel.app`

---

## 1. Customer Authentication (Public - No Token Required)

### Register New Customer
```bash
curl -X POST https://freightrekapi.vercel.app/api/customer/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ragu",
    "lastName": "Kumar",
    "countryCode": "+91",
    "phone": "9876543210",
    "email": "ragu@example.com"
  }'
```

### Send OTP (Login)
```bash
curl -X POST https://freightrekapi.vercel.app/api/customer/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "+91",
    "phone": "9876543210"
  }'
```

### Verify OTP (Get Token)
```bash
curl -X POST https://freightrekapi.vercel.app/api/customer/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "+91",
    "phone": "9876543210",
    "otp": "123456"
  }'
```
> **Response contains token** - Save it for all protected API calls below:
> ```json
> { "success": true, "message": "OTP verified", "data": { "token": "eyJhbGciOiJI..." } }
> ```

---

## 2. Customer Profile (Protected)

### Create Customer
```bash
curl -X POST https://freightrekapi.vercel.app/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Ragu Kumar",
    "email": "ragu@example.com",
    "phone": "9876543210",
    "address": "123 Main Street",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600001",
    "gstNumber": "33AABCU9603R1ZM"
  }'
```

### Get All Customers (with pagination & search)
```bash
curl -X GET "https://freightrekapi.vercel.app/api/customers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Search Customers
```bash
curl -X GET "https://freightrekapi.vercel.app/api/customers?search=ragu&status=Active&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Customer by ID
```bash
curl -X GET https://freightrekapi.vercel.app/api/customers/CUSTOMER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Customer
```bash
curl -X PUT https://freightrekapi.vercel.app/api/customers/CUSTOMER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Ragu Kumar Updated",
    "address": "456 New Street",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pincode": "641001"
  }'
```

### Delete Customer
```bash
curl -X DELETE https://freightrekapi.vercel.app/api/customers/CUSTOMER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. Wallet & Payments (Protected)

### Get Wallet Balance
```bash
curl -X GET https://freightrekapi.vercel.app/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Payment Order (Cashfree)
```bash
curl -X POST https://freightrekapi.vercel.app/api/wallet/create-payment-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "amount": 500,
    "paymentMethod": "upi"
  }'
```

### Verify Payment
```bash
curl -X POST https://freightrekapi.vercel.app/api/wallet/verify-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "orderId": "order_XXXXXXXXXXXXXX"
  }'
```

### Get Transaction History
```bash
curl -X GET "https://freightrekapi.vercel.app/api/wallet/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Transaction History (Filtered by Type)
```bash
curl -X GET "https://freightrekapi.vercel.app/api/wallet/transactions?page=1&limit=10&type=credit" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 4. Shipment / Orders (Protected)

### Create Shipment
```bash
curl -X POST https://freightrekapi.vercel.app/api/shipment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Doe",
    "add": "456 Park Avenue",
    "pin": "400001",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "phone": "9123456789",
    "order": "MY_ORDER_001",
    "paymentMode": "Prepaid",
    "shippingMode": "Surface",
    "fromName": "Ragu Kumar",
    "fromAdd": "123 Main Street",
    "fromPin": "600001",
    "fromCity": "Chennai",
    "fromState": "Tamil Nadu",
    "fromCountry": "India",
    "fromPhone": "9876543210",
    "productsDesc": "Laptop accessories",
    "weight": "2.5",
    "shipmentLength": "30",
    "shipmentWidth": "20",
    "shipmentHeight": "15",
    "quantity": "1",
    "totalAmount": "550",
    "orderType": "customer",
    "baseAmount": 500,
    "markupAmount": 50
  }'
```
> **Response fields:**
> - `orderType` — `"customer"` or `"hub"`
> - `baseAmount` — Base shipping charge (before markup)
> - `markupAmount` — Final charge after markup applied

### Get All Shipments (Paginated)
```bash
curl -X GET "https://freightrekapi.vercel.app/api/shipment/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Shipment by Order ID
```bash
curl -X GET https://freightrekapi.vercel.app/api/shipment/order/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Shipment
```bash
curl -X PUT https://freightrekapi.vercel.app/api/shipment/order/ORDER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Updated",
    "phone": "9123456000",
    "weight": "3.0",
    "productsDesc": "Updated - Laptop accessories"
  }'
```

### Delete Shipment
```bash
curl -X DELETE https://freightrekapi.vercel.app/api/shipment/order/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Track Shipment by Waybill
```bash
curl -X GET https://freightrekapi.vercel.app/api/shipment/track/WAYBILL_NUMBER_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5. Rate Calculator & Markup (Protected)

### Get Rate Calculator Markup
```bash
curl -X GET https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Rate Card Markup
```bash
curl -X GET https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Public Rate Card (No Token Required)
```bash
curl -X GET https://freightrekapi.vercel.app/api/v1/settings/public/rate-card-markup
```

---

## 6. Dashboard (Protected)

### Get Dashboard Data
```bash
curl -X GET https://freightrekapi.vercel.app/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Orders Report
```bash
curl -X GET "https://freightrekapi.vercel.app/api/dashboard/orders-report?period=thisMonth" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Orders Report - Today
```bash
curl -X GET "https://freightrekapi.vercel.app/api/dashboard/orders-report?period=today" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Orders Report - Custom Date Range
```bash
curl -X GET "https://freightrekapi.vercel.app/api/dashboard/orders-report?period=customRange&startDate=2026-01-01&endDate=2026-04-11" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 7. Careers & Job Postings (Public - No Token Required)

### List All Job Postings
```bash
curl -X GET https://freightrekapi.vercel.app/api/careers
```

### Get Job Posting by ID
```bash
curl -X GET https://freightrekapi.vercel.app/api/careers/JOB_ID_HERE
```

### Submit Job Application
```bash
curl -X POST https://freightrekapi.vercel.app/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "JOB_ID_HERE",
    "fullName": "Ragu Kumar",
    "email": "ragu@example.com",
    "phone": "9876543210",
    "resume": "https://example.com/resume.pdf",
    "coverLetter": "I am interested in this position..."
  }'
```

### Get All Applications
```bash
curl -X GET https://freightrekapi.vercel.app/api/applications
```

### Get Applications by Job Posting
```bash
curl -X GET https://freightrekapi.vercel.app/api/applications/job-posting/JOB_ID_HERE
```

---

## 8. Location Data (Public - No Token Required)

### Get Countries
```bash
curl -X GET https://freightrekapi.vercel.app/location/countries
```

### Get States by Country
```bash
curl -X GET "https://freightrekapi.vercel.app/location/states?countryId=COUNTRY_ID_HERE"
```

### Get Cities by State
```bash
curl -X GET "https://freightrekapi.vercel.app/location/cities?stateId=STATE_ID_HERE"
```

---

## PowerShell (Windows) Commands

> In Windows PowerShell, use `Invoke-RestMethod` instead of `curl`.

### Login (Get Token)
```powershell
$response = Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/customer/auth/verify-otp" -Method POST -ContentType "application/json" -Body '{"countryCode":"+91","phone":"9876543210","otp":"123456"}'
$token = $response.data.token
Write-Host "Token: $token"
```

### Use Token in Requests
```powershell
# Set headers with token
$headers = @{ "Authorization" = "Bearer $token" }

# Get Wallet Balance
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/wallet/balance" -Method GET -Headers $headers

# Get Shipments
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/shipment/orders?page=1&limit=10" -Method GET -Headers $headers

# Create Shipment
$body = @{
    name = "John Doe"
    add = "456 Park Avenue"
    pin = "400001"
    city = "Mumbai"
    state = "Maharashtra"
    country = "India"
    phone = "9123456789"
    order = "MY_ORDER_001"
    paymentMode = "Prepaid"
    shippingMode = "Surface"
    fromName = "Ragu Kumar"
    fromAdd = "123 Main Street"
    fromPin = "600001"
    fromCity = "Chennai"
    fromState = "Tamil Nadu"
    fromCountry = "India"
    fromPhone = "9876543210"
    productsDesc = "Laptop accessories"
    weight = "2.5"
    shipmentLength = "30"
    shipmentWidth = "20"
    shipmentHeight = "15"
    quantity = "1"
    totalAmount = "500"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/shipment/create" -Method POST -ContentType "application/json" -Headers $headers -Body $body

# Get Dashboard
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/dashboard" -Method GET -Headers $headers

# Get Orders Report
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/dashboard/orders-report?period=thisMonth" -Method GET -Headers $headers
```

---

## Quick Test Flow

**Step 1: Register**
```bash
curl -X POST https://freightrekapi.vercel.app/api/customer/auth/register -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","countryCode":"+91","phone":"9876543210","email":"test@example.com"}'
```

**Step 2: Verify OTP & Get Token**
```bash
curl -X POST https://freightrekapi.vercel.app/api/customer/auth/verify-otp -H "Content-Type: application/json" -d '{"countryCode":"+91","phone":"9876543210","otp":"123456"}'
```

**Step 3: Use Token for Protected APIs**
```bash
TOKEN="paste_your_token_here"



# Check wallet
curl -X GET https://freightrekapi.vercel.app/api/wallet/balance -H "Authorization: Bearer $TOKEN"

# Create shipment
curl -X POST https://freightrekapi.vercel.app/api/shipment/create -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"John","add":"Mumbai","pin":"400001","city":"Mumbai","state":"Maharashtra","phone":"9123456789","order":"TEST_001","paymentMode":"Prepaid","fromName":"Test","fromAdd":"Chennai","fromPin":"600001","fromCity":"Chennai","fromState":"Tamil Nadu","fromPhone":"9876543210","weight":"1","productsDesc":"Test"}'

# List orders
curl -X GET "https://freightrekapi.vercel.app/api/shipment/orders?page=1&limit=10" -H "Authorization: Bearer $TOKEN"

# Dashboard
curl -X GET https://freightrekapi.vercel.app/api/dashboard -H "Authorization: Bearer $TOKEN"
```
