# Fleet & Parcel Management APIs — Route, Branch, Vehicle, Driver & Parcel Order

Complete API reference for the **Route**, **Vehicle**, **Driver**, and **Parcel Order** management modules in the admin panel (the Parcel Management flow: branch/franchise → parcel booking → charge → tracking).

> Legend: 🔒 = requires admin JWT token + module permission

Base URL example: `https://freightrekapi.vercel.app` (local: `http://localhost:3000`)

---

## Authentication

All endpoints below require:

1. A valid **admin JWT token** in the header: `Authorization: Bearer <token>`
2. The logged-in user's role must have the matching **module permission** (`read` / `write` / `update` / `delete`), or be a **root** role.

**Get a token:**
```
POST /admin/auth/login
{ "email": "admin@freightrek.com", "password": "Admin@123" }
```
The response returns a `token` — use it as `Authorization: Bearer <token>`.

| Module | Permission name | Base path |
|--------|-----------------|-----------|
| Route | `Route Management` | `/admin/route` |
| Vehicle | `Vehicle Management` | `/admin/vehicle` |
| Driver | `Driver Management` | `/admin/driver` |
| Parcel Order | `Parcel Management` | `/admin/parcel-order` |

---

## Common behaviour (Route, Vehicle, Driver)

These three modules expose the same 6 CRUD endpoints:

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/admin/<module>` | write | Create a record |
| GET | `/admin/<module>` | read | List with pagination + search + status filter |
| GET | `/admin/<module>/:id` | read | Get a single record by ID |
| PUT | `/admin/<module>/:id` | update | Update a record |
| PATCH | `/admin/<module>/:id/status` | update | Toggle status (Active / Inactive) |
| DELETE | `/admin/<module>/:id` | delete | Delete a record |

> **Route** adds a 7th endpoint — `PATCH /admin/route/:id/branches` (Branch Management, see §1).
> **Parcel Order** follows a similar CRUD shape but its `status` endpoint drives a parcel lifecycle (not Active/Inactive) and it adds a `/charge` endpoint — see §4.

**List query params** (`GET /admin/<module>`):
- `page` — page number (default `1`)
- `limit` — items per page (default `10`)
- `search` — case-insensitive text search across key fields
- `status` — filter by `Active` or `Inactive`

**Standard response shapes:**

Success (create/update):
```json
{ "success": true, "message": "...", "data": { } }
```

List:
```json
{
  "success": true,
  "data": {
    "<module>s": [ ],
    "pagination": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
  }
}
```

Error:
```json
{ "success": false, "message": "..." }
```

Status codes: `201` create · `200` ok · `400` validation/duplicate · `401` no/invalid token · `403` permission denied · `404` not found · `500` server error.

---

# 1. Route Management 🔒

Base path: `/admin/route`

### Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `routeName` | string | ✅ | 2–150 chars |
| `from` | string | ✅ | Origin location |
| `to` | string | ✅ | Destination location |
| `branches` | string[] | ❌ | Array of branch names (default `[]`) |
| `transportationCharge` | number | ❌ | Default charge auto-applied to parcel orders on this route (default `0`) |
| `status` | enum | ❌ | `Active` / `Inactive` (default `Active`) |

> Duplicate rule: the same `(from, to)` pair cannot be created twice → `400`.

### Branch Management (2.2) — `PATCH /admin/route/:id/branches`
Replaces the route's branch list (trimmed + de-duplicated). Used by the Branch Management screen.
```json
{ "branches": ["Chengalpattu", "Villupuram", "Trichy", "Erode", "Coimbatore"] }
```
> Branches can also be set via the normal `PUT /admin/route/:id` with a `branches` field.

### Create — `POST /admin/route`
```json
{
  "routeName": "Chennai - Bangalore Express",
  "from": "Chennai",
  "to": "Bangalore",
  "branches": ["Guindy", "Tambaram"],
  "status": "Active"
}
```

### List — `GET /admin/route?page=1&limit=10&search=&status=`
Search matches: `routeName`, `from`, `to`, `branches`.

### Get by ID — `GET /admin/route/:id`
### Update — `PUT /admin/route/:id` (any subset of fields)
### Update status — `PATCH /admin/route/:id/status`
```json
{ "status": "Inactive" }
```
### Delete — `DELETE /admin/route/:id`

### Sample response
```json
{
  "success": true,
  "message": "Route created successfully",
  "data": {
    "_id": "665a1f2c8b3e4a0012ab34cd",
    "routeName": "Chennai - Bangalore Express",
    "from": "Chennai",
    "to": "Bangalore",
    "branches": ["Guindy", "Tambaram"],
    "status": "Active",
    "createdAt": "2026-07-30T06:00:00.000Z",
    "updatedAt": "2026-07-30T06:00:00.000Z"
  }
}
```

---

# 2. Vehicle Management 🔒

Base path: `/admin/vehicle`

### Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vehicleType` | string | ✅ | e.g. `Truck`, `Container Truck` |
| `capacity` | string | ✅ | e.g. `10 Ton` |
| `vehicleRegistrationNumber` | string | ✅ | **Unique**, stored uppercase |
| `rcNumber` | string | ✅ | RC number |
| `insuranceNumber` | string | ✅ | Insurance number |
| `status` | enum | ❌ | `Active` / `Inactive` (default `Active`) |

