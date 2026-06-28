import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
raw = result.stdout
lines = raw.split(b"\n")

# Find lines WITH closing quote for zh values
good = 0
bad = 0
for i, line in enumerate(lines, 1):
    if b', zh:' in line:
        import re
        m = re.search(rb',\s*zh:\s*"(.*)"', line)
        if m:
            good += 1
        else:
            bad += 1

print(f"Lines with closing quote: {good}")
print(f"Lines without closing quote: {bad}")
