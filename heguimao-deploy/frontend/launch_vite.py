#!/usr/bin/env python3
"""Launch Vite dev server, wait for ready, then open browser"""
import subprocess, sys, os, time, webbrowser
sys.stdout.reconfigure(encoding='utf-8')

os.chdir(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend")
env = os.environ.copy()

print("Starting Vite on port 5173...")
proc = subprocess.Popen(
    [sys.executable, "-c", """
import subprocess, sys, os
env = {k:v for k,v in os.environ.items() if '(' not in k and ')' not in k}
r = subprocess.run(["node", "node_modules/vite/bin/vite.js", "--port", "5173", "--host", "127.0.0.1"], env=env)
sys.exit(r.returncode)
"""],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8'
)

# Wait for ready signal
ready = False
for line in iter(proc.stdout.readline, ''):
    print(line.rstrip())
    if '5173' in line and ('Local' in line or 'ready' in line):
        ready = True

if ready:
    print("\nOpening browser...")
    time.sleep(2)
    webbrowser.open("http://127.0.0.1:5173")
    print("Browser opened at http://127.0.0.1:5173")
else:
    print("WARNING: Could not detect Vite ready signal")

proc.wait()
