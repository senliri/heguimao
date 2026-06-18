$base = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco'

Write-Host "=== Checking key files for netlify.app domain ==="

$filesToCheck = @(
    "$base\index.html",
    "$base\public\robots.txt",
    "$base\public\sitemap.xml",
    "$base\vercel.json",
    "$base\package.json",
    "$base\vite.config.ts",
    "$base\.env.example",
    "$base\README.md",
    "$base\dist\index.html",
    "$base\dist\404.html",
    "$base\dist\sitemap.xml",
    "$base\dist\robots.txt",
    "$base\src\App.tsx",
    "$base\src\main.tsx",
    "$base\src\lib\auth.ts",
    "$base\src\lib\agent.ts",
    "$base\src\lib\store.ts",
    "$base\src\lib\search.ts",
    "$base\src\pages\Home.tsx",
    "$base\src\pages\Report.tsx",
    "$base\src\pages\AuthPage.tsx",
    "$base\src\components\Layout.tsx",
    "$base\api\chat.js",
    "$base\api\send-email.js",
    "$base\api\feedback.js",
    "$base\api\health.js"
)

$foundNetlify = $false
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match 'catcompliance\.netlify\.app|netlify\.app/') {
            Write-Host "  FOUND netlify.app in: $($file -replace [regex]::Escape($base), '')"
            $foundNetlify = $true
        }
    }
}

if (-not $foundNetlify) {
    Write-Host "  SUCCESS: No netlify.app domain references found!"
}

Write-Host ""
Write-Host "=== Checking for vercel.app references ==="
$vercelCount = 0
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $count = ([regex]::Matches($content, 'mini-disco\.vercel\.app')).Count
        if ($count -gt 0) {
            $rel = ($file -replace [regex]::Escape($base), '').Replace('\', '/')
            Write-Host "  $rel : $count"
            $vercelCount += $count
        }
    }
}
Write-Host ""
Write-Host "Total vercel.app: $vercelCount"
Write-Host ""
Write-Host "=== MIGRATION STATUS ==="
if (-not $foundNetlify) {
    Write-Host "[COMPLETE] All netlify.app references removed!"
    Write-Host "[READY] Project is fully migrated to Vercel."
} else {
    Write-Host "[INCOMPLETE] Still has netlify.app references."
}
