# Career Applications API - Complete Guide

**Base URL:** `https://freightrekapi.vercel.app` or `http://localhost:3000` (Development)

---

## API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | List all applications with filters |
| GET | `/api/applications/:id` | Get application by ID |
| POST | `/api/applications` | Submit new application |
| GET | `/api/applications/job-posting/:jobPostingId` | Get applications for a job posting |

### Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/applications/:id` | Update application (status, details) |
| DELETE | `/api/applications/:id` | Delete application |

---

## Detailed Endpoints

### 1. List All Applications

```bash
GET /api/applications
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Items per page
- `jobPostingId` (optional) - Filter by job posting ID
- `status` (optional) - Filter by status (pending, reviewed, rejected, accepted)
- `email` (optional) - Filter by email (partial match)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/applications?page=1&limit=10&status=pending" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "jobPostingId": {
          "_id": "507f1f77bcf86cd799439010",
          "title": "Delivery Executive"
        },
        "name": "John Doe",
        "phone": "+91-9876543210",
        "email": "john.doe@example.com",
        "coveringMessage": "I am interested in this position because...",
        "resumePath": "uploads/resumes/john_doe_resume.pdf",
        "status": "pending",
        "createdAt": "2026-03-10T10:30:00Z",
        "updatedAt": "2026-03-10T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

---

### 2. Get Application by ID

```bash
GET /api/applications/:id
```

**Path Parameters:**
- `id` - Application ID (MongoDB ObjectId)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "jobPostingId": {
      "_id": "507f1f77bcf86cd799439010",
      "title": "Delivery Executive"
    },
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john.doe@example.com",
    "coveringMessage": "I am interested in this position because I have 2 years of experience in logistics and delivery management.",
    "resumePath": "uploads/resumes/john_doe_resume.pdf",
    "status": "pending",
    "createdAt": "2026-03-10T10:30:00Z",
    "updatedAt": "2026-03-10T10:30:00Z"
  }
}
```

---

### 3. Submit New Application

```bash
POST /api/applications
```

**Request Body:**
```json
{
  "jobPostingId": "507f1f77bcf86cd799439010",
  "name": "John Doe",
  "phone": "+91-9876543210",
  "email": "john.doe@example.com",
  "coveringMessage": "I am interested in this position because I have 2 years of experience in logistics and delivery management. I am confident that I can contribute to your team effectively.",
  "resumePath": "uploads/resumes/john_doe_resume.pdf"
}
```

**Field Validation:**
- `jobPostingId` - Required, valid MongoDB ObjectId
- `name` - Required, 2-100 characters
- `phone` - Required, 10-15 digits/characters with optional +, -, space, (), format
- `email` - Required, valid email format
- `coveringMessage` - Required, 10-2000 characters
- `resumePath` - Required, file path as string

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "507f1f77bcf86cd799439010",
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john.doe@example.com",
    "coveringMessage": "I am interested in this position because I have 2 years of experience in logistics and delivery management.",
    "resumePath": "uploads/resumes/john_doe_resume.pdf"
  }'
```

**Example Response (Success - 201 Created):**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "jobPostingId": {
      "_id": "507f1f77bcf86cd799439010",
      "title": "Delivery Executive"
    },
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john.doe@example.com",
    "coveringMessage": "I am interested in this position because...",
    "resumePath": "uploads/resumes/john_doe_resume.pdf",
    "status": "pending",
    "createdAt": "2026-03-10T10:30:00Z",
    "updatedAt": "2026-03-10T10:30:00Z"
  }
}
```

**Example Response (Duplicate Application):**
```json
{
  "success": false,
  "message": "You have already applied for this position"
}
```

**Example Response (Validation Error):**
```json
{
  "success": false,
  "message": "Validation error: Email is required"
}
```

---

### 4. Get Applications by Job Posting

```bash
GET /api/applications/job-posting/:jobPostingId
```

**Path Parameters:**
- `jobPostingId` - Job posting ID (MongoDB ObjectId)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/applications/job-posting/507f1f77bcf86cd799439010" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "jobPostingId": {
        "_id": "507f1f77bcf86cd799439010",
        "title": "Delivery Executive"
      },
      "name": "John Doe",
      "phone": "+91-9876543210",
      "email": "john.doe@example.com",
      "coveringMessage": "I am interested in this position...",
      "resumePath": "uploads/resumes/john_doe_resume.pdf",
      "status": "pending",
      "createdAt": "2026-03-10T10:30:00Z",
      "updatedAt": "2026-03-10T10:30:00Z"
    }
  ]
}
```

---

### 5. Update Application (Admin Only)

```bash
PUT /api/applications/:id
Authorization: Bearer <admin_jwt_token>
```

**Path Parameters:**
- `id` - Application ID (MongoDB ObjectId)

**Request Body (All fields optional):**
```json
{
  "name": "John Doe",
  "phone": "+91-9876543210",
  "email": "john.doe@example.com",
  "coveringMessage": "Updated message...",
  "status": "reviewed"
}
```

**Valid Status Values:**
- `pending` - Initial status
- `reviewed` - Application reviewed
- `rejected` - Application rejected
- `accepted` - Application accepted

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token_here" \
  -d '{
    "status": "reviewed"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Application updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "jobPostingId": {
      "_id": "507f1f77bcf86cd799439010",
      "title": "Delivery Executive"
    },
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john.doe@example.com",
    "coveringMessage": "I am interested in this position...",
    "resumePath": "uploads/resumes/john_doe_resume.pdf",
    "status": "reviewed",
    "createdAt": "2026-03-10T10:30:00Z",
    "updatedAt": "2026-03-10T10:35:00Z"
  }
}
```

