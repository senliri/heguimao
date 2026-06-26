import subprocess, os, sys, json

# 设置工作目录
frontend_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend"
os.chdir(frontend_dir)

# 检查 dist 文件
dist_files = os.listdir("dist")
print(f"Dist files: {dist_files}")

# 检查 _routes.json 和 _redirects
if "_routes.json" in dist_files:
    with open("_routes.json") as f:
        routes = json.load(f)
        print(f"_routes.json: {len(routes.get('include', []))} include rules")
else:
    print("WARNING: _routes.json not found!")

if "_redirects" in dist_files:
    with open("_redirects") as f:
        redirects = f.read()
        print(f"_redirects: {redirects.strip()}")
else:
    print("WARNING: _redirects not found!")

# 尝试通过 Cloudflare Pages API 部署
print("\n=== Deploying to Cloudflare Pages ===")

# 首先检查 wrangler 配置
with open("wrangler.json") as f:
    wrangler = json.load(f)
    print(f"Project name: {wrangler.get('name')}")

# 列出所有 wrangler 配置
print("\n=== Wrangler Config ===")
result = subprocess.run(
    ["npx.cmd", "--yes", "wrangler", "whoami"],
    cwd=frontend_dir,
    capture_output=True,
    text=True,
    timeout=30
)
print("Wrangler whoami:", result.stdout.strip() or result.stderr.strip())
