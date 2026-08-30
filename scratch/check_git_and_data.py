import json
import subprocess
import os

print("--- SEARCH IN html files ---")
if os.path.exists('administramos-casas-en-arriendo-neiva.html'):
    with open('administramos-casas-en-arriendo-neiva.html', 'r', encoding='utf-8', errors='ignore') as f:
        html_admin = f.read()

    print("Length of administramos-casas-en-arriendo-neiva.html:", len(html_admin))

    for line in html_admin.splitlines():
        if any(k in line.lower() for k in ['portal', 'nogal', 'campo']):
            print("HTML line match:", line.strip()[:150])

print("\n--- SEARCH IN datos_catalogo.json ---")
with open('datos_catalogo.json', 'r', encoding='utf-8') as f:
    cat = json.load(f)

print("Total items in datos_catalogo.json:", len(cat))
matches = []
for p in cat:
    t = str(p.get('titulo', '')) + " " + str(p.get('nombre', '')) + " " + str(p.get('descripcion', ''))
    if 'portal' in t.lower() or 'nogal' in t.lower() or 'campo' in t.lower():
        matches.append((p.get('codigo'), p.get('titulo'), p.get('gestion'), p.get('tipo')))

print(f"Found {len(matches)} matches in datos_catalogo.json:")
for m in matches:
    print(" ", m)
