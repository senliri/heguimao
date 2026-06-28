with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    data = f.read()
    lines = data.split(b'\n')

# Check line 16 (index 15)
print("Line 16 raw bytes:")
print(repr(lines[15]))
print()

# Check line 34 (index 33)
print("Line 34 raw bytes:")
print(repr(lines[33]))
print()

# Check line 90 (index 89)
print("Line 90 raw bytes:")
print(repr(lines[89]))
print()

# Count how many lines have the pattern: zh value with UTF-8 bytes that look like GBK mojibake
# These are lines where zh value contains non-ASCII bytes that aren't valid UTF-8 sequences
bad_utf8 = 0
for i, line in enumerate(lines, 1):
    if b'zh:' in line:
        # Try to decode as UTF-8
        try:
            text = line.decode('utf-8')
        except UnicodeDecodeError:
            bad_utf8 += 1
            if bad_utf8 <= 5:
                print(f"Line {i}: Invalid UTF-8")
                print(f"  Raw: {line[:200]}")

print(f"\nLines with invalid UTF-8: {bad_utf8}")

# Also check for the specific pattern: zh value ends with a byte that isn't a proper quote
# The issue might be that the closing " is being corrupted
for i, line in enumerate(lines, 1):
    text = line.decode('utf-8', errors='replace')
    if 'zh:' in text and ': },' in text:
        # Check if zh value has the pattern: "value锛? },  (missing closing quote)
        # The锛? is actually the UTF-8 representation of ：
        if '锛?' in text or '銆?' in text or '鈥?' in text:
            bad_utf8 += 1
            if bad_utf8 <= 5:
                print(f"Line {i}: Mojibake in zh value")
                print(f"  {text[:200]}")
