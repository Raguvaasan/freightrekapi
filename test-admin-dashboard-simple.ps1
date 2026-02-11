# Admin Dashboard API Test Script
# Usage: .\test-admin-dashboard-simple.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Admin Dashboard API Test Script   " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Configuration
$baseUrl = "https://freightrekapi.vercel.app"
# $baseUrl = "http://localhost:3000"  # Uncomment for local testing

# Step 1: Login as Admin
Write-Host "`n[1/4] Admin Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@freightrek.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/admin/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success) {
        # Token is directly in response, not in data object
        $adminToken = $loginResponse.token
        Write-Host "[SUCCESS] Login successful!" -ForegroundColor Green
        Write-Host "  Message: $($loginResponse.message)" -ForegroundColor Gray
    } else {
        Write-Host "[FAILED] Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "[ERROR] Login error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Note: Make sure admin user exists. Run setup scripts first." -ForegroundColor Yellow
    exit
}

# Headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# Step 2: Test Dashboard Statistics (Week)
Write-Host "`n[2/4] Testing Dashboard Statistics (Week)..." -ForegroundColor Yellow
try {
    $dashboardResponse = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard?period=week" -Method Get -Headers $headers
    
    if ($dashboardResponse.success) {
        Write-Host "[SUCCESS] Dashboard API working!" -ForegroundColor Green
        Write-Host "  Period: $($dashboardResponse.data.period)" -ForegroundColor Gray
        Write-Host "  Total Shipments: $($dashboardResponse.data.overview.totalShipments.count)" -ForegroundColor Gray
        Write-Host "  Active Shipments: $($dashboardResponse.data.overview.activeShipments.total)" -ForegroundColor Gray
        Write-Host "  Revenue: $($dashboardResponse.data.overview.revenue.total)" -ForegroundColor Gray
        Write-Host "  Active Agencies: $($dashboardResponse.data.overview.activeAgencies)" -ForegroundColor Gray
        Write-Host "  Shipment Change: $($dashboardResponse.data.overview.totalShipments.percentageChange)%" -ForegroundColor Gray
    } else {
        Write-Host "[FAILED] Dashboard API failed: $($dashboardResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Dashboard API error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test Top Franchises
Write-Host "`n[3/4] Testing Top Franchises API..." -ForegroundColor Yellow
try {
    $franchiseResponse = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard/top-franchises?limit=5" -Method Get -Headers $headers
    
    if ($franchiseResponse.success) {
        Write-Host "[SUCCESS] Top Franchises API working!" -ForegroundColor Green
        Write-Host "  Total Franchises: $($franchiseResponse.data.Count)" -ForegroundColor Gray
        
        if ($franchiseResponse.data.Count -gt 0) {
            Write-Host "`n  Top Performers:" -ForegroundColor Cyan
            $franchiseResponse.data | ForEach-Object {
                Write-Host "  - $($_.franchiseName)" -ForegroundColor White
                Write-Host "    Shipments: $($_.shipmentCount) | Revenue: $($_.totalRevenue)" -ForegroundColor Gray
            }
        } else {
            Write-Host "  No franchise data available yet" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[FAILED] Top Franchises API failed: $($franchiseResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Top Franchises API error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test Wallet Statistics
Write-Host "`n[4/4] Testing Wallet Statistics API..." -ForegroundColor Yellow
try {
    $walletResponse = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard/wallet-statistics" -Method Get -Headers $headers
    
    if ($walletResponse.success) {
        Write-Host "[SUCCESS] Wallet Statistics API working!" -ForegroundColor Green
        Write-Host "  Total Balance: $($walletResponse.data.totalBalance)" -ForegroundColor Gray
        Write-Host "  Total Wallets: $($walletResponse.data.totalWallets)" -ForegroundColor Gray
        $creditsCount = $walletResponse.data.credits.count
        $creditsAmount = $walletResponse.data.credits.amount
        $debitsCount = $walletResponse.data.debits.count
        $debitsAmount = $walletResponse.data.debits.amount
        Write-Host "  Credits Amount: $creditsAmount | Count: $creditsCount" -ForegroundColor Gray
        Write-Host "  Debits Amount: $debitsAmount | Count: $debitsCount" -ForegroundColor Gray
    } else {
        Write-Host "[FAILED] Wallet Statistics API failed: $($walletResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Wallet Statistics API error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "   Test Complete!                    " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "`nNote: If you see errors, check that:" -ForegroundColor Yellow
Write-Host "  - Admin account exists and is active" -ForegroundColor Yellow
Write-Host "  - Database has some shipment/wallet data" -ForegroundColor Yellow
Write-Host "  - Server is running and accessible" -ForegroundColor Yellow
Write-Host "`nFor local testing, uncomment the localhost URL line in the script." -ForegroundColor Gray
