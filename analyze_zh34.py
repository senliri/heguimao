import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
lines = result.stdout.split(b"\n")
line34 = lines[33]

# Find zh value start
import re
m = re.search(rb',\s*zh:\s*"', line34)
if m:
    zh_start = m.end()
    rest = line34[zh_start:]
    print(f"zh value start (byte {zh_start}): {repr(rest[:100])}")
    print(f"rest hex: {rest.hex()}")
    
    # Find where raw bytes start
    raw_positions = [i for i in range(len(rest)) if rest[i] > 127]
    print(f"\nRaw byte positions in zh value: {raw_positions}")
    for p in raw_positions:
        print(f"  pos {p}: {repr(rest[p:p+10])}")
