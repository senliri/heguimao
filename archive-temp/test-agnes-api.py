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
        {"role": "user", "content": "你好"}
    ],
    "temperature": 0.3
}

response = requests.post(url, headers=headers, json=data, timeout=10)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
