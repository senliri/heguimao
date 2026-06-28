import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

# Restore original
import subprocess
subprocess.run(["git", "restore", filepath], cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy")

# Read raw bytes
with open(filepath, "rb") as f:
    raw = f.read()

# The file was originally written with correct UTF-8 but some bytes got corrupted
# when read/written with GBK encoding on Windows.
# 
# Key insight: the corruption is BYTE-LEVEL. UTF-8 bytes were interpreted as GBK.
# For example, → (U+2192) in UTF-8 is E2 86 92.
# If read as GBK: E2 = 閫, 86 = (invalid), 92 = (invalid)
# 
# But the actual corruption we see is: 锛 (U+951B), 鈥 (U+9225), 锛 (U+922B)
# These are characters that appear when UTF-8 bytes are misinterpreted.
#
# Strategy: identify all non-ASCII characters in the file and map them to correct ones.

# Read as UTF-8 (Python handles this fine)
text = raw.decode("utf-8")

# Find ALL non-ASCII characters and their positions
non_ascii = {}
for i, ch in enumerate(text):
    cp = ord(ch)
    if cp > 127:
        if cp not in non_ascii:
            non_ascii[cp] = []
        non_ascii[cp].append(i)

print("Non-ASCII characters found:")
for cp in sorted(non_ascii.keys()):
    ch = chr(cp)
    count = len(non_ascii[cp])
    # Show a sample context
    pos = non_ascii[cp][0]
    ctx = text[max(0,pos-10):pos+11].replace('\n', '\\n')
    print(f"  U+{cp:04X} ({ch!r}): {count} times, context: ...{ctx}...")
