# Agency & Hub Dashboard API - cURL Commands
# Base URL: http://localhost:3000
#
# Two self-service dashboards for the parcel flow. Each is scoped to whoever is
# logged in - no agency id or hub id is ever accepted, so one login can never
# read another's numbers. The admin's cross-agency view is a separate screen,
# see ADMIN_DASHBOARD_APIS.md.
#
# Every figure comes from the same ParcelOrder / ParcelSettlement records the
# listings and the wallet read, so a tile and the list behind it always agree.
#
# TAMIL SUMMARY
# -------------
# - Agency dashboard: /admin/agency/dashboard - agency token vechu kupdanum,
#   agency id anuppa vendam, login-la irunthu edukkuthu.
# - Hub dashboard: /admin/hub/dashboard (illa /hub/dashboard) - hub token.
# - "Access denied" nu vandha, URL thappu-nu artham. Ippo thappaana path-ku
#   404 varum, permission error varaathu.
# - Agency-ku "orders" nu solradhu avanga book panna parcel. Avangalukku
#   delivery-ku vara parcel thani-ya `inwardOrders`-la varum, delivered aana
#   udane andha count-la irunthu poidum.
# - Outstanding = innum collect pannaatha kaasu (To Pay + Credit, delivery
#   aagaatha order-gal).
# - Payout Due = agency sambarichha commission.

# =============================================================================
# AGENCY DASHBOARD
# =============================================================================

# ---- Log in as the agency (phone OTP) --------------------------------------

curl -X POST http://localhost:3000/admin/login/send-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\" }"

curl -X POST http://localhost:3000/admin/login/verify-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"otp\": \"123456\" }"

# ---- The dashboard ---------------------------------------------------------

curl -X GET http://localhost:3000/admin/agency/dashboard \
  -H "Authorization: Bearer AGENCY_TOKEN"

# {
#   "success": true,
#   "data": {
#     "agency": {
#       "agencyId": "6a7c05c9a4dd796109570e58",
#       "agencyName": "Chennai Agency",
#       "city": "Chennai", "state": "Tamil Nadu",
#       "status": "Active", "profitPercentage": 10
#     },
#     "overview": {
#       "totalOrders": 3,
#       "todayOrders": 1,
#       "totalRevenue": 240,
#       "todayRevenue": 120,
#       "totalOutstanding": 240,
#       "outstandingOrders": 3,
#       "totalPayoutDue": 12,
#       "payoutOrders": 3,
#       "deliveredOrders": 0,
#       "inTransitOrders": 0,
#       "inwardOrders": 0,
#       "walletBalance": 272,
#       "currency": "INR"
#     }
#   }
# }

# ---- What each figure means ------------------------------------------------
#
# totalOrders / todayOrders
#   Parcels booked AT this agency. Parcels addressed to it for delivery are not
#   counted here - they are inwardOrders.
#
# totalRevenue / todayRevenue
#   The total the customer pays on those bookings:
#     transportation + loading + miscellaneous
#   Today's figures run from midnight.
#
# totalOutstanding  (+ outstandingOrders, the count behind it)
#   Money still to be collected from customers: To Pay and Credit bookings that
#   have not been handed over yet. Prepaid ("Paid") was collected at booking,
#   and a delivered To Pay is taken as collected on handover.
#
#   There is no payment-received flag on an order, so delivery IS the signal.
#
# totalPayoutDue  (+ totalProfitEarned, totalPayoutPaid, payoutOrders)
#   Commission still OWED to this agency: its share of every settled booking,
#   less whatever admin has already paid across.
#
#     totalPayoutDue = totalProfitEarned - totalPayoutPaid
#
#   Admin records those payments on the Agency Payout Details screen, so the
#   two screens always show the same numbers - see AGENCY_PAYOUT_APIS.md.
#   Reads 0 while profitPercentage is 0, or for an "Own" agency (company-run,
#   no commission).
#
# deliveredOrders
#   Booked here and now "Delivered".
#
# inTransitOrders
#   Booked here, dispatched, not delivered yet. That is every stage from
#   "Parcel Dispatched" up to but not including "Delivered".
#
# inwardOrders
#   Addressed to this agency for delivery and NOT handed over yet. A parcel
#   drops off this count the moment its status becomes "Delivered", which is
#   what you asked for - the inward list only ever shows outstanding work.
#
# walletBalance
#   Current prepaid balance. Bookings are blocked with 402 once it cannot cover
#   the admin share; top-ups are admin-side, see ADMIN_WALLET_APIS.md.

