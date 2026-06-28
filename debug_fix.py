import re
s = b'\\u7c98\\u8d34\\u4e9a\\u9a6c\\u900a\\u5408\\u89c4\\u901a\\u77e5 \xe9\x88\xa5?AI \\u8bc6\\u522b\\u95ee\\u9898\xe9\x8a\x86\xe4\xb9\x97u5206\\u6790\\u4e25\\u91cd\\u6027\xe9\x94\x9b\xe5\xad\xbfu81ea\\u52a8\\u751f\\u6210\\u9488\\u5bf9\\u6027\\u7533\\u8bc9\\u4fe1\xe9\x8a\x86? '

print(f"Original length: {len(s)}")
print(f"Has raw bytes: {any(b > 127 for b in s)}")

# Strip
s2 = s.rstrip(b" \r\t")
print(f"After rstrip: {len(s2)}")

while s2.endswith(b"?"):
    s2 = s2[:-1]
print(f"After ? strip: {len(s2)}")

# Convert
fixed = bytearray()
j = 0
while j < len(s2):
    b = s2[j]
    if b == 92 and j + 5 < len(s2) and s2[j+1:j+2] == b"u":
        hex_str = s2[j+2:j+6]
        if len(hex_str) == 4:
            try:
                int(hex_str.decode("ascii"), 16)
                fixed.extend(s2[j:j+6])
                j += 6
                continue
            except ValueError:
                pass
    if b > 127:
        k = j
        while k < len(s2) and s2[k] > 127:
            k += 1
        seq = s2[j:k]
        try:
            text = seq.decode("utf-8")
            for ch in text:
                code = ord(ch)
                fixed.extend(f"\\u{code:04x}".encode("ascii"))
        except:
            pass
        j = k
    else:
        fixed.append(b)
        j += 1

print(f"Fixed length: {len(fixed)}")
print(f"Fixed has raw bytes: {any(b > 127 for b in fixed)}")
print(f"Fixed preview: {bytes(fixed)[:150]}")
