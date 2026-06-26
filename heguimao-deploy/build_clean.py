import subprocess, os, sys

os.chdir(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend")

# Clean env vars that might have parentheses
clean_env = os.environ.copy()
# Remove any problematic vars
for k in list(clean_env.keys()):
    if '(' in clean_env[k] or ')' in clean_env[k]:
        print(f"Removing problematic env var: {k}")
        del clean_env[k]

result = subprocess.run(
    [sys.executable, "-m", "npm", "run", "build"],
    env=clean_env,
    capture_output=True,
    text=True
)

# Try npm.cmd directly
result2 = subprocess.run(
    ["npm.cmd", "run", "build"],
    cwd=os.getcwd(),
    env=clean_env,
    capture_output=True,
    text=True
)

print(result2.stdout[-500:] if len(result2.stdout) > 500 else result2.stdout)
if result2.stderr:
    print("STDERR:", result2.stderr[-500:])
print(f"Return code: {result2.returncode}")
