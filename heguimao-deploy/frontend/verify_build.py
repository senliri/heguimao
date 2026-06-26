#!/usr/bin/env python3
"""Verify the built i18n bundle is correct"""
import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')

dist_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\dist"
js_files = [f for f in os.listdir(dist_dir) if f.endswith('.js')]
print(f"Built JS files: {js_files}")

# Find the main bundle (largest one)
main_js = max(js_files, key=lambda f: os.path.getsize(os.path.join(dist_dir, f)))
main_path = os.path.join(dist_dir, main_js)
size_kb = os.path.getsize(main_path) / 1024
print(f"Main bundle: {main_js} ({size_kb:.0f} KB)")

with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check for t function
t_count = content.count('function t(') + content.count('t(key')
print(f"t() function references: {t_count}")

# Check for translation keys
key_markers = content.count('"report.') + content.count('"nav.') + content.count('"auth.')
print(f"Translation key references: {key_markers}")

# Check for "Translation key not found" warning
warnings = content.count('Translation key not found')
print(f"Missing key warnings: {warnings}")

# Check for syntax errors (unmatched brackets)
opens = content.count('{')
closes = content.count('}')
print(f"Braces: {{ {opens} }} {closes} - balanced: {opens == closes}")

print("\n✅ Verification complete")
