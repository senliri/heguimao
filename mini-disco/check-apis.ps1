Write-Host "=== API Route Check ==="
$apis = @('/api/health', '/api/chat', '/api/feedback', '/api/send-email')
foreach ($api in $apis) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:5177$api" -UseBasicParsing -ErrorAction Stop
        Write-Host "  $api -> $($r.StatusCode)"
    } catch {
        Write-Host "  $api -> $($_.Exception.Response.StatusCode.value__) (expected for unconfigured API)"
    }
}
