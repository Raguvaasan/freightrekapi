# Parcel Inward / Outward Register + Invoice on the order list - API Guide
# Date: August 11, 2026
# Base URL: http://localhost:3000

# =============================================================================
# WHAT CHANGED (3 items)
# =============================================================================
#
# 1. Inward / Outward APIs   an agency's movement register, both directions
# 2. Invoice on the order    every parcel order row now carries its invoice id
# 3. Invoice order filter    /admin/invoice?orderId=... now actually filters
#
# No migration needed. Two compound indexes are added on ParcelOrder and build
# themselves on first connect.

# =============================================================================
# 1. INWARD / OUTWARD REGISTER
# =============================================================================
#
# One agency is both an origin and a destination, so "its parcels" splits two
# ways. These are the two registers:
#
#   OUTWARD  parcels BOOKED at this agency and sent out
#            -> query: agency = <this agency>
#
#   INWARD   parcels booked SOMEWHERE ELSE and addressed to this agency
#            for delivery
#            -> query: deliveryCustomer.deliveryAgency = <this agency>
#
# Admin:
#   GET /admin/parcel-order/outward?agency=<agencyId>
#   GET /admin/parcel-order/inward?agency=<agencyId>
#
# Agency login (agency comes from the token; ?agency= is ignored):
#   GET /admin/agency/parcel-order/outward
#   GET /admin/agency/parcel-order/inward
#   (the deprecated /admin/branch/parcel-order/* also works)
#
# Permission (admin only): Parcel Management -> read
# A hub login gets 403 - a hub has no inward/outward of its own, its movements
# are the hub queues.

# ---- Admin ------------------------------------------------------------------

# Everything AGENCY_ID sent out
curl -X GET "http://localhost:3000/admin/parcel-order/outward?agency=$AGENCY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Everything addressed TO AGENCY_ID for delivery
curl -X GET "http://localhost:3000/admin/parcel-order/inward?agency=$AGENCY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# agency is REQUIRED for admin - inward/outward only mean something relative to
# one agency:
# => 400 { "message": "agency is required — an inward/outward register belongs to one agency" }

# ---- Agency login -----------------------------------------------------------

# This agency's own outward register
curl -X GET "http://localhost:3000/admin/agency/parcel-order/outward" \
  -H "Authorization: Bearer $AGENCY_TOKEN"

# This agency's own inward register
curl -X GET "http://localhost:3000/admin/agency/parcel-order/inward" \
  -H "Authorization: Bearer $AGENCY_TOKEN"

# The agency is taken from the token. Passing ?agency=<someone else> is ignored,
# so one agency can never read another's register.

# ---- Filters ----------------------------------------------------------------
#
# Everything the normal order list accepts works here too:
#
#   page, limit          default 1 / 10
#   search               orderNumber, booking/delivery customer name & mobile
#   status               any lifecycle status
#   paymentType          Paid / To Pay / Credit
#   hubAssignment        assigned / unassigned
#   dateFrom, dateTo     booking date range (or ?date= for a single day)
#
# Plus one new one:
#
#   counterpartAgency    the agency at the OTHER end of the movement
#                          on outward -> the DESTINATION agency
#                          on inward  -> the ORIGIN (booking) agency

# What did Chennai send to Coimbatore?
curl -X GET "http://localhost:3000/admin/parcel-order/outward?agency=$CHENNAI_ID&counterpartAgency=$COIMBATORE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# What came in to Coimbatore FROM Chennai? (same set, read from the other side)
curl -X GET "http://localhost:3000/admin/parcel-order/inward?agency=$COIMBATORE_ID&counterpartAgency=$CHENNAI_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Today's inward that is not delivered yet
curl -X GET "http://localhost:3000/admin/agency/parcel-order/inward?date=2026-08-11&status=Parcel%20Arrived%20at%20Branch" \
  -H "Authorization: Bearer $AGENCY_TOKEN"

# ---- Response ---------------------------------------------------------------
#
# {
#   "success": true,
#   "data": {
#     "direction": "inward",                    // or "outward"
#     "agency": {                               // whose register this is
#       "_id": "...", "agencyName": "Coimbatore Agency",
#       "agencyOwner": "...", "phone": "...", "city": "...", "state": "...",
#       "pincode": "...", "status": "Active", "type": "Third Party",
#       "profitPercentage": 10
#     },
#     "orders": [ ...same shape as the normal order list... ],
#     "totals": {
#       "transportationCharge": 1000, "loadingCharge": 100,
#       "miscellaneousCharge": 100,   "totalAmount": 1200
#     },
#     "pagination": { "total": 24, "page": 1, "limit": 10, "totalPages": 3 }
#   }
# }
#
# totals cover the WHOLE filtered set, not just the page - so a date-ranged
# register shows the period's value directly.
#
# Reading the counterpart off a row:
#   inward  -> order.agency                            (where it came from)
#   outward -> order.deliveryCustomer.deliveryAgency   (where it went)
# Both are populated with name / owner / phone / city / state / pincode.

