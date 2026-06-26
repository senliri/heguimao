#!/usr/bin/env python3
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(
    [sys.executable, "-m", "node", "--version"],
    capture_output=True, text=True
)
print(f"Node check: {result.stdout.strip()} {result.stderr.strip()}")

# Try running vite build
result = subprocess.run(
    ["npx", "vite", "build"],
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend",
    capture_output=True, text=True, encoding='utf-8'
)
print("STDOUT:")
print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)
print("STDERR:")
print(result.stderr[-2000:] if len(result.stderr) > 2000 else result.stderr)
print(f"Return code: {result.returncode}")
