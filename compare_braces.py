import subprocess
result = subprocess.run(
    ["git", "show", "HEAD:./frontend/src/lib/i18n.ts"],
    capture_output=True,
    cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy"
)
text = result.stdout.decode("utf-8")
opens = text.count('{')
closes = text.count('}')
print(f"Git version: {{ = {opens}, }} = {closes}, diff = {opens-closes}")

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    mod = f.read()
opens = mod.count('{')
closes = mod.count('}')
print(f"Modified: {{ = {opens}, }} = {closes}, diff = {opens-closes}")
