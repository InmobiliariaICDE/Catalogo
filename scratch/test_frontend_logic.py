import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    admin_data = json.load(f)

props = admin_data.get('properties', [])

print(f"Testing {len(props)} properties...")
currentAdminYear = "2026"
currentAdminMonth = "AGOSTO"
searchVal = ""
currentAdminFilter = "todos"

errors = []
for idx, p in enumerate(props):
    try:
        # Check name
        pname = p.get('name')
        if not pname:
            errors.append(f"Prop {idx} (ID {p.get('id')}) missing name")
        else:
            pname.lower().strip()
        
        # Check payments
        payments = p.get('payments')
        if not payments:
            errors.append(f"Prop {idx} (ID {p.get('id')}) missing payments dict")
        else:
            pyear = payments.get(currentAdminYear)
            if not pyear:
                errors.append(f"Prop {idx} (ID {p.get('id')}) missing payments for year {currentAdminYear}")
            else:
                pmonth = next((m for m in pyear if m.get('month') == currentAdminMonth), None)
                if not pmonth:
                    errors.append(f"Prop {idx} (ID {p.get('id')}) missing month {currentAdminMonth} in {currentAdminYear}")
    except Exception as e:
        errors.append(f"Prop {idx} (ID {p.get('id')}) exception: {e}")

print("Total errors found in test:", len(errors))
for err in errors:
    print("  ERROR:", err)
