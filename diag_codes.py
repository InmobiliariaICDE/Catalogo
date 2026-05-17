import json, re

def norm_cod(c):
    s = str(c or '').strip()
    return re.sub(r'^0+', '', s)

with open('propiedades_kmz.json', encoding='utf-8') as f:
    kmz = json.load(f)

with open('admin_data.json', encoding='utf-8') as f:
    admin = json.load(f)

catalog = admin['properties']

# Build lookup: normalized code -> original raw code
cat_codes = {}
for p in catalog:
    raw = str(p.get('Codigo') or p.get('Código') or '').strip()
    if raw:
        cat_codes[norm_cod(raw)] = raw

print(f"Catalogo tiene {len(cat_codes)} codigos unicos")
# Show sample
print("Muestra catalogo (primeros 5):", list(cat_codes.items())[:5])

# KMZ
kmz_codes = {}
for k in kmz:
    raw = str(k.get('Código') or '').strip()
    if raw:
        kmz_codes[raw] = norm_cod(raw)

print(f"\nKMZ tiene {len(kmz_codes)} entradas")
print("Muestra KMZ (primeros 5):", list(kmz_codes.items())[:5])

# Find KMZ entries without a catalog match
sin_match = [(kraw, knorm) for kraw, knorm in kmz_codes.items() if knorm and knorm not in cat_codes]

print(f"\nKMZ sin match con catalogo: {len(sin_match)}")
for kraw, knorm in sorted(sin_match)[:40]:
    print(f'  KMZ raw="{kraw}" norm="{knorm}"')

# Check specific case: 457
print("\n--- Verificando codigo 457 ---")
print("En catalogo norm '457':", '457' in cat_codes)
k457 = [(kraw, knorm) for kraw, knorm in kmz_codes.items() if '457' in kraw]
print("En KMZ con '457':", k457)
