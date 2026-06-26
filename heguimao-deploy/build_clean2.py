import subprocess, os, sys, shutil

os.chdir(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend")

# Build a completely clean environment - only essentials
clean_env = {}
clean_env["PATH"] = os.environ.get("PATH", "")
clean_env["SYSTEMROOT"] = os.environ.get("SYSTEMROOT", "")
clean_env["COMSPEC"] = os.environ.get("COMSPEC", "cmd.exe")
clean_env["WINDIR"] = os.environ.get("WINDIR", "C:\\Windows")
# Keep NODE_PATH if set
np = os.environ.get("NODE_PATH")
if np:
    clean_env["NODE_PATH"] = np

print("Env keys:", list(clean_env.keys()))

# Check if node/npm exist
print("node:", shutil.which("node"))
print("npm:", shutil.which("npm"))

result = subprocess.run(
    ["npm.cmd", "run", "build"],
    cwd=os.getcwd(),
    env=clean_env,
    capture_output=True,
    text=True
)

print("STDOUT:", result.stdout[-1000:] if len(result.stdout) > 1000 else result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[-500:])
print(f"Return code: {result.returncode}")
