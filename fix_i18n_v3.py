import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed = 0
new_lines = []

for i, line in enumerate(lines):
    original = line
    text = line.rstrip('\n')
    
    if 'zh:' not in text:
        new_lines.append(text)
        continue
    
    # Split at zh: to find the zh value
    # Pattern: "key": { ..., zh: "<value>" },
    # We need to fix:
    # 1. Unterminated strings: zh: "value without closing quote
    # 2. Double-escaped garbage: \\u951b\\u5b7f embedded in zh values
    
    # Find the zh value start
    zh_match = re.search(r'(zh:\s*")(.*)$', text, re.DOTALL)
    if not zh_match:
        new_lines.append(text)
        continue
    
    prefix = text[:zh_match.start()]
    value = zh_match.group(2)
    
    # Step 1: Remove double-escaped garbage sequences (literal \\uXXXX where XXXX is garbage)
    # The garbage sequences are: \\u951b\\u5b7f, \\u9286\\u4fd3, etc.
    # These appear as literal backslash-backslash-u in the file
    # Remove them
    value = re.sub(r'\\\\u[0-9a-fA-F]{4}', '', value)
    
    # Step 2: Fix unterminated strings
    # Check if the value has an odd number of quotes (missing closing quote)
    # The value should end with: " }, or " }, or similar
    # If it ends with: : }, or 、 }, it's missing the closing quote
    
    # Try to find the closing " followed by },
    # Pattern: value" }, or value"},
    close_match = re.search(r'(")\s*,?\s*\}\s*,?\s*$', value)
    if close_match:
        # Value has a closing quote
        quote = close_match.group(1)
        rest = value[close_match.start():]
        value = value[:close_match.start()]
        
        # Check if there's trailing garbage after the closing quote
        # e.g. "value" },  is fine, but "value" }, is also fine
        # But "value" }, means the quote is there
        pass
    else:
        # No closing quote found — value is unterminated
        # The value ends with something like: \uff1a or \u3001 or \u951b garbage
        # We need to find where the actual text ends and add closing quote
        
        # Strip trailing whitespace, commas, braces
        value_stripped = value.rstrip()
        
        # If it ends with }, or , }, or just }, it's unterminated
        if value_stripped.endswith('},') or value_stripped.endswith('},') or value_stripped.endswith('}'):
            # Remove trailing }, or }
            value_stripped = re.sub(r'[,\s]*\}\s*,?\s*$', '', value_stripped)
            # Add closing quote
            value = value_stripped + '" },'
        else:
            # Value might end with a colon or comma that was meant to be the end
            # Just add closing quote
            value = value + '"'
    
    new_line = prefix + value
    new_lines.append(new_line)
    if new_line != text:
        fixed += 1
        if fixed <= 20:
            print(f'Line {i+1}: FIXED')
            print(f'  Old: {text[:200]}')
            print(f'  New: {new_line[:200]}')

print(f'\nTotal fixed: {fixed}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print('File written.')
