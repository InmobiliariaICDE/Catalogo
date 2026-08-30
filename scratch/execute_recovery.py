import json
import openpyxl
import requests

# Load existing admin_data.json
with open('admin_data.json', 'r', encoding='utf-8') as f:
    admin_data = json.load(f)

existing_props = admin_data.get('properties', [])

# Map by ID
props_map = {str(p.get('id')): p for p in existing_props}

# Template for empty monthly payments
def make_empty_payments():
    months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]
    pay_dict = {}
    for y in [2023, 2024, 2025, 2026, 2027]:
        pay_dict[str(y)] = [{"month": m, "value": "-", "status": "FUTURE" if y >= 2026 else "VACANT"} for m in months]
    return pay_dict

# 1. Ensure GOYA B-10-APTO 101 (ID 21) is present
if '21' not in props_map:
    props_map['21'] = {
        "id": "21",
        "excel_row": 22,
        "owner": "Giovany",
        "owner_phone": "",
        "name": "GOYA B-10-APTO 101 1. |",
        "increase_notes": "Aumento. 23 febrero 2026 $40.000",
        "tenant_name": "",
        "tenant_phone": "",
        "damage_notes": "",
        "duration": "12",
        "deposit": "250000",
        "start_date": "2024-02-28",
        "due_day": 24.0,
        "max_due_day": 29.0,
        "monthly_rent": 740000.0,
        "status": "Ocupado",
        "payments": make_empty_payments()
    }

# 2. Ensure LOCAL 1 (ID 20) is present
if '20' not in props_map:
    props_map['20'] = {
        "id": "20",
        "excel_row": 21,
        "owner": "Silvia",
        "owner_phone": "",
        "name": "LOCAL 1 1 |",
        "increase_notes": "Aumento 24 abril 2025 $35.000 | 2. Aumento 2027",
        "tenant_name": "",
        "tenant_phone": "",
        "damage_notes": "",
        "duration": "6",
        "deposit": "300000",
        "start_date": "2024-04-24",
        "due_day": 24.0,
        "max_due_day": 29.0,
        "monthly_rent": 535000.0,
        "status": "Ocupado",
        "payments": make_empty_payments()
    }

# 3. Ensure APTO 203 (ID 24) is present
if '24' not in props_map:
    props_map['24'] = {
        "id": "24",
        "excel_row": 25,
        "owner": "Silvia",
        "owner_phone": "",
        "name": "APTO 203",
        "increase_notes": "",
        "tenant_name": "",
        "tenant_phone": "",
        "damage_notes": "",
        "duration": "12",
        "deposit": "300000",
        "start_date": "2025-07-26",
        "due_day": 26.0,
        "max_due_day": 30.0,
        "monthly_rent": 450000.0,
        "status": "Ocupado",
        "payments": make_empty_payments()
    }

# 4. Add PORTAL DEL CAMPO (ID 25)
props_map['25'] = {
    "id": "25",
    "excel_row": 26,
    "owner": "Inmobiliaria ICDE",
    "owner_phone": "3103914892",
    "name": "CASA CONDOMINIO PORTAL DEL CAMPO",
    "increase_notes": "",
    "tenant_name": "",
    "tenant_phone": "",
    "damage_notes": "Código Catálogo 1338 / 325",
    "duration": "12",
    "deposit": "685000",
    "start_date": "2026-01-01",
    "due_day": 5.0,
    "max_due_day": 10.0,
    "monthly_rent": 685000.0,
    "status": "Ocupado",
    "payments": make_empty_payments()
}

# 5. Add LOS NOGALES (ID 26)
props_map['26'] = {
    "id": "26",
    "excel_row": 27,
    "owner": "Inmobiliaria ICDE",
    "owner_phone": "3105641885",
    "name": "APARTAMENTO LOS NOGALES",
    "increase_notes": "",
    "tenant_name": "",
    "tenant_phone": "",
    "damage_notes": "Código Catálogo 463",
    "duration": "12",
    "deposit": "359000",
    "start_date": "2026-01-01",
    "due_day": 5.0,
    "max_due_day": 10.0,
    "monthly_rent": 359000.0,
    "status": "Ocupado",
    "payments": make_empty_payments()
}

# Sort all properties by numerical ID
sorted_props = sorted(list(props_map.values()), key=lambda p: int(p['id']))

print(f"Total recovered properties count: {len(sorted_props)}")
for i, p in enumerate(sorted_props):
    print(f"  {i+1}. ID: {p['id']:<3} | Name: {p['name']:<38} | Owner: {p['owner']:<20} | Rent: {p.get('monthly_rent')}")

# Save updated admin_data.json
admin_data['properties'] = sorted_props
with open('admin_data.json', 'w', encoding='utf-8') as f:
    json.dump(admin_data, f, indent=4, ensure_ascii=False)

print("\nSUCCESS: Updated admin_data.json with all properties.")

# Synchronize with Google Apps Script Cloud via POST
url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec"

print("\nSending import payload to Google Apps Script...")
payload = {
    "action": "importAdminData",
    "data": {
        "properties": sorted_props
    }
}

try:
    res = requests.post(url, json=payload, timeout=20)
    print("Google Apps Script POST status:", res.status_code)
    print("Google Apps Script response:", res.text)
except Exception as e:
    print("Error pushing to Google Apps Script:", e)
