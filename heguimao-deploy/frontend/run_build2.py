#!/usr/bin/env python3
import subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8')

env = os.environ.copy()
# Remove problematic env vars that cause PowerShell injection issues
for k in list(env.keys()):
    if '(' in k or ')' in k:
        del env[k]

result = subprocess.run(
    ["npx", "vite", "build"],
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend",
    capture_output=True, text=True, encoding='utf-8',
    env=env
)
print("STDOUT:")
print(result.stdout[-3000:] if len(result.stdout) > 3000 else result.stdout)
print("\nSTDERR:")
print(result.stderr[-3000:] if len(result.stderr) > 3000 else result.stderr)
print(f"\nReturn code: {result.returncode}")
