# Admin Dashboard API - cURL Commands

## Base URL
```
Production: https://freightrekapi.vercel.app
Local: http://localhost:3000
```

## Authentication
All endpoints require Admin JWT token in header:
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

---

## 📊 1. Get Dashboard Statistics

Get aggregated dashboard statistics across all franchises

**Endpoint:** `GET /admin/dashboard`

**Query Parameters:**
- `period` (optional): `day` | `week` | `month` | `year` (default: `week`)

### cURL Commands

**Week Statistics:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard?period=week" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Day Statistics:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard?period=day" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Month Statistics:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard?period=month" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Year Statistics:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard?period=year" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "overview": {
      "activeShipments": {
        "total": 0,
        "inTransit": 0,
        "outForDelivery": 0
      },
      "totalShipments": {
        "count": 16,
        "currentPeriod": 16,
        "percentageChange": "0.0"
      },
      "revenue": {
        "total": 123.4,
        "percentageChange": "0.0",
        "currency": "₹"
      },
      "activeAgencies": 6
    },
    "revenueTrend": [
      {
        "date": "2026-02-08T00:00:00.000Z",
        "revenue": 80.27
      },
      {
        "date": "2026-02-09T00:00:00.000Z",
        "revenue": 43.13
      }
    ],
    "shipmentTypeDistribution": [
      {
        "type": "road_freight",
        "count": 16
      }
    ],
    "recentBookings": [
      {
        "_id": "6989f8013c67cb0900a2db63",
        "userId": "695fcf4ef80198a959bc0125",
        "status": "pending",
        "createdAt": "2026-02-09T15:06:41.282Z"
      }
    ],
    "period": "week"
  }
}
```

---

## 🏆 2. Get Top Performing Franchises

Get franchises ranked by revenue

**Endpoint:** `GET /admin/dashboard/top-franchises`

**Query Parameters:**
- `limit` (optional): Number of franchises to return (default: `5`)

### cURL Commands

**Top 5 Franchises:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard/top-franchises?limit=5" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Top 10 Franchises:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard/top-franchises?limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**All Top Franchises:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard/top-franchises?limit=100" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Response Example
```json
{
  "success": true,
  "data": [
    {
      "franchiseId": "507f191e810c19729de860ea",
      "franchiseName": "Chennai Logistics",
      "shipmentCount": 85,
      "totalRevenue": 425000
    },
    {
      "franchiseId": "507f191e810c19729de860eb",
      "franchiseName": "Mumbai Freight Services",
      "shipmentCount": 72,
      "totalRevenue": 360000
    },
    {
      "franchiseId": "507f191e810c19729de860ec",
      "franchiseName": "Delhi Express",
      "shipmentCount": 68,
      "totalRevenue": 340000
    }
  ]
}
```

---

## 💰 3. Get Wallet Statistics

Get wallet and transaction statistics across all franchises

**Endpoint:** `GET /admin/dashboard/wallet-statistics`

### cURL Command

```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard/wallet-statistics" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "totalBalance": 184.6,
    "totalWallets": 5,
    "credits": {
      "amount": 308,
      "count": 11
    },
    "debits": {
      "amount": 123.4,
      "count": 3
    }
  }
}
```

---

## 🔧 Quick Examples

### Using Variables

**Set your token:**
```bash
TOKEN="YOUR_ADMIN_JWT_TOKEN"
BASE_URL="https://freightrekapi.vercel.app"
```

**Get Dashboard:**
```bash
curl -X GET "$BASE_URL/admin/dashboard?period=week" \
  -H "Authorization: Bearer $TOKEN"
```

**Get Top Franchises:**
```bash
curl -X GET "$BASE_URL/admin/dashboard/top-franchises?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

**Get Wallet Stats:**
```bash
curl -X GET "$BASE_URL/admin/dashboard/wallet-statistics" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 Response Data Structure

### Dashboard Overview
- `activeShipments`: Count of shipments in transit or out for delivery
- `totalShipments`: Total count with period comparison
- `revenue`: Revenue with percentage change
- `activeAgencies`: Count of active franchise agencies
- `revenueTrend`: Daily revenue data for charts
- `shipmentTypeDistribution`: Breakdown by shipment type
- `recentBookings`: Last 10 shipments

### Top Franchises
- Sorted by `totalRevenue` (descending)
- Includes shipment count and revenue per franchise
- Configurable limit

### Wallet Statistics
- `totalBalance`: Sum of all franchise wallet balances
- `totalWallets`: Count of wallet records
- `credits`: Total amount and count of credit transactions
- `debits`: Total amount and count of debit transactions

---

## ⚠️ Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "message": "Invalid period parameter"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Error fetching admin dashboard data"
}
```

---

## 📝 Period Options

| Period | Description | Date Range |
|--------|-------------|------------|
| `day` | Today vs Yesterday | Last 24 hours |
| `week` | This Week | Last 7 days |
| `month` | This Month | Last 30 days |
| `year` | This Year | Last 365 days |

---

## ✅ API Status

All Admin Dashboard APIs are **LIVE** and working:

✓ Dashboard Statistics API  
✓ Top Franchises API  
✓ Wallet Statistics API  

**Test Results (Feb 10, 2026):**
- Total Shipments: 16
- Active Agencies: 6
- Total Wallet Balance: ₹184.6
- Revenue: ₹123.4

---

## 🎯 Use Cases

### 1. Admin Dashboard UI
Fetch weekly stats for admin dashboard homepage:
```bash
curl -X GET "$BASE_URL/admin/dashboard?period=week" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Franchise Leaderboard
Display top 10 performing franchises:
```bash
curl -X GET "$BASE_URL/admin/dashboard/top-franchises?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Financial Overview
Get overall wallet and transaction statistics:
```bash
curl -X GET "$BASE_URL/admin/dashboard/wallet-statistics" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Reports
Generate monthly performance report:
```bash
curl -X GET "$BASE_URL/admin/dashboard?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.overview'
```

---

## 🔐 Security Notes

- All endpoints require valid admin JWT token
- Token must have admin privileges with `isRoot: true`
- Tokens expire after 7 days by default
- Use HTTPS in production for secure communication
- Never commit tokens to version control

---

## 📞 Support

For API issues or questions:
- Check server logs for detailed error messages
- Verify token validity and admin permissions
- Ensure database connectivity
- Review CORS settings for frontend integration
