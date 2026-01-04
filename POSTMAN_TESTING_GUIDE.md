# 📮 Postman API Testing Guide - Freightrek Server

**Date:** January 3, 2026  
**Status:** All 13 APIs ready for testing

---

## 🚀 Step 1: Import Postman Collection

### Option A: Import from File
1. Open **Postman** app
2. Click **File → Import** (or `Ctrl+O`)
3. Select **Upload Files**
4. Choose `Freightrek_API.postman_collection.json` from project root
5. Click **Import**

### Option B: Import from URL
1. Open Postman
2. Click **Import**
3. Paste collection URL: `http://localhost:3000/Freightrek_API.postman_collection.json`
4. Click **Import**

### Option C: Manual Setup
1. Create new request: `POST http://localhost:3000/admin/auth/register`
2. Set header: `Content-Type: application/json`
3. Add body and test

---

## 📋 Testing Workflow

### Step 1: Register Admin User

**Request:**
```
POST http://localhost:3000/admin/auth/register
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

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

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

**Postman Tips:**
- Right-click response → Save as example
- Use `Tests` tab to validate response:
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success flag", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.equal(true);
});
```

---

### Step 2: Login (Get JWT Token)

**Request:**
```
POST http://localhost:3000/admin/auth/login
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "email": "admin@freightrek.com",
  "password": "Admin@123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YWJjMTIzZGVmNDU2Nzg5IiwiaWF0IjoxNzA0MjcxNDAwLCJleHAiOjE3MDQyNzUwMDB9.xxx"
}
```

**Auto-save Token in Postman:**

In `Tests` tab, add:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

var jsonData = pm.response.json();
pm.environment.set("auth_token", jsonData.token);
```

Now token automatically saved to environment variable `{{auth_token}}`

---

### Step 3: Create Role

**Request:**
```
POST http://localhost:3000/admin/role
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{auth_token}}"
}
```

**Body:**
```json
{
  "name": "Manager",
  "permissions": ["read", "write", "delete"],
  "status": true
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc456def789012",
    "name": "Manager",
    "permissions": ["read", "write", "delete"],
    "status": true,
    "createdAt": "2026-01-03T10:00:00.000Z"
  }
}
```

**Save Role ID for later:**
```javascript
var jsonData = pm.response.json();
pm.environment.set("role_id", jsonData.data._id);
```

---

### Step 4: Get All Roles

**Request:**
```
GET http://localhost:3000/admin/role
```

**Headers:**
```json
{
  "Authorization": "Bearer {{auth_token}}"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc456def789012",
      "name": "Manager",
      "permissions": ["read", "write", "delete"],
      "status": true
    }
  ]
}
```

---

### Step 5: Get Role by ID

**Request:**
```
GET http://localhost:3000/admin/role/{{role_id}}
```

**Headers:**
```json
{
  "Authorization": "Bearer {{auth_token}}"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc456def789012",
    "name": "Manager",
    "permissions": ["read", "write", "delete"],
    "status": true
  }
}
```

---

### Step 6: Update Role

**Request:**
```
PUT http://localhost:3000/admin/role/{{role_id}}
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{auth_token}}"
}
```

**Body:**
```json
{
  "name": "Senior Manager",
  "permissions": ["read", "write", "delete", "admin"],
  "status": true
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc456def789012",
    "name": "Senior Manager",
    "permissions": ["read", "write", "delete", "admin"],
    "status": true
  }
}
```

---

### Step 7: Create Hub

**Request:**
```
POST http://localhost:3000/admin/hub
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{auth_token}}"
}
```

**Body:**
```json
{
  "name": "Mumbai Central Hub",
  "location": "Mumbai, Maharashtra",
  "capacity": 5000,
  "status": true
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789ghi012345",
    "name": "Mumbai Central Hub",
    "location": "Mumbai, Maharashtra",
    "capacity": 5000,
    "status": true
  }
}
```

**Save Hub ID:**
```javascript
var jsonData = pm.response.json();
pm.environment.set("hub_id", jsonData.data._id);
```

---

### Step 8: Get All Hubs

**Request:**
```
GET http://localhost:3000/admin/hub
```

**Headers:**
```json
{
  "Authorization": "Bearer {{auth_token}}"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc789ghi012345",
      "name": "Mumbai Central Hub",
      "location": "Mumbai, Maharashtra",
      "capacity": 5000,
      "status": true
    }
  ]
}
```

---

### Step 9: Get Hub by ID

**Request:**
```
GET http://localhost:3000/admin/hub/{{hub_id}}
```

**Headers:**
```json
{
  "Authorization": "Bearer {{auth_token}}"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789ghi012345",
    "name": "Mumbai Central Hub",
    "location": "Mumbai, Maharashtra",
    "capacity": 5000,
    "status": true
  }
}
```

---

### Step 10: Update Hub

**Request:**
```
PUT http://localhost:3000/admin/hub/{{hub_id}}
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{auth_token}}"
}
```

**Body:**
```json
{
  "name": "Mumbai Mega Hub",
  "location": "Mumbai, Maharashtra",
  "capacity": 10000,
  "status": true
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789ghi012345",
    "name": "Mumbai Mega Hub",
    "location": "Mumbai, Maharashtra",
    "capacity": 10000,
    "status": true
  }
}
```

---

### Step 11: Delete Hub

**Request:**
```
DELETE http://localhost:3000/admin/hub/{{hub_id}}
```

**Headers:**
```json
{
  "Authorization": "Bearer {{auth_token}}"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Hub deleted"
}
```

---

### Step 12: Delete Role

**Request:**
```
DELETE http://localhost:3000/admin/role/{{role_id}}
```

**Headers:**
```json
{
  "Authorization": "Bearer {{auth_token}}"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Role deleted"
}
```

---

## 🔑 Environment Variables Setup

### Create Postman Environment:
1. Click **Environments** (left sidebar)
2. Click **+** to create new
3. Name: `Freightrek-Local`
4. Add variables:

| Variable | Initial Value | Type |
|----------|---------------|------|
| `base_url` | `http://localhost:3000` | String |
| `auth_token` | (empty) | String |
| `role_id` | (empty) | String |
| `hub_id` | (empty) | String |

