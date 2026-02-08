# 🏢 Franchise Role Management API - cURL Commands

## 🌐 URLs

**Local:** `http://localhost:3000`  
**Production:** `https://freightrekapi.vercel.app`

---

## 📋 Overview

Franchise users can create and manage their own roles and permissions system. Each franchise has separate roles isolated from other franchises and admin roles.

---

## 🔐 Authentication

All endpoints require franchise user authentication. First, login as a franchise:

```bash
# Franchise Login
curl --location 'https://freightrekapi.vercel.app/api/admin/agency/login' \
--header 'Content-Type: application/json' \
--data '{
    "username": "franchise_username",
    "password": "franchise_password"
}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "agencyName": "Express Delivery",
    "_id": "67a8f5b3c9d1e2f3a4b5c6d7"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the `token` and use it in the Authorization header for all requests below.**

---

## 📝 API Endpoints

### 1️⃣ Create Franchise Role

```bash
curl --location 'https://freightrekapi.vercel.app/admin/franchise/role' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_FRANCHISE_TOKEN' \
--data '{
    "roleName": "Franchise Manager",
    "permissions": [
        {
            "module": "shipments",
            "read": true,
            "write": true,
            "update": true,
            "delete": false
        },
        {
            "module": "wallet",
            "read": true,
            "write": false,
            "update": false,
            "delete": false
        },
        {
            "module": "staff",
            "read": true,
            "write": true,
            "update": true,
            "delete": true
        }
    ],
    "status": true
}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roleName": "Franchise Manager",
    "franchiseId": "67a8f5b3c9d1e2f3a4b5c6d7",
    "permissions": [
      {
        "module": "shipments",
        "read": true,
        "write": true,
        "update": true,
        "delete": false
      },
      {
        "module": "wallet",
        "read": true,
        "write": false,
        "update": false,
        "delete": false
      }
    ],
    "status": true,
    "_id": "67b9f6c4d0e2f3a4b5c6d8e9",
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  }
}
```

---

### 2️⃣ Get All Franchise Roles

```bash
curl --location 'https://freightrekapi.vercel.app/admin/franchise/role' \
--header 'Authorization: Bearer YOUR_FRANCHISE_TOKEN'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b9f6c4d0e2f3a4b5c6d8e9",
      "roleName": "Franchise Manager",
      "franchiseId": "67a8f5b3c9d1e2f3a4b5c6d7",
      "permissions": [...],
      "status": true,
      "createdAt": "2026-02-08T12:00:00.000Z",
      "updatedAt": "2026-02-08T12:00:00.000Z"
    }
  ]
}
```

---

### 3️⃣ Get Franchise Role by ID

```bash
curl --location 'https://freightrekapi.vercel.app/admin/franchise/role/67b9f6c4d0e2f3a4b5c6d8e9' \
--header 'Authorization: Bearer YOUR_FRANCHISE_TOKEN'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67b9f6c4d0e2f3a4b5c6d8e9",
    "roleName": "Franchise Manager",
    "franchiseId": "67a8f5b3c9d1e2f3a4b5c6d7",
    "permissions": [
      {
        "module": "shipments",
        "read": true,
        "write": true,
        "update": true,
        "delete": false
      }
    ],
    "status": true,
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  }
}
```

---

### 4️⃣ Update Franchise Role

```bash
curl --location --request PUT 'https://freightrekapi.vercel.app/admin/franchise/role/67b9f6c4d0e2f3a4b5c6d8e9' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_FRANCHISE_TOKEN' \
--data '{
    "roleName": "Senior Franchise Manager",
    "permissions": [
        {
            "module": "shipments",
            "read": true,
            "write": true,
            "update": true,
            "delete": true
        },
        {
            "module": "wallet",
            "read": true,
            "write": true,
            "update": false,
            "delete": false
        }
    ],
    "status": true
}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67b9f6c4d0e2f3a4b5c6d8e9",
    "roleName": "Senior Franchise Manager",
    "franchiseId": "67a8f5b3c9d1e2f3a4b5c6d7",
    "permissions": [...],
    "status": true,
    "updatedAt": "2026-02-08T13:30:00.000Z"
  }
}
```

---

### 5️⃣ Delete Franchise Role

```bash
curl --location --request DELETE 'https://freightrekapi.vercel.app/admin/franchise/role/67b9f6c4d0e2f3a4b5c6d8e9' \
--header 'Authorization: Bearer YOUR_FRANCHISE_TOKEN'
```

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

---

## 🔒 Security Features

✅ **Franchise Isolation**: Each franchise can only access their own roles  
✅ **Authentication Required**: All endpoints require valid franchise JWT token  
✅ **Unique Role Names**: Role names must be unique within each franchise  
✅ **Validation**: Input validation using Yup schemas  

---

## 📊 Common Module Names

Suggested module names for permissions:
- `shipments` - Shipment management
- `wallet` - Wallet and transactions
- `staff` - Staff management
- `customers` - Customer management
- `reports` - Reports and analytics
- `settings` - Franchise settings

---

## ❌ Error Responses

### Role Not Found (404)
```json
{
  "success": false,
  "message": "Role not found"
}
```

### Duplicate Role Name (400)
```json
{
  "success": false,
  "message": "Role name already exists for this franchise"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "message": "Role name must be at least 2 characters"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Franchise not authenticated"
}
```

---

## 🧪 Testing Flow

1. **Login as Franchise** → Get Token
2. **Create Role** → Get Role ID
3. **List All Roles** → Verify creation
4. **Get Role by ID** → Check details
5. **Update Role** → Modify permissions
6. **Delete Role** → Clean up

---

## 📝 Notes

- Franchise roles are separate from admin roles
- Each franchise has their own isolated role system
- Role names must be unique within the same franchise
- Multiple franchises can have roles with the same name
- At least one permission module is required when creating a role
- Duplicate module names in permissions array are not allowed
