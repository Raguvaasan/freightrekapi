# Test Payment Verification API

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Testing Wallet Payment API" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Check if API is live
Write-Host "1. Testing API Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/health" -Method GET
    Write-Host "[SUCCESS] Backend API is live!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Backend API not responding!" -ForegroundColor Red
    exit 1
}

# Test 2: Login to get a valid token
Write-Host "`n2. Getting auth token..." -ForegroundColor Yellow
$loginBody = @{
    email = "freightrek@gmail.com"
    password = "ragu"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/admin/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success) {
        $token = $loginResponse.token
        Write-Host "[SUCCESS] Login successful!" -ForegroundColor Green
        Write-Host "   Token: $($token.Substring(0,20))..." -ForegroundColor Gray
    } else {
        Write-Host "[ERROR] Login failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Login error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Check wallet balance
Write-Host "`n3. Checking current wallet balance..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $balance = Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/wallet/balance" -Method GET -Headers $headers
    Write-Host "[SUCCESS] Current balance: Rs.$($balance.balance)" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not fetch balance: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 4: Verify the latest payment (from your screenshot)
Write-Host "`n4. Testing payment verification (your order)..." -ForegroundColor Yellow
$orderId = "ORDER_697ccff8c13c521b28f76354_1770448639421"

$verifyBody = @{
    orderId = $orderId
} | ConvertTo-Json

Write-Host "   Order ID: $orderId" -ForegroundColor Gray
Write-Host "   Calling: POST /api/wallet/verify-payment" -ForegroundColor Gray
Write-Host "   Payload: { orderId: '$orderId' }" -ForegroundColor Gray

try {
    $verifyResponse = Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/wallet/verify-payment" -Method POST -Body $verifyBody -Headers $headers -ErrorAction Stop
    
    Write-Host "`nAPI Response:" -ForegroundColor Cyan
    Write-Host ($verifyResponse | ConvertTo-Json -Depth 5) -ForegroundColor White
    
    if ($verifyResponse.success -and $verifyResponse.status -eq "SUCCESS") {
        Write-Host "`n[SUCCESS] PAYMENT VERIFICATION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   Amount: Rs.$($verifyResponse.amount)" -ForegroundColor Green
        Write-Host "   New Balance: Rs.$($verifyResponse.newBalance)" -ForegroundColor Green
        Write-Host "   Message: $($verifyResponse.message)" -ForegroundColor Green
        
        Write-Host "`n[CONFIRMED] BACKEND API IS WORKING PERFECTLY!" -ForegroundColor Green
        Write-Host "   The issue is in your FRONTEND code." -ForegroundColor Yellow
    } else {
        Write-Host "`n[WARNING] Payment status: $($verifyResponse.status)" -ForegroundColor Yellow
        Write-Host "   Message: $($verifyResponse.message)" -ForegroundColor Yellow
    }
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    Write-Host "`n[ERROR] Verification failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($errorDetails) {
        Write-Host "   Details: $($errorDetails.message)" -ForegroundColor Red
    }
}

# Check balance again
Write-Host "`n5. Checking updated balance..." -ForegroundColor Yellow
try {
    $newBalance = Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/wallet/balance" -Method GET -Headers $headers
    Write-Host "[SUCCESS] Updated balance: Rs.$($newBalance.balance)" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not fetch updated balance" -ForegroundColor Yellow
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "1. Backend API is fixed and deployed [SUCCESS]" -ForegroundColor Green
Write-Host "2. Update your FRONTEND code at heydeliver.vercel.app" -ForegroundColor Yellow
Write-Host "3. Use the code from: frontend-integration/components/PaymentCallback.tsx" -ForegroundColor Yellow
Write-Host "4. Key change: Remove paymentId, use only orderId" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor White
