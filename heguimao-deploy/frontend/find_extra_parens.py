#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Find the translateError function and check balance
start_idx = content.find('export function translateError')
end_idx = content.find('export function isZh', start_idx)
func_block = content[start_idx:end_idx]

print(f"Function block length: {len(func_block)}")
print(f"Open (: {func_block.count('(')}")
print(f"Close ): {func_block.count(')')}")

# Find where extra ) appears
depth = 0
for i, ch in enumerate(func_block):
    if ch == '(':
        depth += 1
    elif ch == ')':
        depth -= 1
        if depth < 0:
            line = func_block[:i].count('\n') + 1
            context_start = max(0, i - 50)
            context_end = min(len(func_block), i + 50)
            print(f"\nExtra ) at line {line} in function:")
            print(f"Context: ...{repr(func_block[context_start:context_end])}...")
            break
