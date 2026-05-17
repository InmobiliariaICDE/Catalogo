import json, re

with open('admin_data.json', encoding='utf-8') as f:
    admin = json.load(f)

catalog = admin['properties']

# Show all keys of first property
if catalog:
    print("Keys de una propiedad del catalogo:", list(catalog[0].keys()))
    print("Muestra primera propiedad:", {k: v for k, v in list(catalog[0].items())[:8]})

# Search for 457 explicitly
matches_457 = [p for p in catalog if '457' in str(p)]
print(f"\nPropiedades que contienen '457': {len(matches_457)}")
for p in matches_457[:3]:
    print(" ", {k: v for k, v in list(p.items())[:8]})
