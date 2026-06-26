import subprocess, os, sys, json

os.chdir(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend")

# Build completely clean environment
clean_env = {}
clean_env["PATH"] = os.environ.get("PATH", "")
clean_env["SYSTEMROOT"] = os.environ.get("SYSTEMROOT", "")
clean_env["COMSPEC"] = os.environ.get("COMSPEC", "cmd.exe")
clean_env["WINDIR"] = os.environ.get("WINDIR", "C:\\Windows")
np = os.environ.get("NODE_PATH")
if np:
    clean_env["NODE_PATH"] = np
clean_env["VITE_WORKER_URL"] = "https://heguimao-api.senliri028.workers.dev"

# Write a proper package.json check
print("package.json exists:", os.path.exists("package.json"))
with open("package.json") as f:
    pkg = json.load(f)
    build_script = pkg.get("scripts", {}).get("build", "")
    print("Build script:", build_script)

# Run vite directly via node
node_path = r"D:\longxia\qclaw\v0.2.28.587\resources\openclaw\config\bin\node\node.CMD"
vite_node_modules = os.path.join(os.getcwd(), "node_modules", ".bin", "vite.cmd")
vite_npx = os.path.join(os.getcwd(), "node_modules", ".bin", "npx.cmd")

print("vite.cmd exists:", os.path.exists(vite_node_modules))
print("npx.cmd exists:", os.path.exists(vite_npx))

# Try running npx vite build
result = subprocess.run(
    ["npx.cmd", "--yes", "vite", "build"],
    cwd=os.getcwd(),
    env=clean_env,
    capture_output=True,
    text=True,
    timeout=120
)

print("STDOUT:", result.stdout[-1000:] if len(result.stdout) > 1000 else result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[-500:])
print(f"Return code: {result.returncode}")

# Check if dist was updated
if os.path.exists("dist"):
    files = os.listdir("dist")
    print("Dist files:", files)
    for f in files:
        fp = os.path.join("dist", f)
        if os.path.isfile(fp):
            print(f"  {f}: {os.path.getsize(fp)} bytes")
