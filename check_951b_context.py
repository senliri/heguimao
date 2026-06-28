import subprocess
import re

result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
orig = result.stdout.decode("utf-8", errors="replace")

# Find all occurrences of U+951B (锛) and show context
count = 0
for m in re.finditer('\u951b', orig):
    pos = m.start()
    ctx = orig[max(0,pos-20):pos+21].replace('\n', '\\n')
    count += 1
    if count <= 10:
        print(f"U+951B #{count} at pos {pos}: ...{ctx}...")

print(f"\nTotal U+951B: {count}")
