import json
with open('c:/Users/USUARIO/Documents/GitHub/Catalogo/admin_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("Keys of first property:")
props = data.get('properties', [])
if props:
    p = props[0]
    print(p.keys())
    print("Example property:", p)
