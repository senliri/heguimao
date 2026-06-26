#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

idx = content.find('export function translateError')
block = content[idx:idx+1000]
print(f"translateError starts at char {idx}")
print(f"Block open parens: {block.count('(')}, close parens: {block.count(')')}")
print(f"Block open braces: {block.count('{')}, close braces: {block.count('}')}")
print("--- Block content ---")
print(block[:800])
