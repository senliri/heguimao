$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5176/' -UseBasicParsing
$body = $r.Content

Write-Host "=== ALL URL references in index.html ==="
$urls = [regex]::Matches($body, 'https?://[^"''\s>]+', 'IgnoreCase')
foreach ($u in $urls) {
    Write-Host "  $u"
}

Write-Host ""
Write-Host "=== Script imports ==="
$scripts = [regex]::Matches($body, '<script[^>]*src="([^"]*)"', 'IgnoreCase')
foreach ($s in $scripts) {
    Write-Host "  src=$($s.Groups[1].Value)"
}

Write-Host ""
Write-Host "=== Link imports ==="
$links = [regex]::Matches($body, '<link[^>]*href="([^"]*)"', 'IgnoreCase')
foreach ($l in $links) {
    Write-Host "  href=$($l.Groups[1].Value)"
}

Write-Host ""
Write-Host "=== Canonical URL ==="
if ($body -match 'canonical.*?href="([^"]*)"') {
    Write-Host "  $Matches[1]"
}
