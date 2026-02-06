# Payment Order API Testing Script (PowerShell)
# Run this script to test the Payment Order API

Write-Host "`n🚀 Payment Order API Testing Script`n" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:3000"

# Step 1: Login
Write-Host "1️⃣ Logging in as admin..." -ForegroundColor Yellow

$loginBody = @{
    email = "admin@freightrek.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/admin/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    
    if ($loginResponse.success) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        $token = $loginResponse.token
        Write-Host "   User: $($loginResponse.user.name)" -ForegroundColor Gray
        Write-Host "   Token: $($token.Substring(0, 20))...`n" -ForegroundColor Gray
    } else {
        Write-Host "❌ Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "❌ Login error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Setup headers
$headers = @{
    Authorization = "Bearer $token"
}

# Step 2: Get Wallet Balance
Write-Host "2️⃣ Getting wallet balance..." -ForegroundColor Yellow

try {
    $balance = Invoke-RestMethod -Uri "$baseUrl/api/wallet/balance" -Method GET -Headers $headers
    Write-Host "✅ Current Balance: ₹$($balance.balance) $($balance.currency)`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Error getting balance: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Step 3: Create Payment Order
Write-Host "3️⃣ Creating payment order..." -ForegroundColor Yellow

$orderBody = @{
    amount = 500
    paymentMethod = "upi"
} | ConvertTo-Json

try {
    $order = Invoke-RestMethod -Uri "$baseUrl/api/wallet/create-payment-order" -Method POST -ContentType "application/json" -Headers $headers -Body $orderBody
    
    Write-Host "✅ Payment order created successfully!" -ForegroundColor Green
    Write-Host "   Order ID: $($order.orderId)" -ForegroundColor Gray
    Write-Host "   Amount: ₹$($order.amount) $($order.currency)" -ForegroundColor Gray
    Write-Host "   Session ID: $($order.sessionId.Substring(0, 30))...`n" -ForegroundColor Gray
    
    # Store order ID for later use
    $orderId = $order.orderId
} catch {
    Write-Host "❌ Error creating order: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Step 4: Test Different Payment Methods
Write-Host "4️⃣ Testing different payment methods..." -ForegroundColor Yellow

$paymentMethods = @("card", "netbanking", "wallet")

foreach ($method in $paymentMethods) {
    $testOrderBody = @{
        amount = 100
        paymentMethod = $method
    } | ConvertTo-Json
    
    try {
        $testOrder = Invoke-RestMethod -Uri "$baseUrl/api/wallet/create-payment-order" -Method POST -ContentType "application/json" -Headers $headers -Body $testOrderBody
        Write-Host "   ✅ $method`: $($testOrder.orderId)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $method`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n5️⃣ Getting transaction history..." -ForegroundColor Yellow

try {
    $transactions = Invoke-RestMethod -Uri "$baseUrl/api/wallet/transactions?page=1&limit=10" -Method GET -Headers $headers
    
    if ($transactions.success) {
        Write-Host "✅ Found $($transactions.pagination.totalItems) transactions" -ForegroundColor Green
        
        if ($transactions.transactions.Count -gt 0) {
            Write-Host "`n   Recent Transactions:" -ForegroundColor Gray
            foreach ($txn in $transactions.transactions) {
                Write-Host "   - ID: $($txn.transactionId)" -ForegroundColor Gray
                Write-Host "     Type: $($txn.type), Amount: ₹$($txn.amount)" -ForegroundColor Gray
            }
        }
    }
} catch {
    Write-Host "❌ Error getting transactions: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ All tests completed!`n" -ForegroundColor Green

# Display summary
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "   Base URL: $baseUrl" -ForegroundColor Gray
Write-Host "   API Endpoints:" -ForegroundColor Gray
Write-Host "   - POST /admin/auth/login" -ForegroundColor Gray
Write-Host "   - GET  /api/wallet/balance" -ForegroundColor Gray
Write-Host "   - POST /api/wallet/create-payment-order" -ForegroundColor Gray
Write-Host "   - POST /api/wallet/verify-payment" -ForegroundColor Gray
Write-Host "   - GET  /api/wallet/transactions" -ForegroundColor Gray
Write-Host "`n   Documentation: See PAYMENT_ORDER_API_TEST_RESULTS.md`n" -ForegroundColor Gray