# ---- Note on the older `direction` filter -----------------------------------
#
# The plain list already had ?direction=outgoing|incoming for an agency login.
# That still works and is unchanged. The registers are the fuller version:
# admin can use them, they name the agency in the response, and they add
# counterpartAgency.
#
#   ?direction=outgoing   ==  /outward     (agency login only)
#   ?direction=incoming   ==  /inward      (agency login only)

# =============================================================================
# 2. INVOICE ID ON THE PARCEL ORDER LIST
# =============================================================================
#
# Previously the invoice came back only from the CREATE response; a listing had
# to call /admin/invoice/order/{orderId} once per row. Now every order row
# carries it, fetched for the whole page in one query.
#
# Applies to:
#   GET /admin/parcel-order              (list)
#   GET /admin/parcel-order/{id}         (detail)
#   GET /admin/parcel-order/inward       (register)
#   GET /admin/parcel-order/outward      (register)
#   ...and the /admin/agency/parcel-order equivalents.

curl -X GET "http://localhost:3000/admin/parcel-order?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Each row now has three extra fields:
#
# {
#   "orderNumber": "003-611-380",
#   "status": "Delivered",
#   "statusLabel": "Delivered",
#   "totalAmount": 1200,
#
#   "invoiceId": "68f0a1b2c3d4e5f6a7b8c9d0",
#   "invoiceNumber": "INV-2026-27-000045",
#   "invoice": {
#     "_id": "68f0a1b2c3d4e5f6a7b8c9d0",
#     "invoiceNumber": "INV-2026-27-000045",
#     "invoiceDate": "2026-08-11T06:20:11.482Z",
#     "status": "issued",              // issued | cancelled
#     "totalAmount": 1200
#   }
# }
#
# An order with no invoice raised yet gets all three as null:
#   "invoiceId": null, "invoiceNumber": null, "invoice": null
#
# There is exactly one invoice per order (unique index), so this is never a
# list. For the full invoice - bill to / ship to / parcel details / revisions -
# use the id: GET /admin/invoice/{invoiceId}
#
# The detail endpoint GET /admin/parcel-order/{id} also gained statusLabel and
# the deprecated `branch` mirror, so it now matches the list row exactly.

# =============================================================================
# 3. INVOICE LIST - FILTER BY ORDER ID
# =============================================================================
#
# ?orderId= was being ignored, so the call quietly returned the full invoice
# list instead of the one invoice. It filters now.

# Admin
curl -X GET "http://localhost:3000/admin/invoice?orderId=$ORDER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Agency login (scoped to its own invoices)
curl -X GET "http://localhost:3000/admin/agency/invoice?orderId=$ORDER_ID" \
  -H "Authorization: Bearer $AGENCY_TOKEN"

# ?order= is accepted as an alias for ?orderId=
# A malformed id is rejected instead of ignored:
#   => 400 { "message": "Invalid order ID" }
#
# One invoice per order, so the result is 0 or 1 row inside the usual list
# envelope (invoices / totals / pagination).
#
# If you want the invoice itself rather than a list, the direct route is still
# the better call:
#   GET /admin/invoice/order/{orderId}
#   GET /admin/agency/invoice/order/{orderId}
# That one was always working - it returns the invoice object, or 404.

# =============================================================================
# ENDPOINT SUMMARY (new / changed)
# =============================================================================
#
# New
#   GET /admin/parcel-order/outward?agency={id}     admin, Parcel Management read
#   GET /admin/parcel-order/inward?agency={id}      admin, Parcel Management read
#   GET /admin/agency/parcel-order/outward          agency token
#   GET /admin/agency/parcel-order/inward           agency token
#   GET /admin/branch/parcel-order/outward          deprecated path, still works
#   GET /admin/branch/parcel-order/inward           deprecated path, still works
#
# Changed - response gained invoiceId / invoiceNumber / invoice
#   GET /admin/parcel-order
#   GET /admin/parcel-order/{id}
#   GET /admin/agency/parcel-order
#   GET /admin/agency/parcel-order/{id}
#
# Changed - orderId / order query filter now applied
#   GET /admin/invoice
#   GET /admin/agency/invoice
#
# New query parameter
#   counterpartAgency    on the inward/outward registers only
#
# =============================================================================
# ERRORS
# =============================================================================
#
# 400  agency is required — an inward/outward register belongs to one agency
#        admin called /inward or /outward without ?agency=
# 400  Invalid agency ID / Invalid counterpartAgency ID / Invalid order ID
# 403  The inward/outward register is for agency and admin logins
#        a hub token called /inward or /outward
# 403  Account is not allowed to access the parcel flow (or is inactive)
# 404  Agency not found
