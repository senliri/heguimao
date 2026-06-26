#!/usr/bin/env python3
import sys, json
sys.stdout.reconfigure(encoding='utf-8')

config_path = r"C:\Users\87931\.qclaw\openclaw.json"
with open(config_path, 'r', encoding='utf-8') as f:
    config = json.load(f)

config['browser']['ssrfPolicy']['dangerouslyAllowPrivateNetwork'] = True

with open(config_path, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("Updated dangerouslyAllowPrivateNetwork to true")
