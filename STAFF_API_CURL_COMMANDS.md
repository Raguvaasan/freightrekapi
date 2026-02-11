# Staff API - cURL Commands

## API Base URLs

**Local Development**: `http://localhost:3000`  
**Production (Live)**: `https://freightrekapi.vercel.app`

> Replace the base URL in the commands below based on your environment.

## 1. Staff Login 🔐

> **Authentication:** Not required for login endpoint  
> **Available for:** Both Head Quarter staff and Franchise staff

### 🎯 Separate Login Endpoints (Recommended)

Now franchise staff and head quarter staff have **separate login endpoints** to prevent confusion:

- **Franchise Staff**: `/admin/staff/login/franchise` 
- **Head Quarter Staff**: `/admin/staff/login/headquarter`
- **Generic (Both)**: `/admin/staff/login` (backward compatibility)

---

### 1.1 🏢 Franchise Staff Login (Franchise Only)

**Endpoint:** `POST /admin/staff/login/franchise`

✅ **Only franchise staff** can login through this endpoint  
❌ Head quarter staff will be **rejected** with error message

**Local:**
```bash
curl -X POST http://localhost:3000/admin/staff/login/franchise \
  -H "Content-Type: application/json" \
  -d '{
    "username": "raguvasans46@gmail.com",
    "password": "Admin@123"
  }'
```

**Production:**
```bash
curl -X POST https://freightrekapi.vercel.app/admin/staff/login/franchise \
  -H "Content-Type: application/json" \
  -d '{
    "username": "raguvasans46@gmail.com",
    "password": "Admin@123"
  }'
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/admin/staff/login/franchise" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    username = "raguvasans46@gmail.com"
    password = "Admin@123"
  } | ConvertTo-Json)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Franchise staff login successful",
  "data": {
    "_id": "698cb058276ccedd504da48b",
    "name": "Raguvasans Franchise Staff",
    "email": "raguvasans46@gmail.com",
    "phone": "1234567890",
    "type": "franchise",
    "username": "raguvasans46@gmail.com",
    "status": "Active",
    "franchiseId": {
      "_id": "695fcf4ef80198a959bc0125",
      "agencyName": "Test"
    },
    "createdAt": "2026-02-11T10:30:00.000Z",
    "updatedAt": "2026-02-11T10:30:00.000Z"
  }
}
```

**Error - Not a Franchise Staff (401):**
```json
{
  "success": false,
  "message": "Invalid credentials. This is not a franchise staff account."
}
```

---

### 1.2 🏛️ Head Quarter Staff Login (HQ Only)

**Endpoint:** `POST /admin/staff/login/headquarter`

✅ **Only head quarter staff** can login through this endpoint  
❌ Franchise staff will be **rejected** with error message

**Local:**
```bash
curl -X POST http://localhost:3000/admin/staff/login/headquarter \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

**Production:**
```bash
curl -X POST https://freightrekapi.vercel.app/admin/staff/login/headquarter \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/admin/staff/login/headquarter" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    username = "johndoe"
    password = "password123"
  } | ConvertTo-Json)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Head quarter staff login successful",
  "data": {
    "_id": "65abc123def456789",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "type": "head_quarter",
    "username": "johndoe",
    "status": "Active",
    "roleId": {
      "_id": "65role123abc456",
      "name": "Operations Manager",
      "permissions": [
        {
          "module": "Staff Management",
          "read": true,
          "write": true,
          "update": true,
          "delete": false
        }
      ]
    },
    "createdAt": "2026-02-10T10:30:00.000Z",
    "updatedAt": "2026-02-10T10:30:00.000Z"
  }
}
```

**Error - Not a Head Quarter Staff (401):**
```json
{
  "success": false,
  "message": "Invalid credentials. This is not a head quarter staff account."
}
```

---

### 1.3 🔄 Generic Staff Login (Backward Compatibility)

**Endpoint:** `POST /admin/staff/login`

This endpoint accepts **both** franchise and head quarter staff. Use this for backward compatibility only.

**Local:**
```bash
curl -X POST http://localhost:3000/admin/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

