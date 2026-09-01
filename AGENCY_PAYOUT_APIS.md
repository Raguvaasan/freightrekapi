# Agency Payout Details API - cURL Commands
# Base URL: http://localhost:3000
#
# The "Agency Payout Details" screen on admin login: what the company owes each
# agency in commission, the bookings behind it, and the payments made.
#
# Permission: "Wallet Management" (read to view, write to pay, delete to
# reverse) or a root role. Paying and reversing are admin only; an agency reads
# its own figures on /admin/agency/payout (see THE AGENCY'S OWN VIEW).
#
# HOW THE MONEY WORKS
# -------------------
# An agency keeps a share of every booking it makes (profitPercentage). That
# share is recorded on the settlement but never moves through a wallet - the
# agency wallet is a PREPAID FLOAT for booking, and mixing commission into it
# would make the balance mean two things. Commission is paid by bank transfer
# and the payment is recorded here:
#
#   Total Booking Amount = sum of booking totals over settled orders
#   Profit               = sum of the agency's share of those orders
#   Paid                 = payments recorded here (reversed ones excluded)
#   Remaining to Pay     = Profit - Paid
#
# So "Pay" does NOT change the agency wallet balance or the admin settlement
# wallet. It records that the transfer happened.
#
# TAMIL SUMMARY
# -------------
# - Ovvoru booking-laum agency oru share (commission) sambarikkuthu. Adhu
#   wallet-la varaathu - wallet-nu solradhu booking panna venumnu munnadiye
#   pota kaasu. Commission bank transfer-la thaan kudukkanum.
# - "Pay" button amount-a record mattum thaan pannuthu; wallet balance
#   maaraathu.
# - Remaining to Pay = Profit - Paid.
# - Bakki irukkuradhu vida jaasthi pay panna mudiyaathu (400 varum).
# - LR NO nu table-la irukuradhu parcel order number.

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
# STEP 2: The agency list - who is owed what
# =============================================================================
#
# The screen you land on before drilling into one agency.

curl -X GET "http://localhost:3000/admin/agency-payout?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# search matches agency name / owner / phone / city; status is Active|Inactive
curl -X GET "http://localhost:3000/admin/agency-payout?search=chennai&status=Active" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# {
#   "success": true,
#   "data": {
#     "agencies": [
#       {
#         "agencyId": "6a7c05c9a4dd796109570e58",
#         "agencyName": "Testing Chennai Franchise",
#         "agencyOwner": "Ramesh", "phone": "9876543210", "city": "Chennai",
#         "status": "Active", "type": "Third Party", "agencyType": false,
#         "profitPercentage": 10,
#         "totalBookingAmount": 240,
#         "profit": 12,
#         "paid": 0,
#         "remainingToPay": 12,
#         "settledOrders": 3, "payments": 0, "currency": "INR"
#       }
#     ],
#     "totals": {
#       "totalBookingAmount": 288, "profit": 12,
#       "paid": 0, "remainingToPay": 12, "currency": "INR"
#     },
#     "pagination": { "total": 6, "page": 1, "limit": 10, "totalPages": 1 }
#   }
# }
#
# `totals` is company-wide across every agency, not just this page.

# =============================================================================
# STEP 3: The Agency Payout Details page
# =============================================================================

curl -X GET http://localhost:3000/admin/agency-payout/AGENCY_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Paginate / filter the order history underneath:
curl -X GET "http://localhost:3000/admin/agency-payout/AGENCY_ID?page=1&limit=10&dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# `search` here filters the order history by LR number:
curl -X GET "http://localhost:3000/admin/agency-payout/AGENCY_ID?search=000-000" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# {
#   "success": true,
#   "data": {
#     "agency": {
#       "agencyId": "6a7c05c9a4dd796109570e58",
#       "agencyName": "Testing Chennai Franchise",
#       "agencyOwner": "Ramesh", "phone": "9876543210",
#       "email": "...", "city": "Chennai", "state": "Tamil Nadu",
#       "status": "Active", "type": "Third Party", "agencyType": false,
#       "profitPercentage": 10
#     },
#
#     "summary": {                       <- the four cards at the top
#       "totalBookingAmount": 240,
#       "profit": 12,
#       "paid": 5,
#       "remainingToPay": 7,
#       "settledOrders": 3, "payments": 1, "currency": "INR"
#     },
#
#     "orders": [                        <- the Order History table
#       { "serialNo": 1, "date": "2026-08-16T...", "lrNo": "000-000-012",
#         "bookingAmount": 120, "profit": 12,
#         "orderId": "...", "profitPercentage": 10, "adminShare": 108 },
#       { "serialNo": 2, "date": "2026-08-14T...", "lrNo": "000-000-011",
#         "bookingAmount": 0, "profit": 0,
#         "orderId": "...", "profitPercentage": 0, "adminShare": 0 }
#     ],
#
#     "pagination": { "total": 3, "page": 1, "limit": 10, "totalPages": 1 }
#   }
# }
#
# TABLE MAPPING
#   S.NO            -> serialNo        (continues across pages)
#   DATE            -> date            (when the booking was settled)
#   LR NO           -> lrNo            (the parcel order number)
#   BOOKING AMOUNT  -> bookingAmount   (transport + loading + misc)
#   PROFIT          -> profit          (this agency's share)
#
# "No orders found" with everything at 0 means the agency has no SETTLED
# bookings. See the last section if you expect rows and get none.

