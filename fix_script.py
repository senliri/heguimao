with open(r"D:\qclaw\workspace-AI工程师\rewrite_i18n.py", "rb") as f:
    data = f.read()
data = data.replace(b'suffix = \'\'"\'\' + suffix', b'suffix = b\'\'"\'\' + suffix')
with open(r"D:\qclaw\workspace-AI工程师\rewrite_i18n.py", "wb") as f:
    f.write(data)
print("Fixed")
