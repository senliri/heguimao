import requests
import json

url = "https://apihub.agnes-ai.com/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F"
}
data = {
    "model": "agnes-2.0-flash",
    "messages": [
        {"role": "user", "content": "wireless earbuds"}
    ],
    "temperature": 0.3
}

try:
    response = requests.post(url, headers=headers, json=data, timeout=15)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
