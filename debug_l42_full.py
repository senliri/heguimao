import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "rb") as f:
    raw = f.read()

raw_lines = raw.split(b"\n")
line42 = raw_lines[41]

# Process en values
new_line = line42
for m in re.finditer(rb'(en|zh):\s*"', new_line):
    lang = m.group(1)
    value_start = m.end()
    rest = new_line[value_start:]
    close_match = re.search(rb'"', rest)
    
    if not close_match:
        continue
    
    close_pos = value_start + close_match.start()
    value_bytes = new_line[value_start:close_pos]
    suffix = new_line[close_pos:]
    
    if not any(b > 127 for b in value_bytes):
        continue
    
    # Fix value
    s = value_bytes.rstrip(b" \r\t")
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
            except:
                pass
            j = k
        else:
            fixed.append(b)
            j += 1
    
    new_line = new_line[:value_start] + bytes(fixed) + suffix
    print(f"Fixed en value")

# Now process zh values
for m in re.finditer(rb',\s*zh:\s*"', new_line):
    value_start = m.end()
    rest = new_line[value_start:]
    close_match = re.search(rb'"', rest)
    
    if close_match:
        close_pos = value_start + close_match.start()
        value_bytes = new_line[value_start:close_pos]
        suffix = new_line[close_pos:]
        has_closing_quote = True
    else:
        close_match2 = re.search(rb'\}', rest)
        if close_match2:
            close_pos = value_start + close_match2.start()
            value_bytes = new_line[value_start:close_pos]
            suffix = new_line[close_pos:]
            has_closing_quote = False
        else:
            print("No } found for zh value")
            continue
    
    has_raw = any(b > 127 for b in value_bytes)
    print(f"zh value has raw bytes: {has_raw}")
    print(f"value_bytes length: {len(value_bytes)}")
    print(f"value_bytes[:80]: {repr(value_bytes[:80])}")
    
    if not has_raw:
        continue
    
    s = value_bytes.rstrip(b" \r\t")
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
            except:
                pass
            j = k
        else:
            fixed.append(b)
            j += 1
    
    print(f"Fixed length: {len(fixed)}, has raw: {any(b > 127 for b in fixed)}")
    print(f"Fixed[:80]: {bytes(fixed)[:80]}")
    
    if not has_closing_quote:
        suffix = b'"' + suffix
    new_line = new_line[:value_start] + bytes(fixed) + suffix
    print(f"Fixed zh value")

print(f"\nFinal line 42: {new_line.decode('utf-8', errors='replace')[:200]}")
print(f"Has raw bytes: {any(b > 127 for b in new_line)}")
