import json, requests

with open("recovered_local_1.json", encoding="utf-8") as f:
    local_1 = json.load(f)

# Update to match the surviving cloud row (excel_row 23, id 24)
local_1["id"] = "24"
local_1["excel_row"] = 23

script_url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec"

payload = {
    "action": "importAdminData",
    "data": {
        "properties": [local_1]
    }
}

print("Restoring payments to the surviving LOCAL 1 row (excel_row 23, id 24)...")
resp = requests.post(script_url, json=payload, timeout=60, headers={"Content-Type": "application/json"})
print("Status:", resp.status_code)
print("Response:", resp.text[:300])
