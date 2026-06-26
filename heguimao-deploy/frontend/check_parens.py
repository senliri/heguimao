#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

depth = 0
unmatched = None
for i, ch in enumerate(content):
    if ch == '(':
        depth += 1
    elif ch == ')':
        depth -= 1
        if depth < 0:
            line = content[:i].count('\n') + 1
            print(f"Unmatched ) at char {i}, line {line}")
            start = max(0, i-60)
            end = min(len(content), i+60)
            print(f"Context: ...{repr(content[start:end])}...")
            unmatched = i
            break

if depth > 0 and unmatched is None:
    print(f"{depth} unmatched ( found")
    # Show last 500 chars
    print(f"\nLast 500 chars:")
    print(content[-500:])
