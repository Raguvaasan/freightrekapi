# Branch Wallet + Profit Percentage + Parcel Settlement API - cURL Commands
# Date: August 5, 2026
# Base URL: http://localhost:3000

# =============================================================================
# HOW THE FLOW WORKS
# =============================================================================
#
# 1. Admin adds wallet amount to a branch          -> POST /admin/branch-wallet/{branchId}/credit
# 2. Admin sets the branch profit percentage       -> PATCH /admin/agency/{id}/profit-percentage
# 3. Branch books a parcel order                   -> the FULL order amount is debited from
#                                                     the branch wallet automatically
# 4. That amount is credited to the admin wallet   -> visible at /admin/branch-wallet/admin-wallet
#
# Example with a Rs.200 booking and a 10% branch profit percentage:
#
#     order amount          200   <- debited from the branch wallet in full,
#                                    credited to the admin settlement wallet
#     branch profit  (10%)   20   <- commission OWED to the branch, paid out
#                                    separately (POST /admin/agency-payout),
#                                    never netted off the wallet
#     admin share    (90%)  180   <- what the company keeps after the payout
#
# So the branch wallet goes DOWN by 200 and the admin wallet goes UP by 200 on
# every booking. Booking is refused with HTTP 402 if the branch wallet cannot
# cover the whole order amount, and the order is not created.
#
# TAMIL SUMMARY
# -------------
# - Admin, branch-ku wallet-la amount add pannalaam (credit API).
# - Admin, branch-ku profit percentage set pannalaam (profit-percentage API).
# - Branch parcel order book pannumbothu, MULU order amount automatic-a branch
#   wallet-la irunthu detect (debit) aagum.
# - Antha amount admin wallet-ku sendhu serum. 200 rs, 10% profit -> wallet-la
#   irunthu 200 rs poyidum; branch-oda 20 rs commission thani-ya payout
#   (agency-payout API) mulama kudukkapadum.
# - Wallet-la balance porala na order create aagathu (402 error).
# - Order delete / cancel pannina, mulu amount thirumba branch wallet-ku varum.

# =============================================================================
# STEP 1: Login as admin
# =============================================================================

curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@freightrek.com\",
    \"password\": \"Admin@123\"
  }"

# Copy the token and replace YOUR_JWT_TOKEN below.
#
# NOTE: Wallet + settlement endpoints need the "Wallet Management" module
#       permission (read/write/update/delete) OR a root role.
#       Agency profit percentage needs "Agency Management" update permission.

# =============================================================================
# STEP 2: Set the branch profit percentage (requirement 2)
# =============================================================================
#
# Share of every booking amount the branch keeps. 0-100.
# Applies to NEW bookings; settlements already recorded keep the percentage
# they were booked under.

curl -X PATCH http://localhost:3000/admin/agency/BRANCH_ID/profit-percentage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"profitPercentage\": 10
  }"

# It can also be set while creating or updating the branch:

curl -X POST http://localhost:3000/admin/agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"agencyName\": \"Chennai Central Branch\",
    \"agencyOwner\": \"Ramesh\",
    \"phone\": \"9876543210\",
    \"profitPercentage\": 10
  }"

curl -X PUT http://localhost:3000/admin/agency/BRANCH_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"profitPercentage\": 15
  }"

# =============================================================================
# STEP 3: Branch wallet CRUD (requirement 1)
# =============================================================================

# ---- CREATE: add wallet amount to a branch (admin top-up) -------------------

curl -X POST http://localhost:3000/admin/branch-wallet/BRANCH_ID/credit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"amount\": 5000,
    \"remarks\": \"Opening balance for August\",
    \"paymentMethod\": \"cash\",
    \"reference\": \"NEFT-88213\"
  }"

# Response: { transactionId, amount, balanceBefore, balance }

# ---- CREATE: deduct wallet amount from a branch (manual correction) ---------

curl -X POST http://localhost:3000/admin/branch-wallet/BRANCH_ID/debit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"amount\": 250,
    \"remarks\": \"Excess credit adjusted\"
  }"

# 402 if the balance is lower than the amount.

# ---- READ: all branch wallets with balances and settlement totals ----------

curl -X GET "http://localhost:3000/admin/branch-wallet?page=1&limit=10&search=chennai&status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# ---- READ: one branch's wallet ---------------------------------------------

curl -X GET http://localhost:3000/admin/branch-wallet/BRANCH_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Returns balance, profitPercentage, totalCredited, settledOrders,
# totalBookingAmount, totalProfitEarned, totalPaidToAdmin.

# ---- READ: a branch's wallet statement -------------------------------------

curl -X GET "http://localhost:3000/admin/branch-wallet/BRANCH_ID/transactions?page=1&limit=20&type=debit&dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# type: credit | debit | refund | reversal

