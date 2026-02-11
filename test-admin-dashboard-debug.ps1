# Admin Dashboard API Debug Test Script
# Usage: .\test-admin-dashboard-debug.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Admin Dashboard API Debug Test   " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Configuration
$baseUrl = "https://freightrekapi.vercel.app"
# $baseUrl = "http://localhost:3000"  # Uncomment for local testing

# Step 1: Login as Admin
Write-Host "`n[1] Admin Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@freightrek.com"
    password = "Admin@123"
} | ConvertTo-Json

Write-Host "Login URL: $baseUrl/admin/auth/login" -ForegroundColor Cyan
Write-Host "Login Body: $loginBody" -ForegroundColor Cyan

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/admin/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    Write-Host "`nFull Login Response:" -ForegroundColor Magenta
    $loginResponse | ConvertTo-Json -Depth 5
    
    if ($loginResponse.success) {
        # Token is directly in response, not in data object
        $adminToken = $loginResponse.token
        Write-Host "`n[SUCCESS] Login successful!" -ForegroundColor Green
        if ($adminToken) {
            Write-Host "Token (first 50 chars): $($adminToken.Substring(0, [Math]::Min(50, $adminToken.Length)))..." -ForegroundColor Gray
        } else {
            Write-Host "[ERROR] Token is null!" -ForegroundColor Red
            exit
        }
    } else {
        Write-Host "`n[FAILED] Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "`n[ERROR] Login error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

Write-Host "`nUsing Authorization Header: Bearer $($adminToken.Substring(0, [Math]::Min(50, $adminToken.Length)))..." -ForegroundColor Cyan

# Step 2: Test Dashboard Statistics
Write-Host "`n[2] Testing Dashboard Statistics API..." -ForegroundColor Yellow
Write-Host "URL: $baseUrl/admin/dashboard?period=week" -ForegroundColor Cyan

try {
    $dashboardResponse = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard?period=week" -Method Get -Headers $headers
    
    Write-Host "`nFull Dashboard Response:" -ForegroundColor Magenta
    $dashboardResponse | ConvertTo-Json -Depth 10
    
    if ($dashboardResponse.success) {
        Write-Host "`n[SUCCESS] Dashboard API working!" -ForegroundColor Green
    } else {
        Write-Host "`n[FAILED] Dashboard API failed: $($dashboardResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "`n[ERROR] Dashboard API error" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get response body
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    } catch {
        Write-Host "Could not read response body" -ForegroundColor Yellow
    }
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "   Debug Test Complete!             " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
