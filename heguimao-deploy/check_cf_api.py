import urllib.request, json, os

# 检查 Cloudflare Pages 部署状态
# 需要先获取 CF API Token

api_token = os.environ.get("CF_API_TOKEN", "")
account_id = os.environ.get("CF_ACCOUNT_ID", "")

if not api_token or not account_id:
    print("Need CF_API_TOKEN and CF_ACCOUNT_ID env vars")
    print("Get from: https://dash.cloudflare.com/profile/api-tokens")
    exit(1)

# 列出 Pages 项目
url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_token}"})

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        for proj in data.get("result", []):
            print(f"{proj['name']}: {proj['deployment_status']}")
except Exception as e:
    print(f"Error: {e}")
