import re
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()
lines = raw.split(b"\n")

# Process line 42 as the script does
new_line = lines[41]

# Process en values
for m in re.finditer(rb'(en|zh):\s*"', new_line):
    lang = m.group(1)
    if lang != b'en':
        continue
    value_start = m.end()
    rest = new_line[value_start:]
    close_match = re.search(rb'"', rest)
    if close_match:
        close_pos = value_start + close_match.start()
        value_bytes = new_line[value_start:close_pos]
        suffix = new_line[close_pos:]
        has_closing_quote = True
    else:
        continue
    
    has_raw = any(b > 127 for b in value_bytes)
    print(f"en value has raw bytes: {has_raw}")
    if has_raw:
        # Fix it
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

# Now process zh values in the modified line
for m in re.finditer(rb'(en|zh):\s*"', new_line):
    lang = m.group(1)
    if lang != b'zh':
        continue
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
            continue
    
    has_raw = any(b > 127 for b in value_bytes)
    print(f"zh value has raw bytes: {has_raw}")
    if has_raw:
        print(f"  value: {repr(value_bytes[:100])}")
