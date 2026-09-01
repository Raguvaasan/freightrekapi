# Admin Dashboard API - cURL Commands
# Base URL: http://localhost:3000
#
# The admin dashboard for the PARCEL flow. Orders and revenue come from parcel
# bookings (ParcelOrder), not from courier shipments - the pre-parcel screen is
# still there, unchanged, at /admin/dashboard/shipments.
#
# Revenue everywhere here means the total the customer pays:
#   transportation + loading + miscellaneous
#
# TAMIL SUMMARY
# -------------
# - Dashboard ippo parcel booking-la irunthu varuthu, shipment-la irunthu illa.
# - Total Revenue-nu solradhu customer kudukkura mothra thoga (transport +
#   loading + misc).
# - Payment chart-la moonu vagai: Prepaid (Paid), ToPay (To Pay), Credit.
# - "Payment for Truecargo" = booking-la admin-ku vandha share.
#   "Agency Payment" = agency thanakku vechukkitta commission.
# - Palaya courier dashboard venumna /admin/dashboard/shipments-la irukku.

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
# STEP 2: The dashboard, in one call
# =============================================================================

curl -X GET http://localhost:3000/admin/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Everything the screen needs comes back together:
#
#   1. overview.totalAgencies          { total, active }
#   2. overview.totalHubs              { total, active }
#   3. overview.totalOrders            all-time parcel bookings
#   4. overview.totalRevenue           all-time, rupees
#   5. overview.todayOrders            booked since midnight
#   6. overview.todayRevenue           same window
#   7. paymentTypeDistribution[]       Prepaid / ToPay / Credit
#   8. recentBookings[]                last 10 bookings
#   9. topAgencies[]                   top 5 by revenue
#  10. walletSummary                   the money tile (see STEP 4)

# ---- period ----------------------------------------------------------------
#
# Optional. today | week | month | year | all (default all). It scopes the
# payment chart and the top-agency table ONLY - the headline totals stay
# all-time, next to today's figures, so the tiles never move under you.
# Anything unrecognised falls back to `all` rather than erroring.

curl -X GET "http://localhost:3000/admin/dashboard?period=month" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# =============================================================================
# STEP 3: What the response looks like
# =============================================================================
#
# {
#   "success": true,
#   "data": {
#     "overview": {
#       "totalAgencies": { "total": 4, "active": 4 },
#       "totalHubs":     { "total": 2, "active": 2 },
#       "totalOrders": 11,
#       "totalRevenue": 144,
#       "todayOrders": 0,
#       "todayRevenue": 0,
#       "currency": "₹"
#     },
#
#     "paymentTypeDistribution": [
#       { "type": "Paid",   "label": "Prepaid", "count": 3, "amount": 24,  "percentage": 27.27 },
#       { "type": "To Pay", "label": "ToPay",   "count": 8, "amount": 120, "percentage": 72.73 },
#       { "type": "Credit", "label": "Credit",  "count": 0, "amount": 0,   "percentage": 0 }
#     ],
#
#     "recentBookings": [
#       {
#         "orderId": "6a7eab03ac6ee6d5fa655f67",
#         "orderNumber": "003-611-380",
#         "agencyName": "Chennai Agency",
#         "deliveryAgencyName": "Madurai Agency",
#         "bookingCustomer": "Gokul",
#         "deliveryCustomer": "Ragul",
#         "paymentType": "To Pay", "paymentTypeLabel": "ToPay",
#         "amount": 120,
#         "status": "Hub Assigned",
#         "createdAt": "2026-08-14T05:43:31.578Z"
#       }
#     ],
#
#     "topAgencies": [
#       { "agencyId": "...", "agencyName": "Chennai Agency",
#         "type": "Third Party", "agencyType": false,
#         "city": "Chennai", "orders": 2, "revenue": 120 }
#     ],
#
#     "walletSummary": { ... see STEP 4 ... },
#     "period": "all"
#   }
# }
#
# `type` is the stored value and `label` is what the chart shows. The stored
# values are what bookings are made under, so they are never renamed - only the
# label is mapped (Paid -> Prepaid, To Pay -> ToPay).
#
# All three payment types are always returned, including ones with no bookings.
# A chart that silently drops an empty slice reads as if it does not exist.

# =============================================================================
# STEP 4: The money tile (replaces Wallet Statistics)
# =============================================================================

curl -X GET http://localhost:3000/admin/dashboard/wallet-statistics \
  -H "Authorization: Bearer ADMIN_TOKEN"

# {
#   "totalTransactions": 8,       <- every agency wallet movement, count
#   "paymentForTruecargo": 144,   <- admin's share, remitted by the agencies
#   "agencyPayment": 0,           <- commission the agencies kept
#   "settledOrders": 4,
#   "totalBookingAmount": 144,
#   "totalBalance": 930,          <- held across every agency wallet
#   "totalWallets": 4,
#   "credits": { "amount": 1200, "count": 4 },
#   "debits":  { "amount": 270,  "count": 4 },
#   "currency": "₹"
# }
#
# Every booking splits in two - the admin's share, which leaves the agency
# wallet, and the commission the agency keeps:
#
#   ₹120 booking at 10% commission -> Truecargo ₹108, agency ₹12
#
# paymentForTruecargo is the first half, agencyPayment the second, over SETTLED
# bookings only. A reversed settlement has already been undone in the wallets,
# so counting it would overstate both.
#
# agencyPayment reads 0 when the agencies are on 0% commission, or when they are
# "Own" agencies (company-run, so the whole total belongs to admin). Set the
# percentage at PATCH /admin/agency-wallet/{agencyId}/percentage.
#
# The same numbers appear on this call and inside the dashboard's
# `walletSummary`, so the screen needs one call, not two.

# =============================================================================
# STEP 5: Top agencies on their own
# =============================================================================

curl -X GET "http://localhost:3000/admin/dashboard/top-agencies?limit=5&period=month" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Ranked by revenue, then order count. Orders with no booking agency are left
# out - they cannot be named, so they would rank as one nameless row. They do
# still count towards totalOrders / totalRevenue.

# =============================================================================
# STEP 6: The old courier dashboard
# =============================================================================
#
# Unchanged, just moved off the root path. Shipment counts, Surface / Express
# split, Delhivery cost and markup profit.

curl -X GET "http://localhost:3000/admin/dashboard/shipments?period=week" \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X GET "http://localhost:3000/admin/dashboard/top-franchises?limit=5" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# =============================================================================
# IF THE NUMBERS LOOK LOW
# =============================================================================
#
# Orders booked before the branch -> agency rename still carry their agency id
# under `branch` and have no `totalAmount`. They count in totalOrders but add
# nothing to revenue, show as "Unknown" in recentBookings, and are left out of
# topAgencies. Run the migration once:
#
#   node scripts/migrate-branch-to-agency.js --dry-run   # report
#   node scripts/migrate-branch-to-agency.js             # apply
#
# TAMIL: dashboard-la order count sari-ya irundhu revenue kammi-ya irundha,
# indha migration run pannala-nu artham.

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
#
# Parcel dashboard
#   GET /admin/dashboard                        ?period=today|week|month|year|all
#   GET /admin/dashboard/top-agencies           ?limit=5&period=...
#   GET /admin/dashboard/wallet-statistics
#
# Courier dashboard (pre-parcel)
#   GET /admin/dashboard/shipments              ?period=day|week|month|year
#   GET /admin/dashboard/top-franchises         ?limit=5
#
# Reports (unchanged)
#   GET /admin/dashboard/orders-statistics
#   GET /admin/dashboard/franchise-report
