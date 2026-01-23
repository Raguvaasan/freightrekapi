# Markup API - Production CURL Commands

**Base URL:** `https://freightrekapi.vercel.app`

> Replace with your actual Vercel production URL. Get it from: `vercel --prod` output or Vercel dashboard

---

## Authentication Required

All endpoints require a valid JWT token. Get your token from the login endpoint first:

```bash
# Login to get JWT token
curl -X POST https://freightrekapi.vercel.app/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword"
  }'
```

Copy the `token` from the response and use it in the Authorization header as `Bearer YOUR_TOKEN`.

---

## 1. Rate Calculator Markup APIs

### GET - Retrieve Rate Calculator Markup

#### Global Markup
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### User-Specific Markup
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup?user_id=USER_ID_HERE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### Franchise-Specific Markup
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup?franchise_id=FRANCHISE_ID_HERE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### User + Franchise Specific
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup?user_id=USER_ID_HERE&franchise_id=FRANCHISE_ID_HERE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

### POST - Create/Update Rate Calculator Markup

**Permission Required:** `Settings` module with `write` action

#### Create Global Percentage Markup (10%)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "percentage",
    "markup_value": 10,
    "user_id": null,
    "franchise_id": null
  }'
```

#### Create Global Fixed Markup (₹50)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "fixed",
    "markup_value": 50,
    "user_id": null,
    "franchise_id": null
  }'
```

#### Create User-Specific Markup (15% for specific user)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "percentage",
    "markup_value": 15,
    "user_id": "USER_OBJECT_ID_HERE",
    "franchise_id": null
  }'
```

#### Create Franchise-Specific Markup (₹100 for franchise)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "fixed",
    "markup_value": 100,
    "user_id": null,
    "franchise_id": "FRANCHISE_OBJECT_ID_HERE"
  }'
```

---

## 2. Rate Card Markup APIs

### GET - Retrieve Rate Card Markup

#### Global Markup
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### User-Specific Markup
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup?user_id=USER_ID_HERE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### Franchise-Specific Markup
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup?franchise_id=FRANCHISE_ID_HERE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### User + Franchise Specific
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup?user_id=USER_ID_HERE&franchise_id=FRANCHISE_ID_HERE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

### POST - Create/Update Rate Card Markup

**Permission Required:** `Settings` module with `write` action

#### Create Global Percentage Markup (5%)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "percentage",
    "markup_value": 5,
    "user_id": null,
    "franchise_id": null
  }'
```

#### Create Global Fixed Markup (₹25)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "fixed",
    "markup_value": 25,
    "user_id": null,
    "franchise_id": null
  }'
```

#### Create User-Specific Markup (8% for specific user)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "percentage",
    "markup_value": 8,
    "user_id": "USER_OBJECT_ID_HERE",
    "franchise_id": null
  }'
```

#### Create Franchise-Specific Markup (₹75 for franchise)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-card-markup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "fixed",
    "markup_value": 75,
    "user_id": null,
    "franchise_id": "FRANCHISE_OBJECT_ID_HERE"
  }'
```

---

## Expected Responses

### Success Response (200 OK - Existing Updated)
```json
{
  "success": true,
  "data": {
    "id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "markup_category": "rate_calculator",
    "markup_type": "percentage",
    "markup_value": 10,
    "user_id": null,
    "franchise_id": null,
    "is_active": true,
    "created_at": "2026-01-23T15:45:00.000Z",
    "updated_at": "2026-01-23T16:30:00.000Z"
  },
  "message": "rate calculator markup updated successfully"
}
```

### Success Response (201 Created - New)
```json
{
  "success": true,
  "data": {
    "id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "markup_category": "rate_card",
    "markup_type": "fixed",
    "markup_value": 50,
    "user_id": null,
    "franchise_id": null,
    "is_active": true,
    "created_at": "2026-01-23T15:45:00.000Z",
    "updated_at": "2026-01-23T15:45:00.000Z"
  },
  "message": "rate card markup created successfully"
}
```

### Not Found Response (404)
```json
{
  "success": false,
  "data": null,
  "message": "No markup configuration found"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "data": null,
  "message": "Validation error: markup_value must be between 0 and 100 for percentage type"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "data": null,
  "message": "Authentication required"
}
```

### Permission Error (403)
```json
{
  "success": false,
  "data": null,
  "message": "Permission denied"
}
```

---

## Testing Workflow

### Step 1: Login and Get Token
```bash
curl -X POST https://freightrekapi.vercel.app/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword"
  }'
```

### Step 2: Save Token
```bash
# Example response - copy the token value
# {"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}}

export JWT_TOKEN="YOUR_TOKEN_HERE"
```

### Step 3: Create Global Markup
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "percentage",
    "markup_value": 10
  }'
```

### Step 4: Retrieve Markup
```bash
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Step 5: Update Markup (Same endpoint, will update if exists)
```bash
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "markup_type": "fixed",
    "markup_value": 50
  }'
```

---

## Permission Setup

To use POST endpoints, your role must have the **Settings** module with **write** permission:

```bash
# Create/Update role with Settings permission
curl -X POST https://freightrekapi.vercel.app/admin/role \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Markup Manager",
    "description": "Can manage markup settings",
    "isRoot": false,
    "permissions": [
      {
        "module": "Settings",
        "read": true,
        "write": true,
        "update": true,
        "delete": false
      }
    ]
  }'
```

---

## Priority Hierarchy Testing

Test the priority system (User > Franchise > Global):

```bash
# 1. Create global markup (10%)
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"markup_type": "percentage", "markup_value": 10}'

# 2. Create franchise markup (15%)
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"markup_type": "percentage", "markup_value": 15, "franchise_id": "FRANCHISE_ID"}'

# 3. Create user markup (20%)
curl -X POST https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"markup_type": "percentage", "markup_value": 20, "user_id": "USER_ID"}'

# 4. Test priority - should return 20% (user-specific)
curl -X GET "https://freightrekapi.vercel.app/api/v1/settings/rate-calculator-markup?user_id=USER_ID&franchise_id=FRANCHISE_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## Notes

- Replace `YOUR_JWT_TOKEN_HERE` with actual JWT token from login
- Replace `USER_OBJECT_ID_HERE` with actual MongoDB ObjectId of user
- Replace `FRANCHISE_OBJECT_ID_HERE` with actual MongoDB ObjectId of franchise
- For Windows CMD, use `^` instead of `\` for line continuation
- For PowerShell, use `` ` `` instead of `\` for line continuation
- Percentage values must be 0-100
- Fixed values must be >= 0
- Only one active markup per category/user/franchise combination
- Priority: User-specific > Franchise-specific > Global
