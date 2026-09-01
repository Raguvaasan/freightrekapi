# Route Management API - cURL Commands
# Date: July 27, 2026
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

# Copy the token from response and use it below.
# Replace YOUR_JWT_TOKEN with the actual token.
#
# NOTE: The logged-in user's role must have "Route Management" permission
#       (read/write/update/delete) OR be a root role.

# =============================================================================
# ROUTE CRUD OPERATIONS   (base: /admin/route)
# =============================================================================

# 1. CREATE NEW ROUTE
# --------------------
curl -X POST http://localhost:3000/admin/route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"routeName\": \"Chennai - Bangalore Express\",
    \"from\": \"Chennai\",
    \"to\": \"Bangalore\",
    \"branches\": [\"Guindy\", \"Tambaram\"],
    \"status\": \"Active\"
  }"

# 2. CREATE ANOTHER ROUTE (minimal - routeName, from & to required)
# -----------------------------------------------------------------
curl -X POST http://localhost:3000/admin/route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"routeName\": \"Coimbatore - Madurai\",
    \"from\": \"Coimbatore\",
    \"to\": \"Madurai\"
  }"

# 3. GET ALL ROUTES (with pagination)
# ------------------------------------
curl -X GET "http://localhost:3000/admin/route?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. GET ALL ROUTES (with search - matches from / to / branches)
# --------------------------------------------------------------
curl -X GET "http://localhost:3000/admin/route?search=Chennai" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. GET ALL ROUTES (filter by status)
# -------------------------------------
curl -X GET "http://localhost:3000/admin/route?status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 6. GET ROUTE BY ID
# ------------------
curl -X GET http://localhost:3000/admin/route/ROUTE_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 7. UPDATE ROUTE
# ---------------
curl -X PUT http://localhost:3000/admin/route/ROUTE_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"routeName\": \"Chennai - Hyderabad Express\",
    \"from\": \"Chennai\",
    \"to\": \"Hyderabad\",
    \"branches\": [\"Guindy\", \"Tambaram\", \"Velachery\"]
  }"

# 8. UPDATE ROUTE STATUS (Active / Inactive)
# ------------------------------------------
curl -X PATCH http://localhost:3000/admin/route/ROUTE_ID_HERE/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"status\": \"Inactive\"
  }"

# 9. DELETE ROUTE
# ---------------
curl -X DELETE http://localhost:3000/admin/route/ROUTE_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# =============================================================================
# PowerShell Version (For Windows)
# =============================================================================

# 1. CREATE ROUTE (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    routeName = "Chennai - Bangalore Express"
    from      = "Chennai"
    to        = "Bangalore"
    branches  = @("Guindy", "Tambaram")
    status    = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/admin/route" -Method POST -Headers $headers -Body $body

# 2. GET ALL ROUTES (PowerShell)
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
Invoke-RestMethod -Uri "http://localhost:3000/admin/route?page=1&limit=10" -Method GET -Headers $headers

# 3. UPDATE ROUTE STATUS (PowerShell)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$body = @{
    status = "Inactive"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/admin/route/ROUTE_ID_HERE/status" -Method PATCH -Headers $headers -Body $body

# 4. DELETE ROUTE (PowerShell)
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
Invoke-RestMethod -Uri "http://localhost:3000/admin/route/ROUTE_ID_HERE" -Method DELETE -Headers $headers

# =============================================================================
# ENDPOINT SUMMARY
# =============================================================================
# | Method | Endpoint                        | Permission | Description                  |
# |--------|---------------------------------|------------|------------------------------|
# | POST   | /admin/route                    | write      | Create a route               |
# | GET    | /admin/route                    | read       | List (pagination/search/filt)|
# | GET    | /admin/route/:id                | read       | Get one route                |
# | PUT    | /admin/route/:id                | update     | Update a route               |
# | PATCH  | /admin/route/:id/status         | update     | Change status                |
# | DELETE | /admin/route/:id                | delete     | Delete a route               |

# =============================================================================
# SAMPLE SUCCESS RESPONSES
# =============================================================================
# CREATE (201):
# {
#   "success": true,
#   "message": "Route created successfully",
#   "data": {
#     "_id": "665a1f2c8b3e4a0012ab34cd",
#     "routeName": "Chennai - Bangalore Express",
#     "from": "Chennai",
#     "to": "Bangalore",
#     "branches": ["Guindy", "Tambaram"],
#     "status": "Active",
#     "createdAt": "2026-07-27T06:00:00.000Z",
#     "updatedAt": "2026-07-27T06:00:00.000Z"
#   }
# }
#
# LIST (200):
# {
#   "success": true,
#   "data": {
#     "routes": [ { ...route } ],
#     "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
#   }
# }

# =============================================================================
# NOTES
# =============================================================================
# 1. Replace YOUR_JWT_TOKEN with the actual token from login response.
# 2. Replace ROUTE_ID_HERE with the actual route MongoDB ObjectId.
# 3. Required fields on create: "routeName", "from" and "to". "branches" & "status" optional.
# 4. "branches" is an array of strings (each branch chip from the UI form).
# 5. Status can only be "Active" or "Inactive" (default: "Active").
# 6. A route with the same (from, to) pair cannot be created twice -> 400 error.
# 7. All endpoints require a Bearer token + "Route Management" permission.
# 8. Swagger UI available at: http://localhost:3000/api-docs
