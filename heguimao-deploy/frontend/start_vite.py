#!/usr/bin/env python3
import subprocess, os, time, sys
sys.stdout.reconfigure(encoding='utf-8')

os.chdir(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend")
env = os.environ.copy()

print("Starting Vite dev server...")
proc = subprocess.Popen(
    ["node", "node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
    env=env,
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    text=True, encoding='utf-8'
)

# Wait for ready
for line in iter(proc.stdout.readline, ''):
    print(line.rstrip())
    if 'Local:' in line or 'localhost' in line or 'ready' in line.lower():
        print("\nOpening browser...")
        time.sleep(1)
        os.system('start http://127.0.0.1:5173')
        break

print("\nDev server running. Press Ctrl+C to stop.")
proc.wait()
