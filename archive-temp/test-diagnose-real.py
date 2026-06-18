import requests
import json
import re

url = "https://apihub.agnes-ai.com/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F"
}

system_prompt = """You are a compliance expert for Amazon sellers. Generate a compliance diagnosis in the following EXACT JSON format:

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

Analyze: wireless earbuds for market US"""

data = {
    "model": "agnes-2.0-flash",
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "wireless earbuds"}
    ],
    "temperature": 0.3,
    "response_format": {"type": "json_object"}
}

try:
    response = requests.post(url, headers=headers, json=data, timeout=60)
    result = response.json()
    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
    
    print("=== RAW CONTENT (first 2000 chars) ===")
    print(content[:2000])
    print()
    print("=== CAN IT BE PARSED? ===")
    
    # Try to extract JSON
    json_match = re.search(r"\{[\s\S]*\}", content)
    if json_match:
        try:
            parsed = json.loads(json_match.group(0))
            print("Parsed OK")
            print("Keys:", list(parsed.keys()))
            if "recommendations" in parsed:
                print("Has recommendations:", len(parsed["recommendations"]))
            else:
                print("NO recommendations key!")
                print("Actual keys:", list(parsed.keys()))
        except json.JSONDecodeError as e:
            print("Failed to parse JSON:", e)
            print("Extracted JSON snippet:")
            print(json_match.group(0)[:500])
    else:
        print("No JSON found in response")
        
except Exception as e:
    print(f"Error: {e}")
