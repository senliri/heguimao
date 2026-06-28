# Fix i18n.ts: convert raw UTF-8 bytes to \uXXXX, strip trailing ?

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'rb') as f:
    raw = f.read()

raw_lines = raw.split(b'\n')
new_lines = []
fixed_count = 0

for i, raw_line in enumerate(raw_lines):
    if b'zh:' not in raw_line:
        new_lines.append(raw_line)
        continue
    
    zh_pos = raw_line.find(b'zh:')
    prefix = raw_line[:zh_pos + 3]
    rest = raw_line[zh_pos + 3:]
    
    q_start = rest.find(b'"')
    if q_start < 0:
        new_lines.append(raw_line)
        continue
    
    after_open = rest[q_start + 1:]
    
    # Find last " before },
    last_q = -1
    for j in range(len(after_open) - 1, -1, -1):
        if after_open[j:j+1] == b'"':
            last_q = j
            break
    
    if last_q >= 0:
        value_content = after_open[:last_q]
        after_close = after_open[last_q:]
    else:
        value_content = after_open
        after_close = b'"'
    
    # Remove trailing ? from value_content (artifact of encoding corruption)
    if value_content.endswith(b'?'):
        value_content = value_content[:-1]
    
    # Convert raw UTF-8 bytes to \uXXXX escapes
    fixed_content = bytearray()
    j = 0
    while j < len(value_content):
        b = value_content[j]
        if b == 92 and j + 5 < len(value_content) and value_content[j+1:j+2] == b'u':
            hex_str = value_content[j+2:j+6]
            if len(hex_str) == 4:
                try:
                    int(hex_str.decode('ascii'), 16)
                    fixed_content.extend(value_content[j:j+6])
                    j += 6
                    continue
                except ValueError:
                    pass
        if b > 127:
            k = j
            while k < len(value_content) and value_content[k] > 127:
                k += 1
            utf8_seq = value_content[j:k]
            try:
                char = utf8_seq.decode('utf-8')
                if len(char) == 1:
                    code = ord(char)
                    fixed_content.extend(f'\\u{code:04x}'.encode('ascii'))
            except (UnicodeDecodeError, ValueError):
                pass
            j = k
        else:
            fixed_content.append(b)
            j += 1
    
    new_value = bytes(fixed_content)
    new_rest = rest[:q_start] + b'"' + new_value + after_close
    new_line = prefix + new_rest
    
    if new_line != raw_line:
        fixed_count += 1
        if fixed_count <= 10:
            old_text = raw_line.decode('utf-8', errors='replace')[:200]
            new_text = new_line.decode('utf-8', errors='replace')[:200]
            print(f'Line {i+1}:')
            print(f'  OLD: {old_text}')
            print(f'  NEW: {new_text}')
            print()
    
    new_lines.append(new_line)

print(f'Total fixed: {fixed_count}')

with open(filepath, 'wb') as f:
    f.write(b'\n'.join(new_lines))

print('Done.')
