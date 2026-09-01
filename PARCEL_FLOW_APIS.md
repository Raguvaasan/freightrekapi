# Parcel Flow APIs — Branch → Admin (Hub Assign) → Hub → Delivery

Complete API reference for the end-to-end parcel flow across the three actors:

| Actor | Who logs in | Login endpoint | Base path |
|-------|-------------|----------------|-----------|
| **Admin** | `AdminUser`, or `Staff` type `head_quarter` | `POST /admin/auth/login` | `/admin/parcel-order` |
| **Branch** (franchise) | `Agency`, or `Staff` type `franchise` | `POST /admin/agency/login/verify-otp` | `/admin/branch/parcel-order` |
| **Hub** | `Hub`, or `Staff` type `hub` | `POST /admin/hub/unified-login` | `/hub/parcel-order` |

The token carries only the record `_id`; the API resolves the acting role by looking
that id up across `AdminUser` → `Agency` → `Hub` → `Staff`, so no extra header or
role setup is needed. Inactive accounts are rejected with `403`.

> **"Branch" = franchise = an `Agency` record** (`/admin/agency`). Both the booking
> branch (`branch`) and the destination branch
> (`deliveryCustomer.deliveryBranch`) hold an `Agency` `_id`, so one branch can be
> the **origin** of some orders and the **destination** of others.

Base URL in all examples: `http://localhost:3000`

---

## 1. The flow

```
┌─────────────┐   1. book          ┌──────────────────┐
│   BOOKING   │ ─────────────────► │  Order Created   │
│   BRANCH    │  (picks delivery   └──────────────────┘
└─────────────┘   branch from the           │
       │          dropdown)                 │
       │ 2. collect from customer           │
       ▼                                    ▼
                                   ┌──────────────────┐
                                   │ Parcel Collected │
                                   └──────────────────┘
┌─────────────┐   3. assign hub              │
│    ADMIN    │ ─────────────────────────────┤
└─────────────┘                              ▼
                                   ┌──────────────────┐
                                   │   Hub Assigned   │
                                   └──────────────────┘
┌─────────────┐   4. dispatch to hub         │
│   BOOKING   │ ─────────────────────────────┤
│   BRANCH    │                              ▼
└─────────────┘                    ┌──────────────────────┐
                                   │  Parcel Dispatched   │
                                   └──────────────────────┘
┌─────────────┐  5. receive, ASSIGN VEHICLE  │
│     HUB     │     + DRIVER, process, send  │
└─────────────┘ ─────────────────────────────┤
                                             ▼
                              ┌──────────────────────────────┐
                              │   Parcel Arrived at Hub      │
                              │   Parcel Processed at Hub    │
                              │   Parcel Dispatched from Hub │
                              └──────────────────────────────┘
┌─────────────┐   6. arrival / handover      │
│  DELIVERY   │ ─────────────────────────────┤
│   BRANCH    │                              ▼
└─────────────┘                ┌──────────────────────────────┐
                               │  Parcel Arrived at Branch    │
                               │  Parcel Received at Branch   │
                               │  Delivered                   │
                               └──────────────────────────────┘
```

### Lifecycle statuses (in order)

| # | Status | Set by | Notes |
|---|--------|--------|-------|
| 1 | `Order Created` | booking branch (auto on create) | Booking recorded |
| 2 | `Parcel Collected` | booking branch | Picked up from the booking customer |
| 3 | `Hub Assigned` | admin (auto on assign-hub) | Hub chosen for processing |
| 4 | `Parcel Dispatched` | booking branch | Handed over towards the hub |
| 5 | `Parcel Arrived at Hub` | hub | Physically received at the hub |
| 6 | `Parcel Processed at Hub` | hub | Sorted / bagged / manifested |
| 7 | `Parcel Dispatched from Hub` | hub | Sent onward, on the assigned vehicle |
| 8 | `Parcel Arrived at Branch` | delivery branch | Reached the destination branch |
| 9 | `Parcel Received at Branch` | delivery branch | Booked in at the destination counter |
| 10 | `Delivered` | delivery branch | Handed to the delivery customer |