# ---- READ: one statement row ----------------------------------------------

curl -X GET http://localhost:3000/admin/branch-wallet/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# ---- UPDATE: edit the remarks on a manual admin entry ----------------------
#
# Only manual admin top-ups / deductions can be edited, and only their remarks.
# A wrong amount is corrected by reversing the entry and adding a fresh one, so
# the statement stays auditable. Parcel settlement and Cashfree rows are
# read-only (403).

curl -X PATCH http://localhost:3000/admin/branch-wallet/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"remarks\": \"Cash received on 05-Aug - corrected note\"
  }"

# ---- DELETE: reverse a manual admin entry ---------------------------------
#
# Writes an opposite entry rather than deleting the row, so the balance is
# corrected without a hole in the statement.

curl -X DELETE http://localhost:3000/admin/branch-wallet/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"reason\": \"Added to the wrong branch\"
  }"

# ---- READ: the admin settlement wallet ------------------------------------

curl -X GET http://localhost:3000/admin/branch-wallet/admin-wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Returns balance, settledOrders, totalBookingAmount,
# totalBranchProfitGiven, totalReceivedFromBranches, allBranchesBalance.

curl -X GET "http://localhost:3000/admin/branch-wallet/admin-wallet/transactions?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# STEP 4: Book a parcel order -> wallet is debited (requirements 3 and 4)
# =============================================================================

# ---- Optional: preview the split before booking ---------------------------

curl -X GET "http://localhost:3000/admin/parcel-settlement/preview?amount=200&branch=BRANCH_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Branch login uses its own branch (no branch parameter):
#   GET /admin/branch/parcel-order/wallet-preview?amount=200
#   GET /admin/branch/wallet/preview?amount=200
#
# Response:
# {
#   "orderAmount": 200,
#   "profitPercentage": 10,
#   "branchProfitAmount": 20,
#   "adminShareAmount": 180,
#   "walletDebitAmount": 200,
#   "walletBalance": 5000,
#   "balanceAfterBooking": 4800,
#   "sufficientBalance": true
# }

# ---- Branch books the order (branch / franchise login token) --------------

curl -X POST http://localhost:3000/admin/branch/parcel-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BRANCH_JWT_TOKEN" \
  -d "{
    \"bookingCustomer\": { \"name\": \"Suresh\", \"mobileNumber\": \"9876543210\" },
    \"paymentType\": \"Paid\",
    \"deliveryCustomer\": {
      \"name\": \"Kumar\",
      \"mobileNumber\": \"9876500000\",
      \"deliveryBranch\": \"DESTINATION_BRANCH_ID\"
    },
    \"parcelDetails\": {
      \"article\": \"Documents\",
      \"numberOfParcels\": 1,
      \"approximateValue\": 500
    },
    \"transportationCharge\": 200
  }"

# On success the message states the split, and the order carries it too:
#
#   "message": "Parcel order created successfully. Rs.200 debited from the
#               agency wallet; Rs.20 commission owed to the agency"
#
#   "walletSettlement": {
#     "status": "settled",
#     "orderAmount": 200,
#     "profitPercentage": 10,
#     "branchProfitAmount": 20,
#     "adminShareAmount": 180,
#     "walletDebitAmount": 200,
#     "settledAt": "2026-08-05T..."
#   }
#
# If the branch wallet cannot cover the order amount the response is HTTP 402
# and the order is NOT created:
#
#   { "success": false,
#     "message": "Insufficient wallet balance. Required Rs.200, available Rs.50",
#     "data": { "required": 200, "available": 50, "split": { ... } } }

# ---- Admin can book on a branch's behalf; the same branch wallet is used ---

curl -X POST http://localhost:3000/admin/parcel-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"branch\": \"BRANCH_ID\",
    \"bookingCustomer\": { \"name\": \"Suresh\", \"mobileNumber\": \"9876543210\" },
    \"paymentType\": \"Paid\",
    \"deliveryCustomer\": {
      \"name\": \"Kumar\",
      \"mobileNumber\": \"9876500000\",
      \"deliveryBranch\": \"DESTINATION_BRANCH_ID\"
    },
    \"parcelDetails\": { \"article\": \"Documents\", \"numberOfParcels\": 1 },
    \"transportationCharge\": 200
  }"

# ---- Changing the charge moves only the difference ------------------------
#
# 200 -> 300: the wallet amount goes 200 -> 300, so a further Rs.100 is debited.
# 300 -> 100: the wallet amount goes 300 -> 100, so Rs.200 is refunded.

curl -X PATCH http://localhost:3000/admin/parcel-order/ORDER_ID/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"transportationCharge\": 300
  }"

# ---- Deleting an order refunds the full amount to the branch --------------

