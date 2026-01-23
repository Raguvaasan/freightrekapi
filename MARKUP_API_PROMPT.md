# Create 2 Markup Management APIs for HeyDeliver

## Overview
Build RESTful APIs to manage markup settings for Rate Calculator and Rate Card features. Currently stored in frontend localStorage, need to move to backend database.

---

## Database Schema

Create `markups` table:

```sql
CREATE TABLE markups (
    id VARCHAR(36) PRIMARY KEY,
    markup_category ENUM('rate_calculator', 'rate_card') NOT NULL,
    markup_type ENUM('percentage', 'fixed') NOT NULL,
    markup_value DECIMAL(10,2) NOT NULL,
    user_id VARCHAR(36) NULL,
    franchise_id VARCHAR(36) NULL,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (franchise_id) REFERENCES franchises(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    UNIQUE KEY unique_active_markup (markup_category, user_id, franchise_id, is_active)
);
```

---

## API 1: Rate Calculator Markup

### GET /api/v1/settings/rate-calculator-markup
- **Auth:** Bearer Token
- **Query Params:** 
  - `user_id` (optional)
  - `franchise_id` (optional)
- **Returns:** markup config or 404

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "markup_category": "rate_calculator",
    "markup_type": "percentage",
    "markup_value": 10.5,
    "user_id": null,
    "franchise_id": null,
    "is_active": true,
    "created_at": "2026-01-23T15:45:00Z",
    "updated_at": "2026-01-23T15:45:00Z"
  },
  "message": "Rate calculator markup retrieved successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "data": null,
  "message": "No markup configuration found"
}
```

---

### POST /api/v1/settings/rate-calculator-markup
- **Auth:** Bearer Token
- **Permission:** `manage_markup_settings`
- **Request Body:**
```json
{
  "markup_type": "percentage",
  "markup_value": 10.5,
  "user_id": null,
  "franchise_id": null
}
```

**Validation Rules:**
- `markup_type`: required, must be 'percentage' or 'fixed'
- `markup_value`: required, must be >= 0
- If `markup_type` is 'percentage': value must be 0-100
- If `markup_type` is 'fixed': value must be >= 0

**Response (200 OK - Updated):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "markup_category": "rate_calculator",
    "markup_type": "percentage",
    "markup_value": 10.5,
    "user_id": null,
    "franchise_id": null,
    "is_active": true,
    "updated_at": "2026-01-23T15:45:00Z"
  },
  "message": "Rate calculator markup updated successfully"
}
```

**Response (201 Created - New):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "markup_category": "rate_calculator",
    "markup_type": "fixed",
    "markup_value": 5.0,
    "user_id": null,
    "franchise_id": null,
    "is_active": true,
    "created_at": "2026-01-23T15:45:00Z"
  },
  "message": "Rate calculator markup created successfully"
}
```

---

## API 2: Rate Card Markup

### GET /api/v1/settings/rate-card-markup
- **Auth:** Bearer Token
- **Query Params:** 
  - `user_id` (optional)
  - `franchise_id` (optional)
- **Returns:** markup config or 404

**Response Format:** Same as Rate Calculator GET

---

### POST /api/v1/settings/rate-card-markup
- **Auth:** Bearer Token
- **Permission:** `manage_markup_settings`
- **Request Body:**
```json
{
  "markup_type": "fixed",
  "markup_value": 5.0,
  "user_id": null,
  "franchise_id": null
}
```

**Validation Rules:** Same as Rate Calculator POST

**Response Format:** Same as Rate Calculator POST (with `markup_category: "rate_card"`)

---

## Business Rules

1. **Priority Hierarchy:**
   - User-specific markup > Franchise-specific markup > Global markup (null user/franchise)
   - Return highest priority active markup found

2. **Upsert Logic:**
   - Check if active record exists for same category/user/franchise
   - If exists: Update the existing record
   - If not exists: Create new record

3. **Deactivation:**
   - When creating/updating, set `is_active=false` for all old records with same category/user/franchise
   - Keep only one active record per combination

4. **Audit Trail:**
   - Extract user ID from JWT token
   - Store in `created_by` for new records
   - Store in `updated_by` for updates
   - Auto-update timestamps

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "data": null,
  "message": "Validation error: markup_value must be between 0 and 100 for percentage type"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "data": null,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "data": null,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "data": null,
  "message": "No markup configuration found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "data": null,
  "message": "Internal server error"
}
```

