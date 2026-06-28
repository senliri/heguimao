import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

# Read the CURRENT (already partially fixed) file
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Find lines that start with ", zh:" — these are fragments from broken multi-line values
lines = text.split('\n')
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    # Check if this line is a fragment (starts with , zh:)
    if line.strip().startswith(', zh:') and i > 0:
        # Merge with previous line
        prev = new_lines[-1]
        merged = prev.rstrip() + ' ' + line.lstrip()
        new_lines[-1] = merged
        print(f"Merged fragment line {i+1} with line {i}")
        i += 1
        continue
    new_lines.append(line)
    i += 1

text = '\n'.join(new_lines)

# Now fix zh values missing closing quotes
def fix_zh_closing(text):
    lines = text.split('\n')
    new_lines = []
    for line in lines:
        if ', zh:' in line:
            # Try to find balanced zh value
            m = re.search(r',\s*zh:\s*"(.*)"', line)
            if not m:
                # Missing closing quote
                m2 = re.search(r',\s*zh:\s*"', line)
                if m2:
                    val_start = m2.end()
                    close_brace = line.rfind('}')
                    if close_brace > val_start:
                        # Check if there's a trailing " at the end
                        end_quote = line.rfind('"')
                        if end_quote > val_start and end_quote < close_brace:
                            # There IS a closing quote somewhere before }
                            new_lines.append(line)
                        else:
                            # No closing quote — add one
                            line = line[:close_brace] + '"' + line[close_brace:]
                            print(f"  Added closing quote to line")
            new_lines.append(line)
        else:
            new_lines.append(line)
    return '\n'.join(new_lines)

text = fix_zh_closing(text)

# Fix orphaned uXXXX escapes (restore missing backslashes)
def fix_orphaned_escapes(text):
    lines = text.split('\n')
    new_lines = []
    for line in lines:
        if ', zh:' in line:
            # Find zh value and restore missing \ before uXXXX
            def restore(m):
                return '\\u' + m.group(1)
            # Replace uXXXX (not preceded by \) with \uXXXX
            line = re.sub(r'(?<!\\)u([0-9a-fA-F]{4})', restore, line)
        new_lines.append(line)
    return '\n'.join(new_lines)

text = fix_orphaned_escapes(text)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)

print("Done with fragment merging and escape fixing.")

# Verify
with open(filepath, "r", encoding="utf-8") as f:
    final = f.read()

lines = final.split('\n')
bad = 0
for i, line in enumerate(lines, 1):
    if line.strip().startswith(', zh:'):
        bad += 1
        print(f"Fragment line {i}: {line[:60]}")
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            bad += 1
            if bad <= 5:
                print(f"Bad zh line {i}: {line[:60]}")

if bad == 0:
    print("All lines look good!")
else:
    print(f"\n{bad} issues remaining.")