curl -X DELETE http://localhost:3000/admin/parcel-order/ORDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# STEP 5: Settlement ledger (admin)
# =============================================================================

# ---- READ: list settlements with totals ----------------------------------

curl -X GET "http://localhost:3000/admin/parcel-settlement?page=1&limit=10&branch=BRANCH_ID&status=settled&dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# status: settled | reversed
# Totals returned: totalOrderAmount, totalBranchProfit, totalAdminShare

# ---- READ: admin earnings summary, overall and per branch -----------------

curl -X GET "http://localhost:3000/admin/parcel-settlement/summary?dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# ---- READ: one settlement with its wallet transaction trail --------------

curl -X GET http://localhost:3000/admin/parcel-settlement/SETTLEMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# ---- CREATE: settle an order manually ------------------------------------
#
# For bookings with no active settlement - orders created before this flow
# existed, or a settlement that was reversed and now needs re-applying.
# New bookings settle themselves.

curl -X POST http://localhost:3000/admin/parcel-settlement/order/ORDER_ID/settle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 409 if the order is already settled, 402 if the branch balance is short.

# ---- UPDATE: settlement notes -------------------------------------------

curl -X PATCH http://localhost:3000/admin/parcel-settlement/SETTLEMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"notes\": \"Verified against the branch cash book\"
  }"

# ---- UPDATE: reverse a settlement (cancelled booking) -------------------
#
# The full booked amount leaves the admin wallet and goes back to the branch
# wallet.

curl -X POST http://localhost:3000/admin/parcel-settlement/SETTLEMENT_ID/reverse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"reason\": \"Booking cancelled by customer\"
  }"

# =============================================================================
# STEP 6: Branch side (franchise login) - read only
# =============================================================================

# Own wallet balance, profit percentage and totals

curl -X GET http://localhost:3000/admin/branch/wallet \
  -H "Authorization: Bearer BRANCH_JWT_TOKEN"

# Own wallet statement

curl -X GET "http://localhost:3000/admin/branch/wallet/transactions?page=1&limit=20&type=debit" \
  -H "Authorization: Bearer BRANCH_JWT_TOKEN"

# What a booking amount will cost

curl -X GET "http://localhost:3000/admin/branch/wallet/preview?amount=200" \
  -H "Authorization: Bearer BRANCH_JWT_TOKEN"

# Own settlements - per booking: amount, profit kept, amount sent to admin

curl -X GET "http://localhost:3000/admin/branch/wallet/settlements?page=1&limit=10" \
  -H "Authorization: Bearer BRANCH_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/branch/wallet/settlements/summary \
  -H "Authorization: Bearer BRANCH_JWT_TOKEN"

curl -X GET http://localhost:3000/admin/branch/wallet/settlements/SETTLEMENT_ID \
  -H "Authorization: Bearer BRANCH_JWT_TOKEN"

# A branch topping itself up keeps using the existing Cashfree flow:
#   POST /api/wallet/create-payment-order
#   POST /api/wallet/verify-payment

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
#
# Profit percentage
#   PATCH  /admin/agency/{id}/profit-percentage
#   POST   /admin/agency                              (profitPercentage field)
#   PUT    /admin/agency/{id}                         (profitPercentage field)
#
# Branch wallet (admin)
#   GET    /admin/branch-wallet
#   GET    /admin/branch-wallet/{branchId}
#   POST   /admin/branch-wallet/{branchId}/credit
#   POST   /admin/branch-wallet/{branchId}/debit
#   GET    /admin/branch-wallet/{branchId}/transactions
#   GET    /admin/branch-wallet/transactions/{transactionId}
#   PATCH  /admin/branch-wallet/transactions/{transactionId}
#   DELETE /admin/branch-wallet/transactions/{transactionId}
#   GET    /admin/branch-wallet/admin-wallet
#   GET    /admin/branch-wallet/admin-wallet/transactions
#
# Settlements (admin)
#   GET    /admin/parcel-settlement
#   GET    /admin/parcel-settlement/summary
#   GET    /admin/parcel-settlement/preview?amount=
#   GET    /admin/parcel-settlement/{id}
#   PATCH  /admin/parcel-settlement/{id}
#   POST   /admin/parcel-settlement/{id}/reverse
#   POST   /admin/parcel-settlement/order/{orderId}/settle
#
# Branch side (franchise login)
#   GET    /admin/branch/wallet
#   GET    /admin/branch/wallet/transactions
#   GET    /admin/branch/wallet/preview?amount=
#   GET    /admin/branch/wallet/settlements
#   GET    /admin/branch/wallet/settlements/summary
#   GET    /admin/branch/wallet/settlements/{id}
#   GET    /admin/branch/parcel-order/wallet-preview?amount=