### Rules enforced by the API

1. **Forward only.** A status cannot move backwards. `400` with
   `Cannot move back from "X" to "Y"`.
2. **Hub stages need a hub.** `Parcel Arrived at Hub` / `Parcel Processed at Hub` /
   `Parcel Dispatched from Hub` are rejected with `400` until an admin assigns a hub.
3. **Role-locked statuses.**
   - **booking** branch → `Parcel Collected`, `Parcel Dispatched`
   - **delivery** branch → `Parcel Arrived at Branch`, `Parcel Received at Branch`, `Delivered`
   - hub → `Parcel Arrived at Hub`, `Parcel Processed at Hub`, `Parcel Dispatched from Hub`
   - admin → **any** status (override), plus `Hub Assigned`

   Anything else → `403`. When the booking and delivery branch are the same
   (local booking), that one branch can set all five branch stages.
4. **Data scoping.** A branch sees orders it **booked** (`direction=outgoing`) plus
   orders **addressed to it** (`direction=incoming`); a hub sees only orders assigned
   to it. Anything else → `403`.
5. **Only the booking branch** can edit booking details or the transportation charge.
   The delivery branch has read + delivery-status access only.
6. **Hub re-assignment** is allowed until the parcel status reaches
   `Parcel Arrived at Hub`; after that the hub is locked (`400`).
   The **delivery branch** can be changed until `Parcel Dispatched from Hub`.
7. **Vehicle + driver** are assigned by the **hub** (admin can override). Both must be
   `Active`; sending `null`/`""` clears the assignment. It records an entry in
   `statusHistory` **without** moving the lifecycle status. A branch cannot do it (`403`).
8. **Every change is audited** in `statusHistory` with
   `status`, `note`, `updatedBy` (id), `updatedByRole` (`admin`/`branch`/`hub`),
   `updatedByName`, `updatedAt`.
9. Only **admin** can delete an order or move it to a different booking branch.

---

## 2. Endpoint summary

### Admin — `/admin/parcel-order` 🔒 `Parcel Management`
| Method | Endpoint | Perm | Description |
|--------|----------|------|-------------|
| POST | `/admin/parcel-order` | write | Create an order on a branch's behalf (`branch` required) |
| GET | `/admin/parcel-order` | read | List all orders (search + filters) |
| **GET** | **`/admin/parcel-order/outward?agency=`** | read | **Outward register: booked at that branch** |
| **GET** | **`/admin/parcel-order/inward?agency=`** | read | **Inward register: addressed to that branch** |
| GET | `/admin/parcel-order/options/delivery-branches` | read | Dropdown: available delivery branches |
| GET | `/admin/parcel-order/options/vehicles` | read | Dropdown: active vehicles |
| GET | `/admin/parcel-order/options/drivers` | read | Dropdown: active drivers |
| GET | `/admin/parcel-order/:id` | read | Get one order |
| PUT | `/admin/parcel-order/:id` | update | Update booking details / reassign branch |
| **PATCH** | **`/admin/parcel-order/:id/assign-hub`** | update | **Assign the processing hub** |
| PATCH | `/admin/parcel-order/:id/assign-vehicle` | update | Assign vehicle + driver (override of the hub action) |
| GET | `/admin/parcel-order/:id/tracking` | read | Status timeline |
| PATCH | `/admin/parcel-order/:id/charge` | update | Update transportation charge |
| PATCH | `/admin/parcel-order/:id/status` | update | Set any status (override) |
| DELETE | `/admin/parcel-order/:id` | delete | Delete order |

### Branch — `/admin/branch/parcel-order` (franchise token; no permission record needed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/branch/parcel-order` | Book an order (branch taken from the token) |
| GET | `/admin/branch/parcel-order` | List orders booked at **or addressed to** this branch |
| **GET** | **`/admin/branch/parcel-order/outward`** | **Outward register: what this branch booked and sent out** |
| **GET** | **`/admin/branch/parcel-order/inward`** | **Inward register: what is addressed to this branch for delivery** |
| **GET** | **`/admin/branch/parcel-order/options/delivery-branches`** | **Dropdown: available delivery branches** |
| GET | `/admin/branch/parcel-order/:id` | Get one of its orders |
| PUT | `/admin/branch/parcel-order/:id` | Update booking details (booking branch only) |
| GET | `/admin/branch/parcel-order/:id/tracking` | Status timeline |
| PATCH | `/admin/branch/parcel-order/:id/charge` | Update transportation charge (booking branch only) |
| PATCH | `/admin/branch/parcel-order/:id/status` | Branch-side status update |

