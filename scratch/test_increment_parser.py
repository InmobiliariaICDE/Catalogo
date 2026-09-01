import json, re

with open('admin_data.json', encoding='utf-8') as f:
    data = json.load(f)

def calculate_increased_rent(monthly_rent, increase_notes):
    base_rent = float(monthly_rent or 0)
    if not base_rent or not increase_notes:
        return base_rent, 0, "Sin incremento"

    notes = str(increase_notes).strip()
    
    # 1. Look for explicit percentage like 5% or 9.28%
    pct_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*%', notes)
    if pct_match:
        pct = float(pct_match.group(1))
        inc_val = round(base_rent * (pct / 100.0))
        return base_rent + inc_val, inc_val, f"+{pct}% IPC (${inc_val:,})"

    # 2. Look for dollar amounts with $ sign, e.g. $30.000 or $45.000
    dollar_matches = re.findall(r'\$\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]+)', notes)
    if dollar_matches:
        # Take the last or largest valid dollar match
        vals = []
        for dm in dollar_matches:
            val_clean = int(dm.replace('.', ''))
            vals.append(val_clean)
        
        if vals:
            # If the value is smaller than base rent, treat as addition e.g. +$30.000
            # If value is larger than base rent, treat as new total canon
            chosen = vals[0]
            if chosen < base_rent:
                return base_rent + chosen, chosen, f"+${chosen:,} (Incremento)"
            else:
                inc_val = chosen - base_rent
                return chosen, inc_val, f"Nuevo Canon ${chosen:,} (+${inc_val:,})"

    return base_rent, 0, "Sin incremento claro"

print("=== INCREMENT PARSER VERIFICATION ===")
for p in data.get('properties', []):
    row = p.get('excel_row')
    name = p.get('name')
    rent = float(p.get('monthly_rent') or 0)
    notes = p.get('increase_notes')
    new_rent, inc_val, desc = calculate_increased_rent(rent, notes)
    print(f"Row {row:<2} | {name:<26} | Base: ${rent:<9,.0f} | New: ${new_rent:<9,.0f} | Diff: +${inc_val:<7,.0f} | {desc} | Note: '{notes}'")
