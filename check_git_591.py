# Check git version of line 591
import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
lines = result.stdout.split(b"\n")
line591 = lines[590]
print(f"Git line 591: {repr(line591)}")
print(f"Git line 591 hex: {line591.hex()}")

# Check the character after the arrow
#锛 = \xe9\x88\xab = 3 bytes
# After 锛: what's the next byte?
pos = line591.find(b'\xe9\x88\xab')
if pos >= 0:
    print(f"\n锛 at pos {pos}")
    print(f"Next 3 bytes after 锛: {repr(line591[pos+3:pos+6])}")
    print(f"Byte at pos {pos+3}: 0x{line591[pos+3]:02x} = {chr(line591[pos+3])!r}")
