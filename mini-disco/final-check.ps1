$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5177/' -UseBasicParsing
$body = $r.Content

Write-Host "=== 1. STATUS & SIZE ==="
Write-Host "Status: $($r.StatusCode)"
Write-Host "HTML size: $("{0:F1}" -f ($body.Length / 1024)) KB"

Write-Host "`n=== 2. NETLY CHECK ==="
if ($body -match 'netlify') {
    Write-Host "FAIL: Found netlify references"
    $body | Select-String 'netlify' -AllMatches | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "PASS: No netlify references"
}

Write-Host "`n=== 3. VERCEL APP CHECK ==="
$vc = [regex]::Matches($body, 'mini-disco\.vercel\.app')
Write-Host "Found $($vc.Count) mini-disco.vercel.app references"

Write-Host "`n=== 4. ROUTE CHECK ==="
$routes = @('/', '/auth', '/report', '/portfolio', '/dashboard', '/appeal', '/category', '/market', '/settings')
foreach ($route in $routes) {
    try {
        $r2 = Invoke-WebRequest -Uri "http://127.0.0.1:5177$route" -UseBasicParsing -ErrorAction Stop
        Write-Host "  $route -> $($r2.StatusCode) ($("{0:F1}" -f ($r2.Content.Length / 1024))KB)"
    } catch {
        Write-Host "  $route -> ERROR: $_"
    }
}

Write-Host "`n=== 5. JSON-LD CHECK ==="
if ($body -match '"url"\s*:\s*"([^"]*)"', '"item"\s*:\s*"([^"]*)"') {
    $jsonUrls = [regex]::Matches($body, '"url"\s*:\s*"([^"]*)"', 'IgnoreCase')
    $jsonItems = [regex]::Matches($body, '"item"\s*:\s*"([^"]*)"', 'IgnoreCase')
    $allJsonUrls = @($jsonUrls.Captures.Value) + @($jsonItems.Captures.Value)
    foreach ($u in $allJsonUrls) {
        if ($u -match 'netlify') { Write-Host "  FAIL: $u" }
        elseif ($u -match 'vercel') { Write-Host "  OK: $u" }
        else { Write-Host "  INFO: $u" }
    }
}

Write-Host "`n=== 6. CANONICAL URL ==="
if ($body -match 'rel="canonical".*?href="([^"]*)"') {
    Write-Host "  $Matches[1]"
}

Write-Host "`n=== 7. SEO META TAGS ==="
if ($body -match 'meta\s+name="description".*?content="([^"]*)"') {
    Write-Host "  Description: $($Matches[1].Substring(0, [Math]::Min(80, $Matches[1].Length)))..."
}
if ($body -match 'meta\s+property="og:title".*?content="([^"]*)"') {
    Write-Host "  OG Title: $($Matches[1])"
}
if ($body -match '<title>(.*?)</title>') {
    Write-Host "  Page Title: $Matches[1]"
}

Write-Host "`n=== 8. SCRIPT IMPORTS ==="
$scripts = [regex]::Matches($body, '<script[^>]*src="([^"]*)"', 'IgnoreCase')
foreach ($s in $scripts) {
    Write-Host "  src=$($s.Groups[1].Value)"
}
