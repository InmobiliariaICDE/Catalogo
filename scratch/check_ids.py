import json
with open('c:/Users/USUARIO/Documents/GitHub/Catalogo/admin_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for p in data.get('properties', [])[:10]:
    print(f"ID: {p.get('id')}, Name: {p.get('name')}")