### Hub — `/hub/parcel-order` (hub token; sits with the other `/hub/*` APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hub/parcel-order` | List orders **assigned to this hub** |
| **GET** | **`/hub/parcel-order/options/vehicles`** | **Dropdown: active vehicles** |
| **GET** | **`/hub/parcel-order/options/drivers`** | **Dropdown: active drivers** |
| GET | `/hub/parcel-order/:id` | Get one assigned order |
| GET | `/hub/parcel-order/:id/tracking` | Status timeline |
| PATCH | `/hub/parcel-order/:id/status` | Hub-side status update |
| **PATCH** | **`/hub/parcel-order/:id/assign-vehicle`** | **Assign vehicle + driver** |

### List query parameters (all three actors)
| Param | Values | Notes |
|-------|--------|-------|
| `page`, `limit` | integers | Default `1` / `10` |
| `search` | string | orderNumber, booking/delivery customer name & mobile |
| `status` | any lifecycle status | e.g. `Hub Assigned` for a hub's incoming queue |
| `paymentType` | `Paid` / `To Pay` / `Credit` | |
| `branch` | Agency `_id` | Booking branch — **admin only** (branch tokens are auto-scoped) |
| `deliveryBranch` | Agency `_id` | Destination branch — any actor |
| `hub` | Hub `_id` | **admin only** (hub tokens are auto-scoped) |
| `hubAssignment` | `assigned` / `unassigned` | `unassigned` = admin's hub-assignment queue |
| `direction` | `outgoing` / `incoming` | **branch only**: booked here vs addressed here. Omit for both |
| `counterpartAgency` | Agency `_id` | **`/inward` and `/outward` only**: the other end — origin on inward, destination on outward |

> `deliveryBranch` is an ObjectId now, so it is no longer matched by `search` —
> filter by it instead (or search the customer name).

### Every order row carries its invoice

The list, the detail endpoint and both registers return `invoiceId`,
`invoiceNumber` and an `invoice` summary
(`{ _id, invoiceNumber, invoiceDate, status, totalAmount }`) per order — all
three are `null` when no invoice has been raised. One invoice per order, so it
is never a list. Full invoice: `GET /admin/invoice/{invoiceId}`.

### Inward / outward registers

`/outward` = booked at that branch and sent out. `/inward` = booked elsewhere
and addressed to that branch for delivery. A branch token gets its own register
(`?agency=` is ignored); admin must name the branch with `?agency=`. Hub tokens
get `403`. The response wraps the usual list in
`{ direction, agency, orders, totals, pagination }`. Full guide:
[PARCEL_INWARD_OUTWARD_APIS.md](PARCEL_INWARD_OUTWARD_APIS.md).

---

