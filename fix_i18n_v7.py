# Fix i18n.ts: replace raw UTF-8 bytes with unicode escapes, fix missing closing quotes
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'rb') as f:
    raw = f.read()

# Process line by line
raw_lines = raw.split(b'\n')
new_lines = []
fixed_count = 0

for i, raw_line in enumerate(raw_lines):
    # Only process lines containing 'zh:'
    if b'zh:' not in raw_line:
        new_lines.append(raw_line)
        continue
    
    # Find 'zh:' position
    zh_marker = b'zh:'
    zh_pos = raw_line.find(zh_marker)
    prefix = raw_line[:zh_pos + 3]
    rest = raw_line[zh_pos + 3:]
    
    # rest should be: "value" }, or corrupted version
    # Strip leading whitespace
    rest_stripped = rest.lstrip()
    
    if not rest_stripped.startswith(b'"'):
        new_lines.append(raw_line)
        continue
    
    # Find the value content between quotes
    # Look for closing pattern: " followed by }, or just }
    # The closing " might be missing
    
    # Strategy: scan from the opening quote, collect bytes until we find
    # a clean " followed by }, or reach the end
    
    # First, find where the value content ends
    # The value ends before the last " }, pattern, or before }, if no closing "
    
    # Find the last occurrence of " followed by optional },
    last_quote = rest_stripped.rfind(b'"')
    
    if last_quote > 0:
        # There's a closing quote somewhere
        value_content = rest_stripped[1:last_quote]  # between quotes
        after_quote = rest_stripped[last_quote:]
    else:
        # No closing quote — value is unterminated
        value_content = rest_stripped[1:]
        after_quote = b''
    
    # Now fix value_content: replace raw UTF-8 bytes with \uXXXX
    fixed_content = bytearray()
    j = 0
    while j < len(value_content):
        b = value_content[j]
        if b == ord('\\') and j + 5 < len(value_content) and value_content[j+1:j+2] == b'u':
            hex_str = value_content[j+2:j+6]
            if len(hex_str) == 4 and all(x in b'0123456789abcdefABCDEF' for x in hex_str):
                # Valid \uXXXX escape, keep
                fixed_content.extend(value_content[j:j+6])
                j += 6
                continue
        if b > 127:
            # Raw UTF-8 multi-byte sequence
            k = j
            while k < len(value_content) and value_content[k] > 127:
                k += 1
            utf8_seq = value_content[j:k]
            try:
                char = utf8_seq.decode('utf-8')
                code = ord(char)
                fixed_content.extend(f'\\u{code:04x}'.encode('ascii'))
            except UnicodeDecodeError:
                # Skip undecodable bytes
                pass
            j = k
        else:
            fixed_content.append(b)
            j += 1
    
    new_value = b'"' + bytes(fixed_content) + b'"'
    new_line = prefix + rest_stripped[:1] + new_value + after_quote
    
    if new_line != raw_line:
        fixed_count += 1
        if fixed_count <= 5:
            old_text = raw_line.decode('utf-8', errors='replace')[:200]
            new_text = new_line.decode('utf-8', errors='replace')[:200]
            print(f'Line {i+1}:')
            print(f'  OLD: {old_text}')
            print(f'  NEW: {new_text}')
            print()
    
    new_lines.append(new_line)

print(f'Total lines fixed: {fixed_count}')

with open(filepath, 'wb') as f:
    f.write(b'\n'.join(new_lines))

print('File written.')
