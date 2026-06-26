#!/usr/bin/env python3
"""
Fix Report.tsx: only wrap t("...") that appears as JSX TEXT NODE content.
A JSX text node is content between > and < that is NOT inside {...}.

Rules:
- >t("key")< → >{t("key")}<
- >text t("key")< → >text {t("key")}<  
- >{t("key")}< → NO CHANGE (already wrapped)
- doc.text(t("key"), ...) → NO CHANGE (JS function call, not JSX)
- alert(t("key")) → NO CHANGE
- template string `${t("key")}` → NO CHANGE
"""
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

def fix_t_in_text(text):
    """Fix t("...") in JSX text content."""
    changed = False
    result = []
    j = 0
    while j < len(text):
        if text[j:j+2] == 't(' and j+2 < len(text) and text[j+2] in '"\'`':
            quote = text[j+2]
            end = text.find(quote, j+3)
            if end != -1 and end < len(text) - 1 and text[end+1] == ')':
                key = text[j+3:end]
                preceding = ''.join(result).rstrip()
                if preceding.endswith('{'):
                    result.append(text[j:end+2])
                    j = end + 2
                    continue
                changed = True
                result.append('{t(' + quote + key + quote + ')}')
                j = end + 2
                continue
        result.append(text[j])
        j += 1
    return ''.join(result), changed

changes = []

for i, line in enumerate(lines):
    original = line
    line_changed = False
    new_line = ""
    pos = 0
    
    # Walk through the line, tracking whether we're inside {...}
    depth = 0  # JSX expression depth (0 = text node, 1+ = inside {})
    in_jsx_attr = False  # inside a JSX tag's attributes (between < and >)
    attr_depth = 0
    
    j = 0
    while j < len(line):
        ch = line[j]
        
        if ch == '<' and depth == 0:
            # Could be start of JSX element
            # Check if it's <Tag or </ or <> or <>
            if j + 1 < len(line) and line[j+1] == '/':
                pass  # closing tag, stays in text mode
            elif j + 1 < len(line) and line[j+1] == '!':
                pass  # comment
            elif j + 1 < len(line) and line[j+1] == '?':
                pass  # directive
            else:
                # Find the > of this tag
                gt = line.find('>', j)
                if gt != -1:
                    new_line += line[j:gt+1]
                    j = gt + 1
                    continue
        
        if ch == '{' and not in_jsx_attr:
            depth += 1
            new_line += ch
            j += 1
            continue
        
        if ch == '}' and not in_jsx_attr:
            depth = max(0, depth - 1)
            new_line += ch
            j += 1
            continue
        
        if ch == '>' and depth == 0:
            # This could be end of JSX tag, entering text node
            # Check it's not </
            if j + 1 < len(line) and line[j+1] == '/':
                new_line += ch
                j += 1
                continue
            # Check it's not part of >= etc
            if j > 0 and line[j-1] in '=<>!+-':
                new_line += ch
                j += 1
                continue
            new_line += ch
            j += 1
            continue
        
        if ch == '<' and depth > 0:
            # Inside JSX expression, just pass through
            new_line += ch
            j += 1
            continue
        
        new_line += ch
        j += 1
    
    # The above approach is too complex. Let me use a simpler regex approach.
    # Reset and try a different strategy.
    
    # SIMPLE APPROACH:
    # 1. Find all >...< segments (JSX text content between tags)
    # 2. Within those segments, find t("...") NOT preceded by {
    # 3. Only if the segment is NOT inside {...}
    
    # Even simpler: process line by line, looking for patterns like:
    # > t("key") < or > text t("key") < where t is NOT inside {}
    
    # Use a state machine: track { depth
    depth = 0
    result = []
    j = 0
    line_changed = False
    
    while j < len(line):
        ch = line[j]
        
        if ch == '{':
            depth += 1
            result.append(ch)
            j += 1
        elif ch == '}':
            depth = max(0, depth - 1)
            result.append(ch)
            j += 1
        elif ch == '>' and depth == 0:
            # End of JSX tag, entering text node territory
            result.append(ch)
            j += 1
            # Now scan ahead for t("...") or t(`...`) until next < or }
            text_start = len(result)
            text_end = j
            while text_end < len(line) and line[text_end] not in '<}':
                text_end += 1
            
            text_segment = line[j:text_end]
            new_segment, seg_changed = fix_t_in_text(text_segment)
            if seg_changed:
                line_changed = True
            result.append(new_segment)
            j = text_end
        else:
            result.append(ch)
            j += 1
    
    if line_changed:
        changes.append((i+1, original.rstrip(), ''.join(result).rstrip()))

def fix_t_in_text(text):
    """Fix t("...") in JSX text content (between > and < or })."""
    changed = False
    result = []
    j = 0
    
    while j < len(text):
        # Look for t("
        if text[j:j+2] == 't(' and j+2 < len(text) and text[j+2] in '"\'`':
            quote = text[j+2]
            # Find closing quote
            end = text.find(quote, j+3)
            if end != -1 and end < len(text) - 1 and text[end+1] == ')':
                key = text[j+3:end]
                # Check if preceded by { in the result buffer
                preceding = ''.join(result).rstrip()
                if preceding.endswith('{'):
                    # Already wrapped, skip
                    result.append(text[j:end+2])
                    j = end + 2
                    continue
                
                # Not wrapped, fix it
                changed = True
                result.append('{t(' + quote + key + quote + ')}')
                j = end + 2
                continue
        
        result.append(text[j])
        j += 1
    
    return ''.join(result), changed

print(f"Found {len(changes)} lines to fix")

for lineno, old, new in changes[:15]:
    print(f"\nLine {lineno}:")
    print(f"  OLD: {old[:180]}")
    print(f"  NEW: {new[:180]}")

if len(changes) > 15:
    print(f"\n... and {len(changes)-15} more")
    for lineno, old, new in changes[15:]:
        print(f"\nLine {lineno}:")
        print(f"  OLD: {old[:180]}")
        print(f"  NEW: {new[:180]}")

# Write back
change_map = {c[0]: c[2] + "\n" for c in changes}
with open(filepath, "w", encoding="utf-8") as f:
    for i, line in enumerate(lines):
        if (i+1) in change_map:
            f.write(change_map[i+1])
        else:
            f.write(line)

print(f"\nApplied {len(changes)} fixes.")
