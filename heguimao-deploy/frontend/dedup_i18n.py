#!/usr/bin/env python3
"""Remove duplicate keys from i18n.ts, keeping the first occurrence."""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Parse the file into key-value blocks
# Pattern: "key": { en: "...", zh: "..." },
pattern = r'"([^"]+)":\s*\{\s*en:\s*"([^"]*)",\s*zh:\s*"([^"]*)"\s*\}'
matches = list(re.finditer(pattern, content))

seen = {}
remove_ranges = []

# Process in reverse order so we remove duplicates (keep first occurrence)
for i, match in enumerate(matches):
    key = match.group(1)
    if key in seen:
        # This is a duplicate - mark for removal
        remove_ranges.append((match.start(), match.end()))
    else:
        seen[key] = i

# Remove duplicates in reverse order to preserve positions
for start, end in reversed(remove_ranges):
    content = content[:start] + content[end:]

# Clean up any double commas left behind
content = re.sub(r',\s*,', ',', content)
# Clean up empty lines from removals
content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Removed {len(remove_ranges)} duplicate keys")
print(f"Remaining keys: {len(seen)}")
