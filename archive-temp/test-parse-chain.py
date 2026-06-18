import requests
import json
import re

# 模拟 dev 模式的完整链路
url = "https://apihub.agnes-ai.com/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F"
}

# 用空 prompt 模拟诊断请求
data = {
    "model": "agnes-2.0-flash",
    "messages": [
        {"role": "system", "content": ""},  # DIAGNOSIS_PROMPT 里的 {productType} 替换后可能留空
        {"role": "user", "content": "Generate a detailed compliance diagnosis for the following product:\n\nProduct type: \nCategory: electronics\nDetected features: \nTarget market: US\n\nKey risk factors to consider:\n- If battery: UN38.3, MSDS, IATA transport rules\n- If children's product: CPSIA/CPC (US), EN71/CE-UKCA (EU), PSE/JIS (Japan)\n- If food contact: FDA 21 CFR (US), EU 10/2011 (EU), food hygiene standards\n- If medical: FDA Class (US), EU MDR (EU), PMDA (Japan)\n- If magnetic: 15 CFR 1309 magnet strength test\n- If flammable: DOT transport certification, IATA packing instructions\n- If wireless/radio: FCC ID (US), RED/CE (EU), TELEC (Japan), SRRC (China export)"}
    ],
    "temperature": 0.3,
}

try:
    response = requests.post(url, headers=headers, json=data, timeout=60)
    result = response.json()
    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
    
    print("=== RAW content (empty prompt test) ===")
    print(f"Length: {len(content)}")
    print(content[:1000])
    print()
    
    # 模拟 parseAIResponse
    cleaned = content.replace("```json\n", "").replace("```", "").strip()
    
    try:
        parsed = json.loads(cleaned)
        print("Parsed as-is: OK")
        print(f"Keys: {list(parsed.keys())}")
    except json.JSONDecodeError as e:
        print(f"Direct parse FAILED: {e}")
        # Try regex
        json_match = re.search(r"\{[\s\S]*\}", cleaned)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                print("Regex extracted: OK")
                print(f"Keys: {list(parsed.keys())}")
            except:
                print("Regex extract FAILED")
                parsed = None
        else:
            print("No JSON block found")
            parsed = None
    
    if not parsed:
        print("\n*** PARSE FAILED - aiResultData will be undefined! ***")
        
except Exception as e:
    print(f"Error: {e}")
