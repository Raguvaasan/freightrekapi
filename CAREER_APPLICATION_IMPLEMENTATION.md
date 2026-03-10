# Career Applications API - Implementation Summary

## Overview
Complete Career Applications API implementation with the following fields:
- **Name** - Applicant's full name
- **Phone** - Contact phone number
- **Email** - Contact email address
- **Covering Message** - Motivation/cover letter
- **Attach Resume** - Resume file path

## Features Implemented

✅ **Create** - POST `/api/applications`
✅ **Read/List** - GET `/api/applications` (with filters & pagination)
✅ **Read by ID** - GET `/api/applications/:id`
✅ **Update** - PUT `/api/applications/:id` (admin only)
✅ **Delete** - DELETE `/api/applications/:id` (admin only)
✅ **List by Job Posting** - GET `/api/applications/job-posting/:jobPostingId`

## Files Created

### 1. Model
📄 `src/models/careers/careerApplication.model.ts`
- ICareerApplication interface
- MongoDB schema with proper indexes
- Fields: jobPostingId, name, phone, email, coveringMessage, resumePath, status
- Status enum: pending, reviewed, rejected, accepted

### 2. Service Layer
📄 `src/services/careerApplication.service.ts`
- getAllApplications() - with filters & pagination
- getApplicationById() - fetch single application
- createApplication() - submit new application with duplicate check
- updateApplication() - update application details/status
- deleteApplication() - remove application
- getApplicationsByJobPosting() - list applications for a job

### 3. Controller
📄 `src/controllers/careerApplication.controller.ts`
- Request handlers for all CRUD operations
- Input validation & error handling
- Admin-only authorization checks
- Consistent response format

### 4. Validator
📄 `src/validators/careerApplication.validator.ts`
- createCareerApplicationSchema - Yup validation
- updateCareerApplicationSchema - Partial validation
- Field validation rules:
  - name: 2-100 chars
  - phone: 10-15 chars, format validation
  - email: valid email format
  - coveringMessage: 10-2000 chars
  - resumePath: required string
  - status: enum validation

### 5. Routes
📄 `src/routes/careerApplication.routes.ts`
- Public endpoints (no auth):
  - GET /api/applications
  - GET /api/applications/:id
  - POST /api/applications
  - GET /api/applications/job-posting/:jobPostingId
- Admin endpoints (auth required):
  - PUT /api/applications/:id
  - DELETE /api/applications/:id

### 6. App Configuration
📝 Updated `src/app.ts`
- Added import for careerApplicationRoutes
- Registered route at `/api/applications`

### 7. Documentation
📄 `CAREER_APPLICATION_API.md`
- Complete API documentation
- All endpoints with examples
- cURL commands
- PowerShell testing script
- Error responses
- Data model & schema
- Business rules

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/applications | No | List all applications |
| GET | /api/applications/:id | No | Get application by ID |
| POST | /api/applications | No | Submit application |
| GET | /api/applications/job-posting/:jobPostingId | No | List by job |
| PUT | /api/applications/:id | Yes | Update application |
| DELETE | /api/applications/:id | Yes | Delete application |

## Quick Start Example

### Submit Application
```bash
curl -X POST "http://localhost:3000/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "507f1f77bcf86cd799439010",
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john@example.com",
    "coveringMessage": "I am interested in this position because...",
    "resumePath": "uploads/resumes/john_resume.pdf"
  }'
```

## Key Features

✨ **Validation**
- Comprehensive Yup schema validation
- Email format validation
- Phone number format validation
- Duplicate application prevention

✨ **Filtering & Pagination**
- Filter by jobPostingId
- Filter by status (pending/reviewed/rejected/accepted)
- Filter by email
- Pagination support (page, limit)

✨ **Authorization**
- Public: submit & view applications
- Admin-only: update status & delete

✨ **Data Relationships**
- Applications linked to JobPosting via jobPostingId
- Automatic population of job posting details

✨ **Database Indexes**
- jobPostingId (for fast lookups)
- email (for duplicate prevention)
- status (for filtering)
- createdAt (for sorting)

## Running the Server

```bash
# Development
npm run dev

# Build & Run
npm run build
npm start
```

The API will be available at:
- Development: `http://localhost:3000`
- Production: `https://freightrekapi.vercel.app`

## Testing

Use the PowerShell script in `CAREER_APPLICATION_API.md` for comprehensive testing of all endpoints.

Or simply test with curl:
```bash
# List applications
curl http://localhost:3000/api/applications

# Submit application
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"jobPostingId":"...","name":"...","phone":"...","email":"...","coveringMessage":"...","resumePath":"..."}'
```

## Schema Integration

The Career Application model is integrated with:
- **JobPosting Model** - Referenced via jobPostingId
- **MongoDB** - Using Mongoose ODM
- **TypeScript** - Full type safety

## Status Transition

Applications can have the following status values:
- `pending` - Initial status when submitted
- `reviewed` - Admin has reviewed the application
- `rejected` - Application rejected
- `accepted` - Application accepted

Admins can update status via PUT endpoint.

## Next Steps (Optional Enhancements)

1. Add file upload handler for resume attachment
2. Add email notifications for application status updates
3. Add bulk operations (export to CSV)
4. Add applicant dashboard/portal
5. Add application timeline/history tracking
6. Add skill matching with job requirements
