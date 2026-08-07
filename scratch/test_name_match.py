import json

d = json.load(open('admin_data.json', encoding='utf-8'))
for p in d['properties'][:15]:
    raw_name = p.get('name', '')
    print(f"ID: '{p.get('id')}', excel_row: '{p.get('excel_row')}', name: '{raw_name}', tenant: '{p.get('tenant_name')}'")
