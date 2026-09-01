# Parcel Order (Parcel Management) API - cURL Commands
# Date: July 30, 2026
# Base URL: http://localhost:3000

# =============================================================================
# STEP 1: Login to get JWT Token
# =============================================================================

curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@freightrek.com\",
    \"password\": \"Admin@123\"
  }"

# Copy the token from the response and use it below.
# Replace YOUR_JWT_TOKEN with the actual token.
#
# NOTE: The logged-in user's role must have "Parcel Management" permission
#       (read/write/update/delete) OR be a root role.

# =============================================================================
# STEP 2: Get the Branch (Franchise) _id  -- prerequisite
# =============================================================================
#
# "branch" on a parcel order = a franchise, i.e. an Agency record.
# Either pick an existing one from the list...

curl -X GET "http://localhost:3000/admin/agency?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# ...or create one:

curl -X POST http://localhost:3000/admin/agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"agencyName\": \"Chennai Central Branch\",
    \"agencyOwner\": \"Ramesh\",
    \"phone\": \"9876543210\",
    \"agencyType\": false,
    \"city\": \"Chennai\",
    \"state\": \"Tamil Nadu\",
    \"status\": \"Active\"
  }"

# Copy the agency _id from the response -> use as BRANCH_ID_HERE below.
# The branch must be Active.

# =============================================================================
# STEP 3: Get the DELIVERY branch _id (dropdown source)
# =============================================================================
#
# deliveryCustomer.deliveryBranch is also an Agency _id - the destination branch.
# This endpoint is the dropdown source (active franchises only):

curl -X GET "http://localhost:3000/admin/parcel-order/options/delivery-branches" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Type-ahead filter on name / city / pincode:
curl -X GET "http://localhost:3000/admin/parcel-order/options/delivery-branches?search=trichy" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Copy the chosen _id -> use as DELIVERY_BRANCH_ID_HERE below.
#
# Vehicle / driver dropdowns (for /assign-vehicle):
curl -X GET "http://localhost:3000/admin/parcel-order/options/vehicles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
curl -X GET "http://localhost:3000/admin/parcel-order/options/drivers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# PARCEL ORDER FLOW   (base: /admin/parcel-order)
# =============================================================================

# 1. CREATE PARCEL ORDER (2.3)
# ---------------------------------------------------------------------
# Admin books on an agency's behalf, so the booking agency is stated
# explicitly. An agency booking for itself posts the SAME body minus
# `branch` to /admin/agency/parcel-order.
#
# transportationCharge omitted -> defaults to 0 (edit later via /charge).
curl -X POST http://localhost:3000/admin/parcel-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"branch\": \"BRANCH_ID_HERE\",
    \"bookingCustomer\": {
      \"name\": \"Suresh Kumar\",
      \"mobileNumber\": \"9876543210\",
      \"address\": \"12 Anna Salai, Chennai\",
      \"gstNumber\": \"33ABCDE1234F1Z5\"
    },
    \"paymentType\": \"To Pay\",
    \"deliveryCustomer\": {
      \"name\": \"Mahesh R\",
      \"mobileNumber\": \"9123456780\",
      \"address\": \"45 Mettupalayam Road, Coimbatore\",
      \"deliveryBranch\": \"DELIVERY_BRANCH_ID_HERE\"
    },
    \"pickupAddress\": \"Warehouse 3, Guindy Industrial Estate, Chennai 600032\",
    \"deliveryAddress\": \"Shop 12, Gandhipuram Market, Coimbatore 641012\",
    \"parcelDetails\": {
      \"article\": \"Electronics\",
      \"remarks\": \"Handle with care\",
      \"numberOfParcels\": 3,
      \"approximateValue\": 15000
    },
    \"transportationCharge\": 200
  }"

