import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for p in data.get('properties', []):
    name = p.get('name', '')
    if any(k in name for k in ['201', '202', '203']):
        print(f"\n================ Property ID {p.get('id')} : {name} ================")
        print(f"Start date: {p.get('start_date')}, Duration: {p.get('duration')}, Increase Notes: {p.get('increase_notes')}")
        pays_2026 = p.get('payments', {}).get('2026', [])
        for m in pays_2026:
            if m.get('status') not in ['PENDING', 'VACANT', 'FUTURE']:
                print(f"  2026 Month {m.get('month')}: value='{m.get('value')}', status='{m.get('status')}'")
