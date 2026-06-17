$dist = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco\dist'
Write-Host "=== BUILD OUTPUT ==="
Get-ChildItem -Path $dist -Recurse | ForEach-Object {
    $size = "{0:F1}" -f ($_.Length / 1KB)
    Write-Host "  $($_.FullName.Replace($dist, '').Replace('\','/')) ($size KB)"
}

Write-Host "`n=== DIST HTML NETLY CHECK ==="
$htmlFiles = Get-ChildItem -Path $dist -Filter '*.html' -Recurse
foreach ($f in $htmlFiles) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match 'netlify') {
        Write-Host "  FAIL: $($f.FullName.Replace($dist, '')) contains netlify!"
    } else {
        Write-Host "  PASS: $($f.FullName.Replace($dist, '')) - no netlify"
    }
    $vercel = [regex]::Matches($content, 'mini-disco\.vercel\.app').Count
    Write-Host "    -> $vercel vercel.app references"
}

Write-Host "`n=== VERCEL.JSON CHECK ==="
$vercelJson = Get-Content "$dist/../vercel.json" -Raw
Write-Host $vercelJson
