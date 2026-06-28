import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'rb') as f:
    raw = f.read()

# Split into lines preserving endings
raw_lines = raw.split(b'\n')

fixed_count = 0
new_lines = []

for i, raw_line in enumerate(raw_lines):
    line = raw_line.decode('utf-8', errors='replace')
    
    if b'zh:' not in raw_line:
        new_lines.append(raw_line)
        continue
    
    # Find zh: position in raw bytes
    zh_idx = raw_line.find(b'zh:')
    if zh_idx < 0:
        new_lines.append(raw_line)
        continue
    
    prefix_bytes = raw_line[:zh_idx + 3]  # include 'zh:'
    value_bytes = raw_line[zh_idx + 3:]   # everything after 'zh:'
    
    # value_bytes should be like: "value" }, or corrupted
    # Check if starts with quote
    if not value_bytes.startswith(b'"'):
        new_lines.append(raw_line)
        continue
    
    # Find the end: look for " followed by optional },
    # But the closing " might be missing or corrupted
    # Strategy: find the LAST occurrence of " followed by },
    
    # First, try to find a proper closing: " }, or "}, or " },
    # Search for pattern: " followed by whitespace/comma/brace
    close_pattern = rb'"[\s,}]*$'
    close_match = re.search(close_pattern, value_bytes)
    
    if close_match:
        # Found a closing quote at the end
        close_pos = close_match.start()
        inner_bytes = value_bytes[1:close_pos]  # between quotes
        
        # Now check if inner_bytes contain raw non-ASCII bytes (>127)
        # that aren't part of \uXXXX sequences
        fixed_inner = bytearray()
        j = 0
        while j < len(inner_bytes):
            byte = inner_bytes[j]
            if byte == ord('\\') and j + 1 < len(inner_bytes) and inner_bytes[j+1] == ord('u'):
                # Check for \uXXXX
                hex_part = inner_bytes[j+2:j+6]
                if len(hex_part) == 4 and all(b in b'0123456789abcdefABCDEF' for b in hex_part):
                    # Valid \uXXXX escape, keep it
                    fixed_inner.extend(inner_bytes[j:j+6])
                    j += 6
                    continue
            elif byte > 127:
                # Raw UTF-8 byte — this is corruption
                # Collect the full UTF-8 sequence
                k = j
                while k < len(inner_bytes) and inner_bytes[k] > 127:
                    k += 1
                utf8_seq = inner_bytes[j:k]
                try:
                    char = utf8_seq.decode('utf-8')
                    code = ord(char)
                    fixed_inner.extend(f'\\u{code:04x}'.encode('ascii'))
                except UnicodeDecodeError:
                    # Can't decode as UTF-8, skip
                    pass
                j = k
            else:
                fixed_inner.append(byte)
                j += 1
        
        new_value = b'"' + bytes(fixed_inner) + b'"'
        new_line = prefix_bytes + new_value + value_bytes[close_match.end():]
        
        if new_line != raw_line:
            fixed_count += 1
            if fixed_count <= 5:
                print(f'Line {i+1}: FIXED')
                old_text = line[:200].replace('\r', '')
                new_text = new_line.decode('utf-8', errors='replace')[:200].replace('\r', '')
                print(f'  Old: {old_text}')
                print(f'  New: {new_text}')
        
        new_lines.append(new_line)
    else:
        # No closing quote found — value is completely unterminated
        # Find where the value ends (before },)
        end_match = re.search(rb'[,}]\s*$', value_bytes)
        if end_match:
            inner = value_bytes[1:end_match.start()]
            # Clean up raw bytes
            fixed_inner = bytearray()
            j = 0
            while j < len(inner):
                byte = inner[j]
                if byte == ord('\\') and j + 1 < len(inner) and inner[j+1] == ord('u'):
                    hex_part = inner[j+2:j+6]
                    if len(hex_part) == 4 and all(b in b'0123456789abcdefABCDEF' for b in hex_part):
                        fixed_inner.extend(inner[j:j+6])
                        j += 6
                        continue
                elif byte > 127:
                    k = j
                    while k < len(inner) and inner[k] > 127:
                        k += 1
                    utf8_seq = inner[j:k]
                    try:
                        char = utf8_seq.decode('utf-8')
                        code = ord(char)
                        fixed_inner.extend(f'\\u{code:04x}'.encode('ascii'))
                    except UnicodeDecodeError:
                        pass
                    j = k
                else:
                    fixed_inner.append(byte)
                    j += 1
            
            new_value = b'"' + bytes(fixed_inner) + b'"'
            new_line = prefix_bytes + new_value + b' },'
            fixed_count += 1
            if fixed_count <= 5:
                print(f'Line {i+1}: ADDED MISSING CLOSE')
                print(f'  Old: {line[:200].replace(chr(13), "")}')
                print(f'  New: {new_line.decode("utf-8", errors="replace")[:200].replace(chr(13), "")}')
            new_lines.append(new_line)
        else:
            new_lines.append(raw_line)

print(f'\nTotal fixed: {fixed_count}')

with open(filepath, 'wb') as f:
    f.write(b'\n'.join(new_lines))

print('Done.')
