import json

with open("recovered_local_1.json", encoding="utf-8") as f:
    local_1 = json.load(f)

with open("admin_data.json", encoding="utf-8") as f:
    admin_data = json.load(f)

# Check if LOCAL 1 already exists
existing = [p for p in admin_data['properties'] if 'LOCAL 1' in p['name'].upper()]
if not existing:
    admin_data['properties'].append(local_1)
    # Sort properties by id/excel_row or name
    admin_data['properties'].sort(key=lambda p: int(p.get('excel_row', p.get('id', 999))))
    
    with open("admin_data.json", "w", encoding="utf-8") as f:
        json.dump(admin_data, f, indent=2, ensure_ascii=False)
    print("SUCCESS: LOCAL 1 restored to admin_data.json!")
    print(f"Total properties now: {len(admin_data['properties'])}")
else:
    print("LOCAL 1 is already in admin_data.json!")