# =============================================================================
# STEP 4: The Pay button
# =============================================================================
#
# Only `amount` is required; the rest is for the audit trail.

curl -X POST http://localhost:3000/admin/agency-payout/AGENCY_ID/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{
    \"amount\": 5,
    \"paymentMethod\": \"bank_transfer\",
    \"reference\": \"NEFT-99120\",
    \"remarks\": \"August commission - part payment\"
  }"

# 201:
# {
#   "success": true,
#   "message": "5 paid to \"Testing Chennai Franchise\"",
#   "data": {
#     "payout": { "_id": "...", "amount": 5, "reference": "NEFT-99120",
#                 "status": "paid", "paidAt": "...", "paidByName": "Admin",
#                 "profitAtPayment": 12, "paidBeforeThis": 0 },
#     "summary": { "profit": 12, "paid": 5, "remainingToPay": 7, ... }
#   }
# }
#
# The refreshed `summary` comes back with the payment, so the four cards can be
# repainted without a second call.
#
# GUARDS
#   400  amount is more than what is outstanding:
#        "100 is more than the 7 outstanding for \"Testing Chennai Franchise\""
#   400  nothing is owed at all:
#        "\"X\" has nothing outstanding - 0 earned and 0 already paid"
#   400  amount <= 0, or over 1,00,00,000
#
# Overpaying is refused rather than allowed to run the balance negative - it is
# almost always a typo, and a negative "Remaining to Pay" is not something the
# screen can explain. Each payment also snapshots profitAtPayment /
# paidBeforeThis, so a row still explains itself after later bookings move the
# totals on.

# =============================================================================
# STEP 5: Payments already made
# =============================================================================

curl -X GET "http://localhost:3000/admin/agency-payout/AGENCY_ID/payments?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Reversed ones only:
curl -X GET "http://localhost:3000/admin/agency-payout/AGENCY_ID/payments?status=reversed" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# {
#   "summary": { "profit": 12, "paid": 5, "remainingToPay": 7, ... },
#   "payments": [
#     { "serialNo": 1, "paymentId": "...", "date": "2026-08-19T...",
#       "amount": 5, "paymentMethod": "bank_transfer",
#       "reference": "NEFT-99120", "remarks": "...",
#       "status": "paid", "paidByName": "Admin" }
#   ],
#   "pagination": { ... }
# }

# =============================================================================
# STEP 6: Reverse a payment entered by mistake
# =============================================================================
#
# The row is kept and marked reversed rather than deleted, so the history still
# shows it happened; the amount stops counting towards Paid.

curl -X DELETE http://localhost:3000/admin/agency-payout/payments/PAYMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{ \"reason\": \"Paid to the wrong agency\" }"

# 409 if it is already reversed.

# =============================================================================
# THE AGENCY'S OWN VIEW  (agency login)
# =============================================================================
#
# The agency sees the SAME payout details screen against its own token. No
# agency id is passed - it comes from the token, so one agency can never read
# another's commission. Read-only: Pay and Reverse stay with admin.

# ---- Log in as the agency (phone OTP) --------------------------------------

curl -X POST http://localhost:3000/admin/login/send-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\" }"

curl -X POST http://localhost:3000/admin/login/verify-otp \
  -H "Content-Type: application/json" \
  -d "{ \"phone\": \"9876543210\", \"otp\": \"123456\" }"

