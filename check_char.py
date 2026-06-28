seq = b"\xe9\x94\x9b"
text = seq.decode("utf-8")
print(f"text: {repr(text)}")
print(f"chars: {[hex(ord(c)) for c in text]}")
