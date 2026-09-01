# Agency rename, Invoice, Charges, Users, Single Login - API Guide
# Date: August 6, 2026
# Base URL: http://localhost:3000

# =============================================================================
# WHAT CHANGED (9 items)
# =============================================================================
#
# 1. Branch -> Agency        field/route rename, old names still work
# 2. Collection Agency       hidden (410 Gone + dropped from the module list)
# 3. Customer address + GST  optional on booking and delivery customer
# 4. Invoice                 auto-created for every parcel order
# 5. Loading + Misc charges  10% each on top of the transport charge
# 6. Agency Type             Third Party (commission) / Own (no commission)
# 7. Agency users            many users per agency, each with their own phone
# 8. Single login            one phone screen, routed by user type
# 9. Order listing           date filters + totals
#
# ==> RUN THE MIGRATION ONCE BEFORE DEPLOYING:
#
#     node scripts/migrate-branch-to-agency.js --dry-run   # see what it will do
#     node scripts/migrate-branch-to-agency.js             # apply
#
#     It renames branch -> agency in parcel orders and settlements, backfills
#     the charge breakdown, and defaults agency type + charge percentages.
#     Safe to re-run; a second run reports 0 changes.

# =============================================================================
# 1. BRANCH -> AGENCY RENAME
# =============================================================================
#
# New names (use these):        Old names (still accepted, deprecated):
#   agency                        branch
#   deliveryCustomer.deliveryAgency   deliveryCustomer.deliveryBranch
#   /admin/agency/parcel-order        /admin/branch/parcel-order
#   /admin/agency/wallet              /admin/branch/wallet
#   /admin/agency-wallet              /admin/branch-wallet
#
# Responses carry BOTH: `agency` plus a deprecated `branch` mirror, so the
# current frontend keeps working. Drop the old keys once the UI has moved.
#
# Parcel STATUS values are unchanged in the database ("Parcel Arrived at
# Branch"), because renaming them would rewrite every order's history. Each
# response now also carries `statusLabel` with the Agency wording — show that:
#
#   "status": "Parcel Arrived at Branch",
#   "statusLabel": "Parcel Arrived at Agency"
#
# The same applies to the tracking timeline, where `updatedByRole` is
# normalised from the old "branch" to "agency".

# =============================================================================
# 2. COLLECTION AGENCY HIDDEN
# =============================================================================
#
# /admin/collection-agency/* answers 410 Gone:
#   { "success": false,
#     "message": "Collection Agency is not available. This module is currently hidden." }
#
# Nothing was deleted. To bring it back, set COLLECTION_AGENCY_ENABLED=true.
#
# The module list endpoint drives menus and the role/permission screen and now
# leaves Collection Agency out:

curl -X GET http://localhost:3000/admin/modules

# => { "modules": ["Dashboard", "Agency Management", "Hub Management", ...] }

# =============================================================================
# 6. AGENCY TYPE (Third Party / Own) + COMMISSION
# =============================================================================
#
# Third Party -> commission applies (profitPercentage)
# Own         -> company-run, NO commission; the whole booking total goes to admin

curl -X POST http://localhost:3000/admin/agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"agencyName\": \"Chennai Central Agency\",
    \"agencyOwner\": \"Ramesh\",
    \"phone\": \"9876543210\",
    \"type\": \"Third Party\",
    \"profitPercentage\": 10,
    \"loadingChargePercentage\": 10,
    \"miscChargePercentage\": 10
  }"

# An Own agency's commission is forced to 0 even if you send one:

curl -X POST http://localhost:3000/admin/agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"agencyName\": \"Madurai Own Agency\",
    \"agencyOwner\": \"Kumar\",
    \"phone\": \"9876543211\",
    \"type\": \"Own\",
    \"profitPercentage\": 25
  }"

# => profitPercentage comes back as 0

# Setting a commission on an Own agency is refused (400):
curl -X PATCH http://localhost:3000/admin/agency/AGENCY_ID/profit-percentage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{ \"profitPercentage\": 15 }"

