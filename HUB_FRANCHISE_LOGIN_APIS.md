# Hub & Franchise Login — API Documentation

Reference document listing **every API available under Hub login and Franchise login**, and the current gap for Collection Agency.

> Legend: 🔓 = public (no token) · 🔒 = requires that portal's JWT token · 🛡️ = requires admin token + permission

---

## 1. HUB LOGIN

### 1.1 Login APIs (public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/hub/login` | 🔓 | Hub direct login (username + password) |
| POST | `/admin/hub/unified-login` | 🔓 | Unified login — logs in either Hub admin OR Hub staff, returns `loginType` (`hub` / `hub_staff`) |

**Body (both):**
```json
{ "username": "hub@example.com", "password": "secret123" }
```
Returns a JWT token used for all `/hub/*` endpoints below.

> **Credentials are optional now.** `POST /admin/hub` no longer requires
> `username` / `password`, so a hub created today has none and signs in by phone
> OTP at `/admin/login/send-otp` → `/admin/login/verify-otp` instead. The two
> username/password routes above still work for hubs that do have credentials;
> a hub without a password gets a clear message rather than a 500.
>
> Run once before creating credential-less hubs:
> `node scripts/make-hub-username-sparse.js` — the unique index on
> `hubs.username` was not sparse, so the *second* hub without a username would
> otherwise fail with a duplicate-key error.

### 1.2 Hub Management (admin token — Hub Management module)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/hub` | 🛡️ write | Create hub — `username` / `password` are **optional** |
| GET | `/admin/hub` | 🛡️ read | List all hubs |
| GET | `/admin/hub/:id` | 🛡️ read | Get hub by id |
| PUT | `/admin/hub/:id` | 🛡️ update | Update hub |
| DELETE | `/admin/hub/:id` | 🛡️ delete | Delete hub |

### 1.3 APIs available AFTER Hub login (hub token) — mounted in `app.ts`
| Base path | Module | Description |
|-----------|--------|-------------|
| `/hub/orders` | Hub Orders | Order management for the logged-in hub |
| `/hub/staff` | Hub Staff | Hub staff (login/list) |
| `/hub/manage/staff` | Hub Manage Staff | CRUD staff for the logged-in hub |
| `/hub/role` | Hub Role | Role management for the logged-in hub |
| `/hub/dashboard` | Hub Dashboard | Parcel dashboard for the logged-in hub (courier one moved to `/hub/dashboard/shipments`) |
| `/hub/parcel-order` | Parcel Flow | Parcels routed to this hub |

---

## 2. FRANCHISE (AGENCY) LOGIN

### 2.1 Login APIs (public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/agency/login/send-otp` | 🔓 | Send OTP to franchise phone (Ping4SMS) |
| POST | `/admin/agency/login/verify-otp` | 🔓 | Verify OTP → returns JWT token |

**send-otp body:**
```json
{ "phone": "9876543210", "countryCode": "+91" }
```
**verify-otp body:**
```json
{ "phone": "9876543210", "countryCode": "+91", "otp": "123456" }
```

> Note: a username/password login (`agencyService.loginFranchise`) also exists in code but is **not wired to a route** — only OTP login is active for franchise.

### 2.2 Agency Management (admin token — Agency Management module)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/agency` | 🛡️ write | Create agency |
| GET | `/admin/agency` | 🛡️ read | List agencies (pagination + search + status) |
| GET | `/admin/agency/:id` | 🛡️ read | Get agency by id |
| PUT | `/admin/agency/:id` | 🛡️ update | Update agency |
| PATCH | `/admin/agency/:id/status` | 🛡️ update | Toggle Active/Inactive |
| DELETE | `/admin/agency/:id` | 🛡️ delete | Delete agency |

### 2.3 APIs available AFTER Franchise login (franchise token)

