# Cloudflare Pages 部署脚本（简化版）
$frontendDir = "D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend"
Set-Location $frontendDir

Write-Host "=== Cloudflare Pages 部署 ===" -ForegroundColor Cyan
Write-Host "Working dir: $PWD" -ForegroundColor Yellow

# 检查 dist 目录
if (Test-Path "dist") {
    Write-Host "✓ dist 目录存在" -ForegroundColor Green
    Get-ChildItem "dist" | Select-Object Name, Length | Format-Table -AutoSize
} else {
    Write-Host "✗ dist 目录不存在" -ForegroundColor Red
    Write-Host "请先运行: cd frontend && npm run build"
    exit 1
}

# 检查 _routes.json 和 _redirects
$routesJson = Test-Path "dist\_routes.json"
$redirects = Test-Path "dist\_redirects"

if ($routesJson) {
    Write-Host "✓ _routes.json 存在" -ForegroundColor Green
} else {
    Write-Host "✗ _routes.json 缺失" -ForegroundColor Red
}

if ($redirects) {
    Write-Host "✓ _redirects 存在" -ForegroundColor Green
} else {
    Write-Host "✗ _redirects 缺失" -ForegroundColor Red
}

# 检查 wrangler 是否已安装
try {
    $wranglerVersion = wrangler --version 2>&1
    Write-Host "`nWrangler 版本: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "`nWrangler 未安装，请先运行: npm install -g wrangler" -ForegroundColor Red
    Write-Host "或者使用 Cloudflare Pages 的 Git 集成自动部署"
    exit 1
}

# 登录 wrangler
Write-Host "`n正在登录 wrangler..." -ForegroundColor Cyan
wrangler login

# 部署
Write-Host "`n开始部署到 Cloudflare Pages..." -ForegroundColor Cyan
wrangler pages deploy dist --project-name=heguimao
