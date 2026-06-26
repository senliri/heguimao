#!/usr/bin/env python3
import sys, json, os
sys.stdout.reconfigure(encoding='utf-8')

config_path = r"C:\Users\87931\.qclaw\openclaw.json"
with open(config_path, 'r', encoding='utf-8') as f:
    config = json.load(f)

# Navigate to browser.ssrfPolicy
browser = config.get('browser', {})
ssrf = browser.get('ssrfPolicy', {})
print(json.dumps(ssrf, indent=2, ensure_ascii=False))
