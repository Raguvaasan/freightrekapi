# Admin Dashboard API - Testing Guide

## Base URL
```
Production: https://freightrekapi.vercel.app
Local: http://localhost:3000
```

## Authentication
All endpoints require Admin authentication. Include JWT token in header:
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

---

## 1. Get Admin Dashboard Statistics

**Endpoint:** `GET /admin/dashboard`

**Description:** Get aggregated dashboard statistics across all franchises

**Query Parameters:**
- `period` (optional): Filter period - `day`, `week`, `month`, `year` (default: `week`)

**cURL Example:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard?period=week" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "activeShipments": {
        "total": 15,
        "inTransit": 8,
        "outForDelivery": 7
      },
      "totalShipments": {
        "count": 250,
        "currentPeriod": 45,
        "percentageChange": "+12.5"
      },
      "revenue": {
        "total": 125000,
        "percentageChange": "+8.3",
        "currency": "₹"
      },
      "activeAgencies": 12
    },
    "revenueTrend": [
      {
        "date": "2026-02-01T00:00:00.000Z",
        "revenue": 15000
      },
      {
        "date": "2026-02-02T00:00:00.000Z",
        "revenue": 18000
      }
    ],
    "shipmentTypeDistribution": [
      {
        "type": "road_freight",
        "count": 120
      },
      {
        "type": "air_freight",
        "count": 80
      },
      {
        "type": "ocean_freight",
        "count": 50
      }
    ],
    "recentBookings": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "trackingNumber": "FRT123456789",
        "pickupCity": "Chennai",
        "deliveryCity": "Mumbai",
        "status": "in_transit",
        "paymentType": "prepaid",
        "amount": 5000,
        "createdAt": "2026-02-08T10:30:00.000Z",
        "userId": {
          "_id": "507f191e810c19729de860ea",
          "agencyName": "Chennai Logistics"
        }
      }
    ],
    "period": "week"
  }
}
```

---

## 2. Get Top Performing Franchises

**Endpoint:** `GET /admin/dashboard/top-franchises`

**Description:** Get top franchises ranked by revenue

**Query Parameters:**
- `limit` (optional): Number of franchises to return (default: `5`)

**cURL Example:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard/top-franchises?limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
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

## 3. Get Wallet Statistics

**Endpoint:** `GET /admin/dashboard/wallet-statistics`

**Description:** Get wallet and transaction statistics across all franchises

**cURL Example:**
```bash
curl -X GET "https://freightrekapi.vercel.app/admin/dashboard/wallet-statistics" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 2500000,
    "totalWallets": 12,
    "credits": {
      "amount": 5000000,
      "count": 150
    },
    "debits": {
      "amount": 2500000,
      "count": 320
    }
  }
}
```

---

## PowerShell Testing Script

Save as `test-admin-dashboard.ps1`:

```powershell
# Admin Dashboard API Test Script

# Set your admin token
$adminToken = "YOUR_ADMIN_JWT_TOKEN_HERE"
$baseUrl = "https://freightrekapi.vercel.app"

# Headers
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

Write-Host "=== Testing Admin Dashboard APIs ===" -ForegroundColor Cyan

# 1. Get Admin Dashboard (Week)
Write-Host "`n1. Get Admin Dashboard (Week):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard?period=week" -Method Get -Headers $headers
$response | ConvertTo-Json -Depth 10

# 2. Get Admin Dashboard (Day)
Write-Host "`n2. Get Admin Dashboard (Day):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard?period=day" -Method Get -Headers $headers
Write-Host "Period: $($response.data.period)"
Write-Host "Total Shipments: $($response.data.overview.totalShipments.count)"
Write-Host "Active Agencies: $($response.data.overview.activeAgencies)"
Write-Host "Revenue: ₹$($response.data.overview.revenue.total)"

# 3. Get Top Franchises
Write-Host "`n3. Get Top 5 Franchises:" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard/top-franchises?limit=5" -Method Get -Headers $headers
$response.data | ForEach-Object {
    Write-Host "- $($_.franchiseName): $($_.shipmentCount) shipments, ₹$($_.totalRevenue)"
}

# 4. Get Wallet Statistics
Write-Host "`n4. Get Wallet Statistics:" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard/wallet-statistics" -Method Get -Headers $headers
Write-Host "Total Balance: ₹$($response.data.totalBalance)"
Write-Host "Total Wallets: $($response.data.totalWallets)"
Write-Host "Total Credits: ₹$($response.data.credits.amount) ($($response.data.credits.count) transactions)"
Write-Host "Total Debits: ₹$($response.data.debits.amount) ($($response.data.debits.count) transactions)"

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Green
```

---

## Response Data Explanation

### Overview Section
- **activeShipments**: Current shipments that are in_transit or out_for_delivery
- **totalShipments**: Total count with current period count and percentage change
- **revenue**: Total revenue in current period with percentage change
- **activeAgencies**: Count of active franchise agencies

### Revenue Trend
- Daily revenue data points for the selected period
- Can be used to plot revenue chart

### Shipment Type Distribution
- Breakdown of shipments by type (road_freight, air_freight, ocean_freight, rail_freight)
- Can be used for pie chart visualization

### Recent Bookings
- Last 10 shipments across all franchises
- Includes franchise details (populated userId)

---

## Period Options

| Period | Description |
|--------|-------------|
| `day` | Today vs Yesterday |
| `week` | Last 7 days vs Previous 7 days |
| `month` | Last 30 days vs Previous 30 days |
| `year` | Last 365 days vs Previous 365 days |

---

## Notes

1. **Admin Only**: All endpoints require admin authentication with `isRoot: true`
2. **Aggregated Data**: Statistics are calculated across ALL franchises
3. **Performance**: APIs use MongoDB aggregation pipelines for efficient data processing
4. **Percentage Change**: Calculated by comparing current period with previous period of same length
5. **Currency**: All amounts are in INR (₹)

---

## Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "No token provided" // or "Invalid token"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Error fetching admin dashboard data"
}
```
