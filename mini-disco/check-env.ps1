$base = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco'
$envVars = @{}

# Search all source files for process.env references
$files = Get-ChildItem -Path "$base\src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $matches = [regex]::Matches($content, 'process\.env\.(\w+)|import\.meta\.env\.VITE_(\w+)')
    foreach ($m in $matches) {
        $var = $m.Groups[1].Value
        if (-not $var) { $var = $m.Groups[2].Value }
        if ($var) { $envVars[$var] = $true }
    }
}

# Search API files
$apiFiles = Get-ChildItem -Path "$base\api" -Recurse -Include *.js,*.ts
foreach ($f in $apiFiles) {
    $content = Get-Content $f.FullName -Raw
    $matches = [regex]::Matches($content, 'process\.env\.(\w+)')
    foreach ($m in $matches) {
        $var = $m.Groups[1].Value
        if ($var) { $envVars[$var] = $true }
    }
}

# Search for VITE_ prefixed imports
$configFiles = Get-ChildItem -Path "$base\src" -Recurse -Include *.ts,*.tsx
foreach ($f in $configFiles) {
    $content = Get-Content $f.FullName -Raw
    $matches = [regex]::Matches($content, 'VITE_\w+')
    foreach ($m in $matches) {
        $var = $m.Value
        if ($var -notin $envVars.Keys) { $envVars[$var] = $true }
    }
}

Write-Host "=== ALL REFERENCED ENV VARS ==="
$sorted = $envVars.Keys | Sort-Object
foreach ($v in $sorted) {
    Write-Host "  $v"
}

Write-Host ""
Write-Host "=== COMPARISON WITH VERCEL ==="
$vercelVars = @('SMTP_USER', 'SMTP_PASS', 'VITE_AGNES_API_KEY', 'VITE_AI_BASE_URL', 'AUTH_PASSWORD')
$missing = @()
$found = @()
foreach ($v in $sorted) {
    if ($v -in $vercelVars) {
        $found += $v
    } else {
        $missing += $v
    }
}

Write-Host "Already in Vercel:"
foreach ($v in $found) { Write-Host "  ✓ $v" }

Write-Host ""
Write-Host "NOT in Vercel (need to add):"
if ($missing.Count -eq 0) {
    Write-Host "  None! All covered."
} else {
    foreach ($v in $missing) { Write-Host "  ✗ $v" }
}
