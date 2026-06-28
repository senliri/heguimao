import sys
sys.stdout.reconfigure(encoding="utf-8")
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

# Find lines with en: or zh: that have raw bytes but no closing "
import re
for i, line in enumerate(lines, 1):
    if b", zh:" in line or b'"en":' in line:
        has_raw = any(b > 127 for b in line)
        if not has_raw:
            continue
        
        # Check if this line has an unclosed quote
        text = line.decode("utf-8", errors="replace")
        
        # Find en: and zh: patterns
        for pat_name, pat in [("en", rb'"en":\s*"'), ("zh", rb',\s*zh:\s*"')]:
            for m in re.finditer(pat, line):
                value_start = m.end()
                rest = line[value_start:]
                close = re.search(rb'"', rest)
                if not close:
                    # No closing quote on this line
                    # Check if next line continues
                    if i < len(lines):
                        next_line = lines[i]
                        print(f"Line {i} ({pat_name}): no closing quote, next line: {next_line[:80]}")
                    else:
                        print(f"Line {i} ({pat_name}): no closing quote, last line")
