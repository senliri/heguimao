import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# The closing-quote fix added extra " before } on lines that already had "
# Specifically: lines where the value ends with → } (after arrow fix)
# The → was →? → → (arrow), and the ? was the closing "
# But then the closing-quote fix added ANOTHER " before }

# Fix: remove the extra " that was incorrectly added
# Pattern: →" } should be →" } (keep one "), but →" " } should be →" }

# More generally: find lines where closing-quote fix added an extra "
# The pattern is: value + " " + } where the space is between two "
text = text.replace('" "', '"')

with open(filepath, "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

# Verify
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()
print(f"Line 591: {repr(lines[590])}")

# Check for remaining issues
bad = 0
for i, line in enumerate(lines, 1):
    if line.strip().startswith(', zh:'):
        bad += 1
        print(f"Fragment line {i}")
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            bad += 1
            if bad <= 3:
                print(f"Bad zh {i}: {line[:60]}")

if bad == 0:
    print("All checks passed!")
