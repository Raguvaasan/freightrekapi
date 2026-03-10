# Career Application API - Quick cURL Commands

## Base URL
```
Development: http://localhost:3000
Production: https://freightrekapi.vercel.app
```

---

## 1️⃣ Submit an Application (No Auth Required)

```bash
curl -X POST "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "507f1f77bcf86cd799439010",
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john.doe@example.com",
    "coveringMessage": "I am interested in this position because I have 2 years of experience in logistics and delivery management. I am confident that I can contribute to your team effectively and meet the highest standards of customer service.",
    "resumePath": "uploads/resumes/john_doe_resume.pdf"
  }'
```

**Expected Response (201 Created):**
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
    "coveringMessage": "I am interested in this position...",
    "resumePath": "uploads/resumes/john_doe_resume.pdf",
    "status": "pending",
    "createdAt": "2026-03-10T10:30:00Z",
    "updatedAt": "2026-03-10T10:30:00Z"
  }
}
```

---

## 2️⃣ List All Applications (No Auth Required)

```bash
curl -X GET "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json"
```

**With Pagination:**
```bash
curl -X GET "http://localhost:3000/api/applications?page=1&limit=10" \
  -H "Content-Type: application/json"
```

**Filter by Status:**
```bash
curl -X GET "http://localhost:3000/api/applications?status=pending" \
  -H "Content-Type: application/json"
```

**Filter by Job Posting:**
```bash
curl -X GET "http://localhost:3000/api/applications?jobPostingId=507f1f77bcf86cd799439010" \
  -H "Content-Type: application/json"
```

**Filter by Email:**
```bash
curl -X GET "http://localhost:3000/api/applications?email=john.doe@example.com" \
  -H "Content-Type: application/json"
```

**Multiple Filters:**
```bash
curl -X GET "http://localhost:3000/api/applications?status=reviewed&jobPostingId=507f1f77bcf86cd799439010&limit=20" \
  -H "Content-Type: application/json"
```

---

## 3️⃣ Get Application by ID (No Auth Required)

```bash
curl -X GET "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json"
```

---

## 4️⃣ Get Applications for a Job Posting (No Auth Required)

```bash
curl -X GET "http://localhost:3000/api/applications/job-posting/507f1f77bcf86cd799439010" \
  -H "Content-Type: application/json"
```

---

## 5️⃣ Update Application - Change Status (Admin Auth Required)

```bash
curl -X PUT "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "status": "reviewed"
  }'
```

**Status Values:**
- `pending` - Default
- `reviewed` - Mark as reviewed
- `rejected` - Reject application
- `accepted` - Accept application

**Update Name & Phone:**
```bash
curl -X PUT "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "name": "John Abraham",
    "phone": "+91-9876543211"
  }'
```

**Update Entire Application:**
```bash
curl -X PUT "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "name": "John Abraham",
    "phone": "+91-9876543211",
    "email": "john.abraham@example.com",
    "coveringMessage": "Updated cover letter...",
    "status": "reviewed"
  }'
```

---

## 6️⃣ Delete Application (Admin Auth Required)

```bash
curl -X DELETE "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Application deleted successfully"
}
```

---

## Error Examples

### Validation Error - Missing Required Field
```bash
curl -X POST "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "507f1f77bcf86cd799439010",
    "name": "John Doe"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Phone number is required"
}
```

### Duplicate Application
```bash
curl -X POST "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "507f1f77bcf86cd799439010",
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john.doe@example.com",
    "coveringMessage": "Same application again...",
    "resumePath": "uploads/resumes/john_doe_resume.pdf"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "You have already applied for this position"
}
```

### Invalid Email
```bash
curl -X POST "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "507f1f77bcf86cd799439010",
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "invalid-email",
    "coveringMessage": "I want to apply...",
    "resumePath": "uploads/resumes/john_doe_resume.pdf"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email address"
}
```

### Invalid Phone Format
```bash
curl -X POST "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "507f1f77bcf86cd799439010",
    "name": "John Doe",
    "phone": "123",
    "email": "john@example.com",
    "coveringMessage": "I want to apply...",
    "resumePath": "uploads/resumes/john_doe_resume.pdf"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Phone number must be at least 10 digits"
}
```

### Invalid Cover Message Length
```bash
curl -X POST "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "507f1f77bcf86cd799439010",
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john@example.com",
    "coveringMessage": "Short",
    "resumePath": "uploads/resumes/john_doe_resume.pdf"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Covering message must be at least 10 characters"
}
```

### Invalid ID Format
```bash
curl -X GET "http://localhost:3000/api/applications/invalid-id" \
  -H "Content-Type: application/json"
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Application not found"
}
```

### Unauthorized Update (Missing Auth Token)
```bash
curl -X PUT "http://localhost:3000/api/applications/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "reviewed"
  }'
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

---

## Postman Collection

You can also use Postman to test these endpoints. Here's a sample:

1. **POST** - Submit Application
   - URL: `{{baseUrl}}/api/applications`
   - Auth: None
   - Body: JSON (as shown above)

2. **GET** - List Applications
   - URL: `{{baseUrl}}/api/applications?page=1&limit=10`
   - Auth: None

3. **GET** - Get by ID
   - URL: `{{baseUrl}}/api/applications/{{applicationId}}`
   - Auth: None

4. **PUT** - Update Application
   - URL: `{{baseUrl}}/api/applications/{{applicationId}}`
   - Auth: Bearer Token
   - Body: JSON (with fields to update)

5. **DELETE** - Delete Application
   - URL: `{{baseUrl}}/api/applications/{{applicationId}}`
   - Auth: Bearer Token

Set Postman variables:
- `baseUrl` = http://localhost:3000
- `adminToken` = Your JWT admin token
- `applicationId` = The ObjectId of an application

---

## Testing All Endpoints in Sequence

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
ADMIN_TOKEN="your_jwt_token_here"
JOB_POSTING_ID="507f1f77bcf86cd799439010"

echo "1. Submitting Application..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/applications" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobPostingId\": \"$JOB_POSTING_ID\",
    \"name\": \"Test User\",
    \"phone\": \"+91-9876543210\",
    \"email\": \"test@example.com\",
    \"coveringMessage\": \"This is a test application with sufficient character length.\",
    \"resumePath\": \"uploads/test_resume.pdf\"
  }")
APP_ID=$(echo $RESPONSE | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Created Application ID: $APP_ID"

echo "2. Listing Applications..."
curl -s -X GET "$BASE_URL/api/applications?limit=5" \
  -H "Content-Type: application/json" | json_pp

echo "3. Getting Application by ID..."
curl -s -X GET "$BASE_URL/api/applications/$APP_ID" \
  -H "Content-Type: application/json" | json_pp

echo "4. Updating Application Status..."
curl -s -X PUT "$BASE_URL/api/applications/$APP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"reviewed"}' | json_pp

echo "5. Getting by Job Posting..."
curl -s -X GET "$BASE_URL/api/applications/job-posting/$JOB_POSTING_ID" \
  -H "Content-Type: application/json" | json_pp

echo "6. Deleting Application..."
curl -s -X DELETE "$BASE_URL/api/applications/$APP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | json_pp

echo "All tests completed!"
```

---

## Notes

- Replace `YOUR_ADMIN_JWT_TOKEN` with an actual admin JWT token
- Replace `507f1f77bcf86cd799439010` with an actual job posting ID
- Replace `507f1f77bcf86cd799439011` with an actual application ID
- All email addresses are automatically converted to lowercase
- Phone numbers are validated but stored in original format
- Use the appropriate base URL for your environment
