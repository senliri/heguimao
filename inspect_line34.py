import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
lines = result.stdout.split(b"\n")
line34 = lines[33]
print(f"Line 34 ({len(line34)} bytes):")
print(repr(line34[:200]))
print(f"...")
print(repr(line34[-200:]))
print()

# Find all non-ASCII bytes
non_ascii = [(i, line34[i]) for i in range(len(line34)) if line34[i] > 127]
print(f"Non-ASCII byte positions: {len(non_ascii)}")
for pos, byte in non_ascii[:20]:
    print(f"  pos {pos}: 0x{byte:02x}")
