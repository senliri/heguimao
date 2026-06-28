import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "rb") as f:
    raw = f.read()

raw_lines = raw.split(b"\n")
fixed_count = 0
new_lines = []

def fix_value_bytes(s):
    # Strip trailing whitespace first, then ?
    s = s.rstrip(b" \r\t")
    while s.endswith(b"?"):
        s = s[:-1]
    fixed = bytearray()
    j = 0
    while j < len(s):
        b = s[j]
        if b == 92 and j + 5 < len(s) and s[j+1:j+2] == b"u":
            hex_str = s[j+2:j+6]
            if len(hex_str) == 4:
                try:
                    int(hex_str.decode("ascii"), 16)
                    fixed.extend(s[j:j+6])
                    j += 6
                    continue
                except ValueError:
                    pass
        if b > 127:
            k = j
            while k < len(s) and s[k] > 127:
                k += 1
            seq = s[j:k]
            try:
                text = seq.decode("utf-8")
                for ch in text:
                    code = ord(ch)
                    fixed.extend(f"\\u{code:04x}".encode("ascii"))
            except (UnicodeDecodeError, ValueError):
                pass
            j = k
        else:
            fixed.append(b)
            j += 1
    return bytes(fixed)

for i, raw_line in enumerate(raw_lines):
    modified = False
    new_line = raw_line
    
    # Find all occurrences of: en: "VALUE" or zh: "VALUE"
    # Pattern: (en|zh): " (with optional spaces)
    for m in re.finditer(rb'(en|zh):\s*"', new_line):
        lang = m.group(1)
        value_start = m.end()  # position after the opening "
        
        rest = new_line[value_start:]
        
        # Find closing "
        close_match = re.search(rb'"', rest)
        
        if close_match:
            close_pos = value_start + close_match.start()
            value_bytes = new_line[value_start:close_pos]
            suffix = new_line[close_pos:]
            has_closing_quote = True
        else:
            # No closing quote - find }
            close_match2 = re.search(rb'\}', rest)
            if close_match2:
                close_pos = value_start + close_match2.start()
                value_bytes = new_line[value_start:close_pos]
                suffix = new_line[close_pos:]
                has_closing_quote = False
            else:
                continue
        
        # Check if value has raw bytes
        if not any(b > 127 for b in value_bytes):
            continue
        
        fixed_value = fix_value_bytes(value_bytes)
        
        if fixed_value != value_bytes:
            if not has_closing_quote:
                # Add missing closing quote
                suffix = b'"' + suffix
            new_line = new_line[:value_start] + fixed_value + suffix
            modified = True
    
    if modified:
        fixed_count += 1
        if fixed_count <= 5:
            old_text = raw_lines[i].decode("utf-8", errors="replace")[:150]
            new_text = new_line.decode("utf-8", errors="replace")[:150]
            print(f"Line {i+1}:")
            print(f"  OLD: {old_text}")
            print(f"  NEW: {new_text}")
            print()
    
    new_lines.append(new_line)

print(f"Total fixed: {fixed_count}")

with open(filepath, "wb") as f:
    f.write(b"\n".join(new_lines))

print("Written.")

# Verify
with open(filepath, "rb") as f:
    data = f.read()
    lines = data.split(b"\n")

bad = 0
for line in lines:
    if any(b > 127 for b in line):
        bad += 1

print(f"Remaining lines with raw bytes: {bad}")
