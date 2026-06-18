import subprocess
import json

# Get current Vercel env vars
result = subprocess.run(
    ['npx', 'vercel', 'env', 'ls', 'production'],
    capture_output=True, text=True,
    cwd=r'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco'
)

vercel_lines = result.stdout.strip().split('\n')[3:]  # Skip header lines
vercel_vars = {}
for line in vercel_lines:
    parts = line.split()
    if len(parts) >= 2:
        vercel_vars[parts[0]] = True

print("=" * 70)
print("环境变量状态检查")
print("=" * 70)
print()

# Define all variables with their importance
vars_info = {
    'VITE_AGNES_BASE_URL': {
        'desc': 'AI API 基础地址',
        'default': 'https://apihub.agnes-ai.com/v1/chat/completions',
        'required': True,
        'priority': 'P0 - 必须设置，否则 AI 功能不可用'
    },
    'VITE_AGNES_API_KEY': {
        'desc': 'AI API 密钥',
        'default': '(必填)',
        'required': True,
        'priority': 'P0 - 必须设置，否则 AI 请求被拒'
    },
    'AUTH_PASSWORD': {
        'desc': 'API 认证密码',
        'default': '(必填)',
        'required': True,
        'priority': 'P0 - 如果设置了，AI 请求需要密码'
    },
    'SMTP_HOST': {
        'desc': 'SMTP 服务器地址',
        'default': 'smtp.126.com',
        'required': False,
        'priority': 'P1 - 密码重置/反馈邮件需要'
    },
    'SMTP_PORT': {
        'desc': 'SMTP 端口',
        'default': '465 (SSL)',
        'required': False,
        'priority': 'P1 - 配合 SMTP_HOST 使用'
    },
    'SMTP_USER': {
        'desc': 'SMTP 用户名',
        'default': 'senlin2027@126.com',
        'required': False,
        'priority': 'P1 - 已在 Vercel 中设置'
    },
    'SMTP_PASS': {
        'desc': 'SMTP 密码/授权码',
        'default': '(必填)',
        'required': False,
        'priority': 'P1 - 已在 Vercel 中设置'
    },
    'SMTP_FROM': {
        'desc': '发件人邮箱地址',
        'default': '同 SMTP_USER',
        'required': False,
        'priority': 'P2 - 可选，默认同 SMTP_USER'
    },
    'FEEDBACK_EMAIL': {
        'desc': '反馈邮件接收地址',
        'default': 'senlin2027@126.com',
        'required': False,
        'priority': 'P2 - 可选，用于收集用户反馈'
    },
    'VITE_AGNES_MODEL': {
        'desc': 'AI 模型名称',
        'default': 'agnes-2.0-flash',
        'required': False,
        'priority': 'P3 - 可选，有代码默认值'
    },
    'VITE_DEMO_ENABLED': {
        'desc': 'Demo 模式开关',
        'default': 'false',
        'required': False,
        'priority': 'P3 - 可选，代码默认 false'
    },
    'VITE_DEMO_EMAIL': {
        'desc': 'Demo 登录邮箱',
        'default': 'demo@compliance.cat',
        'required': False,
        'priority': 'P3 - 可选，代码有默认值'
    },
    'VITE_DEMO_PASSWORD': {
        'desc': 'Demo 登录密码',
        'default': 'demo123',
        'required': False,
        'priority': 'P3 - 可选，代码有默认值'
    },
    'VITE_DEMO_NAME': {
        'desc': 'Demo 显示名称',
        'default': '演示用户',
        'required': False,
        'priority': 'P3 - 可选，代码有默认值'
    },
    'VITE_APP_NAME': {
        'desc': '应用显示名称',
        'default': '合规猫',
        'required': False,
        'priority': 'P3 - 可选，代码有默认值'
    },
}

print(f"{'状态':<10} {'优先级':<40} {'变量名':<25} {'说明'}")
print("-" * 70)

for var, info in sorted(vars_info.items()):
    in_vercel = var in vercel_vars
    
    if in_vercel:
        status = "[已设置]"
        priority_str = ""
    elif info['required']:
        status = "[需设置]"
        priority_str = f"\n  *** {info['priority']} ***"
    else:
        status = "[可选]"
        priority_str = f"\n  默认: {info['default']}"
    
    print(f"{status:<10} {priority_str:<40} {var:<25} {info['desc']}")
    if not in_vercel and not info['required']:
        print(f"{'':10} {'':40} {'':25} 默认值: {info['default']}")
    print()

print("=" * 70)
print("总结:")
print("=" * 70)

missing_required = [v for v, i in vars_info.items() if v not in vercel_vars and i['required']]
missing_optional = [v for v, i in vars_info.items() if v not in vercel_vars and not i['required']]

if missing_required:
    print(f"\n[!] 需要立即手动添加 ({len(missing_required)} 个):")
    for v in missing_required:
        print(f"    - {vars_info[v]['desc']} ({v})")
else:
    print("\n[✓] 所有必需的环境变量都已设置!")

if missing_optional:
    print(f"\n[?] 可选变量 ({len(missing_optional)} 个，可按需添加):")
    for v in missing_optional:
        print(f"    - {vars_info[v]['desc']} ({v})")
        print(f"      默认值: {vars_info[v]['default']}")

print()
