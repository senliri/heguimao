#!/usr/bin/env python3
"""Verify the built i18n bundle is correct"""
import sys, os, glob
sys.stdout.reconfigure(encoding='utf-8')

assets_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\dist\assets"
js_files = glob.glob(os.path.join(assets_dir, "*.js"))
print(f"Built JS files ({len(js_files)}):")
for f in sorted(js_files, key=lambda x: os.path.getsize(x), reverse=True)[:3]:
    size_kb = os.path.getsize(f) / 1024
    print(f"  {os.path.basename(f)} ({size_kb:.0f} KB)")

# Main bundle is the largest
main_path = max(js_files, key=lambda f: os.path.getsize(f))
main_name = os.path.basename(main_path)
print(f"\nMain bundle: {main_name}")

with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check for t function
t_refs = content.count('function t')
print(f"t() function defs: {t_refs}")

# Check for translation keys
key_refs = content.count('report.') + content.count('nav.') + content.count('auth.')
print(f"Translation key refs: {key_refs}")

# Check for "Translation key not found" warning
warnings = content.count('Translation key not found')
print(f"Missing key warning present: {'YES' if warnings else 'NO'}")

# Balance check
print(f"Braces balanced: {{ {content.count('{')} }} {content.count('}')} -> {content.count('{') == content.count('}')}")
print(f"Parens balanced: ( {content.count('(')} ) {content.count(')')} -> {content.count('(') == content.count(')')}")

# Check HTML references correct JS
html_path = os.path.join(assets_dir.replace('assets', ''), 'index.html')
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()
script_tags = [line.strip() for line in html.split('\n') if '<script' in line.lower()]
print(f"\n<script> tags in index.html:")
for s in script_tags:
    print(f"  {s}")

print("\n✅ Verification complete")