> Duplicate rule: `vehicleRegistrationNumber` must be unique → `400` if repeated.

### Create — `POST /admin/vehicle`
```json
{
  "vehicleType": "Truck",
  "capacity": "10 Ton",
  "vehicleRegistrationNumber": "TN01AB1234",
  "rcNumber": "RC123456789",
  "insuranceNumber": "INS987654321",
  "status": "Active"
}
```

### List — `GET /admin/vehicle?page=1&limit=10&search=&status=`
Search matches: `vehicleType`, `vehicleRegistrationNumber`, `rcNumber`, `insuranceNumber`.

### Get by ID — `GET /admin/vehicle/:id`
### Update — `PUT /admin/vehicle/:id` (any subset of fields)
### Update status — `PATCH /admin/vehicle/:id/status`
```json
{ "status": "Inactive" }
```
### Delete — `DELETE /admin/vehicle/:id`

### Sample response
```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "_id": "665a20aa8b3e4a0012ab34ce",
    "vehicleType": "Truck",
    "capacity": "10 Ton",
    "vehicleRegistrationNumber": "TN01AB1234",
    "rcNumber": "RC123456789",
    "insuranceNumber": "INS987654321",
    "status": "Active",
    "createdAt": "2026-07-30T06:05:00.000Z",
    "updatedAt": "2026-07-30T06:05:00.000Z"
  }
}
```

---

# 3. Driver Management 🔒

Base path: `/admin/driver`

### Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `driverName` | string | ✅ | 2–100 chars |
| `phoneNumber` | string | ✅ | Exactly 10 digits |
| `licenseNumber` | string | ✅ | **Unique**, stored uppercase |
| `dateOfExpiry` | date | ✅ | ISO date `YYYY-MM-DD` |
| `status` | enum | ❌ | `Active` / `Inactive` (default `Active`) |

> Duplicate rule: `licenseNumber` must be unique → `400` if repeated.

### Create — `POST /admin/driver`
```json
{
  "driverName": "Ramesh Kumar",
  "phoneNumber": "9876543210",
  "licenseNumber": "TN1420110012345",
  "dateOfExpiry": "2028-05-31",
  "status": "Active"
}
```

### List — `GET /admin/driver?page=1&limit=10&search=&status=`
Search matches: `driverName`, `phoneNumber`, `licenseNumber`.

### Get by ID — `GET /admin/driver/:id`
### Update — `PUT /admin/driver/:id` (any subset of fields)
### Update status — `PATCH /admin/driver/:id/status`
```json
{ "status": "Inactive" }
```
### Delete — `DELETE /admin/driver/:id`

### Sample response
```json
{
  "success": true,
  "message": "Driver created successfully",
  "data": {
    "_id": "665a21bb8b3e4a0012ab34cf",
    "driverName": "Ramesh Kumar",
    "phoneNumber": "9876543210",
    "licenseNumber": "TN1420110012345",
    "dateOfExpiry": "2028-05-31T00:00:00.000Z",
    "status": "Active",
    "createdAt": "2026-07-30T06:10:00.000Z",
    "updatedAt": "2026-07-30T06:10:00.000Z"
  }
}
```

---

# 4. Parcel Management (Order Booking & Tracking) 🔒

Base path: `/admin/parcel-order` · Permission: `Parcel Management`

This module implements the full parcel flow from the module doc: **Order Creation (2.3) → Transportation Charge (2.4) → Parcel Tracking / Status (2.5)**.

### Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orderNumber` | string | auto | Generated `003-611-380` (read-only) |
| `branch` | ObjectId | ✅ | Booking branch = **franchise** (`Agency` _id from `/admin/agency`); must be **Active** |
| `bookingCustomer.name` | string | ✅ | Booking customer name |
| `bookingCustomer.mobileNumber` | string | ✅ | 10 digits |
| `paymentType` | enum | ✅ | `Paid` / `To Pay` / `Credit` |
| `deliveryCustomer.name` | string | ✅ | Delivery customer name |
| `deliveryCustomer.mobileNumber` | string | ✅ | 10 digits |
| `deliveryCustomer.deliveryBranch` | ObjectId | ✅ | Destination branch (`Agency` _id) chosen from `GET /admin/parcel-order/options/delivery-branches`; must be **Active** |
| `pickupAddress` | string | ❌ | Where the parcel is collected from the booking customer; max 500 chars |
| `deliveryAddress` | string | ❌ | Where the parcel is delivered to the delivery customer; max 500 chars |
| `parcelDetails.article` | string | ✅ | Article description |
| `parcelDetails.remarks` | string | ❌ | |
| `parcelDetails.numberOfParcels` | number | ✅ | ≥ 1 |
| `parcelDetails.approximateValue` | number | ❌ | |
| `transportationCharge` | number | ❌ | Defaults to `0`; editable via the `/charge` endpoint |
| `hub` | ObjectId | auto | Processing hub, set by admin via `/assign-hub` |
| `vehicle` | ObjectId | ❌ | Dispatch vehicle, set by the hub via `/assign-vehicle` |
| `driver` | ObjectId | ❌ | Dispatch driver, set by the hub via `/assign-vehicle` |
| `status` | enum | auto | See lifecycle below (default `Order Created`) |
| `statusHistory` | array | auto | Audit trail of every status change (who + role + when) |

**Business rules:**
- `branch` (franchise / `Agency`) must exist and be **Active**, else `400`.
- `branch` can be reassigned later via `PUT /admin/parcel-order/:id` (admin only).
- `transportationCharge` defaults to `0` on create (2.3) and can be edited later (2.4).
- Status moves **forward only**, and the hub stages require an assigned hub.

### Parcel status lifecycle (2.5)
```
Order Created → Parcel Collected → Hub Assigned → Parcel Dispatched
→ Parcel Arrived at Hub → Parcel Processed at Hub → Parcel Dispatched from Hub
→ Parcel Arrived at Branch → Parcel Received at Branch → Delivered
```
Each status change appends to `statusHistory` with `updatedBy`, `updatedByRole`
(`admin` / `branch` / `hub`), `updatedByName` + timestamp.

> **Full three-actor flow (branch books → admin assigns hub → hub processes →
> delivery), including the branch and hub endpoint groups, is documented
> separately in `PARCEL_FLOW_APIS.md`.**

### Endpoints
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/admin/parcel-order` | write | Create order (2.3) |
| GET | `/admin/parcel-order` | read | List (search, `status`, `branch`, `hub`, `hubAssignment`, `paymentType`) |
| GET | `/admin/parcel-order/:id` | read | Get one (branch/hub/vehicle/driver populated) |
| PUT | `/admin/parcel-order/:id` | update | Update booking details |
| GET | `/admin/parcel-order/options/delivery-branches` | read | Dropdown: available delivery branches |
| GET | `/admin/parcel-order/options/vehicles` | read | Dropdown: active vehicles |
| GET | `/admin/parcel-order/options/drivers` | read | Dropdown: active drivers |
| PATCH | `/admin/parcel-order/:id/assign-hub` | update | Assign the processing hub (admin only) |
| PATCH | `/admin/parcel-order/:id/assign-vehicle` | update | Assign vehicle + driver |
| GET | `/admin/parcel-order/:id/tracking` | read | Status timeline |
| PATCH | `/admin/parcel-order/:id/charge` | update | Update transportation charge (2.4) |
| PATCH | `/admin/parcel-order/:id/status` | update | Update tracking status (2.5) |
| DELETE | `/admin/parcel-order/:id` | delete | Delete order (admin only) |

### Create — `POST /admin/parcel-order`
```json
{
  "branch": "665a1f2c8b3e4a0012ab34cd",
  "bookingCustomer": { "name": "Suresh", "mobileNumber": "9876543210" },
  "paymentType": "To Pay",
  "deliveryCustomer": {
    "name": "Mahesh",
    "mobileNumber": "9123456780",
    "deliveryBranch": "665a1f2c8b3e4a0012ab34ce"
  },
  "parcelDetails": {
    "article": "Electronics",
    "remarks": "Handle with care",
    "numberOfParcels": 3,
    "approximateValue": 15000
  }
}
```
> `branch` is the booking franchise `Agency` _id — fetch it from `GET /admin/agency`.
> `deliveryCustomer.deliveryBranch` is the destination franchise `Agency` _id — fetch
> it from `GET /admin/parcel-order/options/delivery-branches` (the dropdown source).
> `transportationCharge` omitted → stored as `0`; set it via the `/charge` endpoint.

### Update transportation charge — `PATCH /admin/parcel-order/:id/charge`
```json
{ "transportationCharge": 850 }
```

### Update tracking status — `PATCH /admin/parcel-order/:id/status`
```json
{ "status": "Parcel Dispatched", "note": "Loaded on TN01AB1234" }
```

---

## Quick cURL reference

```bash
# Login → token
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@freightrek.com","password":"Admin@123"}'

