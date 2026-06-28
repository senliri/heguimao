import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
lines = result.stdout.split(b"\n")

# Find a line WITH closing quote
for i, line in enumerate(lines, 1):
    if b', zh:' in line:
        import re
        m = re.search(rb',\s*zh:\s*"(.*)"', line)
        if m:
            print(f"Line {i} (HAS closing quote): {line[:100]}")
            break

# Find a line WITHOUT closing quote
for i, line in enumerate(lines, 1):
    if b', zh:' in line:
        import re
        m = re.search(rb',\s*zh:\s*"(.*)"', line)
        if not m:
            print(f"Line {i} (NO closing quote): {line[:100]}")
            break
