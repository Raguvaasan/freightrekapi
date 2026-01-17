# Franchise Staff Management - Tamil Guide

## சுருக்கம் (Summary)

Franchise user-களுக்கு இப்போ separate endpoint கிடைக்குது அவங்க own staff-ஐ manage பண்ண. Automatic-ஆ franchise filtering இருக்கும், வேற franchise-ஓட staff-ஐ பார்க்க முடியாது.

## முக்கிய மாற்றங்கள் (Key Changes)

### 1. புதிய Endpoints
```
/admin/franchise/staff          - உங்க franchise staff பாக்க
/admin/franchise/staff          - புதிய staff create பண்ண
/admin/franchise/staff/:id      - Staff details பாக்க
/admin/franchise/staff/:id      - Staff update பண்ண
/admin/franchise/staff/:id      - Staff delete பண்ண
```

### 2. Franchise Login இப்போ Token Return பண்ணும்
```bash
curl -X POST https://freightrekapi.vercel.app/admin/agency/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your@email.com","password":"Password@123"}'
```

**Response-ல இப்போ token வரும்:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {...}
}
```

## எப்படி Use பண்ணுவது? (How to Use)

### Step 1: Franchise Login பண்ணுங்க
```bash
curl -X POST https://freightrekapi.vercel.app/admin/agency/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "speedx@freightrek.com",
    "password": "Speedx@123"
  }'
```

Token-ஐ save பண்ணுங்க!

### Step 2: உங்க Staff List பாருங்க
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/franchise/staff?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_FRANCHISE_TOKEN"
```

### Step 3: புதிய Staff Create பண்ணுங்க
```bash
curl -X POST https://freightrekapi.vercel.app/admin/franchise/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FRANCHISE_TOKEN" \
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

**முக்கியம்:** `franchiseId` கொடுக்க வேண்டாம் - automatic-ஆ set ஆகும்!

## Security Features

### 1. Automatic Filtering
- உங்க franchise-ஓட staff மட்டும் பாக்க முடியும்
- மத்த franchise-ஓட staff பாக்க முடியாது

### 2. Ownership Check
- ஒவ்வொரு operation-லும் ownership verify பண்ணும்
- மத்தவங்க staff-ஐ edit பண்ண முடியாது

### 3. Data Isolation
- Create பண்ணும் போது automatic-ஆ உங்க franchise-க்கு assign ஆகும்
- `franchiseId`-ஐ மாத்த முடியாது

## Admin vs Franchise Endpoints

| Feature | Admin Endpoint | Franchise Endpoint |
|---------|----------------|-------------------|
| **Path** | `/admin/staff` | `/admin/franchise/staff` |
| **Token** | Admin token தேவை | Franchise token தேவை |
| **franchiseId** | எந்த franchise-க்கும் create பண்ணலாம் | உங்க franchise-க்கு மட்டும் |
| **View Staff** | எல்லா staff-ஐயும் பாக்கலாம் | உங்க franchise staff மட்டும் |
| **Permission** | checkPermission middleware use ஆகும் | Automatic franchise filter |

## முக்கிய வேறுபாடுகள் (Key Differences)

### பழைய வழி (Old Way - Admin Only)
```bash
# Admin token-ஓட மட்டும் access பண்ண முடியும்
curl -X GET https://freightrekapi.vercel.app/admin/staff \
  -H "Authorization: Bearer ADMIN_TOKEN"

# franchiseId manually specify பண்ணணும்
curl -X POST https://freightrekapi.vercel.app/admin/staff \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"franchiseId":"67xyz789abc123456", ...}'
```

### புதிய வழி (New Way - Franchise Users)
```bash
# Franchise token-ஓட access பண்ணலாம்
curl -X GET https://freightrekapi.vercel.app/admin/franchise/staff \
  -H "Authorization: Bearer FRANCHISE_TOKEN"

