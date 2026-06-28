with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()
try:
    raw.decode("utf-8")
    print("File is valid UTF-8")
except UnicodeDecodeError as e:
    print(f"Invalid UTF-8: {e}")
    pos = e.start
    print(f"Around pos {pos}: {raw[pos-20:pos+20]}")
