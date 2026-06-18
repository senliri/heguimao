$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5177/' -UseBasicParsing
$body = $r.Content

Write-Host "=== JSON-LD URL References ==="
$jsonScripts = [regex]::Matches($body, '<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', 'IgnoreCase')
foreach ($s in $jsonScripts) {
    $content = $s.Groups[1].Value
    $urls = [regex]::Matches($content, 'https?://[^"''\s]+')
    foreach ($u in $urls) {
        Write-Host "  $u"
    }
}

Write-Host "`n=== Canonical URL ==="
$canonical = [regex]::Match($body, 'rel=["\']canonical["\'].*?href=["\']([^"\']+)["\']', 'IgnoreCase')
if ($canonical.Success) {
    Write-Host "  $($canonical.Groups[1].Value)"
}

Write-Host "`n=== Page Title ==="
$title = [regex]::Match($body, '<title>(.*?)</title>', 'IgnoreCase')
if ($title.Success) {
    Write-Host "  $($title.Groups[1].Value)"
}