5. Click **Save**
6. Select environment from top-right dropdown

---

## 🧪 Quick Test Sequence

### Run All Tests in Order:
1. **Register** → Gets user created ✅
2. **Login** → Gets JWT token ✅
3. **Create Role** → Gets role_id ✅
4. **Get All Roles** → Verify role exists ✅
5. **Get Role by ID** → Verify role details ✅
6. **Update Role** → Verify update works ✅
7. **Create Hub** → Gets hub_id ✅
8. **Get All Hubs** → Verify hub exists ✅
9. **Get Hub by ID** → Verify hub details ✅
10. **Update Hub** → Verify update works ✅
11. **Delete Hub** → Verify deletion ✅
12. **Delete Role** → Verify deletion ✅

---

## 🔍 Error Testing

### Test Error Cases:

**1. Missing Authorization Header:**
```
GET http://localhost:3000/admin/role
(No Authorization header)
```
Expected: `401 Unauthorized`

**2. Invalid Token:**
```
GET http://localhost:3000/admin/role
Authorization: Bearer invalid-token
```
Expected: `401 Invalid or expired token`

**3. Invalid Email on Login:**
```
POST http://localhost:3000/admin/auth/login
Body: {"email": "wrong@email.com", "password": "Admin@123"}
```
Expected: `400 Invalid credentials`

**4. Duplicate Email on Register:**
```
POST http://localhost:3000/admin/auth/register
(Use same email as before)
```
Expected: `400 User already exists`

**5. Non-existent ID:**
```
GET http://localhost:3000/admin/role/00000000000000000000
Authorization: Bearer {{auth_token}}
```
Expected: `404 Role not found` or similar

---

## 📊 Postman Collection Features

### Automatic Features (Already Configured):
✅ **Token Auto-save** - Login response saves token
✅ **ID Auto-save** - Create responses save IDs
✅ **Bearer Auth** - Automatically adds token to header
✅ **Test Cases** - Pre-written assertions
✅ **Examples** - Response examples for reference
✅ **Documentation** - Full endpoint descriptions

---

## 💡 Pro Tips

### Tip 1: Run Collection Sequentially
1. Click **Run** button (in collection)
2. Select all requests in order
3. Click **Start Run**
4. Postman runs all tests automatically

### Tip 2: Save Response as Example
1. Right-click response
2. **Save as example**
3. Useful for documentation

### Tip 3: Create Test Suite
1. Click **New → Collection**
2. Add all test requests
3. Use **Pre-request Script** to setup data
4. Use **Tests** to validate responses

### Tip 4: Generate Code
1. Click **Code** button (right side)
2. Select language (JavaScript, Python, cURL, etc.)
3. Copy code for automation

---

## 🚨 Common Issues

### Issue: 401 Unauthorized
**Solution:** 
- Check if token is saved in `{{auth_token}}`
- Check if token is not expired
- Re-login to get fresh token

### Issue: 404 Not Found
**Solution:**
- Verify ID exists (create resource first)
- Check if ID is saved in environment variable
- Use correct variable syntax: `{{role_id}}`

### Issue: 400 Bad Request
**Solution:**
- Check request body format (JSON)
- Verify all required fields present
- Check field data types

### Issue: Connection Error
**Solution:**
- Verify server is running: `npm run dev`
- Check URL: `http://localhost:3000`
- Check firewall/antivirus

---

## 📈 Performance Testing

### Add Response Time Test:
```javascript
pm.test("Response time is less than 200ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});
```

### Add Response Size Test:
```javascript
pm.test("Response is not too large", function () {
    pm.expect(pm.response.headers.get('Content-Length')).to.be.below(10000);
});
```

---

## 🔐 Security Testing

### Test 1: SQL Injection
```json
{
  "email": "admin@test.com'; DROP TABLE users; --",
  "password": "test"
}
```
Expected: Safe (Mongoose prevents this)

### Test 2: XSS Payload
```json
{
  "name": "<script>alert('XSS')</script>",
  "email": "test@test.com"
}
```
Expected: Safe (Stored as string)

### Test 3: JWT Expiry
1. Login and get token
2. Wait 7 days (or modify .env to shorter expiry)
3. Try to use expired token
4. Expected: `401 Invalid or expired token`

---

## 📝 Test Report Template

**Tested By:** [Your Name]  
**Date:** January 3, 2026  
**Status:** ✅ PASSED / ❌ FAILED

| Test Case | Request | Expected | Actual | Status |
|-----------|---------|----------|--------|--------|
| Register User | POST /admin/auth/register | 201 | 201 | ✅ |
| Login User | POST /admin/auth/login | 200 + token | 200 + token | ✅ |
| Create Role | POST /admin/role | 201 | 201 | ✅ |
| Get Roles | GET /admin/role | 200 + data | 200 + data | ✅ |

---

## 🎯 Next Steps

After successful API testing:
1. ✅ Verify all 13 endpoints work
2. ✅ Test error scenarios
3. ✅ Verify authentication works
4. ✅ Check response formats
5. 🔄 Run collection multiple times
6. 📊 Document test results

---

**Happy Testing! 🚀**

*Import Freightrek_API.postman_collection.json and start testing!*
