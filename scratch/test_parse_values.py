import json, re

def parse_currency(val):
    if val is None:
        return 0
    val_str = str(val).strip()
    # Remove currency symbol, spaces, dots, commas
    cleaned = re.sub(r'[^\d]', '', val_str)
    try:
        return float(cleaned) if cleaned else 0
    except:
        return 0

d = json.load(open('admin_data.json', encoding='utf-8'))
for p in d['properties']:
    pname = p.get('name', '')
    if 'CHAPINER' in pname.upper() or 'MARCOS' in pname.upper() or 'MANZANARES' in pname.upper():
        print("Property:", pname)
        print("Tenant:", p.get('tenant_name'))
        for m in p['payments'].get('2026', []):
            parsed = parse_currency(m.get('value'))
            print(f"  Month: {m.get('month')}, status: {m.get('status')}, raw_val: '{m.get('value')}', parsed: {parsed}")