**Franchise Staff Management** — `/admin/franchise/staff` (uses shared `Staff` model, `type: 'franchise'`, scoped to the logged-in `franchiseId`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/franchise/staff` | List staff of the logged-in franchise (pagination, search, status, roleId) |
| POST | `/admin/franchise/staff` | Create staff under the logged-in franchise |
| GET | `/admin/franchise/staff/:id` | Get staff (only if belongs to franchise) |
| PUT | `/admin/franchise/staff/:id` | Update staff (only if belongs to franchise) |
| PATCH | `/admin/franchise/staff/:id/status` | Update staff status |
| DELETE | `/admin/franchise/staff/:id` | Delete staff |

**Franchise Role Management** — `/admin/franchise/role` (separate `FranchiseRole` model, scoped to `franchiseId`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/franchise/role` | Create role for the logged-in franchise |
| GET | `/admin/franchise/role` | List roles of the logged-in franchise |
| GET | `/admin/franchise/role/:id` | Get role by id (scoped) |
| PUT | `/admin/franchise/role/:id` | Update role (scoped) |
| DELETE | `/admin/franchise/role/:id` | Delete role (scoped) |

---

## 3. COLLECTION AGENCY — Current State vs Required

### 3.1 What EXISTS today (admin token — Collection Agency Management module)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/collection-agency` | 🛡️ write | Create collection agency |
| GET | `/admin/collection-agency` | 🛡️ read | List collection agencies |
| GET | `/admin/collection-agency/:id` | 🛡️ read | Get by id |
| PUT | `/admin/collection-agency/:id` | 🛡️ update | Update |
| PATCH | `/admin/collection-agency/:id/status` | 🛡️ update | Toggle status |
| DELETE | `/admin/collection-agency/:id` | 🛡️ delete | Delete |

**❌ No login API. ❌ No staff management. ❌ No role management.**

### 3.2 What was BUILT (full parity with Franchise login) ✅

**Login APIs (public, OTP — mirrors franchise):**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/collection-agency/login/send-otp` | 🔓 | Send OTP to collection agency phone |
| POST | `/admin/collection-agency/login/verify-otp` | 🔓 | Verify OTP → returns JWT token |

```
send-otp   body: { "phone": "9876543210", "countryCode": "+91" }
verify-otp body: { "phone": "9876543210", "countryCode": "+91", "otp": "123456" }
```

**Staff Management (collection agency token) — `/admin/collection-agency/staff`:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/collection-agency/staff` | List staff of the logged-in collection agency |
| POST | `/admin/collection-agency/staff` | Create staff (type + agencyId injected from token) |
| GET | `/admin/collection-agency/staff/:id` | Get staff (only if belongs to agency) |
| PUT | `/admin/collection-agency/staff/:id` | Update staff (scoped) |
| PATCH | `/admin/collection-agency/staff/:id/status` | Update staff status (scoped) |
| DELETE | `/admin/collection-agency/staff/:id` | Delete staff (scoped) |

**Role Management (collection agency token) — `/admin/collection-agency/role`:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/collection-agency/role` | Create role |
| GET | `/admin/collection-agency/role` | List roles |
| GET | `/admin/collection-agency/role/:id` | Get role by id (scoped) |
| PUT | `/admin/collection-agency/role/:id` | Update role (scoped) |
| DELETE | `/admin/collection-agency/role/:id` | Delete role (scoped) |

**Files added / changed:**
- `models/customer/otp.model.ts` — added `collection_agency` to `userType`.
- `models/admin/staff.model.ts` — added `collection_agency` type + `collectionAgencyId` field/index.
- `models/admin/collectionAgencyRole.model.ts` — **new** (mirrors `FranchiseRole`).
- `services/admin/collectionAgency.service.ts` — added `sendLoginOtp` / `verifyLoginOtp`.
- `services/admin/collectionAgencyRole.service.ts` — **new**.
- `services/admin/staff.service.ts` — `resolveRole` + create/list/get/update now handle `collection_agency`.
- `controllers/admin/collectionAgency.controller.ts` — OTP login handlers.
- `controllers/admin/collectionAgency-staff.controller.ts` — **new**.
- `controllers/admin/collectionAgencyRole.controller.ts` — **new**.
- `validators/admin/collectionAgency.validator.ts` — OTP schemas.
- `validators/admin/collectionAgencyStaff.validator.ts` — **new**.
- `validators/admin/collectionAgencyRole.validator.ts` — **new**.
- `routes/admin/collectionAgency-staff.routes.ts`, `routes/admin/collectionAgencyRole.routes.ts` — **new**, nested inside `collectionAgency.routes.ts` before the `/:id` routes.

> Note: staff & role routes are nested inside the existing `/admin/collection-agency` router **before** `authMiddleware` and the `/:id` routes, so `/staff` and `/role` resolve as literal paths (not as an `:id`).
