# Freightrek API - Complete Testing Guide with CURL Commands

## 📋 Table of Contents
1. [Admin Authentication](#admin-authentication)
2. [Role Management](#role-management)
3. [Franchise Management](#franchise-management)
4. [Staff Management](#staff-management)
5. [Hub Management](#hub-management)
6. [Testing Flow](#testing-flow)

---

## 🔐 Admin Authentication

### Step 1: Register Admin User
First, create an admin user account.

```bash
curl -X POST https://freightrekapi.vercel.app/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@freightrek.com",
    "phoneNo": "9876543210",
    "password": "Admin@123",
    "roleId": "65abc123def456789"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

---

### Step 2: Login Admin User
Login to get JWT token for authentication.

```bash
curl -X POST https://freightrekapi.vercel.app/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@freightrek.com",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Important:** Save this token! Use it in all protected endpoints.

---

## 👥 Role Management

### Step 3: Create Role
Create roles for staff members.

```bash
curl -X POST https://freightrekapi.vercel.app/admin/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Manager",
    "permissions": {
      "access_management": {
        "read": true,
        "write": true,
        "delete": false
      },
      "agency_management": {
        "read": true,
        "write": true,
        "delete": false
      }
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "_id": "67def456abc789012",
    "name": "Manager",
    "permissions": {...}
  }
}
```

---

### Get All Roles

```bash
curl -X GET "https://freightrekapi.vercel.app/admin/role?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get Role by ID

```bash
curl -X GET https://freightrekapi.vercel.app/admin/role/67def456abc789012 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update Role

```bash
curl -X PUT https://freightrekapi.vercel.app/admin/role/67def456abc789012 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Senior Manager",
    "permissions": {
      "access_management": {
        "read": true,
        "write": true,
        "delete": true
      }
    }
  }'
```

---

### Delete Role

```bash
curl -X DELETE https://freightrekapi.vercel.app/admin/role/67def456abc789012 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🏢 Franchise (Agency) Management

### Step 4: Create Franchise

```bash
curl -X POST https://freightrekapi.vercel.app/admin/agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agencyName": "SpeedX Express",
    "agencyOwner": "David Kumar",
    "phone": "9185647852",
    "email": "speedx@example.com",
    "address": "123, Main Street, Anna Nagar",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600040",
    "gstNumber": "33ABCDE1234F2Z5",
    "status": "Active",
    "username": "speedx@freightrek.com",
    "password": "Speedx@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Agency created successfully",
  "data": {
    "_id": "67xyz789abc123456",
    "agencyName": "SpeedX Express",
    "agencyOwner": "David Kumar",
    "city": "Chennai",
    "state": "Tamil Nadu"
  }
}
```

---

### Step 5: Franchise Login (No Token Required)

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
  "data": {
    "_id": "67xyz789abc123456",
    "agencyName": "SpeedX Express",
    "agencyOwner": "David Kumar",
    "status": "Active"
  }
}
```

---

### Get All Franchises

```bash
curl -X GET "https://freightrekapi.vercel.app/admin/agency?page=1&limit=10&search=Chennai&status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by name/owner/city/state
- `status` - Filter by Active/Inactive

---

### Get Franchise by ID

```bash
curl -X GET https://freightrekapi.vercel.app/admin/agency/67xyz789abc123456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update Franchise

```bash
curl -X PUT https://freightrekapi.vercel.app/admin/agency/67xyz789abc123456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phone": "9876543210",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }'
```

---

### Update Franchise Status

```bash
curl -X PATCH https://freightrekapi.vercel.app/admin/agency/67xyz789abc123456/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "Inactive"
  }'
```

---

### Delete Franchise

```bash
curl -X DELETE https://freightrekapi.vercel.app/admin/agency/67xyz789abc123456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 👨‍💼 Staff Management

### Step 6: Create Staff

```bash
curl -X POST https://freightrekapi.vercel.app/admin/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "roleId": "67def456abc789012",
    "franchiseId": "67xyz789abc123456",
    "username": "johndoe",
    "password": "John@123",
    "status": "Active"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Staff created successfully",
  "data": {
    "_id": "67staff123abc456",
    "name": "John Doe",
    "email": "john@example.com",
    "roleId": {...},
    "franchiseId": {...}
  }
}
```

---

### Step 7: Staff Login (No Token Required)

```bash
curl -X POST https://freightrekapi.vercel.app/admin/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "John@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "67staff123abc456",
    "name": "John Doe",
    "roleId": {...},
    "franchiseId": {...}
  }
}
```

---

### Get All Staff

```bash
curl -X GET "https://freightrekapi.vercel.app/admin/staff?page=1&limit=10&search=John&status=Active&franchiseId=67xyz789abc123456&roleId=67def456abc789012" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `search` - Search by name/email/phone/username
- `status` - Filter by Active/Inactive
- `franchiseId` - Filter by franchise
- `roleId` - Filter by role

---

### Get Staff by ID

```bash
curl -X GET https://freightrekapi.vercel.app/admin/staff/67staff123abc456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update Staff

```bash
curl -X PUT https://freightrekapi.vercel.app/admin/staff/67staff123abc456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Smith",
    "phone": "9123456789",
    "roleId": "67newrole456abc"
  }'
```

---

### Update Staff Status

```bash
curl -X PATCH https://freightrekapi.vercel.app/admin/staff/67staff123abc456/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "Inactive"
  }'
