with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Check: how many ? follow the arrow characters?
import re

# Count patterns
patterns = [
    ('鈥?', 'arrow + ?'),
    ('锛?', 'colon-arrow + ?'),
    ('鈫?', 'arrow2 + ?'),
]

for pat, desc in patterns:
    count = text.count(pat)
    print(f"{desc}: {count}")
    if count > 0:
        # Show context
        for m in re.finditer(re.escape(pat), text):
            pos = m.start()
            ctx = text[max(0,pos-15):pos+len(pat)+15].replace('\n', '\\n')
            print(f"  Context: ...{ctx}...")
