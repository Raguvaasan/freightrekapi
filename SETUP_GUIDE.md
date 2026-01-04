# ✅ Setup Guide - Initial Setup Endpoint

**Problem Fixed:** Now you can create initial role WITHOUT authentication!

---

## 🚀 New Setup Endpoint Added

### Endpoint: POST /admin/setup/role
- **No authentication required!**
- Only works if no roles exist
- Perfect for initial setup

---

## 📋 Complete Setup Sequence

### Step 1: Create Initial Role (No Auth Needed!)

**Go to:** `http://localhost:3000/api-docs`

**Find:** Setup → POST /admin/setup/role

**Body:**
```json
{
  "name": "Admin",
  "permissions": ["read", "write", "delete"],
  "status": true
}
```

**Click Execute**

**Response (201):**
```json
{
  "success": true,
  "message": "Setup role created",
  "data": {
    "_id": "65abc123def456789",
    "name": "Admin",
    "permissions": ["read", "write", "delete"],
    "status": true
  }
}
```

**✅ Copy the `_id` value!**

---

### Step 2: Register User (with roleId from Step 1)

**Find:** Authentication → POST /admin/auth/register

**Body:**
```json
{
  "name": "Admin User",
  "email": "admin@freightrek.com",
  "phoneNo": "9876543210",
  "password": "Admin@123",
  "roleId": "65abc123def456789"
}
```

**Click Execute**

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

---

### Step 3: Login (Get JWT Token)

**Find:** Authentication → POST /admin/auth/login

**Body:**
```json
{
  "email": "admin@freightrek.com",
  "password": "Admin@123"
}
```

**Click Execute**

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**✅ Copy the `token` value!**

---

### Step 4: Use Token for Other Requests

Now all authenticated endpoints work!

**Find:** Any authenticated endpoint (Role Management, Hub Management)

**Add Header:**
```
Authorization: Bearer <paste-token-here>
```

**Example: Create another role (now with auth)**

**Find:** Role Management → POST /admin/role

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "name": "Manager",
  "permissions": ["read", "write"],
  "status": true
}
```

**Click Execute** ✅

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────┐
│  Step 1: Create Initial Role        │
│  POST /admin/setup/role (No Auth)   │
│  Get: roleId                        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Step 2: Register User              │
│  POST /admin/auth/register          │
│  Use: roleId from Step 1            │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Step 3: Login                      │
│  POST /admin/auth/login             │
│  Get: JWT token                     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Step 4: Use Token                  │
│  All authenticated endpoints        │
│  + Authorization: Bearer <token>    │
└─────────────────────────────────────┘
```

---

## 🎯 Quick Copy-Paste Setup

### 1️⃣ Create Initial Role
```bash
curl -X POST http://localhost:3000/admin/setup/role \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "permissions": ["read", "write", "delete"],
    "status": true
  }'
```

Expected response contains `_id`. Save it!

### 2️⃣ Register User (replace ROLE_ID)
```bash
curl -X POST http://localhost:3000/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "phoneNo": "9876543210",
    "password": "Admin@123",
    "roleId": "PASTE_ROLE_ID_HERE"
  }'
```

### 3️⃣ Login (get token)
```bash
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123"
  }'
```

Expected response contains `token`. Save it!

### 4️⃣ Create Role (with auth, replace TOKEN)
```bash
curl -X POST http://localhost:3000/admin/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  -d '{
    "name": "Manager",
    "permissions": ["read", "write"],
    "status": true
  }'
```

---

## ⚠️ Important Notes

- `POST /admin/setup/role` **only works once** (when no roles exist)
- After first role is created, use authenticated endpoint `POST /admin/role`
- If you try to call setup again, you'll get error: "Setup already completed"
- This is by design for security!

---

## 🔄 If Setup Already Done

If you already tried setup and got error:

**Option 1: Start Fresh**
```bash
# Delete all roles from MongoDB
# Then you can use setup endpoint again
```

**Option 2: Login with Existing User**
- Use your existing email/password
- Get token
- Use authenticated endpoints

---

## 📋 Test Checklist

- [ ] Create initial role via `/admin/setup/role`
- [ ] Copy roleId from response
- [ ] Register user with that roleId
- [ ] Login and get token
- [ ] Use token to create hub/role
- [ ] Get all roles with token
- [ ] Everything works! ✅

---

## 🆘 Troubleshooting

### Error: "Setup already completed"
**Solution:** Setup endpoint only works first time. Use authenticated endpoint now:
```
POST /admin/role (with Authorization header)
```

### Error: "Invalid roleId format"
**Solution:** Make sure roleId is exactly as copied from setup response

### Error: "Authorization header missing"
**Solution:** Add header:
```
Authorization: Bearer <your-token>
```

### Error: "Invalid or expired token"
**Solution:** Get fresh token by logging in again

---

## 🎉 You're All Set!

Now you can:
1. ✅ Create roles without auth (setup)
2. ✅ Register users
3. ✅ Login and get token
4. ✅ Use token for authenticated endpoints
5. ✅ Test all 13 APIs!

---

**Start with Step 1 in Swagger UI at `/api-docs`! 🚀**
