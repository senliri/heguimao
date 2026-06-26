import subprocess, os, sys

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

# Set VITE_WORKER_URL explicitly
clean_env["VITE_WORKER_URL"] = "https://heguimao-api.senliri028.workers.dev"

print("PATH:", clean_env["PATH"])

# Run node directly with npm
npm_path = r"D:\longxia\qclaw\v0.2.28.587\resources\openclaw\config\bin\node\npm.CMD"
print("npm path exists:", os.path.exists(npm_path))

result = subprocess.run(
    [npm_path, "run", "build"],
    cwd=os.getcwd(),
    env=clean_env,
    capture_output=True,
    text=True
)

print("STDOUT:", result.stdout[-1000:] if len(result.stdout) > 1000 else result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[-500:])
print(f"Return code: {result.returncode}")
