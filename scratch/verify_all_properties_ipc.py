import math, json

with open('admin_data.json', encoding='utf-8') as f:
    data = json.load(f)

def round_down_5k(val):
    if not val or val <= 0: return 0
    return math.floor(val / 5000.0) * 5000.0

def calc_rent_info(monthly_rent, notes, ipc_rate=5.10):
    base_rent = float(monthly_rent or 0)
    if not base_rent:
        return 0, 0, 0, "Sin canon"
    
    notes_str = str(notes or '').strip()
    
    # Check for explicit percentage in notes
    import re
    pct_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*%', notes_str)
    if pct_match:
        ipc_rate = float(pct_match.group(1))

    has_old_year_note = bool(re.search(r'202[0-5]', notes_str))
    dollar_matches = re.findall(r'\$\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]+)', notes_str)
    
    if dollar_matches and not has_old_year_note and 'ipc' not in notes_str.lower():
        clean_val = int(dollar_matches[-1].replace('.', ''))
        if clean_val > 0:
            if clean_val < base_rent:
                raw_rent = base_rent + clean_val
                new_rent = round_down_5k(raw_rent)
                diff = new_rent - base_rent
                return new_rent, diff, clean_val, f"Fijo +${diff:,.0f}"
            elif clean_val > base_rent:
                new_rent = round_down_5k(clean_val)
                diff = new_rent - base_rent
                return new_rent, diff, clean_val - base_rent, f"Fijo nuevo canon ${new_rent:,.0f}"

    raw_increase = base_rent * (ipc_rate / 100.0)
    diff = round_down_5k(raw_increase)
    new_rent = base_rent + diff
    return new_rent, diff, raw_increase, f"+{ipc_rate}% IPC (Calculado +${raw_increase:,.0f} -> Ajuste: +${diff:,.0f})"

print("=== VERIFY ALL PROPERTIES IPC CALCULATION (IPC 5.10%) ===")
for p in data.get('properties', []):
    row = p.get('excel_row')
    name = p.get('name')
    rent = float(p.get('monthly_rent') or 0)
    notes = p.get('increase_notes')
    new_rent, diff, raw_inc, desc = calc_rent_info(rent, notes, 5.10)
    print(f"Row {row:<2} | {name:<26} | Base: ${rent:<9,.0f} | Raw Inc: +${raw_inc:<7,.0f} | Adj Inc: +${diff:<7,.0f} | New Canon: ${new_rent:<9,.0f} | {desc}")
