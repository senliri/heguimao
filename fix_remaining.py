import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "rb") as f:
    raw = f.read()

lines = raw.split(b"\n")

# Line 591: "report.link": { en: "锛?", zh: "锛?" }
# 锛 = \xe9\x88\xab = U+922B (corrupted arrow →)
# Replace with proper arrow
raw = raw.replace(b'\xe9\x88\xab?', b'\xe2\x86\x92')  # 锛? → →

# Line 515: long line with mixed corrupted chars in zh value
# Find and fix: 銆 -> 、, 锛 -> ：, 锗 -> 等
line515 = lines[514]
# Replace all known corrupted patterns
line515 = line515.replace(b'\xe9\x8a\x86', b'\xe3\x80\x81')  # 銆 -> 、
line515 = line515.replace(b'\xe9\x94\x9b', b'\xef\xbc\x9a')  # 锛 -> ：
line515 = line515.replace(b'\xe9\x94\x9b\xe5\xad\xbf', b'\xef\xbc\x9a\xe5\xae\xb9')  # 锛竼 -> ：容
line515 = line515.replace(b'\xe9\x94\x9b\xe6\xad\x82', b'\xef\xbc\x9a\xe6\xad\xa2')  # 锛姂 -> ：正
line515 = line515.replace(b'\xe9\x94\x9b\xe5\xae\xb8', b'\xef\xbc\x9a\xe5\xae\xb8')  # 锛竸 -> ：隶
line515 = line515.replace(b'\xe9\x94\x9b\xe5\xad\xbfu6cd5', b'\xef\xbc\x9a\xe5\xae\xb8u6cd5')  # 锛竼u6cd5 -> ：隶u6cd5
line515 = line515.replace(b'\xe9\x94\x9b\xe5\xa4\x88', b'\xef\xbc\x9a\xe5\xa4\x88')  # 锛竸 -> ：姆
line515 = line515.replace(b'\xe9\x94\x9b\xe5\x9c\xbdu5fb7', b'\xef\xbc\x9a\xe5\x9c\xbdu5fb7')  # 锛竼u5fb7 -> ：在地
line515 = line515.replace(b'\xe9\x94\x9b\xe6\xad\x8emsatzsteuer', b'\xef\xbc\x9a\xe6\xad\x8emsatzsteuer')  # 锛姂 -> ：正
line515 = line515.replace(b'\xe9\x94\x9b\xe5\xad\xbfu6cd5', b'\xef\xbc\x9a\xe5\xae\xb8u6cd5')  # 锛竼u6cd5 -> ：隶u6cd5
line515 = line515.replace(b'\xe9\x94\x9b\xe5\xa4\x88\xe2\x82\xac?', b'\xef\xbc\x9a\xe5\xa4\x88\xe2\x82\xac"')  # 锛竸欧元? -> ：姆欧元"

lines[514] = line515
raw = b"\n".join(lines)

with open(filepath, "wb") as f:
    f.write(raw)

print("Fixed remaining lines.")

# Verify
with open(filepath, "rb") as f:
    content = f.read()

# Check line 591
lines2 = content.split(b"\n")
print(f"Line 591: {lines2[590]}")
print(f"Line 515: {lines2[514][:100]}...")

# Check for remaining issues
import re
unclosed = 0
for i, line in enumerate(lines2, 1):
    if b', zh:' in line:
        m = re.search(rb',\s*zh:\s*"(.*)"', line)
        if not m:
            unclosed += 1
            if unclosed <= 5:
                print(f"Line {i} still unclosed: {line[:80]}")

if unclosed == 0:
    print("All zh values now have closing quotes!")
