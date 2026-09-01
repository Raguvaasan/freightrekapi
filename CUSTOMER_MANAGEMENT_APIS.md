# Customer Management (Booking Customers) API - cURL Commands
# Base URL: http://localhost:3000
#
# The "Customer Management" screen on admin login: everyone who has booked a
# parcel, what they have booked, and every order behind it.
#
# WHERE A CUSTOMER COMES FROM
# ---------------------------
# A booking customer is NOT a collection of its own. Every parcel order carries
# its customer inline:
#
#   bookingCustomer: { name, mobileNumber, address, gstNumber }
#
# So a "customer" here is every booking that shares a MOBILE NUMBER, rolled up
# into one row. That mobile number is the id - there is no _id to pass.
#
# The name / address / GST shown are the ones from the customer's most recent
# booking (the freshest thing anyone typed). If that booking left the address or
# GST blank, any other value recorded against the same number is used instead of
# showing nothing.
#
# Read-only by design: a customer's details are edited on the booking they
# belong to (PUT /admin/parcel-order/{id}). Two places to edit the same name
# would let the screens disagree about which one is current.
#
# WHO CAN SEE IT
#   Admin  - every customer. Permission: "Parcel Management" read, or a root role.
#   Agency - only the customers who booked with it (same scoping as its parcel
#            list). No extra permission needed.
#
# TAMIL SUMMARY
# -------------
# - Customer-nu separate table illa; booking pothu type panna customer details
#   thaan. Mobile number vachu group panni oru row kaattuthu.
# - Mobile number-e customer id. /{mobileNumber} kudutha andha customer details
#   + avanga pota ellaa order-um varum.
# - Name / address / GST - kadaisiyaa pota booking-la irukurathu.
# - Edit panna vendumna order-a edit pannunga (PUT /admin/parcel-order/{id}).
# - Agency login-la andha agency-la book panna customers mattum theriyum.

# =============================================================================
# STEP 1: Log in as admin
# =============================================================================

curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@freightrek.com\",
    \"password\": \"YOUR_PASSWORD\"
  }"

# Copy the token into ADMIN_TOKEN below.

# =============================================================================
# STEP 2: The customer list
# =============================================================================

curl -X GET "http://localhost:3000/admin/booking-customer?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# search matches name / mobile number / GST
curl -X GET "http://localhost:3000/admin/booking-customer?search=ramesh" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Customers of one agency, booked in a date range, biggest spenders first
curl -X GET "http://localhost:3000/admin/booking-customer?agency=AGENCY_ID&dateFrom=2026-08-01&dateTo=2026-08-31&sortBy=amount" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Only the customers with To Pay bookings
curl -X GET "http://localhost:3000/admin/booking-customer?paymentType=To%20Pay" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# {
#   "success": true,
#   "data": {
#     "customers": [
#       {
#         "serialNo": 1,
#         "mobileNumber": "9876543210",          <- the id
#         "name": "Ramesh Kumar",
#         "address": "12, Anna Salai, Chennai",
#         "gstNumber": "33ABCDE1234F1Z5",
#
#         "totalOrders": 4,
#         "totalParcels": 9,
#         "deliveredOrders": 3,
#         "pendingOrders": 1,
#
#         "transportationCharge": 400,
#         "loadingCharge": 20,
#         "miscellaneousCharge": 10,
#         "totalAmount": 430,
#         "paidAmount": 330,
#         "outstandingAmount": 100,
#         "ordersByPaymentType": { "Paid": 3, "To Pay": 1, "Credit": 0 },
#
#         "firstOrderDate": "2026-07-02T...",
#         "lastOrderDate": "2026-08-16T...",
#         "lastOrderNumber": "000-000-012",
#         "lastOrderStatus": "Delivered",
#         "agencies": [
#           { "agencyId": "...", "agencyName": "Chennai Agency",
#             "city": "Chennai", "state": "Tamil Nadu" }
#         ],
#         "currency": "INR"
#       }
#     ],
#     "totals": {
#       "customers": 37, "totalOrders": 214,
#       "totalAmount": 48250, "paidAmount": 41100,
#       "outstandingAmount": 7150, "currency": "INR"
#     },
#     "pagination": { "total": 37, "page": 1, "limit": 10, "totalPages": 4 }
#   }
# }
#
# `totals` covers every customer matching the filters, not just this page.
#
# QUERY PARAMS
#   page, limit
#   search       name / mobile number / GST
#   agency       only bookings made at this agency (admin only - an agency
#                login is already scoped to itself)
#   paymentType  Paid | To Pay | Credit
#   dateFrom     booking date range, inclusive (YYYY-MM-DD or full ISO)
#   dateTo
#   sortBy       recent (default) | orders | amount | name
#
# COLUMN MAPPING
#   S.NO              -> serialNo             (continues across pages)
#   CUSTOMER NAME     -> name
#   MOBILE NUMBER     -> mobileNumber
#   GST               -> gstNumber
#   TOTAL ORDERS      -> totalOrders
#   TOTAL AMOUNT      -> totalAmount          (transport + loading + misc)
#   OUTSTANDING       -> outstandingAmount    (To Pay + Credit bookings)
#   LAST BOOKING      -> lastOrderDate / lastOrderNumber
#
# NOTE ON FILTERS: a filter narrows the BOOKINGS the roll-up is built from, so
# `?dateFrom=2026-08-01` gives each customer's August numbers, not their
# lifetime ones. Drop the filters for lifetime figures.