# franchiseId automatic-ஆ set ஆகும்
curl -X POST https://freightrekapi.vercel.app/admin/franchise/staff \
  -H "Authorization: Bearer FRANCHISE_TOKEN" \
  -d '{"name":"Jane", "email":"jane@test.com", ...}'
```

## பொதுவான Errors

### 1. Token இல்ல
```json
{
  "success": false,
  "message": "Authorization header missing"
}
```
**Fix:** Authorization header-ல franchise token add பண்ணுங்க

### 2. மத்தவங்க Staff Access பண்ண Try பண்றீங்க
```json
{
  "success": false,
  "message": "Access denied: Staff does not belong to your franchise"
}
```
**Fix:** உங்க franchise-ஓட staff-ஐ மட்டும் access பண்ணுங்க

### 3. Invalid Token
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```
**Fix:** மறுபடியும் login பண்ணி புதிய token எடுங்க

## Test பண்ண Sample Commands

```bash
# 1. Login பண்ணி token save பண்ணுங்க
FRANCHISE_TOKEN=$(curl -s -X POST https://freightrekapi.vercel.app/admin/agency/login \
  -H "Content-Type: application/json" \
  -d '{"username":"speedx@freightrek.com","password":"Speedx@123"}' | jq -r '.token')

echo "Token: $FRANCHISE_TOKEN"

# 2. Staff list பாருங்க
curl -X GET "https://freightrekapi.vercel.app/admin/franchise/staff" \
  -H "Authorization: Bearer $FRANCHISE_TOKEN" | jq

# 3. புதிய staff create பண்ணுங்க
curl -X POST https://freightrekapi.vercel.app/admin/franchise/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANCHISE_TOKEN" \
  -d '{
    "name": "Test Staff",
    "email": "test@staff.com",
    "phone": "9876543210",
    "roleId": "ROLE_ID_HERE",
    "username": "teststaff",
    "password": "Test@123"
  }' | jq

# 4. Staff status update பண்ணுங்க
curl -X PATCH https://freightrekapi.vercel.app/admin/franchise/staff/STAFF_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANCHISE_TOKEN" \
  -d '{"status":"Inactive"}' | jq
```

## நன்மைகள் (Benefits)

1. **Better Security** - மத்தவங்க data பாக்க முடியாது
2. **Easier to Use** - franchiseId கொடுக்க வேண்டாம்
3. **Automatic Filtering** - உங்க staff மட்டும் display ஆகும்
4. **Safe Operations** - தவறுதலா மத்தவங்க staff-ஐ edit பண்ண முடியாது

## Files Created/Modified

### புதிய Files (New Files):
- ✅ `src/controllers/admin/franchise-staff.controller.ts`
- ✅ `src/routes/admin/franchise-staff.routes.ts`
- ✅ `FRANCHISE_STAFF_IMPLEMENTATION.md`
- ✅ `FRANCHISE_STAFF_TAMIL_GUIDE.md` (இந்த file)

### மாற்றப்பட்ட Files (Modified Files):
- ✅ `src/services/admin/agency.service.ts` - JWT token return
- ✅ `src/controllers/admin/agency.controller.ts` - Token response
- ✅ `src/routes/admin/index.ts` - Route registration
- ✅ `API_TESTING_GUIDE.md` - Documentation update

## முடிவுரை (Conclusion)

இப்போ franchise users தங்களோட staff-ஐ easily manage பண்ண முடியும். Separate endpoint-ஓட better security கிடைக்கும். Admin users-க்கு existing endpoints-ல எந்த மாற்றமும் இல்ல.

## Support

சந்தேகம் இருந்தா இந்த files-ஐ பாருங்க:
- `API_TESTING_GUIDE.md` - Detailed examples
- `FRANCHISE_STAFF_IMPLEMENTATION.md` - Technical details
- https://freightrekapi.vercel.app/api-docs - API documentation

---

**Implementation Date:** January 15, 2026  
**Status:** ✅ முடிந்தது (Complete)  
**Ready for Testing:** ஆம் (Yes)
