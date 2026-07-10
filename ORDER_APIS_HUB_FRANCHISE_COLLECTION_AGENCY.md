# Order APIs — Hub, Franchise & Collection Agency

Single reference for the **order (shipment) management APIs** available to the three portals: **Hub**, **Franchise (Agency)**, and **Collection Agency**.

- **Live Base URL:** `https://freightrekapi.vercel.app`
- **Local Base URL:** `http://localhost:3000`
- **Swagger UI (Live):** https://freightrekapi.vercel.app/api-docs

> All order endpoints require a **Bearer JWT token** obtained from that portal's login.
> The token can belong to either the **entity itself** (hub / franchise / collection agency) **or its staff** — the API resolves the owning entity from the token automatically and scopes every order to it.

---

## 0. Base paths

| Portal | Order base path | Login to get token |
|--------|-----------------|--------------------|
| **Hub** | `/hub/orders` | `POST /admin/hub/login` or `/admin/hub/unified-login` |
| **Franchise** | `/admin/franchise/orders` | `POST /admin/agency/login/send-otp` → `/verify-otp` |
| **Collection Agency** | `/admin/collection-agency/orders` | `POST /admin/collection-agency/login/send-otp` → `/verify-otp` |

All three expose the **same six endpoints**:

| # | Method | Path (relative to base) | Description |
|---|--------|-------------------------|-------------|
| 1 | POST   | `/create`          | Create a new order |
| 2 | GET    | `/`                | List orders (pagination + status filter) |
| 3 | GET    | `/track/:waybill`  | Track an order by waybill (Delhivery) |
| 4 | GET    | `/:orderId`        | Get a single order by orderId |
| 5 | PUT    | `/:orderId`        | Update an order |
| 6 | DELETE | `/:orderId`        | Delete an order |

---

## 1. Get a login token

### Hub
```bash
curl -X POST https://freightrekapi.vercel.app/admin/hub/login \
  -H "Content-Type: application/json" \
  -d "{ \"username\": \"hub@example.com\", \"password\": \"secret123\" }"
```

### Franchise (OTP)
```bash
# Step 1 — send OTP
curl -X POST https://freightrekapi.vercel.app/admin/agency/login/send-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"countryCode\": \"+91\" }"

# Step 2 — verify OTP → returns token
curl -X POST https://freightrekapi.vercel.app/admin/agency/login/verify-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"countryCode\": \"+91\", \"otp\": \"123456\" }"
```

### Collection Agency (OTP)
```bash
# Step 1 — send OTP
curl -X POST https://freightrekapi.vercel.app/admin/collection-agency/login/send-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"countryCode\": \"+91\" }"

# Step 2 — verify OTP → returns token
curl -X POST https://freightrekapi.vercel.app/admin/collection-agency/login/verify-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"countryCode\": \"+91\", \"otp\": \"123456\" }"
```

Copy the `token` from the response and use it as `YOUR_JWT_TOKEN` below.

---

## 2. HUB ORDERS — `/hub/orders`

### 2.1 Create order
```bash
curl -X POST https://freightrekapi.vercel.app/hub/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"John Doe\",
    \"add\": \"12 Anna Salai\",
    \"pin\": \"600002\",
    \"city\": \"Chennai\",
    \"state\": \"Tamil Nadu\",
    \"phone\": \"9876500001\",
    \"order\": \"REF-HUB-001\",
    \"paymentMode\": \"COD\",
    \"codAmount\": \"1500\",
    \"totalAmount\": \"1500\",
    \"weight\": \"1000\",
    \"productsDesc\": \"Books\",
    \"shippingMode\": \"Surface\"
  }"
```

> For a **hub-type** pickup order add `"orderType": "hub"`, a `pickupLocation` object, and the from-address fields (`fromName`, `fromAdd`, `fromPin`, `fromCity`, `fromState`, `fromPhone`).
> `assignedStaffId` (optional) must belong to the same hub.

### 2.2 List orders
```bash
curl -X GET "https://freightrekapi.vercel.app/hub/orders?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2.3 Track order
```bash
curl -X GET https://freightrekapi.vercel.app/hub/orders/track/WAYBILL_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2.4 Get order by id
```bash
curl -X GET https://freightrekapi.vercel.app/hub/orders/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2.5 Update order
```bash
curl -X PUT https://freightrekapi.vercel.app/hub/orders/ORDER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{ \"phone\": \"9999999999\", \"status\": \"in_transit\" }"
```

### 2.6 Delete order
```bash
curl -X DELETE https://freightrekapi.vercel.app/hub/orders/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 3. FRANCHISE ORDERS — `/admin/franchise/orders`

Orders are scoped to the logged-in **franchise**. Prepaid orders debit the **franchise wallet**.

### 3.1 Create order
```bash
curl -X POST https://freightrekapi.vercel.app/admin/franchise/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"John Doe\",
    \"add\": \"12 Anna Salai\",
    \"pin\": \"600002\",
    \"city\": \"Chennai\",
    \"state\": \"Tamil Nadu\",
    \"phone\": \"9876500001\",
    \"order\": \"REF-FR-001\",
    \"paymentMode\": \"Prepaid\",
    \"totalAmount\": \"1500\",
    \"weight\": \"1000\",
    \"productsDesc\": \"Books\",
    \"shippingMode\": \"Surface\"
  }"
```

> `assignedStaffId` (optional) must belong to the same franchise.
> Prepaid orders require sufficient franchise wallet balance (returns `Insufficient wallet balance` otherwise). Use `"paymentMode": "COD"` with `codAmount` to skip the wallet debit.

