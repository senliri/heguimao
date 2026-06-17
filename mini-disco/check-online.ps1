try {
    $r = Invoke-WebRequest -Uri 'https://mini-disco.vercel.app' -UseBasicParsing -ErrorAction Stop
    Write-Host "HTTP: $($r.StatusCode)"
    Write-Host "Content-Length: $($r.Content.Length)"
    Write-Host "ContentType: $($r.Headers.'Content-Type')"
    Write-Host "Server: $($r.Headers.Server)"
    Write-Host "Cache-Control: $($r.Headers.'Cache-Control')"
    Write-Host "X-Vercel-ID: $($r.Headers.'X-Vercel-ID')"
} catch {
    Write-Host "ERROR: $_.Exception.Message"
}
