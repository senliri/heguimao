#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(2424, min(2435, len(lines))):
    print(f"Line {i+1}: {repr(lines[i])}")
