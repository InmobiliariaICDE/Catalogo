import json

d = json.load(open('admin_data.json', encoding='utf-8'))
print(f"{'Property Name':<32} | {'Tenant':<25} | {'Due':<5} | {'Max':<5} | {'Aug Status':<12} | {'Aug Val'}")
print("="*95)
for p in d['properties']:
    ago = [m for m in p['payments']['2026'] if m['month']=='AGOSTO'][0]
    print(f"{p['name'][:32]:<32} | {str(p.get('tenant_name',''))[:25]:<25} | {str(p.get('due_day')):<5} | {str(p.get('max_due_day')):<5} | {ago['status']:<12} | {ago['value']}")
