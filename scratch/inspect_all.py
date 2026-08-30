import json
import os
import requests

print("=== 1. FETCH FROM GOOGLE APPS SCRIPT ===")
url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData"
try:
    res = requests.get(url, timeout=10)
    data = res.json()
    props = data.get("properties", [])
    print(f"Cloud returns {len(props)} properties:")
    for p in props:
        print(f"  ID: {p.get('id')}, Name: '{p.get('name')}', Owner: '{p.get('owner')}', Tenant: '{p.get('tenant_name')}', Rent: {p.get('monthly_rent')}")
except Exception as e:
    print("Error fetching from cloud:", e)

print("\n=== 2. LOCAL admin_data.json ===")
with open('admin_data.json', 'r', encoding='utf-8') as f:
    local_admin = json.load(f)
local_props = local_admin.get('properties', [])
print(f"admin_data.json has {len(local_props)} properties:")
for p in local_props:
    print(f"  ID: {p.get('id')}, ExcelRow: {p.get('excel_row')}, Name: '{p.get('name')}', Owner: '{p.get('owner')}', Tenant: '{p.get('tenant_name')}'")

print("\n=== 3. SEARCH BACKUP / CORRUPTED / RECOVERED JSON ===")
for filename in ['admin_backup.html', 'admin_corrupted.html', 'adminreferenciavieja.html', 'recovered_local_1.json']:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            c = f.read()
            print(f"{filename}: size={len(c)}")
            for kw in ['portal', 'nogal', 'campo']:
                count = c.lower().count(kw)
                print(f"  Keyword '{kw}': count={count}")

print("\n=== 4. CHECK PREVIOUS CONVERSATION LOGS ===")
past_log_path = r"C:\Users\USUARIO\.gemini\antigravity\brain\1efca20a-d2f8-47d9-88eb-f2d6a338ec87\.system_generated\logs\transcript.jsonl"
if os.path.exists(past_log_path):
    print("Found past log!")
    with open(past_log_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        print(f"Past transcript line count: {len(lines)}")
        for line in lines:
            if 'portal' in line.lower() or 'nogal' in line.lower() or 'inmuebles' in line.lower():
                print("Transcript match snippet:", line[:200])
else:
    print("Past log path not found at:", past_log_path)