## 3. Order fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orderNumber` | string | auto | `003-611-380`, read-only |
| `branch` | ObjectId → `Agency` | ✅ | Booking branch (franchise); must be **Active** |
| `bookingCustomer.name` | string | ✅ | |
| `bookingCustomer.mobileNumber` | string | ✅ | Exactly 10 digits |
| `paymentType` | enum | ✅ | `Paid` / `To Pay` / `Credit` |
| `deliveryCustomer.name` | string | ✅ | |
| `deliveryCustomer.mobileNumber` | string | ✅ | Exactly 10 digits |
| `deliveryCustomer.deliveryBranch` | ObjectId → `Agency` | ✅ | **Destination branch, picked from the dropdown**; must be **Active** |
| `pickupAddress` | string | ❌ | Where the parcel is collected from the booking customer; max 500 chars |
| `deliveryAddress` | string | ❌ | Where the parcel is delivered to the delivery customer; max 500 chars |
| `parcelDetails.article` | string | ✅ | |
| `parcelDetails.remarks` | string | ❌ | |
| `parcelDetails.numberOfParcels` | number | ✅ | ≥ 1 |
| `parcelDetails.approximateValue` | number | ❌ | |
| `transportationCharge` | number | ❌ | Defaults to `0`; edit via `/charge` |
| `hub` | ObjectId → `Hub` | auto | Set by admin via `/assign-hub` |
| `hubAssignedAt` | date | auto | |
| `hubAssignedBy` | string | auto | Admin user id |
| `vehicle` | ObjectId → `Vehicle` | ❌ | Assigned by the hub via `/assign-vehicle`; must be **Active** |
| `driver` | ObjectId → `Driver` | ❌ | Assigned by the hub via `/assign-vehicle`; must be **Active** |
| `dispatchAssignedAt` | date | auto | When the vehicle/driver was last assigned |
| `dispatchAssignedBy` | string | auto | Hub or admin login id |
| `status` | enum | auto | Default `Order Created` |
| `statusHistory` | array | auto | Full audit trail |

---

## 4. Walkthrough with cURL

### Step 0 — Logins

```bash
# ADMIN
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@freightrek.com","password":"Admin@123"}'
# -> ADMIN_TOKEN

# BRANCH (franchise) - OTP login
curl -X POST http://localhost:3000/admin/agency/login/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","countryCode":"+91"}'

curl -X POST http://localhost:3000/admin/agency/login/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","countryCode":"+91","otp":"123456"}'
# -> BRANCH_TOKEN (response field: token)
#
# Franchise STAFF use the staff OTP login instead - the resulting token
# resolves to the same branch via staff.franchiseId:
#   POST /admin/staff/login/send-otp     {"phone":"...","countryCode":"+91"}
#   POST /admin/staff/login/verify-otp   {"phone":"...","countryCode":"+91","otp":"123456"}

# HUB
curl -X POST http://localhost:3000/admin/hub/unified-login \
  -H "Content-Type: application/json" \
  -d '{"username":"chennaihub","password":"Hub@123"}'
# -> HUB_TOKEN  (works for hub admin and hub staff; see loginType in the response)
```

### Step 1 — Branch loads the delivery-branch dropdown, then books

```bash
# Dropdown source: active franchises that can receive the parcel
curl -X GET "http://localhost:3000/admin/branch/parcel-order/options/delivery-branches" \
  -H "Authorization: Bearer BRANCH_TOKEN"

# Optional server-side filter for a type-ahead (name / city / pincode)
curl -X GET "http://localhost:3000/admin/branch/parcel-order/options/delivery-branches?search=trichy" \
  -H "Authorization: Bearer BRANCH_TOKEN"
```

```json
{
  "success": true,
  "data": [
    { "_id": "665a1f2c8b3e4a0012ab34cd", "agencyName": "Chennai Central Branch", "agencyOwner": "Ramesh", "phone": "9876543210", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600001" },
    { "_id": "665a1f2c8b3e4a0012ab34ce", "agencyName": "Trichy Branch",          "agencyOwner": "Kumar",  "phone": "9876500000", "city": "Trichy",  "state": "Tamil Nadu", "pincode": "620001" }
  ]
}
```

Use the chosen `_id` as `deliveryCustomer.deliveryBranch`:

```bash
curl -X POST http://localhost:3000/admin/branch/parcel-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BRANCH_TOKEN" \
  -d '{
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
    },
    "transportationCharge": 750
  }'
```

`201` → status `Order Created`. No `branch` field is sent — it comes from the token
(any `branch` in the body is stripped). Copy `data._id` → `ORDER_ID`.

> `deliveryBranch` must be an ObjectId of an **Active** branch, else `400`
> (`Delivery branch not found` / `Selected Delivery branch is inactive`).

### Step 2 — Branch marks collection

```bash
curl -X PATCH http://localhost:3000/admin/branch/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BRANCH_TOKEN" \
  -d '{"status":"Parcel Collected","note":"Picked up from booking counter"}'
```

