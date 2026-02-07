# Quick Test - Show Backend is Working

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Testing Backend API Directly" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

$orderId = "ORDER_697ccff8c13c521b28f76354_1770449824591"
Write-Host "Testing with Order ID: $orderId`n" -ForegroundColor Yellow

# Test without token to see the error
Write-Host "Test 1: Calling API without token..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://freightrekapi.vercel.app/api/wallet/verify-payment" `
        -Method POST `
        -Body (@{ orderId = $orderId } | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[Expected] Status: $statusCode" -ForegroundColor Yellow
    
    if ($statusCode -eq 401) {
        Write-Host "[CORRECT] API requires authentication!" -ForegroundColor Green
        Write-Host "`nThis means:" -ForegroundColor Cyan
        Write-Host "  - Backend API is working properly" -ForegroundColor Green
        Write-Host "  - It correctly requires a token" -ForegroundColor Green
        Write-Host "  - Your FRONTEND must send the token!" -ForegroundColor Yellow
    }
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "PROBLEM IDENTIFIED" -ForegroundColor Red
Write-Host "==================================`n" -ForegroundColor Cyan

Write-Host "Your frontend page is NOT sending:" -ForegroundColor Red
Write-Host "  1. The correct API URL" -ForegroundColor Red
Write-Host "  2. The auth token in headers" -ForegroundColor Red
Write-Host "  3. Or calling the API at all" -ForegroundColor Red

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "SOLUTION" -ForegroundColor Green
Write-Host "==================================`n" -ForegroundColor Cyan

Write-Host "Open Browser DevTools (F12) on payment-callback page:" -ForegroundColor Yellow
Write-Host "  1. Go to Console tab - look for errors" -ForegroundColor White
Write-Host "  2. Go to Network tab - check if API call is made" -ForegroundColor White
Write-Host "  3. Check if Authorization header is sent" -ForegroundColor White

Write-Host "`nYour frontend code should be:" -ForegroundColor Yellow
Write-Host @"

const token = localStorage.getItem('authToken');

axios.post(
  'https://freightrekapi.vercel.app/api/wallet/verify-payment',
  { orderId: order_id },
  { 
    headers: { 
      'Authorization': ``Bearer `${token}``
    } 
  }
)

"@ -ForegroundColor White

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "ACTION REQUIRED" -ForegroundColor Yellow
Write-Host "==================================`n" -ForegroundColor Cyan

Write-Host "1. Find your frontend repo (heydeliver)" -ForegroundColor White
Write-Host "2. Update payment-callback page" -ForegroundColor White
Write-Host "3. Copy code from: frontend-integration/components/PaymentCallback.tsx" -ForegroundColor White
Write-Host "4. Deploy to Vercel" -ForegroundColor White
Write-Host "`n" -ForegroundColor White
