#!/usr/bin/env python3
"""Find where the 'missing' keys actually come from"""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

frontend_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src"

suspect_keys = [
    "", "(", "Submission failed. Please try again.", "_", "a", "ai", "cat",
    "invalid-email", "jspdf", "jspdf-autotable", "local-storage-change",
    "market", "meta", "product", "sub", "token", "删除用户失败", "更新用户失败"
]

for root, dirs, files in os.walk(frontend_dir):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for fname in files:
        if not (fname.endswith('.tsx') or fname.endswith('.ts')):
            continue
        fpath = os.path.join(root, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except:
            continue
        
        for lineno, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith(('import ', 'from ', 'export ')):
                continue
            if 't(' not in stripped:
                continue
            
            matches = re.findall(r't\(\s*["\']([^"\']+)["\']\s*\)', stripped)
            for key in matches:
                if key in suspect_keys:
                    print(f"\nFound '{key}' in {fpath}:{lineno}")
                    print(f"  Line: {stripped[:120]}")
