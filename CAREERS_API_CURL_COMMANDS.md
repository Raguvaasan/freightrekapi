# Careers API - Production Testing Guide

**Production URL:** `https://freightrekapi.vercel.app`

---

## API Endpoints

### Public Endpoints (No Auth Required)
- `GET /api/careers` - List all job postings
- `GET /api/careers/:id` - Get job posting by ID

### Admin Endpoints (Auth Required)
- `POST /api/careers` - Create job posting
- `PUT /api/careers/:id` - Update job posting
- `DELETE /api/careers/:id` - Delete job posting

---

## Curl Commands

### 1️⃣ List All Job Postings

```bash
curl -X GET "https://freightrekapi.vercel.app/api/careers" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Delivery Executive",
      "experience": "0-2 Years",
      "qualification": "10th / 12th Pass",
      "shortDesc": "Responsible for timely and safe parcel delivery to customers.",
      "description": [
        "Deliver packages to assigned locations within deadlines",
        "Collect payments (if required)",
        "Maintain delivery logs and reports"
      ],
      "skills": [
        "Valid Driving License",
        "Basic smartphone handling",
        "Good communication skills"
      ],
      "isActive": true,
      "createdAt": "2026-03-10T10:00:00.000Z",
      "updatedAt": "2026-03-10T10:00:00.000Z"
    }
  ]
}
```

---

### 2️⃣ Get Single Job Posting by ID

```bash
curl -X GET "https://freightrekapi.vercel.app/api/careers/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json"
```

---

### 3️⃣ Create Job Posting (Admin Only)

**Requires:** JWT Token in Authorization header

```bash
curl -X POST "https://freightrekapi.vercel.app/api/careers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Warehouse Manager",
    "experience": "3-5 Years",
    "qualification": "Graduation",
    "shortDesc": "Manage warehouse operations and inventory management.",
    "description": [
      "Oversee daily warehouse operations",
      "Manage inventory and stock levels",
      "Train and supervise warehouse staff",
      "Ensure quality and safety standards"
    ],
    "skills": [
      "Warehouse management experience",
      "Leadership skills",
      "Inventory management",
      "Problem-solving ability"
    ]
  }'
```

---

### 4️⃣ Update Job Posting (Admin Only)

**Requires:** JWT Token & Valid Job Posting ID

```bash
curl -X PUT "https://freightrekapi.vercel.app/api/careers/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Senior Delivery Executive",
    "experience": "2-4 Years",
    "qualification": "10th / 12th Pass",
    "shortDesc": "Senior role for experienced delivery personnel.",
    "skills": [
      "Valid Driving License",
      "Smartphone handling",
      "Leadership experience"
    ]
  }'
```

---

### 5️⃣ Delete Job Posting (Admin Only)

**Requires:** JWT Token & Valid Job Posting ID

```bash
curl -X DELETE "https://freightrekapi.vercel.app/api/careers/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Job posting deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": false,
    "updatedAt": "2026-03-10T10:30:00.000Z"
  }
}
```

---

## PowerShell Script for Testing

```powershell
# Configuration
$baseUrl = "https://freightrekapi.vercel.app"
$jwtToken = "YOUR_JWT_TOKEN_HERE"  # Get this from /admin/auth/login

# Headers with auth
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $jwtToken"
}

# 1. List all job postings
Write-Host "1. Getting all job postings..." -ForegroundColor Green
$response = Invoke-RestMethod -Uri "$baseUrl/api/careers" -Method GET
$response | ConvertTo-Json | Write-Host

# 2. Create job posting
Write-Host "`n2. Creating new job posting..." -ForegroundColor Green
$createBody = @{
    title = "Delivery Executive"
    experience = "0-2 Years"
    qualification = "10th / 12th Pass"
    shortDesc = "Responsible for timely and safe parcel delivery to customers."
    description = @(
        "Deliver packages to assigned locations within deadlines",
        "Collect payments (if required)",
        "Maintain delivery logs and reports"
    )
    skills = @(
        "Valid Driving License",
        "Basic smartphone handling",
        "Good communication skills"
    )
} | ConvertTo-Json

$createResponse = Invoke-RestMethod -Uri "$baseUrl/api/careers" -Method POST -Headers $headers -Body $createBody
$jobId = $createResponse.data._id
Write-Host "Created job posting with ID: $jobId"
$createResponse | ConvertTo-Json | Write-Host

# 3. Get single job posting
Write-Host "`n3. Getting job posting by ID..." -ForegroundColor Green
$getResponse = Invoke-RestMethod -Uri "$baseUrl/api/careers/$jobId" -Method GET
$getResponse | ConvertTo-Json | Write-Host

# 4. Update job posting
Write-Host "`n4. Updating job posting..." -ForegroundColor Green
$updateBody = @{
    title = "Senior Delivery Executive"
    experience = "2-4 Years"
} | ConvertTo-Json

$updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/careers/$jobId" -Method PUT -Headers $headers -Body $updateBody
$updateResponse | ConvertTo-Json | Write-Host

# 5. Delete job posting
Write-Host "`n5. Deleting job posting..." -ForegroundColor Green
$deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/careers/$jobId" -Method DELETE -Headers $headers
$deleteResponse | ConvertTo-Json | Write-Host
```

---

## How to Get JWT Token

First, login as admin to get JWT token:

```bash
curl -X POST "https://freightrekapi.vercel.app/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@freightrek.com",
    "password": "your_password"
  }'
```

Response will contain `token` field - use that in Authorization header for admin endpoints.
