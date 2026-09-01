# Vehicle Management API - cURL Commands
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
# NOTE: The logged-in user's role must have "Vehicle Management" permission
#       (read/write/update/delete) OR be a root role.

# =============================================================================
# VEHICLE CRUD OPERATIONS   (base: /admin/vehicle)
# =============================================================================

# 1. CREATE NEW VEHICLE
# ---------------------
curl -X POST http://localhost:3000/admin/vehicle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"vehicleType\": \"Truck\",
    \"capacity\": \"10 Ton\",
    \"vehicleRegistrationNumber\": \"TN01AB1234\",
    \"rcNumber\": \"RC123456789\",
    \"insuranceNumber\": \"INS987654321\",
    \"status\": \"Active\"
  }"

# 2. GET ALL VEHICLES (with pagination)
# --------------------------------------
curl -X GET "http://localhost:3000/admin/vehicle?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. GET ALL VEHICLES (with search - matches type / reg no / rc / insurance)
# --------------------------------------------------------------------------
curl -X GET "http://localhost:3000/admin/vehicle?search=TN01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. GET ALL VEHICLES (filter by status)
# ---------------------------------------
curl -X GET "http://localhost:3000/admin/vehicle?status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. GET VEHICLE BY ID
# --------------------
curl -X GET http://localhost:3000/admin/vehicle/VEHICLE_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 6. UPDATE VEHICLE
# -----------------
curl -X PUT http://localhost:3000/admin/vehicle/VEHICLE_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"vehicleType\": \"Container Truck\",
    \"capacity\": \"20 Ton\"
  }"

# 7. UPDATE VEHICLE STATUS (Active / Inactive)
# --------------------------------------------
curl -X PATCH http://localhost:3000/admin/vehicle/VEHICLE_ID_HERE/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"status\": \"Inactive\"
  }"

# 8. DELETE VEHICLE
# -----------------
curl -X DELETE http://localhost:3000/admin/vehicle/VEHICLE_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# PowerShell Version (For Windows)
# =============================================================================

# 1. CREATE VEHICLE (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    vehicleType               = "Truck"
    capacity                  = "10 Ton"
    vehicleRegistrationNumber = "TN01AB1234"
    rcNumber                  = "RC123456789"
    insuranceNumber           = "INS987654321"
    status                    = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/admin/vehicle" -Method POST -Headers $headers -Body $body

# 2. GET ALL VEHICLES (PowerShell)
$headers = @{ "Authorization" = "Bearer YOUR_JWT_TOKEN" }
Invoke-RestMethod -Uri "http://localhost:3000/admin/vehicle?page=1&limit=10" -Method GET -Headers $headers

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
# | Method | Endpoint                    | Permission | Description                   |
# |--------|-----------------------------|------------|-------------------------------|
# | POST   | /admin/vehicle              | write      | Create a vehicle              |
# | GET    | /admin/vehicle              | read       | List (pagination/search/filt) |
# | GET    | /admin/vehicle/:id          | read       | Get one vehicle               |
# | PUT    | /admin/vehicle/:id          | update     | Update a vehicle              |
# | PATCH  | /admin/vehicle/:id/status   | update     | Change status                 |
# | DELETE | /admin/vehicle/:id          | delete     | Delete a vehicle              |

# =============================================================================
# NOTES
# =============================================================================
# 1. Replace YOUR_JWT_TOKEN with the actual token from login response.
# 2. Replace VEHICLE_ID_HERE with the actual vehicle MongoDB ObjectId.
# 3. Required fields on create: vehicleType, capacity, vehicleRegistrationNumber,
#    rcNumber, insuranceNumber. "status" optional (default: "Active").
# 4. vehicleRegistrationNumber must be UNIQUE (stored uppercase) -> duplicate = 400.
# 5. Status can only be "Active" or "Inactive".
# 6. All endpoints require a Bearer token + "Vehicle Management" permission.
# 7. Swagger UI available at: http://localhost:3000/api-docs
