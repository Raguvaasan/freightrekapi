# 🧪 Complete Testing Setup Summary

**Project:** Freightrek Server  
**Date:** January 3, 2026  
**Total APIs:** 13 Endpoints Ready for Testing

---

## 📮 Postman Collection Testing

### Quick Start (3 Steps):

**Step 1: Import Collection**
- Download: `Freightrek_API.postman_collection.json`
- Open Postman → File → Import
- Select the file → Click Import

**Step 2: Create Environment**
- Click Environments → New
- Add variable: `auth_token` (empty initially)
- Add variable: `base_url` = `http://localhost:3000`
- Save and select environment

**Step 3: Run Tests**
- Login → Copy token
- Test other endpoints with token
- Or use Collection Runner to run all tests

---

## 🎯 13 API Endpoints Summary

### Group 1: Authentication (3 APIs)
```
1. POST   /admin/auth/register      → Create new admin user
2. POST   /admin/auth/login         → Login & get JWT token
3. POST   /admin/auth/create-user   → Create user (admin only)
```

### Group 2: Role Management (5 APIs)
```
4. POST   /admin/role               → Create role
5. GET    /admin/role               → Get all roles
6. GET    /admin/role/:id           → Get specific role
7. PUT    /admin/role/:id           → Update role
8. DELETE /admin/role/:id           → Delete role
```

### Group 3: Hub Management (5 APIs)
```
9. POST   /admin/hub                → Create hub
10. GET   /admin/hub                → Get all hubs
11. GET   /admin/hub/:id            → Get specific hub
12. PUT   /admin/hub/:id            → Update hub
13. DELETE /admin/hub/:id           → Delete hub
```

---

## 📊 Testing Sequence

### Recommended Order:
```
1. Register User
   ↓
2. Login (Get Token)
   ↓
3. Create Role → Save ID
   ↓
4. Get All Roles → Verify
   ↓
5. Get Role by ID
   ↓
6. Update Role
   ↓
7. Create Hub → Save ID
   ↓
8. Get All Hubs → Verify
   ↓
9. Get Hub by ID
   ↓
10. Update Hub
   ↓
11. Delete Hub
   ↓
12. Delete Role
```

---

## 🔐 Authentication Flow

### Without Token (Public):
- ✅ POST /admin/auth/register
- ✅ POST /admin/auth/login

### With Token (Protected):
- Use Bearer token from login response
- Add header: `Authorization: Bearer <token>`
- All other 11 endpoints require this

---

## 📋 Test Examples

### Example 1: Register
```bash
curl -X POST http://localhost:3000/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "phoneNo": "9876543210",
    "password": "Pass@123",
    "roleId": "65abc123def456789"
  }'
```

### Example 2: Login
```bash
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Pass@123"
  }'
```

**Response will include:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Example 3: Create Role (with token)
```bash
curl -X POST http://localhost:3000/admin/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Manager",
    "permissions": ["read", "write"],
    "status": true
  }'
```

---

## 🧪 Testing Tools Available

### 1. **Swagger UI** 
- URL: `http://localhost:3000/api-docs`
- Features: Interactive testing, documentation
- Try it out button for each endpoint

### 2. **Postman Collection**
- File: `Freightrek_API.postman_collection.json`
- Features: Environment variables, tests, automation
- Pre-configured requests with examples

### 3. **cURL Commands**
- Command line tool (built-in)
- Useful for scripts and automation
- See examples in this guide

### 4. **Insomnia** (Alternative)
- Similar to Postman
- Import same collection
- Free and lightweight

### 5. **REST Client Extension** (VS Code)
- Create `.http` files
- Execute requests from editor
- Very lightweight

---

## ✅ Testing Checklist

### Pre-Testing:
- [ ] Server running (`npm run dev`)
- [ ] MongoDB connected
- [ ] Postman installed
- [ ] Collection imported
- [ ] Environment created with variables

### Authentication Tests:
- [ ] Register creates user successfully
- [ ] Login returns JWT token
- [ ] Token auto-saved to environment
- [ ] Expired token returns 401

