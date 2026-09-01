# Collection Agency — Login API Documentation

Reference for **how a Collection Agency owner and its staff log in**.

> Legend: 🔓 = public (no token) · 🔒 = requires the collection agency's own JWT · 🛡️ = requires admin token + permission

Base URL example: `https://<host>/admin/collection-agency`

---

## Summary — which login is which

| Who | Method | Credential |
|-----|--------|------------|
| **Collection Agency owner** | Phone **OTP** only | phone + countryCode → OTP |
| **Collection Agency staff** | Username + **password** | username (email) + password |

> The owner login is **OTP-only** (mirrors the Franchise login pattern). There is **no** email/password login for the owner. `username`/`password` fields exist on the create-agency payload but are **not** wired to any owner login route.

---

## 1. Owner Login (OTP) — Public

### 1.1 Send OTP
`POST /admin/collection-agency/login/send-otp` 🔓

**Body**
```json
{ "phone": "9876543210", "countryCode": "+91" }
```
- `phone` — required, exactly 10 digits
- `countryCode` — required (e.g. `+91`)

**Behaviour**
- Finds an **Active** `CollectionAgency` by `phone`. If none → `400`.
- Generates a 6-digit OTP, valid **5 minutes**, stored with `userType: 'collection_agency'`.
- Sends SMS via Ping4SMS.

**Success `200`**
```json
{ "success": true, "message": "OTP sent successfully" }
```

**Error `400`**
```json
{ "success": false, "message": "No active collection agency account found with this phone number" }
```

### 1.2 Verify OTP → Login
`POST /admin/collection-agency/login/verify-otp` 🔓

**Body**
```json
{ "phone": "9876543210", "countryCode": "+91", "otp": "123456" }
```
- `otp` — required, exactly 6 digits

**Success `200`** — returns JWT token
```json
{
  "success": true,
  "message": "Login successful",
  "token": "<JWT>",
  "data": {
    "id": "665...",
    "collectionAgencyName": "ABC Collections",
    "ownerName": "Ramesh",
    "phone": "9876543210",
    "email": "abc@example.com",
    "status": "Active",
    "address": "...",
    "city": "...",
    "state": "...",
    "pincode": "600001"
  }
}
```

**Error `401`** — one of:
```json
{ "success": false, "message": "OTP not found. Please request a new one" }
{ "success": false, "message": "OTP has expired. Please request a new one" }
{ "success": false, "message": "Invalid OTP" }
```

Use the returned `token` as `Authorization: Bearer <token>` for the collection-agency portal routes below.

---

## 2. Staff Login (username + password)

Collection agency staff use the shared staff login (bcrypt password). Staff records have `type: 'collection_agency'` and a `collectionAgencyId`.

`POST /admin/staff/login` (generic staff login) 🔓

**Body**
```json
{ "username": "staff@example.com", "password": "secret123" }
```

**Success `200`** — returns staff data + JWT `token`. Inactive account or bad credentials → error.

> An OTP login path for staff also exists in `staffService.sendLoginOtp` / `verifyLoginOtp` (pass `type` to scope it), but the primary staff login is username + password.

---

## 3. APIs available AFTER Owner login (collection agency token)

All mounted under `/admin/collection-agency` **before** the admin auth middleware, so they resolve as literal paths.

### 3.1 Staff Management — `/admin/collection-agency/staff` 🔒
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/collection-agency/staff` | List staff of the logged-in collection agency |
| POST | `/admin/collection-agency/staff` | Create staff (`type` + `collectionAgencyId` injected from token) |
| GET | `/admin/collection-agency/staff/:id` | Get staff (only if it belongs to the agency) |
| PUT | `/admin/collection-agency/staff/:id` | Update staff (scoped) |
| PATCH | `/admin/collection-agency/staff/:id/status` | Update staff status (scoped) |
| DELETE | `/admin/collection-agency/staff/:id` | Delete staff (scoped) |

### 3.2 Role Management — `/admin/collection-agency/role` 🔒
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/collection-agency/role` | Create role |
| GET | `/admin/collection-agency/role` | List roles |
| GET | `/admin/collection-agency/role/:id` | Get role by id (scoped) |
| PUT | `/admin/collection-agency/role/:id` | Update role (scoped) |
| DELETE | `/admin/collection-agency/role/:id` | Delete role (scoped) |

### 3.3 Orders — `/admin/collection-agency/orders` 🔒
Order management for the logged-in collection agency.

---

## 4. Admin-side Management (admin token — Collection Agency Management module) 🛡️

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/collection-agency` | 🛡️ write | Create collection agency |
| GET | `/admin/collection-agency` | 🛡️ read | List (pagination + search + status) |
| GET | `/admin/collection-agency/:id` | 🛡️ read | Get by id |
| PUT | `/admin/collection-agency/:id` | 🛡️ update | Update |
| PATCH | `/admin/collection-agency/:id/status` | 🛡️ update | Toggle Active/Inactive |
| DELETE | `/admin/collection-agency/:id` | 🛡️ delete | Delete |

**Create body** (`POST /admin/collection-agency`)
```json
{
  "collectionAgencyName": "ABC Collections",
  "ownerName": "Ramesh",
  "phone": "9876543210",
  "email": "abc@example.com",
  "status": "Active",
  "address": "12 Main St",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "pincode": "600001",
  "gstNumber": "33ABCDE1234F1Z5"
}
```
Required: `collectionAgencyName`, `ownerName`, `phone` (10 digits). All others optional. `phone` must be globally unique.

---

## 5. cURL quick reference

```bash
# 1. Send OTP
curl -X POST https://<host>/admin/collection-agency/login/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","countryCode":"+91"}'

# 2. Verify OTP -> get token
curl -X POST https://<host>/admin/collection-agency/login/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","countryCode":"+91","otp":"123456"}'

# 3. Use token on portal routes
curl https://<host>/admin/collection-agency/staff \
  -H "Authorization: Bearer <JWT>"
```

---

## Source references
- Routes: `src/routes/admin/collectionAgency.routes.ts`
- Owner OTP controller: `src/controllers/admin/collectionAgency.controller.ts`
- Owner OTP service: `src/services/admin/collectionAgency.service.ts` (`sendLoginOtp`, `verifyLoginOtp`)
- OTP validators: `src/validators/admin/collectionAgency.validator.ts`
- Staff login service: `src/services/admin/staff.service.ts`
- OTP model (`userType: 'collection_agency'`): `src/models/customer/otp.model.ts`
