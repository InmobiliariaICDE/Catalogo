import json

with open('admin_data.json', encoding='utf-8') as f:
    data = json.load(f)

print("=== ALL PROPERTIES INCREASE NOTES & RENT ===")
for p in data.get('properties', []):
    row = p.get('excel_row')
    name = p.get('name')
    rent = p.get('monthly_rent')
    notes = p.get('increase_notes')
    print(f"Row {row:<2} | {name:<32} | Rent: {rent:<10} | Increase Notes: '{notes}'")