# Copy the order _id from the response -> use as ORDER_ID_HERE below.
#
# REQUIRED  branch (admin only), bookingCustomer.name + .mobileNumber,
#           paymentType, deliveryCustomer.name + .mobileNumber +
#           .deliveryBranch, parcelDetails.article + .numberOfParcels
# OPTIONAL  both `address` fields, gstNumber, pickupAddress, deliveryAddress,
#           remarks, approximateValue, transportationCharge, vehicle, driver
#
# mobileNumber must be exactly 10 digits; gstNumber, when sent, must be a valid
# GSTIN. Both agencies must be Active.
#
# pickupAddress / deliveryAddress are where the parcel is physically collected
# and dropped - separate from the customers' own `address`, because a parcel is
# often picked up from a warehouse and delivered somewhere other than the
# consignee's registered address. Max 500 chars each. They come back on every
# order read and on the invoice.
#
# WHAT A SUCCESSFUL BOOKING RETURNS
# ---------------------------------
# {
#   "success": true,
#   "message": "Parcel order created successfully. 216 settled to admin; agency keeps 24",
#   "data": {
#     "orderNumber": "000-000-015",
#     "transportationCharge": 200,
#     "loadingCharge": 20, "miscellaneousCharge": 20, "totalAmount": 240,
#     "pickupAddress": "Warehouse 3, Guindy Industrial Estate, Chennai 600032",
#     "deliveryAddress": "Shop 12, Gandhipuram Market, Coimbatore 641012",
#     "walletSettlement": {
#       "status": "settled", "orderAmount": 240, "profitPercentage": 10,
#       "agencyProfitAmount": 24, "adminShareAmount": 216
#     },
#     "invoice": { "invoiceNumber": "INV-2026-27-000008", ... }
#   }
# }
#
# Three things happen together, and either all stick or none do:
#   1. the order is created with an order number (three groups of three digits)
#   2. loading + miscellaneous are added on the agency's percentages, and the
#      admin's share is debited from the agency wallet
#   3. an invoice is raised
#
# HTTP 402 and NO order if the agency wallet cannot cover the admin share.
# Check first with:
#   GET /admin/parcel-settlement/preview?amount=200&agency=BRANCH_ID_HERE
#
# TAMIL: order create panna agency wallet-la kaasu irukanum. Illainaa 402
# varum, order-um create aagaathu.

# 2. GET ALL PARCEL ORDERS (pagination)
# --------------------------------------
curl -X GET "http://localhost:3000/admin/parcel-order?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. GET ALL (search - matches order no / customer name / mobile / branch)
# ------------------------------------------------------------------------
curl -X GET "http://localhost:3000/admin/parcel-order?search=Suresh" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. GET ALL (filters: status / branch / paymentType)
# --------------------------------------------------
curl -X GET "http://localhost:3000/admin/parcel-order?status=Order%20Created" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET "http://localhost:3000/admin/parcel-order?branch=BRANCH_ID_HERE&paymentType=To%20Pay" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. GET PARCEL ORDER BY ID (branch/vehicle/driver populated + statusHistory)
# --------------------------------------------------------------------------
curl -X GET http://localhost:3000/admin/parcel-order/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 6. UPDATE BOOKING DETAILS (partial update allowed)
# --------------------------------------------------
curl -X PUT http://localhost:3000/admin/parcel-order/ORDER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"branch\": \"BRANCH_ID_HERE\",
    \"bookingCustomer\": { \"mobileNumber\": \"9000000000\" },
    \"deliveryCustomer\": { \"deliveryBranch\": \"OTHER_BRANCH_ID_HERE\" },
    \"parcelDetails\": { \"numberOfParcels\": 4 }
  }"

# deliveryBranch can be changed until the status reaches "Parcel Dispatched from Hub".

# 6b. ASSIGN VEHICLE + DRIVER (normally done by the hub; admin override here)
# ---------------------------------------------------------------------------
# Send either field alone to change just that one; null / "" clears it.
curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID_HERE/assign-vehicle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"vehicle\": \"VEHICLE_ID_HERE\",
    \"driver\": \"DRIVER_ID_HERE\",
    \"note\": \"Line-haul assignment\"
  }"

# 7. UPDATE TRANSPORTATION CHARGE (2.4)
# -------------------------------------
curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID_HERE/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"transportationCharge\": 850
  }"

# 8. UPDATE TRACKING STATUS (2.5) - advance through the lifecycle
# ---------------------------------------------------------------
# Order Created -> Parcel Collected -> Hub Assigned -> Parcel Dispatched
#   -> Parcel Arrived at Hub -> Parcel Processed at Hub -> Parcel Dispatched from Hub
#   -> Parcel Arrived at Branch -> Parcel Received at Branch -> Delivered
#
# The lifecycle moves FORWARD only. Hub stages require a hub to be assigned first
# (see PARCEL_FLOW_APIS.md for the full branch -> admin -> hub flow).
curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID_HERE/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"status\": \"Parcel Collected\",
    \"note\": \"Picked up from booking counter\"
  }"

curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID_HERE/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"status\": \"Parcel Dispatched\",
    \"note\": \"Loaded on TN01AB1234\"
  }"

# 9. DELETE PARCEL ORDER
# ----------------------
curl -X DELETE http://localhost:3000/admin/parcel-order/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# PowerShell Version (For Windows)
# =============================================================================

# 1. CREATE PARCEL ORDER (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    branch          = "BRANCH_ID_HERE"
    bookingCustomer = @{ name = "Suresh"; mobileNumber = "9876543210" }
    paymentType     = "To Pay"
    deliveryCustomer = @{
        name          = "Mahesh"
        mobileNumber  = "9123456780"
        deliveryBranch = "DELIVERY_BRANCH_ID_HERE"
    }
    parcelDetails = @{
        article          = "Electronics"
        remarks          = "Handle with care"
        numberOfParcels  = 3
        approximateValue = 15000
    }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:3000/admin/parcel-order" -Method POST -Headers $headers -Body $body