# =============================================================================
# STEP 3: One customer - details plus every order they placed
# =============================================================================
#
# The mobile number is the id.

curl -X GET http://localhost:3000/admin/booking-customer/9876543210 \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Paginate / filter the order list underneath:
curl -X GET "http://localhost:3000/admin/booking-customer/9876543210?page=1&limit=10&dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X GET "http://localhost:3000/admin/booking-customer/9876543210?paymentType=To%20Pay" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# {
#   "success": true,
#   "data": {
#     "customer": {
#       "mobileNumber": "9876543210",
#       "name": "Ramesh Kumar",
#       "address": "12, Anna Salai, Chennai",
#       "gstNumber": "33ABCDE1234F1Z5",
#       "firstOrderDate": "2026-07-02T...",
#       "lastOrderDate": "2026-08-16T...",
#       "lastOrderNumber": "000-000-012",
#       "lastOrderStatus": "Delivered",
#       "agencies": [ { "agencyId": "...", "agencyName": "Chennai Agency", ... } ]
#     },
#
#     "summary": {                     <- LIFETIME, does not move with filters
#       "totalOrders": 4, "totalParcels": 9,
#       "deliveredOrders": 3, "pendingOrders": 1,
#       "transportationCharge": 400, "loadingCharge": 20,
#       "miscellaneousCharge": 10, "totalAmount": 430,
#       "paidAmount": 330, "outstandingAmount": 100,
#       "ordersByPaymentType": { "Paid": 3, "To Pay": 1, "Credit": 0 },
#       "currency": "INR"
#     },
#
#     "orders": [                      <- full parcel orders, newest first
#       {
#         "_id": "...", "orderNumber": "000-000-012",
#         "agency": { "_id": "...", "agencyName": "Chennai Agency", ... },
#         "bookingCustomer": { "name": "Ramesh Kumar", "mobileNumber": "9876543210", ... },
#         "deliveryCustomer": { "name": "Suresh", "mobileNumber": "9000000000",
#                               "deliveryAgency": { "agencyName": "Madurai Agency", ... } },
#         "parcelDetails": { "article": "Spare parts", "numberOfParcels": 2, ... },
#         "paymentType": "Paid",
#         "transportationCharge": 100, "loadingCharge": 5,
#         "miscellaneousCharge": 2, "totalAmount": 107,
#         "status": "Delivered", "statusLabel": "Delivered",
#         "statusHistory": [ ... ],
#         "hub": { "hubName": "Trichy Hub", ... },
#         "invoice": { "invoiceNumber": "INV-000012", "totalAmount": 107, ... },
#         "invoiceNumber": "INV-000012",
#         "createdAt": "2026-08-16T..."
#       }
#     ],
#
#     "totals": {                      <- the FILTERED order list
#       "transportationCharge": 400, "loadingCharge": 20,
#       "miscellaneousCharge": 10, "totalAmount": 430
#     },
#
#     "pagination": { "total": 4, "page": 1, "limit": 10, "totalPages": 1 }
#   }
# }
#
# TWO SETS OF NUMBERS, ON PURPOSE
#   summary -> the customer's lifetime position. It stays put while the order
#              list is filtered, so the profile cards do not flicker.
#   totals  -> the filtered order list only. Use it under the table.
#
# The order rows are exactly what GET /admin/parcel-order returns (invoice
# included), so the parcel list table component can be reused as-is.
#
# 404: { "success": false, "message": "No bookings found for 9876543210" }
#      - nobody has booked with that number (or not at your agency).
# 400: mobile number must be 6-15 digits.

# =============================================================================
# STEP 4: The agency's own customer list
# =============================================================================
#
# Same two endpoints, an agency token instead. No agency id is passed - it comes
# from the token, so an agency only ever sees the customers who booked with it.

curl -X POST http://localhost:3000/admin/login/send-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\" }"

curl -X POST http://localhost:3000/admin/login/verify-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"otp\": \"123456\" }"

curl -X GET "http://localhost:3000/admin/booking-customer?page=1&limit=10" \
  -H "Authorization: Bearer AGENCY_TOKEN"

curl -X GET http://localhost:3000/admin/booking-customer/9876543210 \
  -H "Authorization: Bearer AGENCY_TOKEN"

# The `agency` query param is ignored for an agency token - the token wins.
# A hub token gets 403: this is a booking screen, and a hub does not book.

# =============================================================================
# NOT THE SAME AS /admin/customers
# =============================================================================
#
#   GET /admin/booking-customer   the people parcels are booked FOR, pulled out
#                                 of the bookings themselves. This file.
#   GET /admin/customers          CustomerUser signups - people who registered
#                                 on the app / website. A separate list, with
#                                 its own create / update / delete.
#
# A walk-in customer appears in the first and not the second; someone who signed
# up but never booked appears in the second and not the first.

# =============================================================================
# IF THE LIST IS EMPTY
# =============================================================================
#
# The list is built from parcel orders, so it is empty until bookings exist.
# Check with:
#
#   GET /admin/parcel-order?limit=1
#
# A customer who books under two different mobile numbers shows up as two
# customers - the number is the identity. Same person, same number, different
# spelling of the name: one customer, the latest spelling.

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
#
#   GET /admin/booking-customer                   the customer list
#   GET /admin/booking-customer/{mobileNumber}    details + all their orders
#
# Related
#   GET /admin/parcel-order                       the bookings themselves
#   PUT /admin/parcel-order/{id}                  where customer details are edited
#   GET /admin/customers                          app / website signups
