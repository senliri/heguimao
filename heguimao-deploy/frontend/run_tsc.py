#!/usr/bin/env python3
"""Run tsc --noEmit to check TypeScript types"""
import subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8')

env = os.environ.copy()

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