### Step 3 — Admin sees the pending queue and assigns a hub

```bash
# Bookings still waiting for a hub
curl -X GET "http://localhost:3000/admin/parcel-order?hubAssignment=unassigned" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Available hubs
curl -X GET http://localhost:3000/admin/hub \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Assign
curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID/assign-hub \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"hub":"HUB_ID","note":"Nearest sorting hub"}'
```

`200` → `hub` set, `hubAssignedAt`/`hubAssignedBy` stamped, status advances to
`Hub Assigned`.

### Step 4 — Branch dispatches to the hub

```bash
curl -X PATCH http://localhost:3000/admin/branch/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BRANCH_TOKEN" \
  -d '{"status":"Parcel Dispatched","note":"Loaded on TN01AB1234"}'
```

### Step 5 — Hub receives, assigns vehicle + driver, dispatches

```bash
# The hub's incoming queue
curl -X GET "http://localhost:3000/hub/parcel-order?status=Parcel%20Dispatched" \
  -H "Authorization: Bearer HUB_TOKEN"

curl -X PATCH http://localhost:3000/hub/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HUB_TOKEN" \
  -d '{"status":"Parcel Arrived at Hub","note":"Unloaded at inbound dock"}'

curl -X PATCH http://localhost:3000/hub/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HUB_TOKEN" \
  -d '{"status":"Parcel Processed at Hub","note":"Sorted for Trichy"}'
```

**Assign the vehicle and driver** (dropdowns first):

```bash
curl -X GET "http://localhost:3000/hub/parcel-order/options/vehicles" \
  -H "Authorization: Bearer HUB_TOKEN"
# -> [{ "_id": "...", "vehicleType": "Truck", "vehicleRegistrationNumber": "TN01AB1234", "capacity": "10 Ton" }]

curl -X GET "http://localhost:3000/hub/parcel-order/options/drivers" \
  -H "Authorization: Bearer HUB_TOKEN"
# -> [{ "_id": "...", "driverName": "Ramesh Kumar", "phoneNumber": "9876543210", "licenseNumber": "TN1420110012345", "dateOfExpiry": "2028-05-31T00:00:00.000Z" }]

curl -X PATCH http://localhost:3000/hub/parcel-order/ORDER_ID/assign-vehicle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HUB_TOKEN" \
  -d '{
    "vehicle": "VEHICLE_ID",
    "driver": "DRIVER_ID",
    "note": "Line-haul TN01AB1234, driver Ramesh"
  }'
```

Either field may be sent on its own, and `null` (or `""`) clears it:

```bash
# swap the driver only
curl -X PATCH http://localhost:3000/hub/parcel-order/ORDER_ID/assign-vehicle \
  -H "Content-Type: application/json" -H "Authorization: Bearer HUB_TOKEN" \
  -d '{"driver":"OTHER_DRIVER_ID","note":"Shift change"}'

# release the vehicle
curl -X PATCH http://localhost:3000/hub/parcel-order/ORDER_ID/assign-vehicle \
  -H "Content-Type: application/json" -H "Authorization: Bearer HUB_TOKEN" \
  -d '{"vehicle":null,"note":"Breakdown, awaiting replacement"}'
```

The assignment stamps `dispatchAssignedAt` / `dispatchAssignedBy` and appends a
`statusHistory` entry, but **does not** change the lifecycle status. Then dispatch:

```bash
curl -X PATCH http://localhost:3000/hub/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HUB_TOKEN" \
  -d '{"status":"Parcel Dispatched from Hub","note":"Line-haul to Trichy"}'
```

### Step 6 — Delivery branch delivers

These three use the **delivery branch's** token (the branch chosen in the dropdown
at step 1). Its incoming queue:

