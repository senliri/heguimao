import subprocess
import re

# Get original file from git
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
orig = result.stdout.decode("utf-8", errors="replace")

# Count braces
opens = orig.count('{')
closes = orig.count('}')
print(f"Original: {{ = {opens}, }} = {closes}, diff = {opens - closes}")

# Count quotes
quotes = orig.count('"')
print(f"Original quotes: {quotes}")

# Check for fragments
lines = orig.split('\n')
fragments = 0
for i, line in enumerate(lines, 1):
    if line.strip().startswith(', zh:'):
        fragments += 1
        print(f"Fragment at line {i}: {line[:60]}")

print(f"\nTotal fragments: {fragments}")