---

### 6. Delete Application (Admin Only)

```bash
DELETE /api/applications/:id
Authorization: Bearer <admin_jwt_token>
```

**Path Parameters:**
- `id` - Application ID (MongoDB ObjectId)

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token_here"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Application deleted successfully"
}
```

---

## PowerShell Testing Script

```powershell
# Set base URL
$baseUrl = "http://localhost:3000"

# Headers for requests
$headers = @{
    "Content-Type" = "application/json"
}

# Admin headers (if needed for updates/deletes)
$adminHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer your_jwt_token_here"
}

# 1. List all applications
Write-Host "1. Fetching all applications..." -ForegroundColor Cyan
$listResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications" -Method GET -Headers $headers
Write-Host "Results:" -ForegroundColor Green
$listResponse | ConvertTo-Json | Write-Host

# 2. Submit a new application
Write-Host "`n2. Submitting new application..." -ForegroundColor Cyan
$applicationBody = @{
    jobPostingId = "507f1f77bcf86cd799439010"
    name = "John Doe"
    phone = "+91-9876543210"
    email = "john.doe@example.com"
    coveringMessage = "I am interested in this position because I have 2 years of experience in logistics and delivery management. I am confident that I can contribute to your team effectively."
    resumePath = "uploads/resumes/john_doe_resume.pdf"
} | ConvertTo-Json

$createResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications" -Method POST -Headers $headers -Body $applicationBody
$applicationId = $createResponse.data._id
Write-Host "Created Application ID: $applicationId" -ForegroundColor Green

# 3. Get application by ID
Write-Host "`n3. Fetching application by ID..." -ForegroundColor Cyan
$getResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications/$applicationId" -Method GET -Headers $headers
Write-Host "Retrieved Application:" -ForegroundColor Green
$getResponse | ConvertTo-Json | Write-Host

# 4. Get applications by job posting
Write-Host "`n4. Fetching applications for a job posting..." -ForegroundColor Cyan
$jobPostingResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications/job-posting/507f1f77bcf86cd799439010" -Method GET -Headers $headers
Write-Host "Job Posting Applications:" -ForegroundColor Green
$jobPostingResponse | ConvertTo-Json | Write-Host

# 5. Update application (requires admin token)
Write-Host "`n5. Updating application status..." -ForegroundColor Cyan
$updateBody = @{
    status = "reviewed"
} | ConvertTo-Json

$updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications/$applicationId" -Method PUT -Headers $adminHeaders -Body $updateBody
Write-Host "Updated Application:" -ForegroundColor Green
$updateResponse | ConvertTo-Json | Write-Host

# 6. List applications with filters
Write-Host "`n6. Fetching applications with filters..." -ForegroundColor Cyan
$filteredResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications?status=pending&limit=5" -Method GET -Headers $headers
Write-Host "Filtered Results:" -ForegroundColor Green
$filteredResponse | ConvertTo-Json | Write-Host

# 7. Delete application (requires admin token)
Write-Host "`n7. Deleting application..." -ForegroundColor Cyan
$deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications/$applicationId" -Method DELETE -Headers $adminHeaders
Write-Host "Delete Response:" -ForegroundColor Green
$deleteResponse | ConvertTo-Json | Write-Host

Write-Host "`nAll tests completed!" -ForegroundColor Yellow
```

---

## Data Model

### CareerApplication Schema

```json
{
  "_id": "ObjectId",
  "jobPostingId": "ObjectId (reference to JobPosting)",
  "name": "String (2-100 chars)",
  "phone": "String (10-15 chars, format: +91-9876543210)",
  "email": "String (valid email format)",
  "coveringMessage": "String (10-2000 chars)",
  "resumePath": "String (file path)",
  "status": "String (enum: pending, reviewed, rejected, accepted)",
  "createdAt": "Date (auto-generated)",
  "updatedAt": "Date (auto-generated)"
}
```

### Indexes
- `jobPostingId` - Fast filtering by job posting
- `email` - Unique constraint per job posting (prevents duplicate applications)
- `status` - Fast filtering by application status
- `createdAt` - Descending for recent applications

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message or business logic error"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required or token invalid"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Only admin can update application status"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Application not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error message"
}
```

---

## Business Rules

1. **Duplicate Applications**: A user cannot apply twice for the same job posting (checked by email + jobPostingId combination)
2. **Status Updates**: Only admin can update application status
3. **Resume Files**: The `resumePath` should contain the path to the uploaded resume file
4. **Phone Format**: Should accept various formats (10 digits, +91-XXXXXXXXXX, (XXX) XXX-XXXX, etc.)
5. **Email Validation**: Standard email validation is performed
6. **Pagination**: Default page=1, limit=10

---

## Implementation Notes

- All timestamps are in UTC/ISO 8601 format
- MongoDB ObjectIds are strings in API responses
- Soft delete is not implemented for applications (hard delete)
- Applications are linked to job postings via `jobPostingId` reference
- All email addresses are automatically converted to lowercase for consistency