# Filter by type:
curl -X GET "http://localhost:3000/admin/agency?type=Own" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# 5. LOADING (10%) + MISCELLANEOUS (10%) CHARGES
# =============================================================================
#
# Enter the transport charge; the other two are calculated automatically:
#
#   transport 100 + loading 10 + miscellaneous 10 = total 120
#
# The percentages are per agency (loadingChargePercentage / miscChargePercentage,
# both default 10), so they can be changed without a code change.
#
# IMPORTANT: the wallet commission split now applies to the TOTAL, not the
# transport charge. 120 total at 10% commission -> agency keeps 12, admin gets 108.

# Preview before booking:
curl -X GET "http://localhost:3000/admin/parcel-settlement/preview?amount=100&agency=AGENCY_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# {
#   "charges": {
#     "transportationCharge": 100,
#     "loadingChargePercentage": 10, "loadingCharge": 10,
#     "miscChargePercentage": 10,    "miscellaneousCharge": 10,
#     "totalAmount": 120
#   },
#   "orderAmount": 120,
#   "profitPercentage": 10,
#   "agencyProfitAmount": 12,
#   "adminShareAmount": 108,
#   "type": "Third Party", "agencyType": false,
#   "commissionApplicable": true,
#   "walletBalance": 5000,
#   "balanceAfterBooking": 4892,
#   "sufficientBalance": true
# }

# =============================================================================
# 3 + 4. BOOKING WITH ADDRESS/GST -> INVOICE AUTO-CREATED
# =============================================================================

curl -X POST http://localhost:3000/admin/agency/parcel-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN" \
  -d "{
    \"bookingCustomer\": {
      \"name\": \"Suresh\",
      \"mobileNumber\": \"9876543210\",
      \"address\": \"12 Anna Salai, Chennai 600002\",
      \"gstNumber\": \"33ABCDE1234F1Z5\"
    },
    \"paymentType\": \"Paid\",
    \"deliveryCustomer\": {
      \"name\": \"Kumar\",
      \"mobileNumber\": \"9876500000\",
      \"address\": \"45 Gandhi Road, Coimbatore\",
      \"gstNumber\": \"33XYZAB5678C1Z2\",
      \"deliveryAgency\": \"DESTINATION_AGENCY_ID\"
    },
    \"parcelDetails\": {
      \"article\": \"Documents\",
      \"numberOfParcels\": 1,
      \"approximateValue\": 500
    },
    \"transportationCharge\": 100
  }"

# address and gstNumber are OPTIONAL on both customers. GST, when given, must be
# a valid GSTIN.
#
# The response carries the charges, the wallet split and the invoice:
#
# {
#   "transportationCharge": 100, "loadingCharge": 10,
#   "miscellaneousCharge": 10,   "totalAmount": 120,
#   "walletSettlement": {
#     "status": "settled", "orderAmount": 120, "profitPercentage": 10,
#     "agencyProfitAmount": 12, "adminShareAmount": 108
#   },
#   "invoice": {
#     "invoiceNumber": "INV-2026-27-000001",
#     "billTo":  { "name": "Suresh", "gstNumber": "33ABCDE1234F1Z5", ... },
#     "shipTo":  { "name": "Kumar", "agencyName": "Coimbatore Agency", ... },
#     "pickupAddress":   "12 Anna Salai, Chennai 600002",
#     "deliveryAddress": "45 Mettupalayam Road, Coimbatore 641043",
#     "charges": { ... "totalAmount": 120 }
#   }
# }
#
# Invoice numbers run per financial year: INV-<FY>-<6 digits>.
# Every party and amount is snapshotted, so a reprint months later matches what
# was billed even if the agency or customer record changed since.
#
# PICKUP / DELIVERY ADDRESS
# -------------------------
# pickupAddress and deliveryAddress are set on the order (both optional, max 500
# chars) and are separate from the customers' own `address` fields - a parcel is
# often collected from a warehouse and dropped somewhere other than the
# consignee's registered address. They come back on every parcel-order read
# (list, inward/outward register, by id, tracking) and on every invoice read.
#
# TAMIL: pickup address-um delivery address-um order-la thani field. Customer
# address vera, indha rendum vera. List, invoice ellathulaum varum.

# ---- Invoice APIs (admin) ---------------------------------------------------