```bash
curl -X GET "http://localhost:3000/admin/branch/parcel-order?direction=incoming" \
  -H "Authorization: Bearer DELIVERY_BRANCH_TOKEN"

curl -X PATCH http://localhost:3000/admin/branch/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DELIVERY_BRANCH_TOKEN" \
  -d '{"status":"Parcel Arrived at Branch"}'

curl -X PATCH http://localhost:3000/admin/branch/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DELIVERY_BRANCH_TOKEN" \
  -d '{"status":"Parcel Received at Branch"}'

curl -X PATCH http://localhost:3000/admin/branch/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DELIVERY_BRANCH_TOKEN" \
  -d '{"status":"Delivered","note":"Handed over, OTP verified"}'
```

If the booking branch tries these it gets `403 Only the delivery branch can set "..."`
— unless it *is* the delivery branch (local booking), in which case one token does all five.

### Step 7 — Tracking timeline (any of the three actors)

```bash
curl -X GET http://localhost:3000/admin/parcel-order/ORDER_ID/tracking \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

```json
{
  "success": true,
  "data": {
    "orderNumber": "003-611-380",
    "currentStatus": "Delivered",
    "branch": { "_id": "...", "agencyName": "Chennai Central Branch", "city": "Chennai" },
    "deliveryBranch": { "_id": "...", "agencyName": "Trichy Branch", "city": "Trichy" },
    "hub": { "_id": "...", "hubName": "Chennai Sorting Hub", "city": "Chennai" },
    "hubAssignedAt": "2026-08-02T10:14:00.000Z",
    "vehicle": { "_id": "...", "vehicleType": "Truck", "vehicleRegistrationNumber": "TN01AB1234", "capacity": "10 Ton" },
    "driver": { "_id": "...", "driverName": "Ramesh Kumar", "phoneNumber": "9876543210" },
    "dispatchAssignedAt": "2026-08-02T12:40:00.000Z",
    "timeline": [
      { "status": "Order Created",              "note": "Order booked at \"Chennai Central Branch\" for delivery at \"Trichy Branch\"", "updatedByRole": "branch", "updatedByName": "Chennai Central Branch", "updatedAt": "..." },
      { "status": "Parcel Collected",           "note": "Picked up from booking counter",     "updatedByRole": "branch", "updatedAt": "..." },
      { "status": "Hub Assigned",               "note": "Nearest sorting hub",                "updatedByRole": "admin",  "updatedAt": "..." },
      { "status": "Parcel Dispatched",          "note": "Loaded on TN01AB1234",               "updatedByRole": "branch", "updatedAt": "..." },
      { "status": "Parcel Arrived at Hub",      "note": "Unloaded at inbound dock",           "updatedByRole": "hub",    "updatedAt": "..." },
      { "status": "Parcel Processed at Hub",    "note": "Sorted for Trichy",                  "updatedByRole": "hub",    "updatedAt": "..." },
      { "status": "Parcel Processed at Hub",    "note": "Line-haul TN01AB1234, driver Ramesh","updatedByRole": "hub",    "updatedAt": "..." },
      { "status": "Parcel Dispatched from Hub", "note": "Line-haul to Trichy",                "updatedByRole": "hub",    "updatedAt": "..." },
      { "status": "Parcel Arrived at Branch",                                                 "updatedByRole": "branch", "updatedAt": "..." },
      { "status": "Parcel Received at Branch",                                                "updatedByRole": "branch", "updatedAt": "..." },
      { "status": "Delivered",                  "note": "Handed over, OTP verified",          "updatedByRole": "branch", "updatedAt": "..." }
    ]
  }
}
```

---

## 5. Admin extras

```bash
# Dropdowns (admin can also use /admin/agency, /admin/vehicle, /admin/driver)
curl -X GET "http://localhost:3000/admin/parcel-order/options/delivery-branches" \
  -H "Authorization: Bearer ADMIN_TOKEN"
curl -X GET "http://localhost:3000/admin/parcel-order/options/vehicles" \
  -H "Authorization: Bearer ADMIN_TOKEN"
curl -X GET "http://localhost:3000/admin/parcel-order/options/drivers" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Create an order for a branch (admin must state both branches)
curl -X POST http://localhost:3000/admin/parcel-order \
  -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"branch":"BRANCH_ID","bookingCustomer":{"name":"Suresh","mobileNumber":"9876543210"},"paymentType":"Paid","deliveryCustomer":{"name":"Mahesh","mobileNumber":"9123456780","deliveryBranch":"DELIVERY_BRANCH_ID"},"parcelDetails":{"article":"Documents","numberOfParcels":1}}'

