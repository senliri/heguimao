#!/usr/bin/env python3
import re, sys

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

changes = []
counter = [0]  # mutable counter for nonlocal workaround

for i, line in enumerate(lines):
    original = line
    
    # Split by ">" to isolate JSX text content
    parts = line.split(">")
    new_parts = []
    line_changed = False
    
    for j, part in enumerate(parts):
        if j == 0:
            new_parts.append(part)
            continue
        
        # This is JSX text content between > and <
        # Find t("...") not preceded by {
        new_part = ""
        remaining = part
        
        while True:
            # Find t("...")
            m = re.search(r't\("([^"]*)"\)', remaining)
            if not m:
                break
            
            # Check if preceded by {
            prefix = remaining[max(0,m.start()-3):m.start()]
            if "{" in prefix:
                # Already wrapped, skip past this match
                new_part += remaining[:m.end()]
                remaining = remaining[m.end():]
                continue
            
            # Not wrapped, fix it
            line_changed = True
            counter[0] += 1
            new_part += remaining[:m.start()] + '{t("' + m.group(1) + '")}'
            remaining = remaining[m.end():]
        
        # Handle t(`...`) template literals
        while True:
            m = re.search(r't\(`([^`]*)`', remaining)
            if not m:
                break
            
            prefix = remaining[max(0,m.start()-3):m.start()]
            if "{" in prefix:
                new_part += remaining[:m.end()]
                remaining = remaining[m.end():]
                continue
            
            line_changed = True
            counter[0] += 1
            new_part += remaining[:m.start()] + '{t(`' + m.group(1) + '`)}'
            remaining = remaining[m.end():]
        
        new_part += remaining
        new_parts.append(new_part)
    
    new_line = ">".join(new_parts)
    if line_changed:
        changes.append((i+1, original.rstrip(), new_line.rstrip()))

print(f"Fixed {len(changes)} lines, {counter[0]} total t() calls")

# Show first 10 changes
for lineno, old, new in changes[:10]:
    print(f"\nLine {lineno}:")
    print(f"  OLD: {old[:200]}")
    print(f"  NEW: {new[:200]}")

# Write back
change_map = {c[0]: c[2] for c in changes}
with open(filepath, "w", encoding="utf-8") as f:
    for i, line in enumerate(lines):
        if (i+1) in change_map:
            f.write(change_map[i+1] + "\n")
        else:
            f.write(line)

print(f"\nDone. {len(changes)} fixes applied.")

# Cleanup
for f_path in [filepath.replace("Report.tsx", "fix_report_jsx3.py")]:
    pass  # keep for debugging
