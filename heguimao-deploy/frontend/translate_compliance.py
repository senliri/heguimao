#!/usr/bin/env python3
"""Batch-translate untranslated compliance keys in i18n.ts using Agnes API."""

import json
import re
import sys
import urllib.request
import urllib.error

API_URL = "https://agent.qclaw.dev/v1/chat/completions"
API_KEY = ""  # Will read from env

def read_env():
    """Read API key from environment."""
    import os
    key = os.environ.get("AGNES_API_KEY", "")
    if not key:
        print("ERROR: AGNES_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    return key

def extract_untranslated(filepath):
    """Extract all keys where en == zh from i18n.ts."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Match pattern: "key": { en: "...", zh: "..." },
    pattern = r'"([^"]+)":\s*\{\s*en:\s*"((?:[^"\\]|\\.)*)",\s*zh:\s*"((?:[^"\\]|\\.)*)"'
    
    untranslated = []
    for m in re.finditer(pattern, content):
        key = m.group(1)
        en = m.group(2)
        zh = m.group(3)
        if en == zh and en.strip():
            untranslated.append({
                "key": key,
                "en": en,
                "zh": zh,
                "match": m.group(0)
            })
    
    print(f"Found {len(untranslated)} untranslated keys", file=sys.stderr)
    return untranslated

def translate_batch(items, api_key, batch_size=20):
    """Translate items in batches using Agnes API."""
    import os
    
    translated = {}
    
    # Group by type for better translation context
    name_items = [i for i in items if i["key"].startswith("site.compliance.name.") or i["key"].startswith("site.compliance_time.")]
    desc_items = [i for i in items if i["key"].startswith("site.compliance_desc.")]
    action_items = [i for i in items if i["key"].startswith("site.compliance_action.")]
    
    groups = [
        ("compliance names", name_items),
        ("compliance descriptions", desc_items),
        ("compliance actions", action_items),
    ]
    
    for group_name, group_items in groups:
        if not group_items:
            continue
        
        # Split into smaller batches
        for i in range(0, len(group_items), batch_size):
            batch = group_items[i:i+batch_size]
            
            # Build prompt for translation
            pairs = "\n".join([f'{item["key"].split(".")[-1]}: {item["en"]}' for item in batch])
            
            prompt = f"""You are a professional Chinese translator specializing in Amazon seller compliance and international trade regulations.

Translate the following {'compliance names' if group_name == 'compliance names' else 'compliance descriptions' if group_name == 'compliance descriptions' else 'compliance actions'} from English to Simplified Chinese.

Rules:
- Keep acronyms and abbreviations (FDA, CE, FCC, REACH, RoHS, etc.) in English
- Keep standard regulation numbers (EN 71, CPSIA, Prop 65, etc.) in original format
- Use professional terminology familiar to Chinese Amazon sellers
- Keep the key prefix intact (site.compliance.name.xxx, site.compliance_desc.xxx, site.compliance_action.xxx)
- Output format: JSON object with full keys as values and Chinese translations as values

Here are the items to translate:

{pairs}

Output ONLY a valid JSON object like:
{{
  "site.compliance.name.xxx": "中文翻译",
  "site.compliance_desc.yyy": "中文翻译",
  ...
}}

Do not include any other text. Do not include markdown code fences."""
            
            try:
                data = json.dumps({
                    "model": "agnes-2.0-flash",
                    "messages": [
                        {"role": "system", "content": "You are a professional Chinese translator specializing in Amazon seller compliance and international trade regulations."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 4000
                }).encode("utf-8")
                
                req = urllib.request.Request(
                    API_URL,
                    data=data,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    }
                )
                
                with urllib.request.urlopen(req, timeout=120) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
                    text = result["choices"][0]["message"]["content"].strip()
                    
                    # Extract JSON from response (may have markdown fences)
                    json_match = re.search(r'\{[\s\S]*\}', text)
                    if json_match:
                        trans_json = json.loads(json_match.group(0))
                        for k, v in trans_json.items():
                            if isinstance(v, str) and v:
                                translated[k] = v
                
                print(f"  Translated {i+1}/{len(group_items)} ({group_name})", file=sys.stderr)
                
                # Small delay to avoid rate limiting
                import time
                time.sleep(0.5)
                
            except Exception as e:
                print(f"  ERROR translating batch {i//batch_size + 1} of {group_name}: {e}", file=sys.stderr)
                # Retry once
                try:
                    import time
                    time.sleep(2)
                    data = json.dumps({
                        "model": "agnes-2.0-flash",
                        "messages": [
                            {"role": "system", "content": "You are a professional Chinese translator."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 4000
                    }).encode("utf-8")
                    
                    req = urllib.request.Request(
                        API_URL,
                        data=data,
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {api_key}"
                        }
                    )
                    
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        result = json.loads(resp.read().decode("utf-8"))
                        text = result["choices"][0]["message"]["content"].strip()
                        json_match = re.search(r'\{[\s\S]*\}', text)
                        if json_match:
                            trans_json = json.loads(json_match.group(0))
                            for k, v in trans_json.items():
                                if isinstance(v, str) and v:
                                    translated[k] = v
                except Exception as e2:
                    print(f"  RETRY FAILED: {e2}", file=sys.stderr)
                    for item in batch:
                        translated[item["key"]] = item["en"]  # fallback to en
    
    return translated

def apply_translations(filepath, translated_dict):
    """Apply translations back to i18n.ts."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    count = 0
    for key, zh_text in translated_dict.items():
        # Escape special chars in zh_text for regex
        escaped_zh = re.escape(zh_text)
        
        # Find and replace the zh value
        pattern = rf'("{re.escape(key)}":\s*\{{\s*en:\s*"((?:[^"\\]|\\.)*)",\s*zh:\s*)"((?:[^"\\]|\\.)*)"'
        
        def replacer(m):
            nonlocal count
            count += 1
            en_val = m.group(2)
            if en_val == zh_text:  # Only replace if en == zh (still untranslated)
                return f'{m.group(1)}{en_val}", zh: "{zh_text}"'
            return m.group(0)
        
        content = re.sub(pattern, replacer, content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"\nApplied {count} translations to {filepath}", file=sys.stderr)
    return count

def main():
    filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
    api_key = read_env()
    
    print("Extracting untranslated keys...", file=sys.stderr)
    items = extract_untranslated(filepath)
    
    if not items:
        print("No untranslated keys found!", file=sys.stderr)
        return
    
    print("Translating...", file=sys.stderr)
    translated = translate_batch(items, api_key)
    
    print(f"\nGot {len(translated)} translations", file=sys.stderr)
    
    # Show some samples
    for k, v in list(translated.items())[:5]:
        print(f"  {k}: {v}", file=sys.stderr)
    
    print("\nApplying translations...", file=sys.stderr)
    count = apply_translations(filepath, translated)
    
    if count == 0:
        print("WARNING: No translations were applied. Check the keys match.", file=sys.stderr)
    else:
        print(f"Done! {count} keys translated.", file=sys.stderr)

if __name__ == "__main__":
    main()