curl -X GET "http://localhost:3000/admin/invoice?page=1&limit=10&agency=AGENCY_ID&status=issued&dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/invoice/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/invoice/INVOICE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/invoice/number/INV-2026-27-000001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/invoice/order/ORDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# For orders booked before invoicing existed, or to re-issue a cancelled one:
curl -X POST http://localhost:3000/admin/invoice/order/ORDER_ID/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X PATCH http://localhost:3000/admin/invoice/INVOICE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{ \"notes\": \"Verified against the cash book\" }"

curl -X POST http://localhost:3000/admin/invoice/INVOICE_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{ \"reason\": \"Booking cancelled\" }"

# ---- Invoice APIs (agency login, read-only) --------------------------------
#
# An agency reads the invoices it raised AND the ones for parcels addressed to
# it for delivery - the destination agency has to be able to print what it is
# handing over. Raising / editing / cancelling still belongs to the booking
# agency and admin.
#
# The same applies on the shared admin path, so an agency login can use either:
#
#   GET /admin/invoice?orderId=ORDER_ID
#   GET /admin/agency/invoice?orderId=ORDER_ID
#
# TAMIL: munnadi agency thanoda booking invoice-a mattum thaan paakka mudinjuthu
# - inbound parcel-ku orderId kudutha list kaali-ya vanthuchu. Ippo delivery
# agency-um paakkalaam.
#
# Palaya invoice records-la delivery agency store aagala, so onnu backfill
# panunga:  node scripts/backfill-invoice-delivery-agency.js

curl -X GET http://localhost:3000/admin/agency/invoice \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN"

# The single invoice for one order (empty list here means no invoice was ever
# raised for it - use the generate endpoint above):
curl -X GET "http://localhost:3000/admin/agency/invoice?orderId=ORDER_ID" \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/agency/invoice/summary \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/agency/invoice/order/ORDER_ID \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN"

# ---- Changing the charge updates everything -------------------------------
#
# transport 100 -> 200 recalculates loading 20 + misc 20 = total 240, moves only
# the wallet difference, and revises the invoice (same number, revision logged).

curl -X PATCH http://localhost:3000/admin/agency/parcel-order/ORDER_ID/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN" \
  -d "{ \"transportationCharge\": 200 }"

# Override a derived amount (discount / special case):
curl -X PATCH http://localhost:3000/admin/agency/parcel-order/ORDER_ID/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN" \
  -d "{
    \"transportationCharge\": 200,
    \"loadingCharge\": 0,
    \"miscellaneousCharge\": 15
  }"

# Deleting an order refunds the wallet AND cancels the invoice:
curl -X DELETE http://localhost:3000/admin/parcel-order/ORDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# 9. ORDER LISTING WITH DATE
# =============================================================================

curl -X GET "http://localhost:3000/admin/parcel-order?dateFrom=2026-08-01&dateTo=2026-08-31&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Single day (dateTo covers the whole day):
curl -X GET "http://localhost:3000/admin/parcel-order?dateFrom=2026-08-06&dateTo=2026-08-06" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# ?date=2026-08-06 also works as a shorthand for both.
#
# Every row carries createdAt (the booking date), the charge breakdown and
# statusLabel. The response adds totals for the filtered set:
#
#   "totals": { "transportationCharge": 1000, "loadingCharge": 100,
#               "miscellaneousCharge": 100, "totalAmount": 1200 }
#
# Other filters: status, agency, deliveryAgency, hub, hubAssignment,
# paymentType, search, direction (outgoing / incoming for an agency login).

# =============================================================================
# 7. AGENCY USERS (multiple phone logins per agency)
# =============================================================================
#
# Only a name and a phone number are needed. The phone must be unused across
# the whole system, and becomes the user's login.

curl -X POST http://localhost:3000/admin/agency/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN" \
  -d "{
    \"name\": \"Priya\",
    \"phone\": \"9876500011\",
    \"roleId\": \"FRANCHISE_ROLE_ID\"
  }"

# email / username / password are all optional now.

curl -X GET "http://localhost:3000/admin/agency/users?page=1&limit=10&status=Active" \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/agency/users/USER_ID \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN"

curl -X PUT http://localhost:3000/admin/agency/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN" \
  -d "{ \"name\": \"Priya R\" }"

curl -X PATCH http://localhost:3000/admin/agency/users/USER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN" \
  -d "{ \"status\": \"Inactive\" }"