**Production:**
```bash
curl -X POST https://freightrekapi.vercel.app/admin/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

---

### Login Error Responses

**❌ Invalid Credentials (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**❌ Inactive Account (401):**
```json
{
  "success": false,
  "message": "Staff account is inactive"
}
```

**❌ Validation Error (400):**
```json
{
  "success": false,
  "message": "username is required"
}
```

**❌ Server Error (500):**
```json
{
  "success": false,
  "message": "Error during login"
}
```

---

### Quick Test Commands

**Using environment variables (Recommended):**

```bash
# Set base URL
export BASE_URL="https://freightrekapi.vercel.app"

# Test Head Quarter Staff Login
curl -X POST "$BASE_URL/admin/staff/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'

# Test Franchise Staff Login
curl -X POST "$BASE_URL/admin/staff/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "janesmith",
    "password": "password123"
  }'
```

**PowerShell version:**
```powershell
# Set base URL
$BASE_URL = "https://freightrekapi.vercel.app"

# Test Staff Login
Invoke-RestMethod -Uri "$BASE_URL/admin/staff/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    username = "johndoe"
    password = "password123"
  } | ConvertTo-Json)
```

---

### Login Key Points

✅ **Separate endpoints**: Franchise and HQ staff have dedicated login endpoints  
✅ **Type validation**: Each endpoint validates staff type before login  
✅ **Secure authentication**: Passwords are hashed with bcrypt  
✅ **Account status check**: Only "Active" staff can login  
✅ **Role/Franchise populated**: Response includes full role or franchise details  
✅ **Password excluded**: Password field never appears in response  

🔒 **Security Notes:**
- Use HTTPS in production to protect credentials
- Implement rate limiting to prevent brute force attacks
- Consider adding JWT tokens for subsequent requests
- Log failed login attempts for security monitoring

---

## 📚 Tamil Guide / தமிழ் வழிகாட்டி

### Franchise Staff Login - விளக்கம்

**முக்கிய புள்ளிகள்:**

1. **Separate Endpoint** - தனி endpoint  
   - Franchise staff க்கு: `/admin/staff/login/franchise`
   - Head Quarter staff க்கு: `/admin/staff/login/headquarter`
   - இப்போது இரண்டும் தனித்தனியாக login செய்யலாம்

2. **Type Validation** - வகை சரிபார்ப்பு  
   - Franchise endpoint-ல் franchise staff மட்டும் login ஆகும்
   - HQ endpoint-ல் HQ staff மட்டும் login ஆகும்
   - தவறான endpoint-ல் login செய்தால் error வரும்

3. **Error Messages** - பிழை செய்திகள்  
   ```
   "Invalid credentials. This is not a franchise staff account."
   - இது franchise staff account இல்லை - HQ staff தான்
   
   "Invalid credentials. This is not a head quarter staff account."
   - இது HQ staff account இல்லை - franchise staff தான்
   ```

**உதாரணம்:**

```bash
# Franchise staff login - சரியான முறை
curl -X POST https://freightrekapi.vercel.app/admin/staff/login/franchise \
  -H "Content-Type: application/json" \
  -d '{
    "username": "raguvasans46@gmail.com",
    "password": "Admin@123"
  }'

# HQ staff login - சரியான முறை
curl -X POST https://freightrekapi.vercel.app/admin/staff/login/headquarter \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

**பலன்கள் (Benefits):**
- 🔒 அதிக பாதுகாப்பு (More secure)
- ✅ தெளிவான பிரிப்பு (Clear separation)
- 🚫 குழப்பம் இல்லை (No confusion)
- 🎯 சரியான validation



---

## 2. Create Head Quarter Staff
**Requirements**: `roleId` required, `franchiseId` NOT allowed

```bash
curl -X POST http://localhost:3000/admin/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"John Doe\",
    \"email\": \"john@example.com\",
    \"phone\": \"1234567890\",
    \"type\": \"head_quarter\",
    \"roleId\": \"65abc123def456789\",
    \"username\": \"johndoe\",
    \"password\": \"password123\",
    \"status\": \"Active\"
  }"
```

