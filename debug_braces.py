import re

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Find where the brace depth goes to 2
brace_depth = 0
in_str = False
str_ch = None
line_num = 0

for idx, ch in enumerate(text):
    if idx == 0 or text[max(0,idx-1)] == '\n':
        line_num += 1
    if in_str:
        if ch == str_ch:
            in_str = False
    else:
        if ch in ('"', "'"):
            in_str = True
            str_ch = ch
        elif ch == '{':
            brace_depth += 1
        elif ch == '}':
            brace_depth -= 1

print(f"Final depth: {brace_depth}")

# Find the last position where depth goes to 2
depth = 0
in_s = False
s_ch = None
ln = 0
for idx, ch in enumerate(text):
    if idx == 0 or text[max(0,idx-1)] == '\n':
        ln += 1
    if in_s:
        if ch == s_ch:
            in_s = False
    else:
        if ch in ('"', "'"):
            in_s = True
            s_ch = ch
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == -1:
                print(f"Depth went to -1 at line {ln}, pos {idx}")
                print(f"Context: {text[max(0,idx-50):idx+50]}")
                break

# Count opening and closing braces
opens = text.count('{')
closes = text.count('}')
print(f"\nTotal {{ : {opens}, Total }} : {closes}, diff: {opens-closes}")

# Find lines with extra {
lines = text.split('\n')
d = 0
for i, line in enumerate(lines, 1):
    # Simple count (ignoring strings)
    opens = line.count('{')
    closes = line.count('}')
    d += opens - closes
    if abs(d) > 10:
        print(f"Line {i}: depth={d}, opens={opens}, closes={closes}: {line[:80]}")
