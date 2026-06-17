$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5177/' -UseBasicParsing
$body = $r.Content

# Find all URLs in the page
$allUrls = [regex]::Matches($body, 'https?://[^"''\s><]+')

Write-Host "=== ALL HTTP(S) URLs ==="
$seen = @{}
foreach ($u in $allUrls) {
    $url = $u.Value
    if (-not $seen.ContainsKey($url)) {
        $seen[$url] = $true
        Write-Host "  $url"
    }
}

Write-Host "`n=== SUMMARY ==="
$netlify = $allUrls | Where-Object { $_.Value -match 'netlify' } | Measure-Object | Select-Object -ExpandProperty Count
$vercel = $allUrls | Where-Object { $_.Value -match 'mini-disco\.vercel\.app' } | Measure-Object | Select-Object -ExpandProperty Count
Write-Host "Netlify references: $netlify"
Write-Host "Vercel references: $vercel"
