with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()

# Find the zh part of line 591
idx = raw.find(b'zh: "\xe2\x86\x92')
if idx >= 0:
    segment = raw[idx:idx+20]
    print(f"Segment: {repr(segment)}")
    print(f"Segment hex: {segment.hex()}")
    
    # What comes after the arrow?
    after_arrow = raw[idx+10:idx+20]
    print(f"After arrow: {repr(after_arrow)}")
    print(f"After arrow hex: {after_arrow.hex()}")
