import sys, json
sys.stdout.reconfigure(encoding='utf-8')

for enc in ['utf-16', 'utf-8-sig', 'utf-8']:
    try:
        with open('citas.json', 'r', encoding=enc) as f:
            citas = json.load(f)
        print(f'Encoding: {enc}, total: {len(citas)}')
        # Search for ytrjtyj or similar
        for c in citas:
            cliente = str(c.get('cliente', ''))
            notas = str(c.get('notas', ''))
            obs = str(c.get('observaciones', ''))
            if 'ytr' in cliente.lower() or 'ytr' in notas.lower() or '10:00' in str(c.get('hora','')):
                print(f"  FOUND: id={c.get('id')} cliente={cliente} fecha={c.get('fecha')} hora={c.get('hora')} estado={c.get('estado')}")
        break
    except Exception as e:
        print(f'{enc}: {e}')
