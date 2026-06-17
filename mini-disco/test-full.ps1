$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -UseBasicParsing
$body = $r.Content
Write-Host "=== FULL HTML ==="
Write-Host $body
$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/auth' -UseBasicParsing
Write-Host "`n=== /auth status: $($r.StatusCode) ==="
$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/report' -UseBasicParsing
Write-Host "`n=== /report status: $($r.StatusCode) ==="
$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/portfolio' -UseBasicParsing
Write-Host "`n=== /portfolio status: $($r.StatusCode) ==="
$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/dashboard' -UseBasicParsing
Write-Host "`n=== /dashboard status: $($r.StatusCode) ==="
