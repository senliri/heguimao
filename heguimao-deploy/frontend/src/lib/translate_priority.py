# -*- coding: utf-8 -*-
"""Translate compliance keys - batch 1 of priority keys"""
import json
import time
import re
import urllib.request
import urllib.error

API_KEY = "sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F"
API_URL = "https://api.agnes.ai/v1/chat/completions"

# Load untranslated keys
untranslated = {}
with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\untranslated_keys.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        parts = line.split('\t', 1)
        if len(parts) == 2:
            untranslated[parts[0]] = parts[1]

# Filter to priority site.compliance keys
compliance_keys = {k: v for k, v in untranslated.items() if k.startswith('site.compliance')}
priority_keys = {k: v for k, v in compliance_keys.items() 
                 if '.name.' in k or '.desc.' in k or '.action.' in k}

print(f'Priority keys: {len(priority_keys)}')

def translate_batch(items_dict, attempt=1):
    if not items_dict:
        return {}
    
    lines = '\n'.join([f'{k}: "{v}"' for k, v in items_dict.items()])
    
    prompt = f"""Translate these English regulatory compliance terms into professional Simplified Chinese.

Rules:
1. Keep standard acronyms (FDA, CE, FCC, REACH, RoHS, CPC, ASTM, ISO, BIS, KC, PSE, etc.)
2. Translate descriptive parts using industry-standard Chinese terminology
3. For regulation names: keep the acronym, translate the description
4. For action items: use imperative Chinese (verb first, e.g. 申请, 提交, 确认)
5. For descriptions: translate fully but keep acronyms
6. Return ONLY a JSON object with exact keys matching the input

Items:
{lines}

Return JSON only:"""
    
    data = json.dumps({
        "model": "agnes-2.0-flash",
        "messages": [
            {"role": "system", "content": "You are a professional regulatory compliance translator. Translate English to Simplified Chinese. Keep acronyms. Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 8000
    }, ensure_ascii=False).encode('utf-8')
    
    req = urllib.request.Request(API_URL, data=data, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    })
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            response = json.loads(resp.read().decode('utf-8'))
            text = response['choices'][0]['message']['content'].strip()
            
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                batch_results = json.loads(json_match.group(0))
                return batch_results
            else:
                print(f'  No JSON found in response')
                return {}
    except Exception as e:
        print(f'  Error: {e}')
        return {}

# Process in batches of 15
batch_size = 15
priority_items = list(priority_keys.items())
results = {}
total_batches = (len(priority_items) + batch_size - 1) // batch_size

for i in range(0, len(priority_items), batch_size):
    batch = dict(priority_items[i:i+batch_size])
    batch_num = (i // batch_size) + 1
    print(f'Batch {batch_num}/{total_batches} ({len(batch)} items)...')
    
    translated = translate_batch(batch)
    results.update(translated)
    print(f'  Got {len(translated)} translations')
    
    time.sleep(1)

# Save
with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\compliance_translations.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f'\nDone. Translated: {len(results)}')
for k, v in list(results.items())[:5]:
    print(f'  {k}: {v}')
