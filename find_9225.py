with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('\u9225')
if idx >= 0:
    ctx = text[max(0,idx-30):idx+30]
    print(f"U+9225 at pos {idx}: ...{ctx}...")
    
    # What line is this?
    line_num = text[:idx].count('\n') + 1
    print(f"Line: {line_num}")