### 3.2 List orders
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/franchise/orders?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.3 Track order
```bash
curl -X GET https://freightrekapi.vercel.app/admin/franchise/orders/track/WAYBILL_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.4 Get order by id
```bash
curl -X GET https://freightrekapi.vercel.app/admin/franchise/orders/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.5 Update order
```bash
curl -X PUT https://freightrekapi.vercel.app/admin/franchise/orders/ORDER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{ \"phone\": \"9999999999\", \"status\": \"in_transit\" }"
```

### 3.6 Delete order
```bash
curl -X DELETE https://freightrekapi.vercel.app/admin/franchise/orders/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4. COLLECTION AGENCY ORDERS — `/admin/collection-agency/orders`

Orders are scoped to the logged-in **collection agency**. No wallet debit (collection agencies have no wallet).

### 4.1 Create order
```bash
curl -X POST https://freightrekapi.vercel.app/admin/collection-agency/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"John Doe\",
    \"add\": \"12 Anna Salai\",
    \"pin\": \"600002\",
    \"city\": \"Chennai\",
    \"state\": \"Tamil Nadu\",
    \"phone\": \"9876500001\",
    \"order\": \"REF-CA-001\",
    \"paymentMode\": \"COD\",
    \"codAmount\": \"1500\",
    \"totalAmount\": \"1500\",
    \"weight\": \"1000\",
    \"productsDesc\": \"Books\",
    \"shippingMode\": \"Surface\"
  }"
```

> `assignedStaffId` (optional) must belong to the same collection agency.

### 4.2 List orders
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/collection-agency/orders?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.3 Track order
```bash
curl -X GET https://freightrekapi.vercel.app/admin/collection-agency/orders/track/WAYBILL_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.4 Get order by id
```bash
curl -X GET https://freightrekapi.vercel.app/admin/collection-agency/orders/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.5 Update order
```bash
curl -X PUT https://freightrekapi.vercel.app/admin/collection-agency/orders/ORDER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{ \"phone\": \"9999999999\", \"status\": \"in_transit\" }"
```

### 4.6 Delete order
```bash
curl -X DELETE https://freightrekapi.vercel.app/admin/collection-agency/orders/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5. PowerShell examples (Windows)

### Create (any portal — change the URL)
```powershell
$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    name         = "John Doe"
    add          = "12 Anna Salai"
    pin          = "600002"
    city         = "Chennai"
    state        = "Tamil Nadu"
    phone        = "9876500001"
    order        = "REF-001"
    paymentMode  = "COD"
    codAmount    = "1500"
    totalAmount  = "1500"
    weight       = "1000"
    productsDesc = "Books"
    shippingMode = "Surface"
} | ConvertTo-Json

# Hub:                https://freightrekapi.vercel.app/hub/orders/create
# Franchise:          https://freightrekapi.vercel.app/admin/franchise/orders/create
# Collection Agency:  https://freightrekapi.vercel.app/admin/collection-agency/orders/create
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/hub/orders/create" -Method POST -Headers $headers -Body $body
```

### List (any portal)
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_JWT_TOKEN" }
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/admin/franchise/orders?page=1&limit=10" -Method GET -Headers $headers
```

---

## 6. Request body fields (create / update)

| Field | Type | Required (create) | Notes |
|-------|------|-------------------|-------|
| `name` | string | Yes | Consignee name |
| `add` | string | Yes | Consignee address |
| `pin` | string | Yes | 6 digits |
| `city` | string | Yes | |
| `state` | string | Yes | |
| `phone` | string | Yes | 10 digits |
| `order` | string | Yes | Your order reference |
| `paymentMode` | string | No | `Prepaid` or `COD` (default `COD`) |
| `codAmount` | string | No | Required for COD if `totalAmount` not given |
| `totalAmount` | string | No | Used for Prepaid wallet debit (franchise) |
| `weight` | string | No | In grams |
| `productsDesc` | string | No | |
| `shippingMode` | string | No | `Surface` or `Express` (default `Surface`) |
| `fromName`,`fromAdd`,`fromPin`,`fromCity`,`fromState`,`fromPhone` | string | No | Pickup / seller address |
| `pickupLocation` | object | No | `{ name, address, pincode, city, state, country, phone }` |
| `assignedStaffId` | string | No | Must belong to the same portal entity |
| `orderType` | string | No | `hub` or `customer` (hub portal only) |

> Update accepts a subset (`name`, `add`, `pin`, `city`, `state`, `phone`, `paymentMode`, `status`, from-address fields, `weight`, `shippingMode`, `assignedStaffId`, …).
> `status` values: `pending`, `created`, `Active`, `in_transit`, `delivered`, `failed`, `cancelled`.

---

## 7. Notes

1. Replace `YOUR_JWT_TOKEN`, `ORDER_ID_HERE`, and `WAYBILL_HERE` with real values.
2. The token may belong to the **entity or its staff** — orders are always scoped to the owning hub / franchise / collection agency, so a portal only sees its own orders.
3. `assignedStaffId`, if supplied, must belong to the **same** entity as the token, else `400`.
4. **Franchise** Prepaid orders debit the franchise wallet; **Hub** and **Collection Agency** orders skip the wallet check.
5. Tracking calls the Delhivery API and requires the waybill to belong to your entity's order.
6. Live Swagger UI: https://freightrekapi.vercel.app/api-docs
