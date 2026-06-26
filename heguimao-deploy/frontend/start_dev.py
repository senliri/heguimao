#!/usr/bin/env python3
"""Start Vite dev server and open browser"""
import subprocess, sys, os, threading, time
sys.stdout.reconfigure(encoding='utf-8')

env = os.environ.copy()

# Start Vite dev server
vite_proc = subprocess.Popen(
    [sys.executable, "-c", """
import subprocess, sys, os
env = os.environ.copy()
r = subprocess.run([
    "node", "node_modules/vite/bin/vite.js", "--host", "127.0.0.1"
], cwd=os.getcwd(), env=env)
sys.exit(r.returncode)
"""],
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend",
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8'
)

# Wait for server to be ready
time.sleep(3)

# Open browser
os.system('start http://127.0.0.1:5173')

print("Vite dev server started at http://127.0.0.1:5173")
print("Browser should have opened automatically.")
print("Press Ctrl+C to stop.")

# Keep alive
try:
    vite_proc.wait()
except KeyboardInterrupt:
    vite_proc.terminate()
    print("\nStopped.")
