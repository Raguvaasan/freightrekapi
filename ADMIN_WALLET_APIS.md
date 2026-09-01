# Admin Wallet API - cURL Commands
# Base URL: http://localhost:3000
#
# Current paths are /admin/agency-wallet/*. The older /admin/branch-wallet/*
# paths still answer on the same router and are kept only for the existing
# frontend - prefer the agency ones in anything new.
#
# Permissions: every endpoint here needs the "Wallet Management" module
# permission (read / write / update / delete) or a root role - the percentage
# endpoint included. Only the older /admin/agency/{id}/profit-percentage route
# still needs "Agency Management" update.
#
# TAMIL SUMMARY
# -------------
# - Admin, oru agency-ku wallet-la amount add (credit) / kammi (debit) pannalaam.
# - Percentage set panra API-la profit + loading + misc moonum set aagum.
# - Agency order book pannumbothu admin share automatic-a agency wallet-la
#   irunthu debit aagum, admin settlement wallet-ku serum.
# - Manual-a admin poatta entry-ya mattum edit / reverse panna mudiyum.
#   Settlement, Cashfree rows read-only (403).

# =============================================================================
# STEP 1: Log in as admin
# =============================================================================

curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@freightrek.com\",
    \"password\": \"YOUR_PASSWORD\"
  }"

# Single phone login works for admin too (agency / hub / staff / admin):
#
#   curl -X POST http://localhost:3000/admin/login/send-otp \
#     -H "Content-Type: application/json" \
#     -d "{ \"phone\": \"9876543210\" }"
#
#   curl -X POST http://localhost:3000/admin/login/verify-otp \
#     -H "Content-Type: application/json" \
#     -d "{ \"phone\": \"9876543210\", \"otp\": \"123456\" }"
#
# Copy the token into ADMIN_TOKEN below.

# =============================================================================
# STEP 2: Set the percentages for an agency
# =============================================================================
#
# All three live on the wallet screen. Every field is optional - send only what
# is changing, but at least one (400 if the body has none).
#
#   profitPercentage        share of each booking total the agency keeps
#   loadingChargePercentage loading charge added on top of the transport charge
#   miscChargePercentage    miscellaneous charge, same basis
#
# transport 100 at 10% + 10% -> loading 10 + misc 10 -> total 120.
# At a 10% commission the agency keeps 12 and 108 is debited to admin.

curl -X PATCH http://localhost:3000/admin/agency-wallet/AGENCY_ID/percentage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{
    \"profitPercentage\": 10,
    \"loadingChargePercentage\": 10,
    \"miscChargePercentage\": 10
  }"

# An "Own" agency earns no commission - sending profitPercentage > 0 for one
# is rejected with 400. Change its type to "Third Party" first.
#
# WHERE THESE FIELDS LIVE
# -----------------------
# - loadingChargePercentage / miscChargePercentage are set ONLY here, and are
#   returned ONLY by the admin wallet reads (STEP 5). They are not accepted on
#   agency create / update, and no agency-login response reports them - the
#   agency sees the resulting rupee amounts on each order and invoice instead.
# - profitPercentage can also still be set through the agency module:
#     PATCH /admin/agency/{id}/profit-percentage   { "profitPercentage": 10 }
#
# New agencies start at 10% loading and 10% miscellaneous.

# =============================================================================
# STEP 3: Add money to an agency wallet
# =============================================================================

curl -X POST http://localhost:3000/admin/agency-wallet/AGENCY_ID/credit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{
    \"amount\": 5000,
    \"remarks\": \"Opening balance for August\",
    \"paymentMethod\": \"cash\",
    \"reference\": \"NEFT-88213\"
  }"

# amount: > 0 and <= 1000000. remarks / paymentMethod / reference optional.
# Response: { agencyName, transactionId, amount, balanceBefore, balance }
# 400 if the agency is not Active.

# =============================================================================
# STEP 4: Deduct money from an agency wallet (manual correction)
# =============================================================================

curl -X POST http://localhost:3000/admin/agency-wallet/AGENCY_ID/debit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{
    \"amount\": 250,
    \"remarks\": \"Excess credit adjusted\"
  }"

# 402 if the balance is lower than the amount.

# =============================================================================
# STEP 5: Read wallets
# =============================================================================

# ---- Every agency wallet, with balances and settlement totals --------------

curl -X GET "http://localhost:3000/admin/agency-wallet?page=1&limit=10&search=chennai&status=Active" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Per row: balance, profitPercentage, loadingChargePercentage,
# miscChargePercentage, settledOrders, totalBookingAmount, totalProfitEarned,
# totalPaidToAdmin.
# Plus totals.allBranchesBalance - held across every agency, not just this page.

# ---- One agency's wallet ---------------------------------------------------

