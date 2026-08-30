import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    admin_data = json.load(f)

properties = admin_data.get('properties', [])
print(f"Total properties: {len(properties)}\n")

for p in properties:
    pid = str(p.get('id'))
    name = p.get('name', '')
    s_date = p.get('start_date', '')
    dur = p.get('duration', '')
    status = p.get('status', '')
    tenant = p.get('tenant_name', '')
    print(f"ID {pid:<3} | Status: {status:<10} | StartDate: '{s_date}' | Duration: '{dur}' | Tenant: '{tenant}' | Name: {name}")