# 2. UPDATE STATUS (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{ status = "Parcel Collected"; note = "Picked up" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/admin/parcel-order/ORDER_ID_HERE/status" -Method PATCH -Headers $headers -Body $body

# 3. UPDATE CHARGE (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{ transportationCharge = 850 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/admin/parcel-order/ORDER_ID_HERE/charge" -Method PATCH -Headers $headers -Body $body

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
# | Method | Endpoint                          | Permission | Description              |
# |--------|-----------------------------------|------------|--------------------------|
# | POST   | /admin/parcel-order                | write      | Create order (2.3)      |
# | GET    | /admin/parcel-order                | read       | List (search + filters) |
# | GET    | /admin/parcel-order/:id            | read       | Get one order           |
# | PUT    | /admin/parcel-order/:id            | update     | Update booking details  |
# | PATCH  | /admin/parcel-order/:id/assign-hub | update     | Assign processing hub   |
# | PATCH  | /admin/parcel-order/:id/assign-vehicle | update | Assign vehicle + driver |
# | GET    | /admin/parcel-order/:id/tracking   | read       | Status timeline         |
# | GET    | /admin/parcel-order/options/delivery-branches | read | Branch dropdown   |
# | GET    | /admin/parcel-order/options/vehicles | read     | Vehicle dropdown        |
# | GET    | /admin/parcel-order/options/drivers  | read     | Driver dropdown         |
# | PATCH  | /admin/parcel-order/:id/charge     | update     | Update charge (2.4)     |
# | PATCH  | /admin/parcel-order/:id/status     | update     | Update tracking (2.5)   |
# | DELETE | /admin/parcel-order/:id            | delete     | Delete order            |
#
# Branch-side and hub-side endpoints are documented in PARCEL_FLOW_APIS.md:
#   /admin/branch/parcel-order/*   (franchise token)
#   /hub/parcel-order/*            (hub token)

# =============================================================================
# SAMPLE SUCCESS RESPONSE (create)
# =============================================================================
# {
#   "success": true,
#   "message": "Parcel order created successfully",
#   "data": {
#     "_id": "665a30cc8b3e4a0012ab34d0",
#     "orderNumber": "003-611-380",
#     "branch": { "_id": "...", "agencyName": "Chennai Central Branch", "agencyOwner": "Ramesh", "phone": "9876543210", "city": "Chennai", "state": "Tamil Nadu", "status": "Active" },
#     "bookingCustomer": { "name": "Suresh", "mobileNumber": "9876543210" },
#     "paymentType": "To Pay",
#     "deliveryCustomer": { "name": "Mahesh", "mobileNumber": "9123456780", "deliveryBranch": { "_id": "...", "agencyName": "Trichy Branch", "city": "Trichy" } },
#     "parcelDetails": { "article": "Electronics", "remarks": "Handle with care", "numberOfParcels": 3, "approximateValue": 15000 },
#     "transportationCharge": 0,
#     "status": "Order Created",
#     "statusHistory": [ { "status": "Order Created", "note": "Order created", "updatedAt": "..." } ],
#     "createdAt": "...",
#     "updatedAt": "..."
#   }
# }

# =============================================================================
# NOTES
# =============================================================================
# 1. Replace YOUR_JWT_TOKEN, BRANCH_ID_HERE, ORDER_ID_HERE with real values.
# 2. "branch" is the booking franchise -> an Agency _id (/admin/agency).
#    It is required on create, must exist and must be Active.
#    It can be reassigned later via PUT /admin/parcel-order/:id.
# 3. deliveryCustomer.deliveryBranch is the DESTINATION branch -> an Agency _id.
#    Get the dropdown list from GET /admin/parcel-order/options/delivery-branches
#    (active franchises only). It must be Active, else 400.
# 4. transportationCharge defaults to 0 when omitted;
#    it can be edited later via the /charge endpoint.
# 5. paymentType must be one of: Paid, To Pay, Credit.
# 6. Booking & delivery mobile numbers must be exactly 10 digits.
# 7. Valid statuses (lifecycle order): Order Created, Parcel Collected, Hub Assigned,
#    Parcel Dispatched, Parcel Arrived at Hub, Parcel Processed at Hub,
#    Parcel Dispatched from Hub, Parcel Arrived at Branch, Parcel Received at Branch,
#    Delivered. Status can only move forward.
# 8. Every status change is recorded in statusHistory (status + note + who + when).
# 9. orderNumber is auto-generated (003-611-380 - three groups of three
#    digits, running in order) and is read-only.
# 10. All endpoints require a Bearer token + "Parcel Management" permission.
# 11. Swagger UI available at: http://localhost:3000/api-docs
