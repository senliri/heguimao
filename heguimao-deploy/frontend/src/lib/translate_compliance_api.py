# -*- coding: utf-8 -*-
"""Batch translate compliance keys using Agnes API"""
import json
import time
import re
import urllib.request
import urllib.error

API_KEY = "sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F"
API_URL = "https://api.agnes.ai/v1/chat/completions"

# Load untranslated keys
untranslated = []
with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\untranslated_keys.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        parts = line.split('\t', 1)
        if len(parts) == 2:
            untranslated.append((parts[0], parts[1]))

# Filter to site.compliance keys only (desc/action/name)
compliance_keys = [(k, v) for k, v in untranslated if k.startswith('site.compliance')]
print(f'Total compliance keys: {len(compliance_keys)}')

# Split into batches of 20
batches = []
batch_size = 20
for i in range(0, len(compliance_keys), batch_size):
    batches.append(compliance_keys[i:i+batch_size])

print(f'Split into {len(batches)} batches of {batch_size}')

# Build translation prompt
def build_prompt(items):
    """Build a prompt for translating a batch of keys"""
    lines = []
    for key, en_text in items:
        lines.append(f'{key}: "{en_text}"')
    
    prompt = f"""Translate the following English regulatory compliance terms into professional Chinese (Simplified). 

Rules:
1. Keep standard acronyms and regulation numbers (FDA, CE, FCC, REACH, RoHS, CPC, ASTM, ISO, etc.)
2. Translate descriptive parts professionally using industry-standard terminology
3. For regulation names: translate the descriptive part, keep the acronym
4. For action items: translate to imperative Chinese (动词开头)
5. For descriptions: translate fully but keep acronyms
6. Return ONLY a JSON object with keys matching the input, values being the Chinese translation
7. Do NOT add any explanation or markdown

Example:
- "FDA Food Facility Registration" -> "FDA食品设施注册"
- "Apply BIS Certification" -> "申请BIS认证"
- "Battery Containing Products Must Comply With The New Battery Regulation" -> "含电池产品需符合新电池法规"

Items to translate:
{chr(10).join(lines)}

Return JSON like:
{{"key1": "中文翻译1", "key2": "中文翻译2"}}"""
    return prompt

results = {}
failed = []

for batch_idx, batch in enumerate(batches):
    print(f'\nProcessing batch {batch_idx+1}/{len(batches)} ({len(batch)} items)...')
    
    prompt = build_prompt(batch)
    
    data = json.dumps({
        "model": "agnes-2.0-flash",
        "messages": [
            {"role": "system", "content": "You are a professional regulatory compliance translator. Translate English to Simplified Chinese. Keep acronyms and regulation numbers. Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 4000
    }, ensure_ascii=False).encode('utf-8')
    
    req = urllib.request.Request(API_URL, data=data, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    })
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            response = json.loads(resp.read().decode('utf-8'))
            text = response['choices'][0]['message']['content'].strip()
            
            # Try to extract JSON from the response
            json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                batch_results = json.loads(json_str)
                results.update(batch_results)
                print(f'  ✓ Translated {len(batch_results)} items')
            else:
                print(f'  ✗ No JSON found in response')
                failed.extend([k for k, v in batch])
                
    except Exception as e:
        print(f'  ✗ Error: {e}')
        failed.extend([k for k, v in batch])
    
    time.sleep(0.5)  # Rate limit

# Save results
print(f'\n=== Results ===')
print(f'Successfully translated: {len(results)}')
print(f'Failed: {len(failed)}')

with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\translation_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\failed_keys.txt', 'w', encoding='utf-8') as f:
    for k in failed:
        f.write(k + '\n')

print('Saved to translation_results.json and failed_keys.txt')
