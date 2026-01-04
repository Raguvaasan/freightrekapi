# 🔴 Fix: Registration Error - roleId Validation

**Issue:** Registration failing with error about `roleId` validation

---

## ❌ What You're Sending (Wrong)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNo": "1234567890",
  "password": "Pass@123",
  "roleId": 123  ← ❌ WRONG! This is a number, not a string
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Admineuser validation failed: roleId: cast to ObjectId failed for value \"123\"..."
}
```

---

## ✅ What You Should Send (Correct)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNo": "1234567890",  ← Must be string, 10 digits
  "password": "Pass@123",     ← Min 6 characters
  "roleId": "65abc123def456789"  ← Must be valid MongoDB ObjectId string
}
```

---

## 📋 Validation Rules (Updated)

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| `name` | string | Min 2 chars | "John Doe" |
| `email` | string | Valid email | "john@example.com" |
| `phoneNo` | **string** | 10 digits | "9876543210" |
| `password` | string | Min 6 chars | "Pass@123" |
| `roleId` | **string** | MongoDB ObjectId | "65abc123def456789" |

---

## 🚀 Step-by-Step Fix

### Step 1: Create a Role First

**Go to:** `http://localhost:3000/api-docs`

**Find:** Role Management → POST /admin/role

**Click:** "Try it out"

**Body:**
```json
{
  "name": "Admin",
  "permissions": ["read", "write", "delete"],
  "status": true
}
```

**Click Execute**

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123def456789",  ← Copy this ID!
    "name": "Admin",
    "permissions": ["read", "write", "delete"]
  }
}
```

### Step 2: Copy the Role ID

From response above, copy the `_id` value:
```
65abc123def456789
```

### Step 3: Register User with Correct roleId

**Go to:** Authentication → POST /admin/auth/register

**Click:** "Try it out"

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNo": "9876543210",
  "password": "Pass@123",
  "roleId": "65abc123def456789"
}
```

⚠️ **IMPORTANT:**
- `phoneNo` must be a **string** "9876543210" (not number 9876543210)
- `roleId` must be the **exact ID** from the role you created
- `roleId` must be a **string** in valid MongoDB ObjectId format

### Step 4: Click Execute

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

---

## ✅ Valid roleId Format

MongoDB ObjectIds are 24-character hexadecimal strings:
```
✅ "65abc123def456789ab1234f" - Valid
✅ "507f1f77bcf86cd799439011" - Valid
✅ "65abc123def456789" - Valid (without trailing chars)

❌ "123" - Invalid (too short)
❌ "invalid-id" - Invalid (not hex)
❌ 123 - Invalid (number, not string)
❌ "ZZZZZZZZZZZZZZZZZZZZZZZ" - Invalid (not hex)
```

---

## 🔍 How to Get a Valid roleId

### Option 1: Create Role via Swagger (Recommended)
1. Go to `/api-docs`
2. Find Role Management → POST /admin/role
3. Create a role
4. Copy the returned `_id`
5. Use it for registration

### Option 2: Create Role via Postman
1. Import Postman collection
2. Create role request
3. Copy ID from response

### Option 3: Check Database
1. Open MongoDB Atlas
2. Find `adminroles` collection
3. Copy any role's `_id`

### Option 4: Use Sample ID (for testing only)
```
65abc123def456789ab1234f
```
(But this might not exist in your DB)

---

## 🐛 Common Mistakes to Avoid

### ❌ Mistake 1: phoneNo as number
```json
{
  "phoneNo": 9876543210  ← WRONG!
}
```
**Fix:** Use string `"9876543210"`

### ❌ Mistake 2: roleId as number
```json
{
  "roleId": 123  ← WRONG!
}
```
**Fix:** Use string `"65abc123def456789"`

### ❌ Mistake 3: Invalid roleId format
```json
{
  "roleId": "invalid-id"  ← WRONG format!
}
```
**Fix:** Use valid MongoDB ObjectId `"65abc123def456789"`

### ❌ Mistake 4: roleId doesn't exist in DB
```json
{
  "roleId": "00000000000000000000000"  ← ID not in DB!
}
```
**Fix:** Create role first, then use that ID

### ❌ Mistake 5: Phone number wrong format
```json
{
  "phoneNo": "12345"  ← Only 5 digits!
}
```
**Fix:** Must be 10 digits `"1234567890"`

---

## 📌 Complete Working Example

```json
{
  "name": "Admin User",
  "email": "admin@freightrek.com",
  "phoneNo": "9876543210",
  "password": "Admin@123456",
  "roleId": "65abc123def456789"
}
```

**Requirements:**
- ✅ name: 2+ characters
- ✅ email: valid format
- ✅ phoneNo: exactly 10 digits as string
- ✅ password: 6+ characters
- ✅ roleId: valid MongoDB ObjectId as string

---

## 🔧 Quick Test Sequence

1. **Create a role first** (if none exists)
   - POST /admin/role
   - Save the `_id`

2. **Register a user** with that roleId
   - POST /admin/auth/register
   - Use the roleId from step 1

3. **Login** with user credentials
   - POST /admin/auth/login
   - Get JWT token

4. **Use token** for other endpoints
   - Add header: `Authorization: Bearer <token>`

---

## ✨ Fixed Validation

**Updated validation rules are now in place:**
- ✅ phoneNo is now string type (not number)
- ✅ phoneNo must be exactly 10 digits
- ✅ roleId must be valid MongoDB ObjectId format
- ✅ password must be min 6 characters
- ✅ name must be min 2 characters

---

## 🎯 Next Steps

1. Create a role first via Swagger
2. Copy the `_id` from response
3. Register user with that roleId
4. It will work! ✅

---

**If you still get error:**
- Check roleId is 24-character hex string
- Check role exists in database
- Check phone is 10 digits
- Check all fields are correct type

Happy Testing! 🚀
