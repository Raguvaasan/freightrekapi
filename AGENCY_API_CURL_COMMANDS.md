# Agency Management API - cURL Commands
# Date: January 3, 2026
# Base URL: http://localhost:3000

# =============================================================================
# STEP 1: Login to get JWT Token
# =============================================================================

# Login with existing admin user
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@freightrek.com\",
    \"password\": \"Admin@123\"
  }"

# Copy the token from response and use it below
# Replace YOUR_JWT_TOKEN with actual token

# =============================================================================
# STEP 2: Create a Hub (if not exists) - Required for Agency
# =============================================================================

curl -X POST http://localhost:3000/admin/hub \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"Chennai Central Hub\",
    \"location\": \"Chennai, Tamil Nadu\",
    \"capacity\": 5000,
    \"status\": true
  }"

# Copy the hub ID from response for next steps

# =============================================================================
# AGENCY CRUD OPERATIONS
# =============================================================================

# 1. CREATE NEW AGENCY
# ---------------------
#
# AGENCY TYPE
# -----------
# `agencyType` is a boolean:  true = Own,  false = Third Party.
#
#   Third Party (false) -> commission applies; the agency keeps
#                          profitPercentage of every booking total
#   Own         (true)  -> company-run, NO commission; the whole booking
#                          total is remitted to admin
#
# It is the same setting as the older string field `type` ("Own" /
# "Third Party"), just shaped for a checkbox. Send EITHER one - both are
# accepted and the two are kept in step on every save, so every response
# carries both:
#
#   "type": "Third Party",  "agencyType": false
#   "type": "Own",          "agencyType": true
#
# Sending both is allowed only if they agree; a create/update with
# { "type": "Third Party", "agencyType": true } is rejected with 400.
# Omitting both gives a Third Party agency (agencyType false).
#
# Setting agencyType true forces profitPercentage to 0 - an Own agency never
# keeps a commission, whatever was sent.
#
# TAMIL: agencyType true-nu potta "Own" agency - commission kidaiyaathu,
# mothra thoga-vum admin-ku poidum. false-nu potta "Third Party" - avanga
# profitPercentage-a vechukuvaanga.
curl -X POST http://localhost:3000/admin/agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"agencyName\": \"SpeedX Express\",
    \"agencyOwner\": \"David Kumar\",
    \"phone\": \"9185647852\",
    \"assignedHub\": \"HUB_ID_HERE\",
    \"status\": \"Active\",
    \"agencyType\": false,
    \"email\": \"speedx@example.com\",
    \"address\": \"123 Main Street, Chennai\"
  }"

# 2. CREATE ANOTHER AGENCY
# -------------------------
curl -X POST http://localhost:3000/admin/agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"agencyName\": \"Metro Parcel\",
    \"agencyOwner\": \"Krish Sharma\",
    \"phone\": \"9876543210\",
    \"assignedHub\": \"HUB_ID_HERE\",
    \"status\": \"Active\",
    \"agencyType\": true,
    \"email\": \"metro@example.com\",
    \"address\": \"456 Park Avenue, Coimbatore\"
  }"

# 3. GET ALL AGENCIES (with pagination)
# --------------------------------------
curl -X GET "http://localhost:3000/admin/agency?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. GET ALL AGENCIES (with search)
# ----------------------------------
curl -X GET "http://localhost:3000/admin/agency?search=SpeedX" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. GET ALL AGENCIES (filter by status)
# ---------------------------------------
curl -X GET "http://localhost:3000/admin/agency?status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 6. GET ALL AGENCIES (filter by hub)
# ------------------------------------
curl -X GET "http://localhost:3000/admin/agency?hubId=HUB_ID_HERE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 7. GET AGENCY BY ID
# -------------------
curl -X GET http://localhost:3000/admin/agency/AGENCY_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 8. UPDATE AGENCY
# ----------------
curl -X PUT http://localhost:3000/admin/agency/AGENCY_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"agencyName\": \"SpeedX Express Updated\",
    \"phone\": \"9999999999\",
    \"email\": \"speedx.new@example.com\"
  }"

# 9. UPDATE AGENCY STATUS
# ------------------------
curl -X PATCH http://localhost:3000/admin/agency/AGENCY_ID_HERE/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"status\": \"Inactive\"
  }"

# 10. GET AGENCIES BY HUB ID
# ---------------------------
curl -X GET http://localhost:3000/admin/agency/hub/HUB_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 11. DELETE AGENCY
# -----------------
curl -X DELETE http://localhost:3000/admin/agency/AGENCY_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# PowerShell Version (For Windows)
# =============================================================================

# 1. CREATE AGENCY (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    agencyName = "SpeedX Express"
    agencyOwner = "David Kumar"
    phone = "9185647852"
    assignedHub = "HUB_ID_HERE"
    status = "Active"
    agencyType = $false
    email = "speedx@example.com"
    address = "Chennai, Tamil Nadu"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/admin/agency" -Method POST -Headers $headers -Body $body

# 2. GET ALL AGENCIES (PowerShell)
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
Invoke-RestMethod -Uri "http://localhost:3000/admin/agency?page=1&limit=10" -Method GET -Headers $headers

# 3. UPDATE AGENCY STATUS (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    status = "Inactive"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/admin/agency/AGENCY_ID_HERE/status" -Method PATCH -Headers $headers -Body $body

# =============================================================================
# NOTES
# =============================================================================
# 1. Replace YOUR_JWT_TOKEN with actual token from login response
# 2. Replace HUB_ID_HERE with actual hub MongoDB ObjectId
# 3. Replace AGENCY_ID_HERE with actual agency MongoDB ObjectId
# 4. Phone number must be exactly 10 digits
# 5. All authenticated endpoints require Bearer token
# 6. Status can only be "Active" or "Inactive"
# 7. Swagger UI available at: http://localhost:3000/api-docs