---

## 3. Create Franchise Staff
**Requirements**: `franchiseId` required, `roleId` NOT allowed

```bash
curl -X POST http://localhost:3000/admin/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"Jane Smith\",
    \"email\": \"jane@example.com\",
    \"phone\": \"0987654321\",
    \"type\": \"franchise\",
    \"franchiseId\": \"65xyz789abc123456\",
    \"username\": \"janesmith\",
    \"password\": \"password123\",
    \"status\": \"Active\"
  }"
```

---

## 4. Get All Staff (with filters)
```bash
# Get all staff
curl -X GET "http://localhost:3000/admin/staff?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by status
curl -X GET "http://localhost:3000/admin/staff?status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by franchise
curl -X GET "http://localhost:3000/admin/staff?franchiseId=65xyz789abc123456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by role
curl -X GET "http://localhost:3000/admin/staff?roleId=65abc123def456789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search by name/email/phone
curl -X GET "http://localhost:3000/admin/staff?search=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5. Get Staff by ID
```bash
curl -X GET http://localhost:3000/admin/staff/65abc123def456789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 6. Update Head Quarter Staff
```bash
curl -X PUT http://localhost:3000/admin/staff/65abc123def456789 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"John Doe Updated\",
    \"email\": \"john.updated@example.com\",
    \"phone\": \"1234567899\",
    \"roleId\": \"65abc456def789012\",
    \"status\": \"Inactive\"
  }"
```

---

## 7. Update Franchise Staff
```bash
curl -X PUT http://localhost:3000/admin/staff/65xyz789abc123456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"Jane Smith Updated\",
    \"email\": \"jane.updated@example.com\",
    \"franchiseId\": \"65xyz999abc111222\",
    \"status\": \"Active\"
  }"
```

---

## 8. Update Staff Password

**Local:**
```bash
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"admin\",
    \"password\": \"admin123\"
  }"
```

**Production:**
```bash
curl -X POST https://freightrekapi.vercel.appadmin/staff/65abc123def456789 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"password\": \"newpassword123\"
  }"
```

---

## 9. Change Staff Type
**Note**: When changing type, ensure correct fields are present

```bash
# Change from franchise to head_quarter (need roleId, remove franchiseId)
curl -X PUT http://localhost:3000/admin/staff/65xyz789abc123456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"type\": \"head_quarter\",
    \"roleId\": \"65abc123def456789\"
  }"
```

---

## 10. Delete Staff
```bash
curl -X DELETE http://localhost:3000/admin/staff/65abc123def456789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Important Notes

### Type Field Validation Rules:
- **head_quarter**: 
  - ✅ Must have `roleId`
  - ❌ Cannot have `franchiseId`
  
- **franchise**: 
  - ✅ Must have `franchiseId`
  - ❌ Cannot have `roleId`

### Getting JWT Token:
First login as admin or staff to get the token:
```bash
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"admin\",
    \"password\": \"admin123\"
  }"
```

Copy the `token` from response and use it in the `Authorization: Bearer TOKEN` header.

---

## Error Examples

### ❌ Invalid: Head Quarter with franchiseId
```bash
curl -X POST http://localhost:3000/admin/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"Invalid Staff\",
    \"email\": \"invalid@example.com\",
    \"phone\": \"1234567890\",
    \"type\": \"head_quarter\",
    \"franchiseId\": \"65xyz789abc123456\",
    \"username\": \"invalid\",
    \"password\": \"password123\"
  }"
```
**Response**: `Franchise should not be provided for head quarter staff`

### ❌ Invalid: Franchise with roleId
```bash
curl -X POST http://localhost:3000/admin/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"name\": \"Invalid Staff\",
    \"email\": \"invalid@example.com\",
    \"phone\": \"1234567890\",
    \"type\": \"franchise\",
    \"roleId\": \"65abc123def456789\",
    \"username\": \"invalid\",
    \"password\": \"password123\"
  }"
```
**Response**: `Role should not be provided for franchise staff`