# Create a route
curl -X POST http://localhost:3000/admin/route \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"routeName":"Chennai - Bangalore Express","from":"Chennai","to":"Bangalore","branches":["Guindy"]}'

# Create a vehicle
curl -X POST http://localhost:3000/admin/vehicle \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"vehicleType":"Truck","capacity":"10 Ton","vehicleRegistrationNumber":"TN01AB1234","rcNumber":"RC123","insuranceNumber":"INS987"}'

# Create a driver
curl -X POST http://localhost:3000/admin/driver \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"driverName":"Ramesh Kumar","phoneNumber":"9876543210","licenseNumber":"TN1420110012345","dateOfExpiry":"2028-05-31"}'

# Create a parcel order (branch id = franchise/agency _id from GET /admin/agency)
curl -X POST http://localhost:3000/admin/parcel-order \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"branch":"<BRANCH_ID>","bookingCustomer":{"name":"Suresh","mobileNumber":"9876543210"},"paymentType":"To Pay","deliveryCustomer":{"name":"Mahesh","mobileNumber":"9123456780","deliveryBranch":"<DELIVERY_BRANCH_ID>"},"parcelDetails":{"article":"Electronics","numberOfParcels":3,"approximateValue":15000}}'

# Advance parcel status
curl -X PATCH http://localhost:3000/admin/parcel-order/<ORDER_ID>/status \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"status":"Parcel Collected"}'

# List (with pagination / search / status)
curl "http://localhost:3000/admin/route?page=1&limit=10&search=Chennai&status=Active" \
  -H "Authorization: Bearer <TOKEN>"
```

Per-module detailed cURL + PowerShell commands:
- `ROUTE_API_CURL_COMMANDS.md`
- `VEHICLE_API_CURL_COMMANDS.md`
- `DRIVER_API_CURL_COMMANDS.md`
- `PARCEL_ORDER_API_CURL_COMMANDS.md`
- `PARCEL_FLOW_APIS.md` — branch → admin hub assign → hub → delivery flow

Swagger UI: `http://localhost:3000/api-docs`

---

## Source references

| Module | Model | Service | Controller | Routes | Validator |
|--------|-------|---------|------------|--------|-----------|
| Route | `src/models/admin/route.model.ts` | `src/services/admin/route.service.ts` | `src/controllers/admin/route.controller.ts` | `src/routes/admin/route.routes.ts` | `src/validators/admin/route.validator.ts` |
| Vehicle | `src/models/admin/vehicle.model.ts` | `src/services/admin/vehicle.service.ts` | `src/controllers/admin/vehicle.controller.ts` | `src/routes/admin/vehicle.routes.ts` | `src/validators/admin/vehicle.validator.ts` |
| Driver | `src/models/admin/driver.model.ts` | `src/services/admin/driver.service.ts` | `src/controllers/admin/driver.controller.ts` | `src/routes/admin/driver.routes.ts` | `src/validators/admin/driver.validator.ts` |
| Parcel Order | `src/models/admin/parcelOrder.model.ts` | `src/services/admin/parcelOrder.service.ts` | `src/controllers/admin/parcelOrder.controller.ts` | `src/routes/admin/parcelOrder.routes.ts` | `src/validators/admin/parcelOrder.validator.ts` |

- Module permissions: `src/config/adminModule.ts`
- Route registration: `src/routes/admin/index.ts`, `src/app.ts` (hub namespace)
- Parcel flow extras: `src/utils/parcelActor.ts`,
  `src/middleware/parcelActor.middleware.ts`,
  `src/routes/admin/branchParcelOrder.routes.ts`,
  `src/routes/hub/parcelOrder.routes.ts`
