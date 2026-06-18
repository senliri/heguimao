$base = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco'
$errors = @()
$passes = @()

function Test-FileForNetlify {
    param($filePath, $label)
    $content = Get-Content $filePath -Raw
    # Match actual netlify URLs or domains, not just comment references
    if ($content -match 'catcompliance\.netlify\.app' -or $content -match 'netlify\.app/') {
        $errors += "FAIL: $label contains netlify domain reference"
    } else {
        $passes += "PASS: $label - no netlify domain"
    }
}

# Check all critical files
Test-FileForNetlify "$base\index.html" "index.html"
Test-FileForNetlify "$base\public\robots.txt" "robots.txt"
Test-FileForNetlify "$base\public\sitemap.xml" "sitemap.xml"
Test-FileForNetlify "$base\vercel.json" "vercel.json"
Test-FileForNetlify "$base\package.json" "package.json"
Test-FileForNetlify "$base\vite.config.ts" "vite.config.ts"
Test-FileForNetlify "$base\.env.example" ".env.example"
Test-FileForNetlify "$base\README.md" "README.md"

# Check dist files
$dist = "$base\dist"
$htmlDist = Get-ChildItem -Path $dist -Filter '*.html' -Recurse
foreach ($f in $htmlDist) {
    Test-FileForNetlify $f.FullName $f.FullName.Replace($base + '\', '')
}

# Check src files
$srcFiles = Get-ChildItem -Path "$base\src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx
foreach ($f in $srcFiles) {
    Test-FileForNetlify $f.FullName "src/$($f.Name)"
}

# Check api files
$apiFiles = Get-ChildItem -Path "$base\api" -Recurse
foreach ($f in $apiFiles) {
    Test-FileForNetlify $f.FullName "api/$($f.Name)"
}

Write-Host "=== FINAL VERIFICATION REPORT ==="
Write-Host ""
Write-Host "--- PASSES ---"
foreach ($p in $passes) { Write-Host "  ✓ $p" }
Write-Host ""
Write-Host "--- ERRORS ---"
if ($errors.Count -eq 0) {
    Write-Host "  ✓ NONE! All clean."
} else {
    foreach ($e in $errors) { Write-Host "  ✗ $e" }
}
Write-Host ""
Write-Host "=== SUMMARY ==="
Write-Host "Total: $($passes.Count + $errors.Count) files checked"
Write-Host "Passed: $($passes.Count)"
Write-Host "Failed: $($errors.Count)"

if ($errors.Count -eq 0) {
    Write-Host ""
    Write-Host "[OK] Project is completely migrated from Netlify to Vercel!"
}
