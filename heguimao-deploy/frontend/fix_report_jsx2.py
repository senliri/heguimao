#!/usr/bin/env python3
"""Fix Report.tsx: wrap bare t("...") in JSX text nodes with {}."""
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

changes = []

for i, line in enumerate(lines):
    original = line
    n = 0  # count changes on this line
    
    # Strategy: find t("...") or t(`...`) that appear AFTER > (JSX text content)
    # and are NOT already inside {...}
    
    # Split line by > to find JSX text portions
    parts = line.split(">")
    new_parts = []
    for j, part in enumerate(parts):
        if j == 0:
            # Before first >, skip (this is JSX tag attributes or JS code)
            new_parts.append(part)
        else:
            # This is JSX text content (between > and <)
            # Check if it contains t("...") not wrapped in {}
            
            # Pattern: text t("key") more_text
            # Fix: text {t("key")} more_text
            
            # Match t("...") that is NOT preceded by { on the same segment
            def replacer(m):
                nonlocal n
                # Check if preceded by {
                start = m.start()
                prefix = part[max(0,start-3):start]
                if "{" in prefix:
                    return m.group(0)  # already wrapped
                n += 1
                return '{t("' + m.group(2) + '")}'
            
            part = re.sub(r't\("([^"]*)"\)', replacer, part)
            
            # Same for template literals
            def replacer_tpl(m):
                nonlocal n
                start = m.start()
                prefix = part[max(0,start-3):start]
                if "{" in prefix:
                    return m.group(0)
                n += 1
                return '{t(`' + m.group(2) + '`)}'
            
            part = re.sub(r't\(`([^`]*)`', replacer_tpl, part)
            
            new_parts.append(part)
    
    new_line = ">".join(new_parts)
    if new_line != original:
        changes.append((i+1, original.rstrip(), new_line.rstrip()))

print(f"Found {len(changes)} lines to fix")
for lineno, old, new in changes:
    print(f"\nLine {lineno}:")
    print(f"  OLD: {old[:150]}")
    print(f"  NEW: {new[:150]}")

# Apply changes
with open(filepath, "w", encoding="utf-8") as f:
    for i, line in enumerate(lines):
        if i+1 in [c[0] for c in changes]:
            matched = [c for c in changes if c[0] == i+1]
            if matched:
                f.write(matched[0][2] + "\n")
            else:
                f.write(line)
        else:
            f.write(line)

print(f"\nApplied {len(changes)} fixes.")
