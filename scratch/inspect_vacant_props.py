import json

d = json.load(open('admin_data.json', encoding='utf-8'))

target_names = [
    'APTO LOS NOGALES',
    'CASA CONJUNTO PORTAL DEL CAMPO',
    'APTO MARCOS-GRANJAS',
    'CASA MANZANARES V ETAPA',
    'CASA MARCOS-GRANJAS',
    'GOYA T-10-APTO 101'
]

for p in d['properties']:
    pname = p.get('name', '')
    if any(t in pname for t in target_names):
        print("--------------------------------------------------")
        print("Name:", pname)
        print("Owner:", p.get('owner'))
        print("Tenant:", p.get('tenant_name'))
        print("Start Date:", p.get('start_date'))
        print("Status:", p.get('status'))
        payments_2026 = [(m['month'], m['status'], m['value']) for m in p['payments'].get('2026', [])]
        print("2026 payments:", payments_2026)
