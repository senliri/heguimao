# -*- coding: utf-8 -*-
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'rb') as f:
    raw_data = f.read()

lines = raw_data.split(b'\n')

fixed_count = 0
new_lines = []

for i, line in enumerate(lines):
    if b'zh:' not in line:
        new_lines.append(line)
        continue
    
    text = line.decode('latin-1')  # Safe roundtrip for any byte
    
    parts = text.rsplit('zh:', 1)
    if len(parts) != 2:
        new_lines.append(line)
        continue
    
    prefix = parts[0]
    zh_rest = parts[1]
    
    if not zh_rest.startswith('"'):
        new_lines.append(line)
        continue
    
    stripped = zh_rest.rstrip()
    stripped = re.sub(r'[,}\s]+\s*$', '', stripped)
    
    if stripped.endswith('"'):
        value = stripped
    else:
        value = stripped + '"'
    
    inner = value[1:-1]
    
    # Build fixed inner string
    fixed_inner = []
    j = 0
    while j < len(inner):
        ch = inner[j]
        if ch == '\\' and j + 5 < len(inner) and inner[j+1] == 'u':
            hex_str = inner[j+2:j+6]
            if all(c in '0123456789abcdefABCDEF' for c in hex_str):
                fixed_inner.append('\\u' + hex_str)
                j += 6
                continue
        # Regular character
        code = ord(ch)
        if code > 127:
            fixed_inner.append(f'\\u{code:04x}')
        else:
            fixed_inner.append(ch)
        j += 1
    
    fixed_value = '"' + ''.join(fixed_inner) + '"'
    new_line = prefix + 'zh:' + fixed_value
    
    if new_line != text:
        fixed_count += 1
        if fixed_count <= 5:
            print(f'Line {i+1}: FIXED')
            print(f'  Old: {text[:200]}')
            print(f'  New: {new_line[:200]}')
    
    new_lines.append(new_line.encode('latin-1'))

print(f'\nTotal lines fixed: {fixed_count}')

with open(filepath, 'wb') as f:
    f.write(b'\n'.join(new_lines))

print('File written.')
