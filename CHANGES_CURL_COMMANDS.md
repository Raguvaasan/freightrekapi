# cURL Commands - Parcel / Invoice / Permission changes
# Base URL: http://localhost:3000   (prod: https://freightrekapi.vercel.app)
#
# Covers, in order:
#   1. Parcel creation - delivery agency optional + waybill / vehicleType / vehicleCapacity
#   2. Agency login response - agency type
#   3. Invoice access for a hub
#   4. Role delete (the 500 fix)
#   5. Module lists + staff permissions (admin / franchise / hub)
#   6. Waybill + vehicle on the invoice API

# =============================================================================
# STEP 0: Get a token
# =============================================================================

# --- admin (email + password) ---
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@freightrek.com", "password": "Admin@123" }'

# --- anyone (agency / hub / staff / admin) via the single phone login ---
curl -X POST http://localhost:3000/admin/login/send-otp \
  -H "Content-Type: application/json" \
  -d '{ "phone": "9384171722", "countryCode": "+91" }'

curl -X POST http://localhost:3000/admin/login/verify-otp \
  -H "Content-Type: application/json" \
  -d '{ "phone": "9384171722", "countryCode": "+91", "otp": "123456" }'

# --- agency direct login (OTP only; there is no username/password route) ---
curl -X POST http://localhost:3000/admin/agency/login/send-otp \
  -H "Content-Type: application/json" \
  -d '{ "phone": "9384171722", "countryCode": "+91" }'

curl -X POST http://localhost:3000/admin/agency/login/verify-otp \
  -H "Content-Type: application/json" \
  -d '{ "phone": "9384171722", "countryCode": "+91", "otp": "123456" }'

# --- hub direct login (username + password) ---
curl -X POST http://localhost:3000/admin/hub/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "HUB_USERNAME", "password": "HUB_PASSWORD" }'

# Set these once and reuse below:
#   ADMIN_TOKEN   AGENCY_TOKEN   HUB_TOKEN


# =============================================================================
# 1. PARCEL CREATION - delivery agency is now OPTIONAL
#    + waybill, vehicleType, vehicleCapacity
# =============================================================================

# --- 1a. Book WITHOUT a delivery agency (this used to be rejected) ---
curl -X POST http://localhost:3000/admin/agency/parcel-order \
  -H "Authorization: Bearer AGENCY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingCustomer":  { "name": "Ravi Kumar", "mobileNumber": "9876543210" },
    "paymentType":      "To Pay",
    "deliveryCustomer": { "name": "Suresh", "mobileNumber": "9876543211" },
    "parcelDetails":    { "article": "Machine Parts", "numberOfParcels": 3, "approximateValue": 5000 },
    "transportationCharge": 500,
    "waybill":         "AWB-556677",
    "vehicleType":     "Tata Ace",
    "vehicleCapacity": "2 Ton"
  }'

# --- 1b. Same, WITH a delivery agency (unchanged behaviour) ---
# Pick the destination from the dropdown endpoint first:
curl -X GET "http://localhost:3000/admin/agency/parcel-order/options/delivery-branches" \
  -H "Authorization: Bearer AGENCY_TOKEN"

curl -X POST http://localhost:3000/admin/agency/parcel-order \
  -H "Authorization: Bearer AGENCY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingCustomer":  { "name": "Ravi Kumar", "mobileNumber": "9876543210" },
    "paymentType":      "To Pay",
    "deliveryCustomer": {
      "name": "Suresh",
      "mobileNumber": "9876543211",
      "deliveryAgency": "DESTINATION_AGENCY_ID"
    },
    "parcelDetails":   { "article": "Machine Parts", "numberOfParcels": 3 },
    "transportationCharge": 500,
    "waybill":         "AWB-556677",
    "vehicleType":     "Tata Ace",
    "vehicleCapacity": "2 Ton"
  }'

# --- 1c. Admin booking on an agency's behalf (same new fields) ---
curl -X POST http://localhost:3000/admin/parcel-order \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agency":           "BOOKING_AGENCY_ID",
    "bookingCustomer":  { "name": "Ravi Kumar", "mobileNumber": "9876543210" },
    "paymentType":      "Paid",
    "deliveryCustomer": { "name": "Suresh", "mobileNumber": "9876543211" },
    "parcelDetails":    { "article": "Machine Parts", "numberOfParcels": 3 },
    "transportationCharge": 500,
    "waybill":         "AWB-556677",
    "vehicleType":     "Tata Ace",
    "vehicleCapacity": "2 Ton"
  }'

# --- 1d. Set the delivery agency LATER, and edit waybill / vehicle ---
curl -X PUT http://localhost:3000/admin/agency/parcel-order/ORDER_ID \
  -H "Authorization: Bearer AGENCY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryCustomer": { "deliveryAgency": "DESTINATION_AGENCY_ID" },
    "waybill":         "AWB-111222",
    "vehicleType":     "Eicher Pro",
    "vehicleCapacity": "5 Ton"
  }'

