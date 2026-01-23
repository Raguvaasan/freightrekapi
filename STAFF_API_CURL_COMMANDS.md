# Staff API - cURL Commands

## API Base URLs

**Local Development**: `http://localhost:3000`  
**Production (Live)**: `https://freightrekapi.vercel.app`

> Replace the base URL in the commands below based on your environment.

## 1. Staff Login

**Local:**
```bash
curl -X POST http://localhost:3000/admin/staff/login \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"johndoe\",
    \"password\": \"password123\"
  }"
```

**Production:**
```bash
curl -X POST https://freightrekapi.vercel.app/admin/staff/login \
**Local:**
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

**Production:**
```bash
curl -X POST https://freightrekapi.vercel.app
    \"username\": \"johndoe\",
**Local:**
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

**Production:**
```bash
curl -X POST https://freightrekapi.vercel.app
```

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
