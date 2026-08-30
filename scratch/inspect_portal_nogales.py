import json

with open('datos_catalogo.json', 'r', encoding='utf-8') as f:
    cat = json.load(f)

print(f"Total catalog items: {len(cat)}")
matches = []
for idx, p in enumerate(cat):
    text = json.dumps(p, ensure_ascii=False).lower()
    for kw in ['portal del campo', 'nogales', 'portal', 'nogal']:
        if kw in text:
            matches.append((idx, p.get('Código') or p.get('codigo'), p.get('Nombre') or p.get('titulo'), p.get('Tipo de inmueble') or p.get('tipo'), p.get('Gestion') or p.get('gestion'), p.get('Administración') or p.get('administracion'), kw))

print(f"Found {len(matches)} matches in datos_catalogo.json:")
for m in matches:
    print(f"Idx: {m[0]} | Code: {m[1]} | Name: {m[2]} | Type: {m[3]} | Gest: {m[4]} | AdminField: {m[5]} | Match: {m[6]}")
