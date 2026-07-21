import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total properties: {len(data['properties'])}")
for p in data['properties'][:5]:
    print(f"ID: {p['id']}, Name: {p['name']}, Excel Row: {p.get('excel_row')}")