# NOTE: waybill is stored uppercase. The delivery agency can be changed until
#       the parcel status reaches "Parcel Dispatched from Hub".


# =============================================================================
# 2. AGENCY LOGIN RESPONSE - agency type
# =============================================================================
#
# type       = "Own" | "Third Party"   (stored wording)
# agencyType = true | false            (boolean the agency form uses)
#
# Returned by all three of these now:

curl -X POST http://localhost:3000/admin/login/verify-otp \
  -H "Content-Type: application/json" \
  -d '{ "phone": "9384171722", "countryCode": "+91", "otp": "123456" }'
# -> data.agencyType ("Third Party")  and  data.user.type / data.user.agencyType

curl -X POST http://localhost:3000/admin/login/lookup \
  -H "Content-Type: application/json" \
  -d '{ "phone": "9384171722" }'
# -> { userType, module, name, agencyType, active }

curl -X POST http://localhost:3000/admin/agency/login/verify-otp \
  -H "Content-Type: application/json" \
  -d '{ "phone": "9384171722", "countryCode": "+91", "otp": "123456" }'
# -> data.type, data.agencyType, data.profitPercentage


# =============================================================================
# 3. INVOICE ACCESS FOR A HUB
# =============================================================================
#
# The hub UI already calls /admin/invoice - that path now accepts a hub token
# and is scoped to the parcels routed through that hub. No frontend change.

# --- 3a. The call that was returning "admin / agency access required" ---
curl -X GET "http://localhost:3000/admin/invoice?orderId=PARCEL_ORDER_ID" \
  -H "Authorization: Bearer HUB_TOKEN"

# --- 3b. Same thing on the dedicated hub router ---
curl -X GET "http://localhost:3000/hub/invoice?page=1&limit=10" \
  -H "Authorization: Bearer HUB_TOKEN"

curl -X GET "http://localhost:3000/hub/invoice/summary" \
  -H "Authorization: Bearer HUB_TOKEN"

curl -X GET "http://localhost:3000/hub/invoice/order/PARCEL_ORDER_ID" \
  -H "Authorization: Bearer HUB_TOKEN"

curl -X GET "http://localhost:3000/hub/invoice/number/INV-2026-27-000003" \
  -H "Authorization: Bearer HUB_TOKEN"

curl -X GET "http://localhost:3000/hub/invoice/INVOICE_ID" \
  -H "Authorization: Bearer HUB_TOKEN"

# Filters accepted on the list: page, limit, status, invoiceNumber, orderNumber,
# paymentType, search, dateFrom, dateTo
curl -X GET "http://localhost:3000/hub/invoice?status=issued&dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer HUB_TOKEN"

# A hub is READ-ONLY on invoices - this returns 403 "A hub cannot raise invoices":
curl -X POST "http://localhost:3000/admin/invoice/order/PARCEL_ORDER_ID/generate" \
  -H "Authorization: Bearer HUB_TOKEN"

# Another hub's invoice returns 403:
#   "This invoice is for a parcel that is not assigned to your hub"


# =============================================================================
# 4. ROLE DELETE - the 500 fix
# =============================================================================

curl -X DELETE http://localhost:3000/admin/role/ROLE_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Now returns:
#   200 { "success": true,  "message": "Role deleted" }
#   404 { "success": false, "message": "Role not found" }
#   400 { "success": false, "message": "Invalid role ID" }     <- e.g. /admin/role/abc
#   401 { "success": false, "message": "Authorization header missing" }
#   403 { "success": false, "message": "Permission denied" }
# (previously any of these came back as a 500)


# =============================================================================
# 5. MODULE LISTS + STAFF PERMISSIONS
# =============================================================================

# --- 5a. The module list each role screen should offer ---
curl -X GET http://localhost:3000/admin/modules
# -> Dashboard, Agency Management, Hub Management, Route Management,
#    Vehicle Management, Driver Management, Access Management,
#    Parcel Management, Invoice Management, Customer Management,
#    Wallet Management, Settings

curl -X GET http://localhost:3000/admin/franchise/role/modules \
  -H "Authorization: Bearer AGENCY_TOKEN"
# -> Dashboard, Parcel Management, Invoice Management, Wallet Management,
#    Payout Management, Customer Management, Staff Management, Access Management

curl -X GET http://localhost:3000/hub/role/modules \
  -H "Authorization: Bearer HUB_TOKEN"
# -> Dashboard, Parcel Management, Invoice Management, Staff Management,
#    Access Management

# --- 5b. Give an AGENCY staff role invoice access ---
curl -X POST http://localhost:3000/admin/franchise/role \
  -H "Authorization: Bearer AGENCY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "Billing Executive",
    "permissions": [
      { "module": "Dashboard",          "read": true, "write": false, "update": false, "delete": false },
      { "module": "Parcel Management",  "read": true, "write": true,  "update": true,  "delete": false },
      { "module": "Invoice Management", "read": true, "write": true,  "update": false, "delete": false }
    ]
  }'

