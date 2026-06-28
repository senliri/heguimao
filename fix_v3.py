import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

# Step 1: Replace corrupted bytes with correct Unicode characters
# These are ALL in the middle of values, NOT at the end
CORRUPTION_TO_UNICODE = [
    # 锛 (U+951B = \xe9\x94\x9b) → ： (U+FF1A) FULLWIDTH COLON
    (b'\xe9\x94\x9b', '\uff1a'),
    # 銆 (U+9486 = \xe9\x8a\x86) → 、 (U+3001) IDEOGRAPHIC COMMA  
    (b'\xe9\x8a\x86', '\u3001'),
    # 鈥 (U+9225 = \xe9\x88\xa5) → " (U+0022) DOUBLE QUOTE
    (b'\xe9\x88\xa5', '"'),
    # 锛 (U+922B = \xe9\x88\xab) → → (U+2192) RIGHT ARROW
    (b'\xe9\x88\xab', '\u2192'),
    # 锕 (U+9515 = \xe9\x94\x95) → ． (U+FF0E) FULLWIDTH FULL STOP
    (b'\xe9\x94\x95', '\uff0e'),
    # 锔 (U+9514 = \xe9\x94\x94) → · (U+00B7) MIDDLE DOT
    (b'\xe9\x94\x94', '\u00b7'),
    # 鈹 (U+9439 = \xe9\x90\xb9) → — (U+2014) EM DASH
    (b'\xe9\x90\xb9', '\u2014'),
]

with open(filepath, "rb") as f:
    raw = f.read()

# Apply replacements
for bad_bytes, unicode_char in CORRUPTION_TO_UNICODE:
    count = raw.count(bad_bytes)
    if count > 0:
        raw = raw.replace(bad_bytes, unicode_char.encode("utf-8"))
        print(f"Replaced {bad_bytes.hex()} ({count} times) with U+{ord(unicode_char):04X} ({unicode_char})")

# Step 2: Fix zh values missing closing quotes
# Pattern: zh value ends with a Unicode escape or Chinese char followed by ? } or space }
# The ? is a corrupted closing "
# We need to find zh values that DON'T have a closing " before }

content = raw.decode("utf-8")

# Find all zh values and check for closing quote
def fix_zh_closing_quotes(text):
    """Find zh values missing closing quotes and add them."""
    result = text
    # Match zh: "..." pattern where ... may or may not have closing "
    # We look for lines with zh: that don't have a balanced quote
    
    lines = result.split("\n")
    new_lines = []
    for line in lines:
        if ', zh:' in line:
            # Try to find zh value with closing quote
            m = re.search(r',\s*zh:\s*"(.*)"', line)
            if m:
                # Has closing quote, keep as-is
                new_lines.append(line)
            else:
                # Missing closing quote - find the zh value start and add closing quote
                m2 = re.search(r',\s*zh:\s*"', line)
                if m2:
                    # Find the value content (everything after zh: ")
                    value_start = m2.end()
                    # Find the } that ends this entry
                    close_brace = line.rfind("}")
                    if close_brace > value_start:
                        # Insert closing " before }
                        new_line = line[:value_start] + line[value_start:close_brace] + '"' + line[close_brace:]
                        new_lines.append(new_line)
                        print(f"  Added closing quote at line")
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)
        else:
            new_lines.append(line)
    return "\n".join(new_lines)

content = fix_zh_closing_quotes(content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

# Step 3: Verify
with open(filepath, "r", encoding="utf-8") as f:
    final = f.read()

lines = final.split("\n")
unclosed = 0
for i, line in enumerate(lines, 1):
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            unclosed += 1
            if unclosed <= 5:
                print(f"Line {i} still unclosed: {line[:80]}")

if unclosed == 0:
    print("\nAll zh values have closing quotes!")
else:
    print(f"\n{unclosed} lines still missing closing quotes.")

# Check for remaining corrupted bytes
remaining = 0
for bad_bytes, _ in CORRUPTION_TO_UNICODE:
    count = final.encode("utf-8").count(bad_bytes)
    if count > 0:
        remaining += count
        print(f"WARNING: Still found {bad_bytes.hex()} {count} times!")

if remaining == 0:
    print("All corrupted bytes fixed.")