### Role Management Tests:
- [ ] Create role works with auth
- [ ] Get all roles returns data
- [ ] Get role by ID works
- [ ] Update role modifies data
- [ ] Delete role removes from DB

### Hub Management Tests:
- [ ] Create hub works with auth
- [ ] Get all hubs returns data
- [ ] Get hub by ID works
- [ ] Update hub modifies data
- [ ] Delete hub removes from DB

### Error Handling Tests:
- [ ] Missing auth returns 401
- [ ] Invalid token returns 401
- [ ] Duplicate email on register returns 400
- [ ] Non-existent ID returns 404
- [ ] Invalid input returns 400

### Security Tests:
- [ ] Password not returned in responses
- [ ] Sensitive data excluded
- [ ] SQL injection prevented
- [ ] XSS prevented

---

## 📈 Performance Checks

| Endpoint | Expected Time | Acceptable |
|----------|----------------|-----------|
| Login | < 100ms | < 200ms |
| Get Roles | < 50ms | < 100ms |
| Create Role | < 100ms | < 200ms |
| Get Hub by ID | < 50ms | < 100ms |

---

## 🎓 Step-by-Step Testing Guide

### Full Testing Session (15 minutes):

**1. Setup (2 min)**
- Import Postman collection
- Create environment
- Verify server is running

**2. Authentication (3 min)**
- Test Register endpoint
- Test Login endpoint
- Verify token is returned

**3. Role Management (5 min)**
- Create a role
- Get all roles
- Get specific role
- Update the role
- Delete the role

**4. Hub Management (5 min)**
- Create a hub
- Get all hubs
- Get specific hub
- Update the hub
- Delete the hub

---

## 🔍 Debugging Tips

### If Register Fails:
- Check email is unique
- Verify roleId exists in database
- Check password is strong enough
- Look for validation errors in response

### If Login Fails:
- Verify user exists
- Check email/password are correct
- Ensure user status is active

### If Role Operations Fail:
- Verify you're logged in
- Check if token is in Authorization header
- Verify token hasn't expired
- Check user has required permissions

### If Token Issues:
- Re-login to get fresh token
- Verify token format: `Bearer <token>`
- Check environment variable is set
- Ensure no extra spaces in token

---

## 📊 Expected Responses

### 201 Created
```json
{
  "success": true,
  "data": { "id": "...", "name": "..." }
}
```

### 200 OK
```json
{
  "success": true,
  "data": [ ... ] or { ... }
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error or user already exists"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Role not found" or "Hub not found"
}
```

---

## 🚀 Testing Automation

### Postman Collection Runner:
1. Click **Run** (top-left)
2. Select collection
3. Select all requests
4. Click **Start Run**
5. Watch tests execute automatically

### Postman CLI (Newman):
```bash
npm install -g newman
newman run Freightrek_API.postman_collection.json \
  -e environment.json \
  -r htmlextra
```

---

## 📝 Test Report Template

```markdown
# API Testing Report
**Date:** January 3, 2026
**Tester:** [Your Name]
**Server:** http://localhost:3000

## Summary
- Total Endpoints: 13
- Passed: 13/13 ✅
- Failed: 0
- Skipped: 0

## Results by Category

### Authentication (3/3 ✅)
- Register: PASS
- Login: PASS
- Create User: PASS

### Roles (5/5 ✅)
- Create: PASS
- Read All: PASS
- Read One: PASS
- Update: PASS
- Delete: PASS

### Hubs (5/5 ✅)
- Create: PASS
- Read All: PASS
- Read One: PASS
- Update: PASS
- Delete: PASS

## Issues Found
None

## Recommendations
All APIs working perfectly!
```

---

## 💾 Save Test Results

In Postman:
1. **Run Collection**
2. After tests complete
3. Click **Export Results**
4. Save as JSON/HTML
5. Share with team

---

## 🎯 Final Checklist

Before going to production:
- [ ] All 13 APIs tested
- [ ] Error scenarios tested
- [ ] Authentication verified
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Documentation complete
- [ ] Team trained on APIs
- [ ] Test reports generated

---

**Ready to Test! Start with Postman collection! 🚀**

See `POSTMAN_TESTING_GUIDE.md` for detailed step-by-step instructions.