curl -X DELETE http://localhost:3000/admin/agency/users/USER_ID \
  -H "Authorization: Bearer AGENCY_JWT_TOKEN"

# Each user works the Agency module with their own token: booking orders,
# viewing the agency wallet and invoices, all scoped to their agency.
# Their FranchiseRole controls what they can do.
# A user cannot be moved to another agency here, cannot see another agency's
# users, and cannot delete the account they are logged in as.

# =============================================================================
# 8. SINGLE LOGIN PAGE (phone number, routed by user type)
# =============================================================================
#
# One phone field on one screen. Works for Agency, Hub, Staff and Admin — the
# number is unique system-wide, so the type is resolved, not asked for.

curl -X POST http://localhost:3000/admin/login/send-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"countryCode\": \"+91\" }"

# => { "data": { "userType": "agency", "module": "agency" } }

curl -X POST http://localhost:3000/admin/login/verify-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"countryCode\": \"+91\", \"otp\": \"123456\" }"

# {
#   "token": "eyJ...",
#   "data": {
#     "userType": "agency",        // admin | agency | hub | staff
#     "staffType": null,           // head_quarter | franchise | hub (staff only)
#     "module": "agency",          // admin | agency | hub  <-- where to land them
#     "name": "Chennai Central Agency",
#     "agencyId": "...", "agencyName": "...",
#     "hubId": null,   "hubName": null,
#     "user": { ...full profile... }
#   }
# }
#
# Switch the landing screen on `module`:
#   admin  -> admin dashboard
#   agency -> agency module (orders, wallet, invoices, users)
#   hub    -> hub module
#
# A franchise staff member gets userType "staff" + module "agency", so agency
# users land in the same place as the agency itself.

# Resolve the type without sending an OTP (to pre-fill the screen):
curl -X POST http://localhost:3000/admin/login/lookup \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\" }"

# Responses:
#   404 no account with this phone number
#   403 account is inactive
#   400 OTP missing/expired (or a bad phone format)
#   401 invalid OTP  (a wrong attempt does NOT consume the OTP)
#
# The old per-type logins still work:
#   /admin/auth/login              admin email + password
#   /admin/agency/login/send-otp   agency phone OTP
#   /admin/staff/login/send-otp    staff phone OTP
#   /admin/hub/login               hub username + password

# =============================================================================
# ENDPOINT SUMMARY (new / changed)
# =============================================================================
#
# Single login
#   POST   /admin/login/send-otp
#   POST   /admin/login/verify-otp
#   POST   /admin/login/lookup
#   GET    /admin/modules
#
# Invoice (admin)
#   GET    /admin/invoice
#   GET    /admin/invoice/summary
#   GET    /admin/invoice/{id}
#   PATCH  /admin/invoice/{id}
#   POST   /admin/invoice/{id}/cancel
#   GET    /admin/invoice/number/{invoiceNumber}
#   GET    /admin/invoice/order/{orderId}
#   POST   /admin/invoice/order/{orderId}/generate
#
# Invoice (agency)
#   GET    /admin/agency/invoice
#   GET    /admin/agency/invoice/summary
#   GET    /admin/agency/invoice/{id}
#   GET    /admin/agency/invoice/number/{invoiceNumber}
#   GET    /admin/agency/invoice/order/{orderId}
#
# Agency users
#   GET    /admin/agency/users
#   POST   /admin/agency/users
#   GET    /admin/agency/users/{id}
#   PUT    /admin/agency/users/{id}
#   PATCH  /admin/agency/users/{id}/status
#   DELETE /admin/agency/users/{id}
#
# Agency (self) — renamed from /admin/branch/*
#   /admin/agency/parcel-order/*        (was /admin/branch/parcel-order/*)
#   /admin/agency/wallet/*              (was /admin/branch/wallet/*)
#
# Agency wallet (admin) — renamed from /admin/branch-wallet
#   /admin/agency-wallet/*              (was /admin/branch-wallet/*)
#
# Agency
#   PATCH  /admin/agency/{id}/profit-percentage
#   POST   /admin/agency                (+ type, loading/misc %)
#   PUT    /admin/agency/{id}           (+ type, loading/misc %)
#   GET    /admin/agency?type=Own
