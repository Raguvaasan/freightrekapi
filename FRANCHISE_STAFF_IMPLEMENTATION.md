# Franchise Staff Management - Implementation Summary

## Overview
Implemented a separate endpoint system for franchise users to manage their own staff members with automatic franchise filtering and proper authorization.

## Changes Made

### 1. New Controller: `franchise-staff.controller.ts`
**Location:** `src/controllers/admin/franchise-staff.controller.ts`

**Features:**
- `getFranchiseStaff()` - Get all staff for the logged-in franchise
- `getFranchiseStaffById()` - Get specific staff details (with ownership check)
- `createFranchiseStaff()` - Create staff (automatically assigns to franchise)
- `updateFranchiseStaff()` - Update staff (with ownership check)
- `updateFranchiseStaffStatus()` - Update staff status (with ownership check)
- `deleteFranchiseStaff()` - Delete staff (with ownership check)

**Security Features:**
- Automatically extracts franchise ID from JWT token
- Prevents franchises from accessing other franchises' staff
- Prevents franchises from changing staff's franchiseId
- Returns 403 Forbidden if staff doesn't belong to franchise

### 2. New Routes: `franchise-staff.routes.ts`
**Location:** `src/routes/admin/franchise-staff.routes.ts`

**Endpoints:**
```
GET    /admin/franchise/staff              - Get all franchise staff
POST   /admin/franchise/staff              - Create new staff
GET    /admin/franchise/staff/:id          - Get staff by ID
PUT    /admin/franchise/staff/:id          - Update staff
DELETE /admin/franchise/staff/:id          - Delete staff
PATCH  /admin/franchise/staff/:id/status   - Update staff status
```

**Features:**
- All routes require JWT authentication
- Uses existing validators from staff.validator.ts
- Includes Swagger documentation

### 3. Updated Agency Login to Return JWT Token

**Files Modified:**
- `src/services/admin/agency.service.ts`
- `src/controllers/admin/agency.controller.ts`

**Changes:**
- Franchise login now returns JWT token in response
- Token format: `{ success: true, message: "...", token: "...", data: {...} }`
- Token uses same JWT generation as admin users

### 4. Updated Admin Routes Index
**File:** `src/routes/admin/index.ts`

**Change:**
- Added franchise staff routes: `router.use("/franchise/staff", franchiseStaffRoutes)`

### 5. Updated API Documentation
**File:** `API_TESTING_GUIDE.md`

**Changes:**
- Added "Franchise Staff Management" section
- Updated franchise login response to show token
- Added examples for all franchise staff endpoints
- Added Flow 4: Franchise Staff Management
- Updated Quick Reference table with franchise endpoints
- Updated Table of Contents

## Usage Examples

### Step 1: Franchise Login
```bash
curl -X POST https://freightrekapi.vercel.app/admin/agency/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "speedx@freightrek.com",
    "password": "Speedx@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "67xyz789abc123456",
    "agencyName": "SpeedX Express",
    "status": "Active"
  }
}
```

### Step 2: View Your Staff
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/franchise/staff?page=1&limit=10" \
  -H "Authorization: Bearer FRANCHISE_TOKEN"
```

### Step 3: Create Staff for Your Franchise
```bash
curl -X POST https://freightrekapi.vercel.app/admin/franchise/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer FRANCHISE_TOKEN" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "9123456789",
    "roleId": "67def456abc789012",
    "username": "janesmith",
    "password": "Jane@123",
    "status": "Active"
  }'
```

**Note:** `franchiseId` is automatically set - no need to provide it!

## Security Features

### 1. Automatic Franchise Filtering
- All queries automatically filter by the logged-in franchise's ID
- Franchise users cannot see or modify other franchises' staff

### 2. Ownership Verification
- Every operation checks if the staff belongs to the franchise
- Returns 403 Forbidden if trying to access another franchise's staff

### 3. Data Isolation
- Franchises cannot change the `franchiseId` field
- Staff creation automatically assigns to the logged-in franchise

### 4. JWT Authentication
- All endpoints require valid franchise JWT token
- Token extracted from Authorization header: `Bearer <token>`

## Differences Between Admin and Franchise Endpoints

| Feature | Admin Endpoint (`/admin/staff`) | Franchise Endpoint (`/admin/franchise/staff`) |
|---------|----------------------------------|-----------------------------------------------|
| **Authentication** | Admin JWT token required | Franchise JWT token required |
| **Authorization** | Permission-based (checkPermission) | Automatic franchise filtering |
| **franchiseId Parameter** | Can specify any franchiseId | Automatically set to logged-in franchise |
| **Data Visibility** | Can see all staff across all franchises | Can only see own franchise's staff |
| **Create Staff** | Can assign to any franchise | Can only create for own franchise |
| **Update Staff** | Can update any staff | Can only update own franchise's staff |
| **Delete Staff** | Can delete any staff | Can only delete own franchise's staff |

## Benefits

### 1. Better Security
- Franchises cannot access other franchises' data
- Enforced at the controller level

### 2. Better User Experience
- No need to pass franchiseId in requests
- Automatic filtering reduces errors
- Simpler API for franchise users

### 3. Maintainability
- Separate endpoints for different user types
- Clear separation of concerns
- Easier to add franchise-specific features

### 4. Backward Compatibility
- Existing admin endpoints unchanged
- Admin users can still manage all staff via `/admin/staff`

## Testing

### Quick Test Flow
```bash
# 1. Login as franchise (save token)
FRANCHISE_TOKEN=$(curl -X POST https://freightrekapi.vercel.app/admin/agency/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@agency.com","password":"Test@123"}' | jq -r '.token')

# 2. Get your staff list
curl -X GET "https://freightrekapi.vercel.app/admin/franchise/staff" \
  -H "Authorization: Bearer $FRANCHISE_TOKEN" | jq

# 3. Create new staff
curl -X POST https://freightrekapi.vercel.app/admin/franchise/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANCHISE_TOKEN" \
  -d '{
    "name":"Test Staff",
    "email":"test@staff.com",
    "phone":"9876543210",
    "roleId":"ROLE_ID",
    "username":"teststaff",
    "password":"Test@123"
  }' | jq
```

## Files Created
- `src/controllers/admin/franchise-staff.controller.ts`
- `src/routes/admin/franchise-staff.routes.ts`
- `FRANCHISE_STAFF_IMPLEMENTATION.md` (this file)

## Files Modified
- `src/services/admin/agency.service.ts` - Added JWT token generation
- `src/controllers/admin/agency.controller.ts` - Return token in response
- `src/routes/admin/index.ts` - Registered franchise staff routes
- `API_TESTING_GUIDE.md` - Added documentation and examples

## Next Steps (Optional Enhancements)

### 1. Add Dashboard Endpoint
```typescript
// GET /admin/franchise/dashboard
- Total staff count
- Active/Inactive breakdown
- Recent staff activities
```

### 2. Add Bulk Operations
```typescript
// POST /admin/franchise/staff/bulk-status
- Update status of multiple staff at once
```

### 3. Add Staff Statistics
```typescript
// GET /admin/franchise/staff/stats
- Staff by role distribution
- Status breakdown
- Department-wise count
```

### 4. Add Export Feature
```typescript
// GET /admin/franchise/staff/export
- Export staff list as CSV/Excel
```

## Support

For issues or questions:
- Check API documentation: https://freightrekapi.vercel.app/api-docs
- Review API_TESTING_GUIDE.md for examples
- Verify JWT token is valid and not expired

---

**Implementation Date:** January 15, 2026  
**Status:** ✅ Complete and Ready for Testing
