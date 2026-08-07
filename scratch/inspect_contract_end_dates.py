import json
from datetime import datetime, date

def parse_date(d_val):
    if not d_val: return None
    s_str = str(d_val).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d-%b-%y"):
        try: return datetime.strptime(s_str, fmt).date()
        except: pass
    return None

d = json.load(open('admin_data.json', encoding='utf-8'))
print(f"{'Property Name':<32} | {'Start Date':<12} | {'Dur':<4} | {'Calc End':<10} | {'Jul Status':<10} | {'Aug Status'}")
print("="*95)

for p in d['properties']:
    s_dt = parse_date(p.get('start_date'))
    dur = 12
    try:
        if p.get('duration'): dur = int(float(p.get('duration')))
    except: pass
    
    end_str = "None"
    if s_dt:
        end_y = s_dt.year + (s_dt.month + dur - 1) // 12
        end_m = (s_dt.month + dur - 1) % 12 + 1
        end_str = f"{end_y}-{end_m:02d}-01"

    payments = p.get('payments', {}).get('2026', [])
    jul = payments[6]['status'] if len(payments)>6 else 'N/A'
    aug = payments[7]['status'] if len(payments)>7 else 'N/A'
    
    print(f"{p.get('name','')[:32]:<32} | {str(p.get('start_date')):<12} | {dur:<4} | {end_str:<10} | {jul:<10} | {aug}")
