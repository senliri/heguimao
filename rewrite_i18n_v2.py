import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "rb") as f:
    raw = f.read()

raw_lines = raw.split(b"\n")

def is_valid_utf8_byte_seq(b, idx, data):
    """Check if byte at idx starts a valid UTF-8 sequence."""
    if b <= 0x7F:
        return True  # ASCII
    if 0xC2 <= b <= 0xDF:
        # 2-byte sequence
        return idx + 1 < len(data) and 0x80 <= data[idx+1] <= 0xBF
    if b == 0xE0:
        # 3-byte with U+0800..U+FFFF
        return (idx + 2 < len(data) and 
                0xA0 <= data[idx+1] <= 0xBF and 
                0x80 <= data[idx+2] <= 0xBF)
    if 0xE1 <= b <= 0xEC:
        return (idx + 2 < len(data) and 
                0x80 <= data[idx+1] <= 0xBF and 
                0x80 <= data[idx+2] <= 0xBF)
    if b == 0xED:
        # 3-byte with U+D800..U+DFFF (surrogate range - invalid in UTF-8)
        return (idx + 2 < len(data) and 
                0x80 <= data[idx+1] <= 0x9F and  # D800-D9FF = surrogates (invalid)
                0x80 <= data[idx+2] <= 0xBF)
    if 0xEE <= b <= 0xEF:
        return (idx + 2 < len(data) and 
                0x80 <= data[idx+1] <= 0xBF and 
                0x80 <= data[idx+2] <= 0xBF)
    if b == 0xF0:
        # 4-byte with U+010000..U+10FFFF
        return (idx + 3 < len(data) and 
                0x90 <= data[idx+1] <= 0xBF and 
                0x80 <= data[idx+2] <= 0xBF and 
                0x80 <= data[idx+3] <= 0xBF)
    if 0xF1 <= b <= 0xF3:
        return (idx + 3 < len(data) and 
                0x80 <= data[idx+1] <= 0xBF and 
                0x80 <= data[idx+2] <= 0xBF and 
                0x80 <= data[idx+3] <= 0xBF)
    if b == 0xF4:
        return (idx + 3 < len(data) and 
                0x80 <= data[idx+1] <= 0x8F and 
                0x80 <= data[idx+2] <= 0xBF and 
                0x80 <= data[idx+3] <= 0xBF)
    return False  # 0xF5-0xFF are invalid UTF-8 start bytes

def fix_value_bytes(s):
    """Fix trailing ? and whitespace, preserving valid UTF-8 sequences."""
    s = s.rstrip(b" \r\t")
    while s.endswith(b"?"):
        s = s[:-1]
    return s

def convert_invalid_utf8(value_bytes):
    """Convert only INVALID UTF-8 bytes to \\uXXXX escapes.
    Valid UTF-8 (emoji, Chinese chars, etc.) are left alone.
    """
    fixed = bytearray()
    i = 0
    while i < len(value_bytes):
        b = value_bytes[i]
        
        # Check for existing \uXXXX escape - skip it
        if b == 92 and i + 5 < len(value_bytes) and value_bytes[i+1:i+2] == b"u":
            hex_str = value_bytes[i+2:i+6]
            if len(hex_str) == 4:
                try:
                    int(hex_str.decode("ascii"), 16)
                    fixed.extend(value_bytes[i:i+6])
                    i += 6
                    continue
                except ValueError:
                    pass
        
        if b > 127:
            # Try to decode as valid UTF-8
            if is_valid_utf8_byte_seq(b, i, value_bytes):
                # Valid UTF-8 sequence - find its end and keep as-is
                j = i
                while j < len(value_bytes) and value_bytes[j] > 127:
                    j += 1
                seq = value_bytes[i:j]
                try:
                    text = seq.decode("utf-8")
                    # Verify round-trip
                    if text.encode("utf-8") == seq:
                        fixed.extend(seq)  # Keep valid UTF-8 as-is
                        i = j
                        continue
                except UnicodeDecodeError:
                    pass
                # If round-trip fails, fall through to escape
            # Invalid UTF-8 - convert each byte to \uXXXX
            k = i
            while k < len(value_bytes) and value_bytes[k] > 127:
                k += 1
            seq = value_bytes[i:k]
            try:
                text = seq.decode("utf-8", errors="replace")
                for ch in text:
                    code = ord(ch)
                    fixed.extend(f"\\u{code:04x}".encode("ascii"))
            except:
                pass
            i = k
        else:
            fixed.append(b)
            i += 1
    
    return bytes(fixed)

modified = False
new_lines = []

for raw_line in raw_lines:
    new_line = raw_line
    line_modified = False
    
    # Process en and zh values
    for lang in [b'en', b'zh']:
        for m in re.finditer(rb'(en|zh):\s*"', new_line):
            if m.group(1) != lang:
                continue
            
            value_start = m.end()
            rest = new_line[value_start:]
            
            # Try to find closing "
            close_match = re.search(rb'"', rest)
            if close_match:
                close_pos = value_start + close_match.start()
                value_bytes = new_line[value_start:close_pos]
                suffix = new_line[close_pos:]
                has_closing_quote = True
            else:
                # No closing quote - try to find }
                close_match2 = re.search(rb'\}', rest)
                if close_match2:
                    close_pos = value_start + close_match2.start()
                    value_bytes = new_line[value_start:close_pos]
                    suffix = new_line[close_pos:]
                    has_closing_quote = False
                else:
                    continue
            
            # Strip trailing ? and whitespace
            value_bytes = fix_value_bytes(value_bytes)
            
            # Convert only invalid UTF-8 bytes
            fixed_value = convert_invalid_utf8(value_bytes)
            
            if fixed_value != value_bytes:
                if not has_closing_quote:
                    suffix = b'"' + suffix
                new_line = new_line[:value_start] + fixed_value + suffix
                line_modified = True
    
    if line_modified:
        modified = True
    
    new_lines.append(new_line)

if modified:
    output = b"\n".join(new_lines)
    with open(filepath, "wb") as f:
        f.write(output)
    print("Done. File updated.")
else:
    print("No changes needed.")

# Verification
with open(filepath, "rb") as f:
    lines = f.read().split(b"\n")

bad_count = 0
for i, line in enumerate(lines, 1):
    if not line.strip():
        continue
    has_raw = any(b > 127 for b in line)
    if has_raw:
        # Check if it's a comment line (valid UTF-8 like emoji)
        text = line.decode("utf-8", errors="replace")
        # Check if the raw bytes are valid UTF-8
        try:
            line.decode("utf-8")
            # Valid UTF-8 - these are emoji/comments, OK
            continue
        except UnicodeDecodeError:
            bad_count += 1
            if bad_count <= 5:
                print(f"Still bad line {i}: {line[:80]}")

if bad_count == 0:
    print("All lines with raw bytes are now valid UTF-8 (emoji/comments).")
else:
    print(f"\n{bad_count} lines still have invalid UTF-8.")