```

---

### Delete Staff

```bash
curl -X DELETE https://freightrekapi.vercel.app/admin/staff/67staff123abc456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📍 Hub Management

### Step 8: Create Hub

```bash
curl -X POST https://freightrekapi.vercel.app/admin/hub \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "hubName": "Chennai Central Hub",
    "location": "Chennai",
    "address": "456, Park Road, T Nagar",
    "contactNumber": "9876543210",
    "status": "Active"
  }'
```

---

### Get All Hubs

```bash
curl -X GET "https://freightrekapi.vercel.app/admin/hub?page=1&limit=10&search=Chennai&status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get Hub by ID

```bash
curl -X GET https://freightrekapi.vercel.app/admin/hub/67hub123abc456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update Hub

```bash
curl -X PUT https://freightrekapi.vercel.app/admin/hub/67hub123abc456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "hubName": "Chennai Main Hub",
    "contactNumber": "9123456789"
  }'
```

---

### Delete Hub

```bash
curl -X DELETE https://freightrekapi.vercel.app/admin/hub/67hub123abc456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔄 Complete Testing Flow

### Flow 1: Admin Setup
```bash
# 1. Register Admin
curl -X POST https://freightrekapi.vercel.app/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","phoneNo":"9876543210","password":"Admin@123","roleId":"65abc123def456789"}'

# 2. Login Admin (Save the token)
curl -X POST https://freightrekapi.vercel.app/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123"}'
```

---

### Flow 2: Create Role → Franchise → Staff

```bash
# 1. Create Role
curl -X POST https://freightrekapi.vercel.app/admin/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Manager","permissions":{"access_management":{"read":true,"write":true,"delete":false}}}'

# 2. Create Franchise (Save franchise ID)
curl -X POST https://freightrekapi.vercel.app/admin/agency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"agencyName":"Test Agency","agencyOwner":"Owner Name","phone":"9876543210","city":"Chennai","state":"Tamil Nadu","pincode":"600001","username":"test@agency.com","password":"Test@123"}'

# 3. Create Staff (Use role ID and franchise ID from above)
curl -X POST https://freightrekapi.vercel.app/admin/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Staff Name","email":"staff@test.com","phone":"9876543210","roleId":"ROLE_ID","franchiseId":"FRANCHISE_ID","username":"staffuser","password":"Staff@123"}'
```

---

### Flow 3: Test Login Endpoints

```bash
# 1. Franchise Login (No token needed)
curl -X POST https://freightrekapi.vercel.app/admin/agency/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@agency.com","password":"Test@123"}'

# 2. Staff Login (No token needed)
curl -X POST https://freightrekapi.vercel.app/admin/staff/login \
  -H "Content-Type: application/json" \
  -d '{"username":"staffuser","password":"Staff@123"}'
```

---

## 📝 Testing Tips

### 1. Save Token
After login, save the JWT token:
```bash
# Linux/Mac
TOKEN=$(curl -X POST https://freightrekapi.vercel.app/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123"}' | jq -r '.token')

# Then use: -H "Authorization: Bearer $TOKEN"
```

### 2. Pretty Print JSON
Add `| jq` to format response:
```bash
curl ... | jq
```

### 3. Save Response to File
```bash
curl ... > response.json
```

### 4. Check Status Code
```bash
curl -w "\nHTTP Status: %{http_code}\n" ...
```

---

## ⚠️ Common Errors

### 401 Unauthorized
```json
{"success": false, "message": "No token provided"}
```
**Fix:** Add Authorization header with valid JWT token

### 400 Bad Request
```json
{"success": false, "message": "Validation error"}
```
**Fix:** Check required fields and data format

### 409 Conflict
```json
{"success": false, "message": "Email already exists"}
```
**Fix:** Use different email/username

---

## 🔍 Swagger Documentation

Interactive API documentation available at:
```
https://freightrekapi.vercel.app/api-docs
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

## 🎯 Quick Reference

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/admin/auth/register` | POST | No | Register admin |
| `/admin/auth/login` | POST | No | Admin login |
| `/admin/agency/login` | POST | No | Franchise login |
| `/admin/staff/login` | POST | No | Staff login |
| `/admin/role` | POST | Yes | Create role |
| `/admin/agency` | POST | Yes | Create franchise |
| `/admin/staff` | POST | Yes | Create staff |
| `/admin/hub` | POST | Yes | Create hub |

---

## 📞 Support

For issues or questions:
- Email: support@freightrek.com
- API Docs: https://freightrekapi.vercel.app/api-docs

---

**Last Updated:** January 8, 2026
**API Version:** 1.0.0
**Base URL:** https://freightrekapi.vercel.app
