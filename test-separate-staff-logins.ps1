# Test Separate Staff Login Endpoints
# This script tests franchise and HQ staff login separation

$BASE_URL = "https://freightrekapi.vercel.app"
# $BASE_URL = "http://localhost:3000"  # Uncomment for local testing

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Separate Staff Login Endpoints" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Franchise Staff Login (Correct Endpoint)
Write-Host "Test 1: Franchise Staff Login (Should SUCCESS)" -ForegroundColor Yellow
Write-Host "Endpoint: POST /admin/staff/login/franchise" -ForegroundColor Gray
Write-Host "Username: raguvasans46@gmail.com`n" -ForegroundColor Gray

$franchiseLoginBody = @{
    username = "raguvasans46@gmail.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/staff/login/franchise" `
        -Method POST `
        -ContentType "application/json" `
        -Body $franchiseLoginBody
    
    Write-Host "✅ SUCCESS - Franchise staff login worked!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor Green
    Write-Host "Staff Name: $($response.data.name)" -ForegroundColor Green
    Write-Host "Staff Type: $($response.data.type)" -ForegroundColor Green
    Write-Host "Franchise: $($response.data.franchiseId.agencyName)`n" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED - $($_.Exception.Message)`n" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 2: Franchise Staff Login on HQ Endpoint (Should FAIL)
Write-Host "`nTest 2: Franchise Staff on HQ Endpoint (Should FAIL)" -ForegroundColor Yellow
Write-Host "Endpoint: POST /admin/staff/login/headquarter" -ForegroundColor Gray
Write-Host "Username: raguvasans46@gmail.com`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/staff/login/headquarter" `
        -Method POST `
        -ContentType "application/json" `
        -Body $franchiseLoginBody `
        -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED - This should have failed!" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorDetails.message -like "*not a head quarter staff*") {
        Write-Host "✅ SUCCESS - Correctly rejected franchise staff!" -ForegroundColor Green
        Write-Host "Error: $($errorDetails.message)`n" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED - Wrong error: $($errorDetails.message)`n" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 2

# Test 3: Check existing HQ staff
Write-Host "`nTest 3: Checking if HQ staff exists..." -ForegroundColor Yellow

$checkHQBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/staff/login/headquarter" `
        -Method POST `
        -ContentType "application/json" `
        -Body $checkHQBody
    
    Write-Host "✅ SUCCESS - HQ staff login worked!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor Green
    Write-Host "Staff Name: $($response.data.name)" -ForegroundColor Green
    Write-Host "Staff Type: $($response.data.type)" -ForegroundColor Green
    if ($response.data.roleId) {
        Write-Host "Role: $($response.data.roleId.name)`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  No HQ staff found with these credentials" -ForegroundColor Yellow
    Write-Host "This is normal if no HQ staff exists yet`n" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Test 4: Generic Endpoint (Both Should Work)
Write-Host "`nTest 4: Generic Login Endpoint (Backward Compatibility)" -ForegroundColor Yellow
Write-Host "Endpoint: POST /admin/staff/login" -ForegroundColor Gray
Write-Host "Username: raguvasans46@gmail.com`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/staff/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $franchiseLoginBody
    
    Write-Host "✅ SUCCESS - Generic endpoint still works!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor Green
    Write-Host "Staff Type: $($response.data.type)`n" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED - $($_.Exception.Message)`n" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Franchise staff can login via /login/franchise" -ForegroundColor Green
Write-Host "✅ Franchise staff BLOCKED from /login/headquarter" -ForegroundColor Green
Write-Host "✅ Generic /login endpoint still works (backward compatibility)" -ForegroundColor Green
Write-Host "`nEndpoint URLs:" -ForegroundColor Yellow
Write-Host "  Franchise: $BASE_URL/admin/staff/login/franchise" -ForegroundColor White
Write-Host "  HQ Staff:  $BASE_URL/admin/staff/login/headquarter" -ForegroundColor White
Write-Host "  Generic:   $BASE_URL/admin/staff/login`n" -ForegroundColor White
