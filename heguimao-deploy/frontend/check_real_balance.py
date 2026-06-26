#!/usr/bin/env python3
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove comments and string literals to get real code
# Remove single-line comments
code = re.sub(r'//.*', '', content)
# Remove template literals content (keep the structure)
code = re.sub(r'`[^`]*`', '``', code)
# Remove double-quoted strings
code = re.sub(r'"[^"]*"', '""', code)
# Remove single-quoted strings
code = re.sub(r"'[^']*'", "''", code)

depth = 0
for ch in code:
    if ch == '(':
        depth += 1
    elif ch == ')':
        depth -= 1

print(f"Real paren balance (excluding comments/strings): {depth}")

# Same for braces
depth_b = 0
for ch in code:
    if ch == '{':
        depth_b += 1
    elif ch == '}':
        depth_b -= 1
print(f"Real brace balance: {depth_b}")

# Same for brackets
depth_br = 0
for ch in code:
    if ch == '[':
        depth_br += 1
    elif ch == ']':
        depth_br -= 1
print(f"Real bracket balance: {depth_br}")
