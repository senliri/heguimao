with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

bad = 0
for i, line in enumerate(lines, 1):
    text = line.strip()
    if 'zh:' in text:
        idx = text.rfind('zh:')
        if idx >= 0:
            zh_part = text[idx+3:].lstrip()
            if zh_part.startswith('"'):
                zh_part = zh_part[1:]
                if '"' not in zh_part:
                    bad += 1
                    if bad <= 10:
                        print(f"Line {i}: No closing quote")
                        print(f"  {text[:200]}")

print(f"Total lines with no closing quote in zh: {bad}")
