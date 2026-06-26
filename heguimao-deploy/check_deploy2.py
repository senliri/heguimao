import subprocess, os, sys, json

frontend_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend"
os.chdir(frontend_dir)

dist_files = os.listdir("dist")
print(f"Dist files: {dist_files}")

if "_routes.json" in dist_files:
    with open(os.path.join("dist", "_routes.json")) as f:
        routes = json.load(f)
        print(f"_routes.json: {len(routes.get('include', []))} include rules")
else:
    print("WARNING: _routes.json not found!")

if "_redirects" in dist_files:
    with open(os.path.join("dist", "_redirects")) as f:
        redirects = f.read()
        print(f"_redirects: {redirects.strip()}")
else:
    print("WARNING: _redirects not found!")

print("\n=== Wrangler Config ===")
with open("wrangler.json") as f:
    wrangler = json.load(f)
    print(f"Project name: {wrangler.get('name')}")

print("\n=== Wrangler Whoami ===")
result = subprocess.run(
    ["npx.cmd", "--yes", "wrangler", "whoami"],
    cwd=frontend_dir,
    capture_output=True,
    text=True,
    timeout=30
)
output = result.stdout.strip() or result.stderr.strip()
print(output[:200] if len(output) > 200 else output)
