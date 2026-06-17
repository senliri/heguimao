$dist = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco\dist'
$errors = @()
$passes = @()

# 1. Check all HTML files for netlify
$htmlFiles = Get-ChildItem -Path $dist -Filter '*.html' -Recurse
foreach ($f in $htmlFiles) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match 'netlify') {
        $errors += "FAIL: $($f.FullName.Replace($dist, '')) contains netlify"
    } else {
        $passes += "PASS: $($f.FullName.Replace($dist, '')) - no netlify"
    }
    $vc = [regex]::Matches($content, 'mini-disco\.vercel\.app').Count
    if ($vc -gt 0) {
        $passes += "  -> $vc vercel.app references in $($f.FullName.Replace($dist, ''))"
    }
}

# 2. Check sitemap.xml
$sitemap = Get-Content "$dist\sitemap.xml" -Raw
if ($sitemap -match 'netlify') {
    $errors += "FAIL: sitemap.xml contains netlify"
} else {
    $passes += "PASS: sitemap.xml - no netlify"
}

# 3. Check robots.txt
$robots = Get-Content "$dist\robots.txt" -Raw
if ($robots -match 'netlify') {
    $errors += "FAIL: robots.txt contains netlify"
} else {
    $passes += "PASS: robots.txt - no netlify"
}

# 4. Check vercel.json
$vercel = Get-Content "$dist/../vercel.json" -Raw
if ($vercel -match 'netlify') {
    $errors += "FAIL: vercel.json contains netlify"
} else {
    $passes += "PASS: vercel.json - no netlify"
}

# 5. Check all source files for netlify
$srcFiles = Get-ChildItem -Path 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco\src' -Recurse -Include '*.ts', '*.tsx', '*.js', '*.jsx'
foreach ($f in $srcFiles) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match 'netlify') {
        $errors += "FAIL: src/$($f.Name.Replace($dist, '')) contains netlify"
    }
}

# 6. Check api files for netlify
$apiFiles = Get-ChildItem -Path 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco\api' -Recurse
foreach ($f in $apiFiles) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match 'netlify') {
        $errors += "FAIL: api/$($f.Name.Replace($dist, '')) contains netlify"
    }
}

# 7. Check package.json
$pkg = Get-Content "$dist/../package.json" -Raw
if ($pkg -match 'netlify') {
    $errors += "FAIL: package.json contains netlify"
} else {
    $passes += "PASS: package.json - no netlify"
}

# 8. Check vite.config.ts
$vite = Get-Content "$dist/../vite.config.ts" -Raw
if ($vite -match 'netlify') {
    $errors += "FAIL: vite.config.ts contains netlify"
} else {
    $passes += "PASS: vite.config.ts - no netlify"
}

# 9. Check .env.example
$envEx = Get-Content "$dist/../.env.example" -Raw
if ($envEx -match 'netlify') {
    $errors += "FAIL: .env.example contains netlify"
} else {
    $passes += "PASS: .env.example - no netlify"
}

# 10. Check README.md
$readme = Get-Content "$dist/../README.md" -Raw
if ($readme -match 'netlify') {
    $errors += "WARN: README.md contains netlify references (may be migration docs)"
} else {
    $passes += "PASS: README.md - no netlify"
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
Write-Host "Summary: $($passes.Count) passed, $($errors.Count) failed"
