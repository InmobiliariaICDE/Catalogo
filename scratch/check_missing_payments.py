import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    adminData = json.load(f)

print("Checking properties for missing payments object...")
missing_pym = 0
for idx, p in enumerate(adminData.get('properties', [])):
    if 'payments' not in p or p['payments'] is None:
        print(f"Property index {idx} ({p.get('name')}): MISSING payments!")
        missing_pym += 1
    elif not isinstance(p['payments'], dict):
        print(f"Property index {idx} ({p.get('name')}): payments is NOT a dict! Got {type(p['payments'])}")
        missing_pym += 1

if missing_pym == 0:
    print("All properties have payments dict.")
