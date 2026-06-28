import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
lines = result.stdout.split(b"\n")
print(f"Line 16: {repr(lines[15])}")
print(f"Line 16 hex: {lines[15].hex()}")