# Assign vehicle + driver on the hub's behalf
curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID/assign-vehicle \
  -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"vehicle":"VEHICLE_ID","driver":"DRIVER_ID"}'

# Everything sitting at one hub
curl -X GET "http://localhost:3000/admin/parcel-order?hub=HUB_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Everything booked by one branch / addressed to one branch
curl -X GET "http://localhost:3000/admin/parcel-order?branch=BRANCH_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
curl -X GET "http://localhost:3000/admin/parcel-order?deliveryBranch=DELIVERY_BRANCH_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Change the destination branch (allowed until "Parcel Dispatched from Hub")
curl -X PUT http://localhost:3000/admin/parcel-order/ORDER_ID \
  -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"deliveryCustomer":{"deliveryBranch":"OTHER_BRANCH_ID"}}'

# Override any status (bypasses the role restriction, still forward-only)
curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID/status \
  -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"status":"Delivered","note":"Closed manually after customer confirmation"}'

# Update charge
curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID/charge \
  -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"transportationCharge":850}'

# Delete (admin only)
curl -X DELETE http://localhost:3000/admin/parcel-order/ORDER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 6. PowerShell versions

```powershell
$branch = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer BRANCH_TOKEN" }
$dest   = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer DELIVERY_BRANCH_TOKEN" }
$admin  = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer ADMIN_TOKEN" }
$hub    = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer HUB_TOKEN" }

# 1a. Delivery-branch dropdown
$branches = Invoke-RestMethod -Uri "http://localhost:3000/admin/branch/parcel-order/options/delivery-branches" -Method GET -Headers $branch
$branches.data | Select-Object _id, agencyName, city
$deliveryBranchId = ($branches.data | Where-Object { $_.city -eq "Trichy" } | Select-Object -First 1)._id

# 1b. Branch books
$body = @{
    bookingCustomer  = @{ name = "Suresh"; mobileNumber = "9876543210" }
    paymentType      = "To Pay"
    deliveryCustomer = @{ name = "Mahesh"; mobileNumber = "9123456780"; deliveryBranch = $deliveryBranchId }
    parcelDetails    = @{ article = "Electronics"; numberOfParcels = 3; approximateValue = 15000 }
    transportationCharge = 750
} | ConvertTo-Json -Depth 5
$order = Invoke-RestMethod -Uri "http://localhost:3000/admin/branch/parcel-order" -Method POST -Headers $branch -Body $body
$orderId = $order.data._id

# 2. Branch collects
$body = @{ status = "Parcel Collected"; note = "Picked up" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/admin/branch/parcel-order/$orderId/status" -Method PATCH -Headers $branch -Body $body

# 3. Admin assigns a hub
$body = @{ hub = "HUB_ID"; note = "Nearest sorting hub" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/admin/parcel-order/$orderId/assign-hub" -Method PATCH -Headers $admin -Body $body

# 4. Branch dispatches
$body = @{ status = "Parcel Dispatched" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/admin/branch/parcel-order/$orderId/status" -Method PATCH -Headers $branch -Body $body

# 5a. Hub receives + processes
foreach ($s in @("Parcel Arrived at Hub", "Parcel Processed at Hub")) {
    $body = @{ status = $s } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:3000/hub/parcel-order/$orderId/status" -Method PATCH -Headers $hub -Body $body
}

# 5b. Hub assigns vehicle + driver from the dropdowns
$vehicles = Invoke-RestMethod -Uri "http://localhost:3000/hub/parcel-order/options/vehicles" -Method GET -Headers $hub
$drivers  = Invoke-RestMethod -Uri "http://localhost:3000/hub/parcel-order/options/drivers"  -Method GET -Headers $hub
$body = @{
    vehicle = $vehicles.data[0]._id
    driver  = $drivers.data[0]._id
    note    = "Line-haul assignment"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/hub/parcel-order/$orderId/assign-vehicle" -Method PATCH -Headers $hub -Body $body

# 5c. Hub dispatches
$body = @{ status = "Parcel Dispatched from Hub" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/hub/parcel-order/$orderId/status" -Method PATCH -Headers $hub -Body $body

# 6. Delivery branch delivers (uses the DESTINATION branch token)
foreach ($s in @("Parcel Arrived at Branch", "Parcel Received at Branch", "Delivered")) {
    $body = @{ status = $s } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:3000/admin/branch/parcel-order/$orderId/status" -Method PATCH -Headers $dest -Body $body
}

# 7. Timeline
Invoke-RestMethod -Uri "http://localhost:3000/admin/parcel-order/$orderId/tracking" -Method GET -Headers $admin
```

