# Setup Vercel Environment Variables (Without Newlines)

Write-Host "🔧 Setting up Vercel Environment Variables..." -ForegroundColor Cyan

# Set CASHFREE_CLIENT_ID
Write-Host "`n1️⃣ Setting CASHFREE_CLIENT_ID..." -ForegroundColor Yellow
$clientId = "11234039df03f3ca05c6ad44a223043211"
Set-Content -Path temp_client_id.txt -Value $clientId -NoNewline
Get-Content temp_client_id.txt | vercel env add CASHFREE_CLIENT_ID production
Remove-Item temp_client_id.txt

# Set CASHFREE_CLIENT_SECRET
Write-Host "`n2️⃣ Setting CASHFREE_CLIENT_SECRET..." -ForegroundColor Yellow
$clientSecret = "cfsk_ma_prod_16fdb417afe46c7b8787f42b3f547b49_183a3a56"
Set-Content -Path temp_client_secret.txt -Value $clientSecret -NoNewline
Get-Content temp_client_secret.txt | vercel env add CASHFREE_CLIENT_SECRET production
Remove-Item temp_client_secret.txt

# Set CASHFREE_API_URL
Write-Host "`n3️⃣ Setting CASHFREE_API_URL..." -ForegroundColor Yellow
$apiUrl = "https://api.cashfree.com/pg"
Set-Content -Path temp_api_url.txt -Value $apiUrl -NoNewline
Get-Content temp_api_url.txt | vercel env add CASHFREE_API_URL production
Remove-Item temp_api_url.txt

# Set BACKEND_URL
Write-Host "`n4️⃣ Setting BACKEND_URL..." -ForegroundColor Yellow
$backendUrl = "https://freightrekapi.vercel.app"
Set-Content -Path temp_backend_url.txt -Value $backendUrl -NoNewline
Get-Content temp_backend_url.txt | vercel env add BACKEND_URL production
Remove-Item temp_backend_url.txt

Write-Host "`n✅ All environment variables set!" -ForegroundColor Green
Write-Host "`n📦 Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
