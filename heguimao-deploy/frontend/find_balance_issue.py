#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Track bracket balance through the file
depth = 0
max_depth = 0
problem_pos = None

for i, ch in enumerate(content):
    if ch == '(':
        depth += 1
        if depth > max_depth:
            max_depth = depth
    elif ch == ')':
        depth -= 1
        if depth < 0 and problem_pos is None:
            line = content[:i].count('\n') + 1
            problem_pos = i
            print(f"First unmatched ) at char {i}, line {line}")
            start = max(0, i-100)
            end = min(len(content), i+100)
            print(f"Context: {repr(content[start:end])}")
            break

if depth > 0:
    print(f"\nFile ends with {depth} unmatched (")
    # Find the last few unmatched opens
    depth2 = 0
    for i in range(len(content)-1, max(0, len(content)-500), -1):
        if content[i] == ')': depth2 += 1
        elif content[i] == '(': 
            depth2 -= 1
            if depth2 < 0:
                print(f"Last unmatched ( near end, char {i}")
                print(f"Context: {repr(content[max(0,i-50):i+100])}")
                break
