import re
import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
raw = result.stdout
lines = raw.split(b"\n")

# Find all zh values and check for closing quote
for i, line in enumerate(lines, 1):
    if b', zh:' in line:
        m = re.search(rb',\s*zh:\s*"(.*)"', line)
        if not m:
            # No closing quote
            m2 = re.search(rb',\s*zh:\s*"', line)
            if m2:
                rest = line[m2.end():]
                print(f"Line {i}: no closing quote, rest={repr(rest[:80])}")
