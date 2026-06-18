import requests
import json
import re

url = "https://apihub.agnes-ai.com/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F"
}

prompt = """You are an Amazon compliance expert. Generate a compliance diagnosis based on the user's product profile and target market.

[CRITICAL RULE]: All output MUST be in **English**. Only output valid JSON.

Product information:
- Product type: 
- Product features: 
- Target market: US
- Known category: electronics

Output format (strict JSON, nothing else — output ONLY the JSON object, no wrapper, no markdown, no code blocks):
{
  "summary": "2-3 sentence summary, direct core conclusion",
  "recommendations": [],
  "riskLevel": "high | medium | low",
  "warnings": []
}

CRITICAL FORMAT RULES:
1. Output MUST be valid JSON only — no explanatory text before or after
2. Do NOT use markdown code blocks (no ```json or ```)
3. Do NOT use bullet points or numbered lists
4. Each recommendation must have ALL required fields: name, required, desc, severity, reason, estimatedCost, estimatedTime, action, needsThirdParty, confidence, priorityLabel
5. Output a FLAT JSON object — no nested objects like {"compliance_diagnosis": {...}}"""

data = {
    "model": "agnes-2.0-flash",
    "messages": [
        {"role": "system", "content": prompt},
        {"role": "user", "content": "Generate a detailed compliance diagnosis for the following product:\n\nProduct type: \nCategory: electronics\nDetected features: \nTarget market: US\n\nKey risk factors to consider:\n- If battery: UN38.3, MSDS, IATA transport rules\n- If children's product: CPSIA/CPC (US), EN71/CE-UKCA (EU), PSE/JIS (Japan)\n- If food contact: FDA 21 CFR (US), EU 10/2011 (EU), food hygiene standards\n- If medical: FDA Class (US), EU MDR (EU), PMDA (Japan)\n- If magnetic: 15 CFR 1309 magnet strength test\n- If flammable: DOT transport certification, IATA packing instructions\n- If wireless/radio: FCC ID (US), RED/CE (EU), TELEC (Japan), SRRC (China export)"}
    ],
    "temperature": 0.3,
}

try:
    response = requests.post(url, headers=headers, json=data, timeout=60)
    result = response.json()
    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
    
    print(f"=== Content Length: {len(content)} ===")
    print(f"=== First 500 chars: ===")
    print(repr(content[:500]))
    print()
    
    # Simulate parseAIResponse
    cleaned = content.replace("```json\n", "").replace("```", "").strip()
    
    # Try direct parse
    try:
        parsed = json.loads(cleaned)
        print("Direct JSON parse: SUCCESS")
        print(f"Keys: {list(parsed.keys())}")
        print(f"Has recommendations: {'recommendations' in parsed}")
    except json.JSONDecodeError as e:
        print(f"Direct JSON parse: FAILED ({e})")
        # Try regex
        json_match = re.search(r"\{[\s\S]*\}", cleaned)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                print("Regex extract: SUCCESS")
                print(f"Keys: {list(parsed.keys())}")
                print(f"Has recommendations: {'recommendations' in parsed}")
            except json.JSONDecodeError as e2:
                print(f"Regex extract: FAILED ({e2})")
                print("*** AI DID NOT RETURN JSON - PARSE WILL THROW ***")
        else:
            print("No JSON block found")
            print("*** AI DID NOT RETURN JSON - PARSE WILL THROW ***")

except Exception as e:
    print(f"Request Error: {e}")
