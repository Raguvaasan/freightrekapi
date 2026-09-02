# B2B API Curl Commands

Replace `http://localhost:3000` with your base URL and set `TOKEN_B2B` / `TOKEN_ADMIN` after login.

## Admin Token for Local Testing

First obtain `TOKEN_ADMIN` from the same environment as the vehicle request. Do not use the literal `TOKEN_ADMIN` text.

```bash
curl -X POST "http://localhost:3000/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ADMIN_EMAIL",
    "password": "ADMIN_PASSWORD"
  }'
```

Use the `token` returned by this response in the `Authorization` header below. A token from `https://freightrekapi.vercel.app` must be used with the Vercel API, not localhost, unless both environments have the same `JWT_SECRET`.

## 1. Register B2B

```bash
curl -X POST "http://localhost:3000/b2b/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alpha Logistics",
    "mobileNumber": "9876543210",
    "address": "12 MG Road, Bengaluru",
    "state": "Karnataka",
    "pincode": "560001",
    "gstNumber": "29ABCDE1234F1Z5"
  }'
```

## 2. Send OTP

```bash
curl -X POST "http://localhost:3000/b2b/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "countryCode": "+91"
  }'
```

## 3. Verify OTP

```bash
curl -X POST "http://localhost:3000/b2b/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "countryCode": "+91",
    "otp": "123456"
  }'
```

## 4. B2B Profile: Get and Edit

The B2B user can get or edit its own registration details with the login token.

```bash
curl -X GET "http://localhost:3000/b2b/auth/profile" \
  -H "Authorization: Bearer TOKEN_B2B"
```

```bash
curl -X PUT "http://localhost:3000/b2b/auth/profile" \
  -H "Authorization: Bearer TOKEN_B2B" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alpha Logistics Pvt Ltd",
    "address": "15 MG Road, Bengaluru",
    "state": "Karnataka",
    "pincode": "560001",
    "gstNumber": "29ABCDE1234F1Z5"
  }'
```

## 5. B2B User Management as Admin

```bash
curl -X GET "http://localhost:3000/admin/b2b/users?page=1&limit=10&search=alpha&status=Active" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

```bash
curl -X GET "http://localhost:3000/admin/b2b/users/B2B_USER_ID" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

```bash
curl -X PUT "http://localhost:3000/admin/b2b/users/B2B_USER_ID" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9876543210",
    "status": "Active"
  }'
```

## 6. B2B Vehicle CRUD as Admin

### Add vehicle

```bash
curl -X POST "http://localhost:3000/b2b/vehicles" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "Mini Truck",
    "capacity": "500 KG",
    "ratePerKm": 25,
    "status": "Active"
  }'
```

### Edit vehicle

```bash
curl -X PUT "http://localhost:3000/b2b/vehicles/VEHICLE_ID" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "Mini Truck",
    "capacity": "750 KG",
    "ratePerKm": 28,
    "status": "Active"
  }'
```

### Deactivate vehicle

```bash
curl -X PATCH "http://localhost:3000/b2b/vehicles/VEHICLE_ID/deactivate" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Delete vehicle

```bash
curl -X DELETE "http://localhost:3000/b2b/vehicles/VEHICLE_ID" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Search + pagination

```bash
curl -X GET "http://localhost:3000/b2b/vehicles?page=1&limit=10&search=truck&status=Active" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

## 7. Create B2B Order Draft

```bash
curl -X POST "http://localhost:3000/b2b/orders/draft" \
  -H "Authorization: Bearer TOKEN_B2B" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingCustomer": {
      "name": "Rahul",
      "phoneNumber": "9000000001",
      "address": "Bengaluru Warehouse",
      "pincode": "560001"
    },
    "deliveryCustomer": {
      "name": "Kumar",
      "phoneNumber": "9000000002",
      "address": "Chennai Office",
      "pincode": "600001"
    },
    "approximateWeight": 350
  }'
```

## 8. Get Draft / Step 2 Details

```bash
curl -X GET "http://localhost:3000/b2b/orders/draft/DRAFT_ID/step2" \
  -H "Authorization: Bearer TOKEN_B2B"
```

## 9. Confirm B2B Order

```bash
curl -X POST "http://localhost:3000/b2b/orders/draft/DRAFT_ID/confirm" \
  -H "Authorization: Bearer TOKEN_B2B"
```

## 10. Get Order Details

```bash
curl -X GET "http://localhost:3000/b2b/orders/ORDER_ID" \
  -H "Authorization: Bearer TOKEN_B2B"
```

## 11. B2B Order Listing: Search, Filters and Pagination

```bash
curl -X GET "http://localhost:3000/b2b/orders?page=1&limit=10&status=CONFIRMED&search=Rahul&bookingPincode=560001&deliveryPincode=600001&vehicleType=Mini%20Truck&minWeight=100&maxWeight=1000&minAmount=1000&maxAmount=10000&minDistance=10&maxDistance=500&startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer TOKEN_B2B"
```

Supported B2B-user listing query parameters: `page`, `limit`, `status`, `search`, `bookingPincode`, `deliveryPincode`, `vehicleType`, `minWeight`, `maxWeight`, `minAmount`, `maxAmount`, `minDistance`, `maxDistance`, `startDate`, and `endDate`.

## 12. Admin Order Listing: Search, Filters and Pagination

```bash
curl -X GET "http://localhost:3000/admin/b2b/orders?page=1&limit=10&status=CONFIRMED&search=Rahul&b2bUserId=B2B_USER_ID&orderId=ORDER_ID&vehicleId=VEHICLE_ID&bookingPincode=560001&deliveryPincode=600001&vehicleType=Mini%20Truck&minWeight=100&maxWeight=1000&minAmount=1000&maxAmount=10000&minDistance=10&maxDistance=500&startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

Supported admin query parameters: all B2B-user listing parameters above, plus `b2bUserId`, `orderId`, and `vehicleId`.

```bash
curl -X GET "http://localhost:3000/admin/b2b/orders/ORDER_ID" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```
