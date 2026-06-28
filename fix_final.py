import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

# Pattern: corrupted Chinese punctuation + ? where ? was actually the closing "
# These are always at the END of zh values, before } or space + }
# Replace 锛? with ：" (correct colon + closing quote)
# Replace 銆? with 、" (correct comma + closing quote)
# Replace 鈥? with "" (correct quote + closing quote)

with open(filepath, "rb") as f:
    raw = f.read()

# Map of corrupted byte sequences → correct sequences
# Order matters: longer patterns first
CORRUPTIONS = [
    # 锛? = \xe9\x94\x9b? → ：" = \xef\xbc\x9a"
    (b'\xe9\x94\x9b?', b'\xef\xbc\x9a"'),
    # 銆? = \xe9\x8a\x86? → 、" = \xe3\x80\x81"
    (b'\xe9\x8a\x86?', b'\xe3\x80\x81"'),
    # 鈥? = \xe9\x88\xa5? → ""
    (b'\xe9\x88\xa5?', b'""'),
    # 锛竼 = \xe9\x94\x9b\xe5\xad\xbf → ：容 = \xef\xbc\x9a\xe5\xae\xb9
    (b'\xe9\x94\x9b\xe5\xad\xbf', b'\xef\xbc\x9a\xe5\xae\xb9'),
    # 銆竼 = \xe9\x8a\x86\xe4\xb9\x97 → 、产 = \xe3\x80\x81\xe4\xb9\x97
    (b'\xe9\x8a\x86\xe4\xb9\x97', b'\xe3\x80\x81\xe4\xb9\x97'),
    # 锛姂 = \xe9\x94\x9b\xe6\xad\x82 → ：正 = \xef\xbc\x9a\xe6\xad\xa3
    (b'\xe9\x94\x9b\xe6\xad\x82', b'\xef\xbc\x9a\xe6\xad\xa3'),
    # 锛竸 = \xe9\x94\x9b\xe5\xa4\x88 → ：姆 = \xef\xbc\x9a\xe5\xa4\x88
    (b'\xe9\x94\x9b\xe5\xa4\x88', b'\xef\xbc\x9a\xe5\xa4\x88'),
    # 锛� = \xe9\x94\x9b\xe2\x82\xac → ：€ = \xef\xbc\x9a\xe2\x82\xac
    (b'\xe9\x94\x9b\xe2\x82\xac', b'\xef\xbc\x9a\xe2\x82\xac'),
    # 锛? (standalone, no following char) → ："
    (b'\xe9\x94\x9b', b'\xef\xbc\x9a"'),
    # 銆? (standalone) → 、"
    (b'\xe9\x8a\x86', b'\xe3\x80\x81"'),
]

for bad, good in CORRUPTIONS:
    count = raw.count(bad)
    if count > 0:
        raw = raw.replace(bad, good)
        print(f"Replaced {bad.hex()} ({count} times) with {good.hex()}")

with open(filepath, "wb") as f:
    f.write(raw)

# Verify
with open(filepath, "rb") as f:
    content = f.read()

lines = content.split(b"\n")
unclosed = 0
for i, line in enumerate(lines, 1):
    if b', zh:' in line:
        m = re.search(rb',\s*zh:\s*"(.*)"', line)
        if not m:
            unclosed += 1
            if unclosed <= 5:
                print(f"Line {i} still unclosed: {line[:80]}")

if unclosed == 0:
    print("\nAll zh values now have closing quotes!")
else:
    print(f"\n{unclosed} lines still missing closing quotes.")
