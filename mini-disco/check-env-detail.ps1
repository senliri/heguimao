# 分析每个环境变量在代码中的使用情况
$base = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco'

$vars = @{
    'VITE_AGNES_BASE_URL' = @{ desc = 'AI API 基础地址'; default = 'https://apihub.agnes-ai.com/v1/chat/completions'; required = $true }
    'VITE_AGNES_API_KEY'  = @{ desc = 'AI API 密钥'; default = '(必填)'; required = $true }
    'VITE_AGNES_MODEL'    = @{ desc = 'AI 模型名'; default = 'agnes-2.0-flash'; required = $false }
    'AUTH_PASSWORD'       = @{ desc = 'API 认证密码'; default = '(必填)'; required = $true }
    'SMTP_HOST'           = @{ desc = 'SMTP 服务器'; default = 'smtp.126.com'; required = $false }
    'SMTP_PORT'           = @{ desc = 'SMTP 端口'; default = '465'; required = $false }
    'SMTP_USER'           = @{ desc = 'SMTP 用户名'; default = 'senlin2027@126.com'; required = $false }
    'SMTP_PASS'           = @{ desc = 'SMTP 密码/授权码'; default = '(必填)'; required = $false }
    'SMTP_FROM'           = @{ desc = '发件人邮箱'; default = 'SMTP_USER'; required = $false }
    'FEEDBACK_EMAIL'      = @{ desc = '反馈接收邮箱'; default = 'senlin2027@126.com'; required = $false }
    'VITE_DEMO_ENABLED'   = @{ desc = 'Demo 模式开关'; default = 'false'; required = $false }
    'VITE_DEMO_EMAIL'     = @{ desc = 'Demo 登录邮箱'; default = 'demo@compliance.cat'; required = $false }
    'VITE_DEMO_PASSWORD'  = @{ desc = 'Demo 登录密码'; default = 'demo123'; required = $false }
    'VITE_DEMO_NAME'      = @{ desc = 'Demo 显示名称'; default = '演示用户'; required = $false }
    'VITE_APP_NAME'       = @{ desc = '应用名称'; default = '合规猫'; required = $false }
    'AGNES_API_URL'       = @{ desc = 'AGNES API 地址(旧)'; default = '同 VITE_AGNES_BASE_URL'; required = $false }
    'AGNES_API_KEY'       = @{ desc = 'AGNES API 密钥(旧)'; default = '同 VITE_AGNES_API_KEY'; required = $false }
    'AGNES_BASE_URL'      = @{ desc = 'AGNES 基础地址(旧)'; default = '同 VITE_AGNES_BASE_URL'; required = $false }
    'AGNES_MODEL'         = @{ desc = 'AGNES 模型(旧)'; default = 'agnes-2.0-flash'; required = $false }
    'APP_NAME'            = @{ desc = '应用名(旧)'; default = '合规猫'; required = $false }
    'DEMO_EMAIL'          = @{ desc = 'Demo 邮箱(旧)'; default = '同 VITE_DEMO_EMAIL'; required = $false }
    'DEMO_NAME'           = @{ desc = 'Demo 名称(旧)'; default = '同 VITE_DEMO_NAME'; required = $false }
    'DEMO_PASSWORD'       = @{ desc = 'Demo 密码(旧)'; default = '同 VITE_DEMO_PASSWORD'; required = $false }
    'DEMO_ENABLED'        = @{ desc = 'Demo 开关(旧)'; default = '同 VITE_DEMO_ENABLED'; required = $false }
    'VERCEL_URL'          = @{ desc = 'Vercel 域名(自动)'; default = '自动设置'; required = $false }
}

Write-Host "=== 环境变量状态检查 ==="
Write-Host ""

$vercelVars = @('SMTP_USER', 'SMTP_PASS', 'VITE_AGNES_API_KEY', 'VITE_AI_BASE_URL', 'AUTH_PASSWORD')

foreach ($pair in $vars.GetEnumerator() | Sort-Object Key) {
    $v = $pair.Key
    $info = $pair.Value
    $inVercel = $v -in $vercelVars
    
    if ($inVercel) {
        Write-Host "  [已设置] $v"
        Write-Host "           说明: $($info.desc)"
        Write-Host "           默认值: $($info.default)"
    } elseif ($info.required) {
        Write-Host "  [⚠️ 需要设置] $v"
        Write-Host "               说明: $($info.desc)"
        Write-Host "               默认值: $($info.default)"
        Write-Host "               *** 必须手动添加 ***"
    } else {
        Write-Host "  [可选] $v"
        Write-Host "         说明: $($info.desc)"
        Write-Host "         默认值: $($info.default)"
    }
    Write-Host ""
}