# ---- Related agency screens ------------------------------------------------
#
#   GET /admin/agency/parcel-order              orders booked + received
#   GET /admin/agency/parcel-order/inward       the inward register itself
#   GET /admin/agency/parcel-order/outward      the outward register
#   GET /admin/agency/wallet                    balance and settlement totals
#   GET /admin/agency/invoice                   invoices
#
# Admin side of the same commission: GET /admin/agency-payout/{agencyId}

# =============================================================================
# HUB DASHBOARD
# =============================================================================

# Two paths, same screen. /admin/hub/dashboard mirrors the agency one, so both
# self-service dashboards sit at matching URLs; /hub/dashboard is the original.

curl -X GET http://localhost:3000/admin/hub/dashboard \
  -H "Authorization: Bearer HUB_TOKEN"

curl -X GET http://localhost:3000/hub/dashboard \
  -H "Authorization: Bearer HUB_TOKEN"

# {
#   "success": true,
#   "data": {
#     "hub": {
#       "hubId": "6a71...", "hubName": "Chennai Hub",
#       "city": "Chennai", "state": "Tamil Nadu", "status": true
#     },
#     "overview": {
#       "todayOrders": 0,
#       "todayAssigned": 0,
#       "assignedOrders": 5,
#       "pendingOrders": 4,
#       "inTransitOrders": 0,
#       "deliveredOrders": 1
#     }
#   }
# }

# ---- What each figure means ------------------------------------------------
#
# todayOrders     booked today AND routed to this hub
# todayAssigned   handed to this hub today, whenever they were booked
#
#   Both readings of "today's orders" are returned because they answer different
#   questions - show whichever the screen means.
#
# assignedOrders  everything an admin has ever routed here
#
# pendingOrders   this hub's queue: assigned but not dispatched onward. That is
#                 "Hub Assigned", "Parcel Dispatched", "Parcel Arrived at Hub"
#                 and "Parcel Processed at Hub".
#
# inTransitOrders left this hub, not delivered yet: "Parcel Dispatched from
#                 Hub", "Parcel Arrived at Branch", "Parcel Received at Branch".
#
# deliveredOrders routed here and now "Delivered".
#
# A hub never books a parcel, so there is no revenue on this screen.
#
# The status buckets are derived from the lifecycle order in code, not listed
# again, so inserting a stage cannot leave a tile counting the wrong set.

# ---- The old courier dashboard ---------------------------------------------
#
# Unchanged, just moved off the root path.

curl -X GET "http://localhost:3000/hub/dashboard/shipments?period=thisMonth" \
  -H "Authorization: Bearer HUB_TOKEN"

# =============================================================================
# IF THE NUMBERS LOOK LOW
# =============================================================================
#
# Orders booked before the branch -> agency rename still carry their agency id
# under `branch` and have no `totalAmount`, so they belong to no agency and add
# nothing to revenue. Run the migration once:
#
#   node scripts/migrate-branch-to-agency.js --dry-run   # report
#   node scripts/migrate-branch-to-agency.js             # apply

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
#
# Agency (agency token)
#   GET /admin/agency/dashboard
#
# Hub (hub token)
#   GET /admin/hub/dashboard          same screen, matching the agency path
#   GET /hub/dashboard
#   GET /hub/dashboard/shipments      ?period=week|thisMonth|lastMonth|month
#
# Admin (admin token) - see ADMIN_DASHBOARD_APIS.md
#   GET /admin/dashboard
#   GET /admin/dashboard/top-agencies
#   GET /admin/dashboard/wallet-statistics
