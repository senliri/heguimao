import requests
import json
import re

# Simulate the dev-mode API call (no response_format parameter)
url = "https://apihub.agnes-ai.com/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F"
}

# This is what the frontend actually sends in dev mode
system_prompt = """You are a compliance expert for Amazon sellers. Analyze the product and generate a compliance diagnosis in EXACT JSON format.

Return ONLY a valid JSON object with these fields:
{
  "summary": "brief summary text",
  "recommendations": [
    {
      "name": "Certification Name",
      "required": true,
      "desc": "Description of the requirement",
      "severity": "high",
      "reason": "Why this is required",
      "estimatedCost": "$500-1000",
      "estimatedTime": "2-4 weeks",
      "action": "What to do",
      "needsThirdParty": true,
      "confidence": "high",
      "priorityLabel": "Mandatory"
    }
  ],
  "riskLevel": "high",
  "warnings": ["warning1"]
}

CRITICAL FORMAT RULES:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Do NOT wrap in ```json ... ```
- Do NOT add any text before or after the JSON
- All fields must be present"""

data = {
    "model": "agnes-2.0-flash",
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "wireless earbuds for US market"}
    ],
    "temperature": 0.3,
    # NOTE: No response_format parameter (simulates dev mode)
}

try:
    response = requests.post(url, headers=headers, json=data, timeout=60)
    result = response.json()
    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
    
    print("=== RAW CONTENT (first 3000 chars) ===")
    print(content[:3000])
    print()
    print("=== SIMULATING parseAIResponse ===")
    
    # Simulate frontend parseAIResponse
    cleaned = content.replace("```json\n", "").replace("```", "").strip()
    print(f"After cleaning: {cleaned[:200]}...")
    
    try:
        parsed = json.loads(cleaned)
        print("Parsed as-is: OK")
    except json.JSONDecodeError as e:
        print(f"Parsed as-is: FAILED ({e})")
        # Try regex extraction
        json_match = re.search(r"\{[\s\S]*\}", cleaned)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                print("Regex extracted: OK")
            except:
                print("Regex extracted: FAILED")
                parsed = None
        else:
            parsed = None
    
    if parsed:
        print(f"Keys: {list(parsed.keys())}")
        if "recommendations" in parsed:
            print(f"Has recommendations: {len(parsed['recommendations'])} items")
        else:
            print("MISSING recommendations!")
            print(f"Actual keys: {list(parsed.keys())}")
            
except Exception as e:
    print(f"Error: {e}")