---

## Implementation Checklist

### Database
- [ ] Create migration file for `markups` table
- [ ] Add indexes on (`markup_category`, `user_id`, `franchise_id`, `is_active`)
- [ ] Run migration

### Backend Code
- [ ] Create Markup model/entity
- [ ] Create MarkupController with GET and POST methods
- [ ] Implement priority logic (user > franchise > global)
- [ ] Implement upsert logic
- [ ] Add JWT authentication middleware
- [ ] Add permission check middleware (`manage_markup_settings`)
- [ ] Add request validation
- [ ] Add error handling with proper status codes
- [ ] Add logging for all markup changes

### Testing
- [ ] Test GET with no data (404 response)
- [ ] Test GET with global markup
- [ ] Test GET with user-specific markup
- [ ] Test GET with franchise-specific markup
- [ ] Test priority hierarchy
- [ ] Test POST create new markup
- [ ] Test POST update existing markup
- [ ] Test POST with invalid data (400 errors)
- [ ] Test POST without authentication (401 error)
- [ ] Test POST without permission (403 error)
- [ ] Test concurrent updates

### Documentation
- [ ] Add API documentation to Postman/Swagger
- [ ] Document authentication requirements
- [ ] Document permission requirements
- [ ] Add example requests and responses

---

## Frontend Integration Notes

**Current Frontend Storage:**
- Rate Calculator: `localStorage.getItem('rateMarkup')` and `localStorage.getItem('rateMarkupType')`
- Rate Card: `localStorage.getItem('rateCardMarkup')` and `localStorage.getItem('rateCardMarkupType')`

**After API Implementation:**
1. Create Zustand store for markup management
2. Fetch markup on app load/login
3. Cache in store for performance
4. Call POST API when user saves markup settings
5. Remove localStorage usage

**Example Frontend Integration:**
```typescript
// Fetch markup on page load
const fetchRateCalculatorMarkup = async () => {
  const response = await axios.get('/api/v1/settings/rate-calculator-markup', {
    headers: { Authorization: `Bearer ${token}` }
  })
  // Store in Zustand
}

// Save markup
const saveRateCalculatorMarkup = async (type: string, value: number) => {
  await axios.post('/api/v1/settings/rate-calculator-markup', {
    markup_type: type,
    markup_value: value
  }, {
    headers: { Authorization: `Bearer ${token}` }
  })
}
```

---

## Example Use Cases

### Use Case 1: Global Markup for All Users
```json
POST /api/v1/settings/rate-calculator-markup
{
  "markup_type": "percentage",
  "markup_value": 10,
  "user_id": null,
  "franchise_id": null
}
```
Result: All users get 10% markup unless they have user/franchise-specific settings.

---

### Use Case 2: Franchise-Specific Markup
```json
POST /api/v1/settings/rate-card-markup
{
  "markup_type": "fixed",
  "markup_value": 15,
  "user_id": null,
  "franchise_id": "franchise-123"
}
```
Result: All users in franchise-123 get ₹15 fixed markup.

---

### Use Case 3: User-Specific Markup (Highest Priority)
```json
POST /api/v1/settings/rate-calculator-markup
{
  "markup_type": "percentage",
  "markup_value": 5,
  "user_id": "user-456",
  "franchise_id": null
}
```
Result: user-456 gets 5% markup, overriding global/franchise settings.

---

## Technical Notes

- Use transactions for upsert operations to prevent race conditions
- Add database indexes for performance
- Log all markup changes with user info and timestamp
- Consider caching frequently accessed markups (Redis)
- Validate JWT token and extract user ID securely
- Use prepared statements to prevent SQL injection
- Return consistent JSON response format

---

**Copy this entire document and share it with your backend developer/AI to implement these APIs.**
