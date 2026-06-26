#!/usr/bin/env python3
"""Scan for remaining hardcoded English strings in JSX"""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

frontend_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages"

# Common English words/phrases that should be translated
patterns = [
    r'>Submit</',       # Submit button
    r'>Cancel</',       # Cancel button
    r'>Send</',         # Send button
    r'>Back</',         # Back button
    r'>Next</',         # Next button
    r'>Save</',         # Save button
    r'>Delete</',       # Delete button
    r'>Loading</',      # Loading text
    r'>Error</',        # Error text
    r'>Success</',      # Success text
    r'>Processing</',   # Processing text
    r'>Please wait</',  # Please wait
    r'>No results</',   # No results
    r'>Not found</',    # Not found
    r'>Required</',     # Required field
    r'>Invalid</',      # Invalid input
    r'>Failed</',       # Failed
    r'>Waiting</',      # Waiting
    r'>Completed</',    # Completed
    r'>Processing...', # Processing with ellipsis
    r'>Sending...',    # Sending with ellipsis
]

found_issues = []

for fname in os.listdir(frontend_dir):
    if not (fname.endswith('.tsx') or fname.endswith('.ts')):
        continue
    fpath = os.path.join(frontend_dir, fname)
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
    except:
        continue
    
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith(('import ', 'from ', 'export ', '//', '/*')):
            continue
        if 't("' not in line and "t('" not in line:
            continue
        for pat in patterns:
            if re.search(pat, line):
                found_issues.append((fname, i, line.strip()[:120]))

if found_issues:
    print(f"Found {len(found_issues)} potential hardcoded strings:")
    for fi in found_issues:
        print(f"  {fi[0]}:{fi[1]} -> {fi[2]}")
else:
    print("✅ No common hardcoded English strings found in JSX!")

# Also check for alert() with English strings
alert_pattern = r'alert\(["\']([^"\']+)["\']\)'
alerts = []
for fname in os.listdir(frontend_dir):
    if not fname.endswith('.tsx'):
        continue
    fpath = os.path.join(frontend_dir, fname)
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
    except:
        continue
    matches = re.findall(alert_pattern, content)
    for m in matches:
        if len(m) > 5:  # Skip very short ones
            alerts.append((fname, m))

if alerts:
    print(f"\n⚠️ English strings in alert():")
    for a in alerts:
        print(f"  {a[0]}: \"{a[1]}\"")
else:
    print("\n✅ No English strings in alert() calls!")
