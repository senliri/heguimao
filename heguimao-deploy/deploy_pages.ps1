# Cloudflare Pages 部署脚本
# 使用方法：在 PowerShell 中运行，需要安装 wrangler CLI

# 检查 wrangler 是否已安装
try {
    $wranglerVersion = wrangler --version 2>&1 | Select-String -Pattern "wrangler" -ErrorAction SilentlyContinue
    if ($wranglerVersion) {
        Write-Host "Wrangler found: $wranglerVersion"
    } else {
        Write-Host "Wrangler not found in PATH"
    }
} catch {
    Write-Host "Wrangler not installed. Install with: npm install -g wrangler"
}

# 切换到前端目录
$frontendDir = "D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend"
Set-Location $frontendDir

# 检查 dist 目录
if (Test-Path "dist") {
    Write-Host "`nDist directory found!"
    Get-ChildItem "dist" | Select-Object Name, Length | Format-Table -AutoSize
} else {
    Write-Host "`nERROR: dist directory not found!"
    Write-Host "Run 'npm run build' first"
    exit 1
}

# 检查 _routes.json 和 _redirects
if (Test-Path "dist\_routes.json") {
    Write-Host "`n_routes.json found in dist/" -ForegroundColor Green
} else {
    Write-Host "`nWARNING: _routes.json NOT found in dist/" -ForegroundColor Yellow
}

if (Test-Path "dist\_redirects") {
    Write-Host "_redirects found in dist/" -ForegroundColor Green
} else {
    Write-Host "WARNING: _redirects NOT found in dist/" -ForegroundColor Yellow
}

# 部署到 Cloudflare Pages
Write-Host "`nDeploying to Cloudflare Pages..." -ForegroundColor Cyan
wrangler pages deploy dist --project-name=heguimao
