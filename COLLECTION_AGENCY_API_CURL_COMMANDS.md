# Collection Agency Management API - cURL Commands

- **Date:** July 4, 2026
- **Live Base URL:** `https://freightrekapi.vercel.app`
- **Local Base URL:** `http://localhost:3000`
- **Swagger UI (Live):** https://freightrekapi.vercel.app/api-docs
- **Permission Module:** `Collection Agency Management` (read / write / update / delete)

> All endpoints below (except login) require a Bearer JWT token and the
> `Collection Agency Management` permission on your admin/staff role.
> Root roles bypass the permission check.

---

## STEP 1: Login to get JWT Token

```bash
curl -X POST https://freightrekapi.vercel.app/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@freightrek.com\",
    \"password\": \"Admin@123\"
  }"
```

Copy the `token` from the response and use it as `YOUR_JWT_TOKEN` below.

---

## COLLECTION AGENCY CRUD OPERATIONS

### 1. CREATE NEW COLLECTION AGENCY

```bash
curl -X POST https://freightrekapi.vercel.app/admin/collection-agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"collectionAgencyName\": \"Chennai Collection Point\",
    \"ownerName\": \"David Kumar\",
    \"phone\": \"9185647852\",
    \"status\": \"Active\",
    \"email\": \"chennai.collect@example.com\",
    \"address\": \"123 Main Street, Chennai\",
    \"city\": \"Chennai\",
    \"state\": \"Tamil Nadu\",
    \"pincode\": \"600001\",
    \"gstNumber\": \"33ABCDE1234F1Z5\",
    \"username\": \"chennai.collect@example.com\",
    \"password\": \"Secret@123\"
  }"
```

> Required fields: `collectionAgencyName`, `ownerName`, `phone`.
> `username` / `password` are optional (kept for future login support).

### 2. GET ALL COLLECTION AGENCIES (with pagination)

```bash
curl -X GET "https://freightrekapi.vercel.app/admin/collection-agency?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. GET ALL COLLECTION AGENCIES (with search)

```bash
curl -X GET "https://freightrekapi.vercel.app/admin/collection-agency?search=Chennai" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. GET ALL COLLECTION AGENCIES (filter by status)

```bash
curl -X GET "https://freightrekapi.vercel.app/admin/collection-agency?status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. GET COLLECTION AGENCY BY ID

```bash
curl -X GET https://freightrekapi.vercel.app/admin/collection-agency/COLLECTION_AGENCY_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. UPDATE COLLECTION AGENCY

```bash
curl -X PUT https://freightrekapi.vercel.app/admin/collection-agency/COLLECTION_AGENCY_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"collectionAgencyName\": \"Chennai Collection Point Updated\",
    \"phone\": \"9999999999\",
    \"email\": \"chennai.new@example.com\"
  }"
```

### 7. UPDATE COLLECTION AGENCY STATUS

```bash
curl -X PATCH https://freightrekapi.vercel.app/admin/collection-agency/COLLECTION_AGENCY_ID_HERE/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"status\": \"Inactive\"
  }"
```

### 8. DELETE COLLECTION AGENCY

```bash
curl -X DELETE https://freightrekapi.vercel.app/admin/collection-agency/COLLECTION_AGENCY_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## PowerShell Version (For Windows)

### 1. CREATE COLLECTION AGENCY (PowerShell)

```powershell
$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    collectionAgencyName = "Chennai Collection Point"
    ownerName            = "David Kumar"
    phone                = "9185647852"
    status               = "Active"
    email                = "chennai.collect@example.com"
    address              = "123 Main Street, Chennai"
    city                 = "Chennai"
    state                = "Tamil Nadu"
    pincode              = "600001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/admin/collection-agency" -Method POST -Headers $headers -Body $body
```

### 2. GET ALL COLLECTION AGENCIES (PowerShell)

```powershell
$headers = @{ "Authorization" = "Bearer YOUR_JWT_TOKEN" }
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/admin/collection-agency?page=1&limit=10" -Method GET -Headers $headers
```

### 3. UPDATE COLLECTION AGENCY STATUS (PowerShell)

```powershell
$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{ status = "Inactive" } | ConvertTo-Json

Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/admin/collection-agency/COLLECTION_AGENCY_ID_HERE/status" -Method PATCH -Headers $headers -Body $body
```

---

## Endpoints Summary

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|------------|-------------|
| 1 | POST   | `/admin/collection-agency`            | write  | Create a collection agency |
| 2 | GET    | `/admin/collection-agency`            | read   | List (pagination + search + status filter) |
| 3 | GET    | `/admin/collection-agency/:id`        | read   | Get collection agency by ID |
| 4 | PUT    | `/admin/collection-agency/:id`        | update | Update collection agency |
| 5 | PATCH  | `/admin/collection-agency/:id/status` | update | Update status (Active/Inactive) |
| 6 | DELETE | `/admin/collection-agency/:id`        | delete | Delete collection agency |

---

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `collectionAgencyName` | string | Yes | 2–100 chars, unique |
| `ownerName`            | string | Yes | 2–100 chars |
| `phone`                | string | Yes | Exactly 10 digits, globally unique across all user types |
| `status`               | string | No  | `Active` or `Inactive` (default `Active`) |
| `email`                | string | No  | Valid email |
| `address`              | string | No  | Max 500 chars |
| `city`                 | string | No  | Max 100 chars |
| `state`                | string | No  | Max 100 chars |
| `pincode`              | string | No  | Exactly 6 digits |
| `gstNumber`            | string | No  | Valid GST format |
| `username`             | string | No  | Valid email, unique |
| `password`             | string | No  | 6–100 chars (stored bcrypt-hashed) |

---

## NOTES

1. Replace `YOUR_JWT_TOKEN` with the actual token from the login response.
2. Replace `COLLECTION_AGENCY_ID_HERE` with the actual MongoDB ObjectId.
3. Phone number must be exactly 10 digits and is unique across Admin / Staff / Agency / Collection Agency / Hub.
4. All authenticated endpoints require a Bearer token.
5. `status` can only be `Active` or `Inactive`.
6. Live Swagger UI: https://freightrekapi.vercel.app/api-docs
