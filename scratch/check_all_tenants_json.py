import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

props = data.get('properties', [])
print(f"Total properties: {len(props)}")
for p in props:
    print(f" ID: {str(p.get('id')):<4} | Name: {p.get('name'):<38} | Owner: {p.get('owner'):<20} | Tenant: '{p.get('tenant_name', '')}'")
