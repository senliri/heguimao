import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# Pattern 1: double-escaped unicode like \\u951b\\u5b7f -> should be just removed or fixed
# The corrupted sequences look like: \u670d\u52a1\u5668\u5347\u7ea7\u5931\u8d25\\u951b\\u5b7fu8bf7\u91cd\u8bd5\u3001
# The \\u951b\\u5b7f is garbage (GBK interpretation of UTF-8 bytes)
# We need to find zh values with these double-escaped sequences

fixed = 0
new_lines = []

for i, line in enumerate(lines, 1):
    original = line
    
    # Fix double-escaped unicode sequences (\\\\u followed by 4 hex digits)
    # These are artifacts of GBK misinterpretation
    # Replace \\uXXXX patterns that appear as literal text (not proper unicode escapes)
    
    # Pattern: look for zh value, find corrupted double-escaped sequences
    # The corrupted parts are like \\u951b\\u5b7f which are actually garbage
    # We need to fix the Chinese text
    
    if '\\\\u' in line and 'zh:' in line:
        # Find the zh value portion and fix it
        # Strategy: extract zh value, replace \\\\uXXXX with proper unicode
        
        # Match the entire zh value
        m = re.search(r'(zh:\s*")([^"]+)(\s*"[^}]*)', line)
        if m:
            prefix = m.group(1)
            value = m.group(2)
            suffix = m.group(3)
            
            # Remove double-escaped sequences (\\\\u -> \\u is not right either)
            # Actually \\u in the source file means literal backslash-u in the string
            # The corrupted ones are like \\u951b which is wrong
            
            # Replace \\\\uXXXX (literal backslash + u + 4 hex) with nothing
            value = re.sub(r'\\\\u[0-9a-fA-F]{4}', '', value)
            
            if value != m.group(2):
                new_line = line.replace(m.group(2), value)
                new_lines.append(new_line)
                fixed += 1
                print(f'Line {i+1}: fixed double-escaped garbage')
                print(f'  Before: {original.strip()[:150]}')
                print(f'  After:  {new_line.strip()[:150]}')
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

print(f'\nTotal fixes: {fixed}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print('File written.')
