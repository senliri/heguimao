#!/usr/bin/env python3
"""
Fix Report.tsx: wrap bare t("...") and t(`...`) calls in JSX text nodes with {}.

Strategy: For each line, find patterns like >t("key")< or >text t("key")<
and wrap the t() call in curly braces.
"""
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

changed_lines = []
total_changes = 0

for i, line in enumerate(lines):
    original = line
    line_changes = 0
    
    # Skip lines that are purely JS (not JSX): lines with doc.text(, alert(, console.
    # These are inside { } blocks or function calls, not JSX text nodes.
    # Heuristic: if line contains "doc.text(" or "alert(" or "console." as main content, skip.
    # But be careful: some lines have both JSX and JS.
    
    # Only process lines that contain JSX element patterns (>...<)
    # Key patterns to fix:
    # 1. >t("...")< — bare t() as sole text content
    # 2. >text t("...")</ — t() mixed with text
    # 3. >t(`...`)< — template literal variant
    
    # Pattern 1: > t("key") < (possibly with whitespace around)
    # Don't match if already >{t(
    def fix_jsx_t(m):
        nonlocal line_changes
        prefix = m.group(1)  # everything before t(
        quote_type = m.group(2)  # " or `
        key = m.group(3)  # the key
        suffix = m.group(4)  # everything after )
        
        # If prefix ends with {, already wrapped
        if prefix.rstrip().endswith("{"):
            return m.group(0)
        
        line_changes += 1
        return prefix + "{t(" + quote_type + key + quote_type + ")}" + suffix
    
    # Match: (prefix)t("key")(suffix) where prefix doesn't end with {
    # Using a function for replacement
    new_line = re.sub(
        r'((?:^|[>])\s*)(?!.*\{t\(")'  # prefix that isn't already inside {t(
        r't\("([^"]*)"\)',
        lambda m: m.group(1) + '{t("' + m.group(2) + '")}',
        line
    )
    
    # Template literal variant
    new_line = re.sub(
        r'(>)\s*t\(`([^`]*)`',
        lambda m: m.group(1) + ' {t(`' + m.group(2) + '`)}',
        new_line
    )
    
    # Also fix: >text t("key") — where t() follows text without {
    new_line = re.sub(
        r'(>[^<{]*)t\("([^"]*)"\)',
        lambda m: m.group(1) + '{t("' + m.group(2) + '")}',
        new_line
    )
    
    new_line = re.sub(
        r'(>[^<{]*)t\(`([^`]*)`',
        lambda m: m.group(1) + ' {t(`' + m.group(2) + '`)}',
        new_line
    )
    
    if new_line != line:
        total_changes += line_changes if line_changes > 0 else 1
        changed_lines.append((i+1, line.rstrip(), new_line.rstrip()))
        line = new_line
    
    # Apply same fix for lines with >{t( but missing closing }:
    # e.g. >{t("key")< should be >{t("key")}<
    # Actually this is rare, let's focus on the main issue first

print(f"Total changed lines: {len(changed_lines)}")
for lineno, old, new in changed_lines:
    print(f"\nLine {lineno}:")
    print(f"  OLD: {old[:120]}")
    print(f"  NEW: {new[:120]}")

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(lines)

print(f"\nDone. Wrote {len(changed_lines)} fixes to {filepath}")
