$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -UseBasicParsing
$body = $r.Content
Write-Host "Status: $($r.StatusCode)"
Write-Host "Body length: $($body.Length)"
Write-Host "---First 800 chars---"
Write-Host $body.Substring(0, [Math]::Min(800, $body.Length))
Write-Host "---Checking for critical elements---"
if ($body -match 'compliance-cat') { Write-Host "Title: FOUND" } else { Write-Host "Title: MISSING" }
if ($body -match 'index-CueWfZAe') { Write-Host "Vite bundle: FOUND" } else { Write-Host "Vite bundle: MISSING" }
if ($body -match 'siteData') { Write-Host "siteData chunk: FOUND" } else { Write-Host "siteData chunk: MISSING" }
if ($body -match 'Report') { Write-Host "Report chunk: FOUND" } else { Write-Host "Report chunk: MISSING" }
