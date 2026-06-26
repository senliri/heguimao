import json
with open(r'C:\Users\87931\.qclaw\openclaw.json', 'r', encoding='utf-8') as f:
    cfg = json.load(f)
providers = cfg.get('llm', {}).get('providers', {})
for name, prov in providers.items():
    base = prov.get('baseUrl', '')
    print(f'{name}: {base}')
