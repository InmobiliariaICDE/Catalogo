import json

with open('datos_catalogo.json', 'r', encoding='utf-8') as f:
    cat = json.load(f)

for p in cat:
    code = str(p.get('Código') or p.get('codigo'))
    if code in ['1338', '325', '463']:
        print(f"\n================ CODE {code} ================")
        for k, v in p.items():
            print(f"  {k}: {v}")
