import sys, json
sys.stdout.reconfigure(encoding='utf-8')
for enc in ['utf-16','utf-8-sig','utf-8']:
    try:
        with open('citas.json','r',encoding=enc) as f:
            citas = json.load(f)
        print(f'Encoding: {enc}, total: {len(citas)}')
        sv = [c for c in citas if c.get('estado')=='solicito_visita']
        print(f'solicito_visita count: {len(sv)}')
        for c in sv[:5]:
            fecha = c.get('fecha','')
            hora = c.get('hora','')
            cliente = c.get('cliente','')
            cid = c.get('id','')
            print(f'  fecha={fecha} hora={hora} cliente={cliente} id={cid}')
        break
    except Exception as e:
        print(f'{enc}: {e}')