# --- 5c. Give a HUB staff role invoice access ---
curl -X POST http://localhost:3000/hub/role \
  -H "Authorization: Bearer HUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "Hub Supervisor",
    "permissions": [
      { "module": "Dashboard",          "read": true, "write": false, "update": false, "delete": false },
      { "module": "Parcel Management",  "read": true, "write": false, "update": true,  "delete": false },
      { "module": "Invoice Management", "read": true, "write": false, "update": false, "delete": false }
    ]
  }'

# --- 5d. Add Invoice Management to an existing ADMIN role ---
curl -X PUT http://localhost:3000/admin/role/ROLE_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "Sub Admin",
    "permissions": [
      { "module": "Dashboard",           "read": true, "write": false, "update": false, "delete": false },
      { "module": "Parcel Management",   "read": true, "write": true,  "update": true,  "delete": false },
      { "module": "Invoice Management",  "read": true, "write": true,  "update": true,  "delete": false },
      { "module": "Customer Management", "read": true, "write": false, "update": true,  "delete": false }
    ]
  }'

# --- 5e. Routes that now enforce a staff permission -----------------------
#
# A DIRECT agency / hub login always passes (it owns its own modules).
# A STAFF login is measured against their FranchiseRole / HubRole.
#
#   AGENCY side (module -> route)
#     Parcel Management   GET/POST/PUT  /admin/agency/parcel-order
#                         GET           /admin/franchise/orders
#     Invoice Management  GET           /admin/agency/invoice
#                         POST          /admin/agency/invoice/order/:id/generate
#     Dashboard           GET           /admin/agency/dashboard
#     Wallet Management   GET           /admin/agency/wallet
#     Payout Management   GET           /admin/agency/payout
#     Staff Management    ALL           /admin/agency/users, /admin/franchise/staff
#     Access Management   ALL           /admin/franchise/role
#
#   HUB side
#     Parcel Management   GET/PATCH     /hub/parcel-order, /hub/orders
#     Invoice Management  GET           /hub/invoice, /admin/invoice
#     Dashboard           GET           /hub/dashboard, /admin/hub/dashboard
#     Staff Management    ALL           /hub/manage/staff
#     Access Management   ALL           /hub/role
#
#   ADMIN side
#     Invoice Management  ALL           /admin/invoice   (old "Parcel Management" also passes)
#     Customer Management ALL           /admin/customers
#
# Sample denial:
curl -X GET "http://localhost:3000/admin/agency/invoice?limit=1" \
  -H "Authorization: Bearer AGENCY_STAFF_TOKEN"
# 403 { "success": false, "message": "Permission denied for \"Invoice Management\"" }

# Legacy module names already in the database still work:
#   "Orders" -> Parcel Management,  "Wallet" -> Wallet Management,
#   "Manage Staffs" -> Staff Management,  "Role & Permissions" -> Access Management
# There is NO alias for Invoice Management or Customer Management - grant them.


# =============================================================================
# 6. WAYBILL + VEHICLE ON THE INVOICE API
# =============================================================================
#
# waybill, vehicleType and vehicleCapacity are snapshotted onto the invoice
# and returned by every invoice read endpoint.

curl -X GET "http://localhost:3000/admin/invoice?limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X GET "http://localhost:3000/admin/invoice/order/PARCEL_ORDER_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X GET "http://localhost:3000/admin/invoice/number/INV-2026-27-000018" \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X GET "http://localhost:3000/admin/invoice/INVOICE_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response shape (trimmed):
# {
#   "success": true,
#   "data": {
#     "invoiceNumber": "INV-2026-27-000018",
#     "orderNumber":   "000-000-023",
#     "waybill":         "AWB-556677",
#     "vehicleType":     "Tata Ace",
#     "vehicleCapacity": "2 Ton",
#     "issuedByAgency": { ... },
#     "billTo": { ... },
#     "shipTo": { ... },
#     "parcelDetails": { "article": "Machine Parts", "numberOfParcels": 3 },
#     "charges": { "transportationCharge": 100, "loadingCharge": 10,
#                  "miscellaneousCharge": 10, "totalAmount": 120 },
#     "paymentType": "To Pay",
#     "status": "issued"
#   }
# }
#
# Editing the order keeps the invoice in step:
curl -X PUT http://localhost:3000/admin/agency/parcel-order/ORDER_ID \
  -H "Authorization: Bearer AGENCY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "waybill": "AWB-111222", "vehicleType": "Eicher Pro", "vehicleCapacity": "5 Ton" }'
# -> the invoice for that order now shows AWB-111222 / Eicher Pro / 5 Ton
#
# Invoices raised BEFORE this change have no snapshot of their own, but the
# populated `order` on the response carries waybill / vehicleType /
# vehicleCapacity, so the print screen can fall back to those. Editing the
# order once backfills the invoice.