# Copy the token into AGENCY_TOKEN below.

# ---- Payout details: the four cards + Order History -------------------------

curl -X GET http://localhost:3000/admin/agency/payout \
  -H "Authorization: Bearer AGENCY_TOKEN"

# Same query params as the admin version:
curl -X GET "http://localhost:3000/admin/agency/payout?page=1&limit=10&dateFrom=2026-08-01&dateTo=2026-08-31&search=000-000" \
  -H "Authorization: Bearer AGENCY_TOKEN"

# The response is the same shape as the admin
# /admin/agency-payout/{agencyId} page, so the two screens can share a
# component:
#
# { "success": true,
#   "data": {
#     "agency": { "agencyId": "...", "agencyName": "...", "profitPercentage": 10, ... },
#     "summary": { "totalBookingAmount": 240, "profit": 12,
#                  "paid": 5, "remainingToPay": 7,
#                  "settledOrders": 3, "payments": 1, "currency": "INR" },
#     "orders": [ { "serialNo": 1, "date": "2026-08-16T...", "lrNo": "000-000-012",
#                   "bookingAmount": 120, "profit": 12 } ],
#     "pagination": { "total": 3, "page": 1, "limit": 10, "totalPages": 1 }
#   } }

# ---- Payments received ------------------------------------------------------

curl -X GET "http://localhost:3000/admin/agency/payout/payments?page=1&limit=10" \
  -H "Authorization: Bearer AGENCY_TOKEN"

# Only the ones admin reversed:
curl -X GET "http://localhost:3000/admin/agency/payout/payments?status=reversed" \
  -H "Authorization: Bearer AGENCY_TOKEN"

# A franchise staff login inherits its agency's figures (the staff record
# carries the agency), so the screen works for staff too.
#
# 403 "agency access required" for an admin or hub token - admin reads
# /admin/agency-payout/{agencyId} instead.

# TAMIL
#   Agency login-la payout details paakalaam - profit evlo sambarichom, evlo
#   kaasu vanthuruku, bakki evlo. Pay pannuradhu admin vela; agency paaka
#   mattum thaan. Agency id anuppa vendaam - token-la irunthu edukkuthu.

# ---- The same numbers on the dashboard -------------------------------------
#
# The dashboard carries the headline figures, so the two screens can never
# disagree:
#
#   GET /admin/agency/dashboard   (agency token)
#     overview.totalProfitEarned  = profit
#     overview.totalPayoutPaid    = paid
#     overview.totalPayoutDue     = remainingToPay
#
# NOTE: totalPayoutDue used to be the GROSS commission earned. Now that payments
# are recorded it is what is still OWED (earned - paid). Read totalProfitEarned
# if you want the gross figure.

# =============================================================================
# IF EVERYTHING READS 0
# =============================================================================
#
# Profit is 0 while the agency is on 0% commission - the whole booking total
# goes to admin. Set it first:
#
#   PATCH /admin/agency-wallet/{agencyId}/percentage  { "profitPercentage": 10 }
#
# An "Own" agency never earns commission, whatever percentage is set.
#
# Orders booked before the branch -> agency rename belong to no agency and have
# no amounts, so they add nothing here. Run the migration once:
#
#   node scripts/migrate-branch-to-agency.js --dry-run   # report
#   node scripts/migrate-branch-to-agency.js             # apply
#
# TAMIL: profit 0-nu vandha, agency-ku commission percentage set pannalanu
# artham. Percentage set panna piraku pota booking-la thaan profit varum -
# palaya booking-ku retro-va apply aagaathu.

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
#
#   GET    /admin/agency-payout                        every agency's position
#   GET    /admin/agency-payout/{agencyId}             the payout details page
#   POST   /admin/agency-payout/{agencyId}/pay         the Pay button
#   GET    /admin/agency-payout/{agencyId}/payments    payments made
#   DELETE /admin/agency-payout/payments/{paymentId}   reverse a payment
#
# Agency login (read-only, its own figures)
#   GET    /admin/agency/payout                        the payout details page
#   GET    /admin/agency/payout/payments               payments received
#
# Related
#   GET    /admin/agency-wallet                        prepaid booking balances
#   PATCH  /admin/agency-wallet/{agencyId}/percentage  set the commission
#   GET    /admin/agency/dashboard                     the agency's own view
