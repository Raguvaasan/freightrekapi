$ProgressPreference = 'SilentlyContinue'

function Invoke-API($url, $body) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $req = [System.Net.WebRequest]::Create($url)
    $req.Method = "POST"
    $req.ContentType = "application/json"
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    try {
        $res = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($res.GetResponseStream())
        return @{ Status = [int]$res.StatusCode; Body = $reader.ReadToEnd() }
    } catch [System.Net.WebException] {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        return @{ Status = [int]$_.Exception.Response.StatusCode; Body = $reader.ReadToEnd() }
    }
}

Write-Host "=== TEST 1: Staff Hub Login (swey.shwetha@gmail.com) ===" -ForegroundColor Cyan
$r1 = Invoke-API "https://freightrekapi.vercel.app/admin/staff/login/hub" '{"username":"swey.shwetha@gmail.com","password":"Admin@123"}'
Write-Host "Status : $($r1.Status)"
Write-Host "Response: $($r1.Body)"

Write-Host ""
Write-Host "=== TEST 2: Direct Hub Login (swetha@gmail.com) ===" -ForegroundColor Cyan
$r2 = Invoke-API "https://freightrekapi.vercel.app/admin/hub/login" '{"username":"swetha@gmail.com","password":"Admin@123"}'
Write-Host "Status : $($r2.Status)"
Write-Host "Response: $($r2.Body)"
