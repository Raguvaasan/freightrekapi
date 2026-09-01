# Driver Management API - cURL Commands
# Date: July 30, 2026
# Base URL: http://localhost:3000

# =============================================================================
# STEP 1: Login to get JWT Token
# =============================================================================

curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@freightrek.com\",
    \"password\": \"Admin@123\"
  }"

# Copy the token from the response and use it below.
# Replace YOUR_JWT_TOKEN with the actual token.
#
# NOTE: The logged-in user's role must have "Driver Management" permission
#       (read/write/update/delete) OR be a root role.

# =============================================================================
# DRIVER CRUD OPERATIONS   (base: /admin/driver)
# =============================================================================

# 1. CREATE NEW DRIVER
# --------------------
curl -X POST http://localhost:3000/admin/driver \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"driverName\": \"Ramesh Kumar\",
    \"phoneNumber\": \"9876543210\",
    \"licenseNumber\": \"TN1420110012345\",
    \"dateOfExpiry\": \"2028-05-31\",
    \"status\": \"Active\"
  }"

# 2. GET ALL DRIVERS (with pagination)
# -------------------------------------
curl -X GET "http://localhost:3000/admin/driver?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. GET ALL DRIVERS (with search - matches name / phone / license)
# -----------------------------------------------------------------
curl -X GET "http://localhost:3000/admin/driver?search=Ramesh" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. GET ALL DRIVERS (filter by status)
# --------------------------------------
curl -X GET "http://localhost:3000/admin/driver?status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. GET DRIVER BY ID
# -------------------
curl -X GET http://localhost:3000/admin/driver/DRIVER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 6. UPDATE DRIVER
# ----------------
curl -X PUT http://localhost:3000/admin/driver/DRIVER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"driverName\": \"Ramesh K\",
    \"phoneNumber\": \"9000000000\",
    \"dateOfExpiry\": \"2029-01-15\"
  }"

# 7. UPDATE DRIVER STATUS (Active / Inactive)
# -------------------------------------------
curl -X PATCH http://localhost:3000/admin/driver/DRIVER_ID_HERE/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"status\": \"Inactive\"
  }"

# 8. DELETE DRIVER
# ----------------
curl -X DELETE http://localhost:3000/admin/driver/DRIVER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# PowerShell Version (For Windows)
# =============================================================================

# 1. CREATE DRIVER (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    driverName    = "Ramesh Kumar"
    phoneNumber   = "9876543210"
    licenseNumber = "TN1420110012345"
    dateOfExpiry  = "2028-05-31"
    status        = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/admin/driver" -Method POST -Headers $headers -Body $body

# 2. GET ALL DRIVERS (PowerShell)
$headers = @{ "Authorization" = "Bearer YOUR_JWT_TOKEN" }
Invoke-RestMethod -Uri "http://localhost:3000/admin/driver?page=1&limit=10" -Method GET -Headers $headers

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
# | Method | Endpoint                   | Permission | Description                   |
# |--------|----------------------------|------------|-------------------------------|
# | POST   | /admin/driver              | write      | Create a driver               |
# | GET    | /admin/driver              | read       | List (pagination/search/filt) |
# | GET    | /admin/driver/:id          | read       | Get one driver                |
# | PUT    | /admin/driver/:id          | update     | Update a driver               |
# | PATCH  | /admin/driver/:id/status   | update     | Change status                 |
# | DELETE | /admin/driver/:id          | delete     | Delete a driver               |

# =============================================================================
# NOTES
# =============================================================================
# 1. Replace YOUR_JWT_TOKEN with the actual token from login response.
# 2. Replace DRIVER_ID_HERE with the actual driver MongoDB ObjectId.
# 3. Required fields on create: driverName, phoneNumber, licenseNumber,
#    dateOfExpiry. "status" optional (default: "Active").
# 4. phoneNumber must be exactly 10 digits.
# 5. dateOfExpiry accepts ISO date (YYYY-MM-DD) or any parseable date string.
# 6. licenseNumber must be UNIQUE (stored uppercase) -> duplicate = 400.
# 7. Status can only be "Active" or "Inactive".
# 8. All endpoints require a Bearer token + "Driver Management" permission.
# 9. Swagger UI available at: http://localhost:3000/api-docs
