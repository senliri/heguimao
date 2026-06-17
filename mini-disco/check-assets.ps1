$dist = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco\dist'

Write-Host "=== SITEMAP CHECK ==="
$sitemap = Get-Content "$dist\sitemap.xml" -Raw
if ($sitemap -match 'netlify') { Write-Host "  FAIL: Contains netlify!" } else { Write-Host "  PASS: No netlify" }
Write-Host "  Content preview:"
Write-Host $sitemap.Substring(0, [Math]::Min(500, $sitemap.Length))

Write-Host "`n=== ROBOTS.TXT CHECK ==="
$robots = Get-Content "$dist\robots.txt" -Raw
Write-Host "  Content: $robots"

Write-Host "`n=== 404.HTML CHECK ==="
$notfound = Get-Content "$dist\404.html" -Raw
Write-Host "  Size: $notfound.Length bytes"
if ($notfound -match 'netlify') { Write-Host "  FAIL: Contains netlify!" } else { Write-Host "  PASS: No netlify" }