curl -X GET http://localhost:3000/admin/agency-wallet/AGENCY_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"

# balance, profitPercentage, loadingChargePercentage, miscChargePercentage,
# totalCredited, settledOrders, totalBookingAmount, totalProfitEarned,
# totalPaidToAdmin.
#
# The two charge percentages appear here and in the list above only. The
# agency's own /admin/agency/wallet response omits them.

# ---- One agency's statement ------------------------------------------------

curl -X GET "http://localhost:3000/admin/agency-wallet/AGENCY_ID/transactions?page=1&limit=20&type=debit&dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# type: credit | debit | refund | reversal
# Each row carries `editable` - true only for manual admin entries.

# ---- One statement row -----------------------------------------------------

curl -X GET http://localhost:3000/admin/agency-wallet/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"

# =============================================================================
# STEP 6: The admin settlement wallet
# =============================================================================
#
# Everything agencies have remitted on their bookings lands here.

curl -X GET http://localhost:3000/admin/agency-wallet/admin-wallet \
  -H "Authorization: Bearer ADMIN_TOKEN"

# balance, settledOrders, totalBookingAmount, totalBranchProfitGiven,
# totalReceivedFromBranches, allBranchesBalance.

curl -X GET "http://localhost:3000/admin/agency-wallet/admin-wallet/transactions?page=1&limit=20&type=credit&dateFrom=2026-08-01&dateTo=2026-08-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# =============================================================================
# STEP 7: Correct a manual entry
# =============================================================================
#
# Only manual admin top-ups and deductions can be touched. Parcel settlement
# and Cashfree rows answer 403 - use the settlement reverse endpoint for those.

# ---- Edit the remarks (never the amount) -----------------------------------
#
# A wrong amount is corrected by reversing the entry and adding a fresh one, so
# the statement stays auditable.

curl -X PATCH http://localhost:3000/admin/agency-wallet/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{
    \"remarks\": \"Cash received on 05-Aug - corrected note\"
  }"

# ---- Reverse the entry -----------------------------------------------------
#
# Writes an opposite row rather than deleting anything, so the balance is
# corrected without a hole in the statement. 409 if already reversed.

curl -X DELETE http://localhost:3000/admin/agency-wallet/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{
    \"reason\": \"Added to the wrong agency\"
  }"

# =============================================================================
# STEP 8: Check the split before a booking
# =============================================================================

curl -X GET "http://localhost:3000/admin/parcel-settlement/preview?amount=200&agency=AGENCY_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# `amount` is the transportation charge being quoted. The response applies the
# agency's loading and miscellaneous percentages first, then splits the total:
#
# {
#   "charges": {
#     "transportationCharge": 200,
#     "loadingChargePercentage": 10, "loadingCharge": 20,
#     "miscChargePercentage": 10,    "miscellaneousCharge": 20,
#     "totalAmount": 240
#   },
#   "orderAmount": 240,
#   "profitPercentage": 10,
#   "agencyProfitAmount": 24,
#   "adminShareAmount": 216,
#   "walletBalance": 5000,
#   "balanceAfterBooking": 4784,
#   "sufficientBalance": true
# }
#
# On booking, adminShareAmount is debited from the agency wallet and credited to
# the admin settlement wallet. HTTP 402 and no order if the balance is short.

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
#
# Percentages
#   PATCH  /admin/agency-wallet/{agencyId}/percentage   profit + loading + misc
#   PATCH  /admin/agency/{id}/profit-percentage         profit only
#
# Agency wallets (admin)
#   GET    /admin/agency-wallet
#   GET    /admin/agency-wallet/{agencyId}
#   POST   /admin/agency-wallet/{agencyId}/credit
#   POST   /admin/agency-wallet/{agencyId}/debit
#   GET    /admin/agency-wallet/{agencyId}/transactions
#   GET    /admin/agency-wallet/transactions/{transactionId}
#   PATCH  /admin/agency-wallet/transactions/{transactionId}
#   DELETE /admin/agency-wallet/transactions/{transactionId}
#
# Admin settlement wallet
#   GET    /admin/agency-wallet/admin-wallet
#   GET    /admin/agency-wallet/admin-wallet/transactions
#
# Agency's own view (agency login)
#   GET    /admin/agency/wallet
#   GET    /admin/agency/wallet/transactions
#   GET    /admin/agency/wallet/preview?amount=
#   GET    /admin/agency/wallet/settlements
#   GET    /admin/agency/wallet/settlements/summary
#   GET    /admin/agency/wallet/settlements/{id}
#
# Deprecated aliases (same handlers)
#   /admin/branch-wallet/*        -> /admin/agency-wallet/*
#   /admin/branch/wallet/*        -> /admin/agency/wallet/*
