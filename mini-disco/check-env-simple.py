import sys

# Hardcoded based on: npx vercel env ls production
# AUTH_PASSWORD, SMTP_USER, SMTP_PASS, VITE_AGNES_API_KEY, VITE_AI_BASE_URL
vercel_vars = {'AUTH_PASSWORD', 'SMTP_USER', 'SMTP_PASS', 'VITE_AGNES_API_KEY', 'VITE_AI_BASE_URL'}

# All env vars referenced in code
vars_info = {
    'VITE_AGNES_BASE_URL': {'desc': 'AI API 基础地址', 'default': 'https://apihub.agnes-ai.com/v1/chat/completions', 'required': True},
    'VITE_AGNES_API_KEY': {'desc': 'AI API 密钥', 'default': '(必填)', 'required': True},
    'AUTH_PASSWORD': {'desc': 'API 认证密码', 'default': '(必填)', 'required': True},
    'SMTP_HOST': {'desc': 'SMTP 服务器', 'default': 'smtp.126.com', 'required': False},
    'SMTP_PORT': {'desc': 'SMTP 端口', 'default': '465', 'required': False},
    'SMTP_USER': {'desc': 'SMTP 用户名', 'default': 'senlin2027@126.com', 'required': False},
    'SMTP_PASS': {'desc': 'SMTP 密码', 'default': '(必填)', 'required': False},
    'SMTP_FROM': {'desc': '发件人邮箱', 'default': '同 SMTP_USER', 'required': False},
    'FEEDBACK_EMAIL': {'desc': '反馈接收邮箱', 'default': 'senlin2027@126.com', 'required': False},
    'VITE_AGNES_MODEL': {'desc': 'AI 模型名', 'default': 'agnes-2.0-flash', 'required': False},
    'VITE_DEMO_ENABLED': {'desc': 'Demo 开关', 'default': 'false', 'required': False},
    'VITE_DEMO_EMAIL': {'desc': 'Demo 邮箱', 'default': 'demo@compliance.cat', 'required': False},
    'VITE_DEMO_PASSWORD': {'desc': 'Demo 密码', 'default': 'demo123', 'required': False},
    'VITE_DEMO_NAME': {'desc': 'Demo 名称', 'default': '演示用户', 'required': False},
    'VITE_APP_NAME': {'desc': '应用名称', 'default': '合规猫', 'required': False},
}

print('=' * 80)
print('环境变量状态检查')
print('=' * 80)
print()

missing_required = []
missing_optional = []

for var, info in sorted(vars_info.items()):
    in_vercel = var in vercel_vars
    if in_vercel:
        print(f'[已设置] {var:<25} {info["desc"]}')
    elif info['required']:
        print(f'[需要设置] {var:<25} {info["desc"]}')
        print(f'           默认值: {info["default"]}')
        print(f'           *** 不设置将导致功能异常 ***')
        missing_required.append(var)
    else:
        print(f'[可选] {var:<25} {info["desc"]}')
        print(f'       默认值: {info["default"]}')
        missing_optional.append(var)
    print()

print('=' * 80)
print('总结')
print('=' * 80)

if missing_required:
    print(f'\n[!] 需要立即手动添加 ({len(missing_required)} 个):')
    for v in missing_required:
        print(f'    - {vars_info[v]["desc"]} ({v})')
    print()
    print('  添加方法 1 - Vercel Dashboard:')
    print('    1. 打开 https://vercel.com/senliris-projects/mini-disco/settings/environment-variables')
    print('    2. 点击 "Add New"')
    print('    3. 输入变量名和值，Environment 选 "Production"')
    print()
    print('  添加方法 2 - 命令行:')
    for v in missing_required:
        print(f'    npx vercel env add {v} production')
    print()

if missing_optional:
    print(f'[?] 可选变量 ({len(missing_optional)} 个，代码有默认值，可按需覆盖):')
    for v in missing_optional:
        print(f'    - {vars_info[v]["desc"]} ({v}) = {vars_info[v]["default"]}')

print()
