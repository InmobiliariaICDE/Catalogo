import json, requests

with open("recovered_local_1.json", encoding="utf-8") as f:
    local_1 = json.load(f)

# Update ID to 24 (the new ID assigned by the Apps Script)
local_1["id"] = "24"
local_1["excel_row"] = 24

script_url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec"

# Use importAdminData to send the full property with all payments in one call
payload = {
    "action": "importAdminData",
    "data": {
        "properties": [local_1]
    }
}

print("Sending full LOCAL 1 property with all payments via importAdminData...")
print(f"Property: {local_1['name']}, payments years: {list(local_1['payments'].keys())}")
try:
    resp = requests.post(script_url, json=payload, timeout=60, headers={"Content-Type": "application/json"})
    print("Status:", resp.status_code)
    print("Response:", resp.text[:500])
except Exception as e:
    print("Error:", e)
