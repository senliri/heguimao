#!/usr/bin/env python3
"""Run tsc --noEmit via node directly"""
import subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8')

env = os.environ.copy()

# Find tsc
tsc_path = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\node_modules\typescript\bin\tsc.js"
node_path = "node"

if os.path.exists(tsc_path):
    print(f"Found tsc at: {tsc_path}")
    result = subprocess.run(
        [node_path, tsc_path, "--noEmit"],
        cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend",
        capture_output=True, text=True, encoding='utf-8',
        env=env
    )
else:
    print("tsc.js not found, trying npx...")
    result = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend",
        capture_output=True, text=True, encoding='utf-8',
        env=env
    )

print("STDOUT:")
print(result.stdout[-3000:] if len(result.stdout) > 3000 else result.stdout)
print("\nSTDERR:")
print(result.stderr[-3000:] if len(result.stderr) > 3000 else result.stderr)
print(f"\nReturn code: {result.returncode}")
