$dist = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco\dist'

Write-Host "=== PRODUCTION BUILD SUMMARY ==="
Write-Host ""

$totalSize = 0
$fileCount = 0

# List all asset files sorted by size
Get-ChildItem -Path $dist -Recurse -File | Where-Object {
    $_.Extension -match '\.(js|css|html|xml|txt|ico|svg|png|jpg)$'
} | Sort-Object Length -Descending | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 1)
    $totalSize += $_.Length
    $fileCount++
    $rel = ($_.FullName -replace [regex]::Escape($dist + '\'), '').Replace('\', '/')
    Write-Host "  $rel  ($sizeKB KB)"
}

Write-Host ""
Write-Host "Total files: $fileCount"
Write-Host "Total size: $([math]::Round($totalSize / 1MB, 2)) MB"
Write-Host "Gzip estimate: ~$([math]::Round($totalSize * 0.3 / 1MB, 2)) MB"

Write-Host ""
Write-Host "=== CHUNK ANALYSIS ==="
$jsFiles = Get-ChildItem -Path "$dist\assets" -Filter '*.js' -Recurse | Where-Object {
    $_.Name -notmatch '^index\.' -and $_.Name -notmatch '^vendor\.'
}
Write-Host "Lazy-loaded chunks:"
foreach ($f in $jsFiles | Sort-Object Length -Descending) {
    $sizeKB = [math]::Round($f.Length / 1KB, 1)
    $rel = ($f.FullName -replace [regex]::Escape($dist + '\'), '').Replace('\', '/')
    Write-Host "  $rel : $sizeKB KB"
}
