#!/usr/bin/env python3
import subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8')

env = os.environ.copy()

# Find node
node_paths = [
    r"C:\Program Files\nodejs\node.exe",
    "node",
]

node_exe = None
for p in node_paths:
    try:
        r = subprocess.run([p, "--version"], capture_output=True, text=True, env=env)
        if r.returncode == 0:
            node_exe = p
            print(f"Found node at: {node_exe} ({r.stdout.strip()})")
            break
    except:
        pass

if not node_exe:
    print("Node not found!")
    sys.exit(1)

vite_bin = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\node_modules\vite\bin\vite.js"

result = subprocess.run(
    [node_exe, vite_bin, "build"],
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend",
    capture_output=True, text=True, encoding='utf-8',
    env=env
)
print("STDOUT:")
print(result.stdout[-3000:] if len(result.stdout) > 3000 else result.stdout)
print("\nSTDERR:")
print(result.stderr[-3000:] if len(result.stderr) > 3000 else result.stderr)
print(f"\nReturn code: {result.returncode}")
