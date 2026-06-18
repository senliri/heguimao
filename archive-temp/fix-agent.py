import re

path = r"C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\heguimao-deploy\frontend\src\lib\agent.ts"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the problematic section: "return normalizeDiagnosis(parsed) as T;\n  }"
# We need to replace this with just "return sanitizeNested(parsed);"
# and then the ensureRecommendations function should come after normalizeDiagnosis

# First, let's find and show the context around the issue
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'return normalizeDiagnosis(parsed) as T;' in line:
        print(f"Line {i}: {repr(line)}")
        print(f"Line {i+1}: {repr(lines[i+1])}")
        print(f"Line {i+2}: {repr(lines[i+2])}")
        print(f"Line {i+3}: {repr(lines[i+3])}")
        break