---

## 7. Error responses you should expect

| Case | Code | Message |
|------|------|---------|
| No / bad token | `401` | `Authorization header missing` / `Invalid or expired token` |
| Login id is not an admin, branch or hub (or is inactive) | `403` | `Account is not allowed to access the parcel flow (or is inactive)` |
| Hub token on a branch route (or vice-versa) | `403` | `branch access required` / `hub access required` |
| Branch opens an unrelated order | `403` | `This parcel order was neither booked at nor addressed to your branch` |
| Hub opens an order assigned elsewhere | `403` | `This parcel order is not assigned to your hub` |
| Branch tries a hub status | `403` | `A branch cannot set "Parcel Arrived at Hub". Allowed: ...` |
| Delivery branch tries an origin status | `403` | `Only the booking branch can set "Parcel Collected"` |
| Booking branch tries a delivery status | `403` | `Only the delivery branch can set "Delivered"` |
| Delivery branch edits the booking / charge | `403` | `Only the booking branch can edit these details` / `... change the transportation charge` |
| Hub tries to book | `403` | `A hub cannot book parcel orders` |
| Non-admin calls assign-hub | `403` | `Only admin can assign a hub to a parcel order` |
| Branch calls assign-vehicle | `403` | `Only the hub (or admin) can assign a vehicle and driver` |
| Hub stage before assignment | `400` | `No hub assigned yet. Admin must assign a hub before "..."` |
| Backwards status | `400` | `Cannot move back from "Delivered" to "Parcel Collected"` |
| Same status again | `400` | `Order is already in "..." status` |
| Hub change after arrival | `400` | `Hub cannot be changed once the parcel status is "..."` |
| Delivery branch change after hub dispatch | `400` | `Delivery branch cannot be changed once the parcel status is "..."` |
| assign-vehicle with neither field | `400` | `Provide a vehicle and/or a driver` |
| Inactive branch / hub / vehicle / driver | `400` | `Selected ... is inactive` |
| Unknown delivery branch | `400` | `Delivery branch not found` |

---

## 8. Implementation map

| Concern | File |
|---------|------|
| Model + status lists + origin/destination status maps | `src/models/admin/parcelOrder.model.ts` |
| Actor resolution (admin / branch / hub from a token) | `src/utils/parcelActor.ts` |
| Role guard for branch & hub route groups | `src/middleware/parcelActor.middleware.ts` |
| Business rules (scoping, transitions, hub assign) | `src/services/admin/parcelOrder.service.ts` |
| Shared controller for all three actors | `src/controllers/admin/parcelOrder.controller.ts` |
| Admin routes | `src/routes/admin/parcelOrder.routes.ts` |
| Branch routes | `src/routes/admin/branchParcelOrder.routes.ts` |
| Hub routes | `src/routes/hub/parcelOrder.routes.ts` |
| Validators | `src/validators/admin/parcelOrder.validator.ts` |
| Mounts | `src/routes/admin/index.ts` (admin, branch) · `src/app.ts` (hub) |

Swagger UI: `http://localhost:3000/api-docs`
(tags **Parcel Management**, **Parcel Flow - Branch**, **Parcel Flow - Hub**)

Related docs: `PARCEL_ORDER_API_CURL_COMMANDS.md` (admin CRUD only),
`FLEET_MANAGEMENT_APIS.md` (route / vehicle / driver modules).
