#!/usr/bin/env python3
"""Find and fix all orphaned commas in i18n.ts"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

fixed_lines = []
removed_count = 0

for i, line in enumerate(lines):
    stripped = line.strip()
    # Check if line is just a comma or whitespace + comma
    if stripped == ',':
        print(f"Line {i+1}: Removing orphaned comma")
        removed_count += 1
        continue
    # Check if line ends with comma followed by whitespace-only next line
    # Already handled by the above check
    fixed_lines.append(line)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(fixed_lines)

print(f"Removed {removed_count} orphaned commas")
print(f"Original lines: {len(lines)}, New lines: {len(fixed_lines)}")
