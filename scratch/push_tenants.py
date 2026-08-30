import json
import requests

with open('admin_data.json', 'r', encoding='utf-8') as f:
    admin_data = json.load(f)

url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec"

payload = {
    "action": "importAdminData",
    "data": {
        "properties": admin_data.get('properties', [])
    }
}

try:
    res = requests.post(url, json=payload, timeout=20)
    print("Google Apps Script response:", res.status_code, res.text)
except Exception as e:
    print("Error pushing to Google Apps Script:", e)
