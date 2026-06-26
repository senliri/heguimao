#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

opens = content.count('{')
closes = content.count('}')
parens_open = content.count('(')
parens_close = content.count(')')
brackets_open = content.count('[')
brackets_close = content.count(']')

print(f"Braces: {{ {opens} }} {closes} - balanced: {opens == closes}")
print(f"Parens: ( {parens_open} ) {parens_close} - balanced: {parens_open == parens_close}")
print(f"Brackets: [{brackets_open} ] {brackets_close} - balanced: {brackets_open == brackets_close}")
print(f"File size: {len(content)} chars, {content.count(chr(10))} lines")
print(f"\nLast 300 chars:")
print(content[-300:])
