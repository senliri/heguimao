import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
lines = result.stdout.split(b"\n")
line591 = lines[590]
print(f"Git line 591: {repr(line591)}")
print(f"Hex: {line591.hex()}")

# Find U+922B
idx = line591.find(b'\xe9\x88\xab')
if idx >= 0:
    print(f"\nU+922B (锛) at pos {idx}")
    print(f"Context: {repr(line591[idx:idx+10])}")
else:
    print("\nU+922B not found in git version")
