import json, re
from datetime import datetime, date

def parse_date(d_val):
    if not d_val: return None
    s_str = str(d_val).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d-%b-%y"):
        try: return datetime.strptime(s_str, fmt).date()
        except: pass
    return None

d = json.load(open('admin_data.json', encoding='utf-8'))
_today = datetime.now().date() # 2026-08-07
_curr_year = 2026
_curr_month_idx = 7 # August (0-indexed)

print(f"{'Property Name':<30} | {'Tenant':<20} | {'Start':<10} | {'Rolled End':<10} | {'Aug Status':<10} | {'Sep Status'}")
print("="*95)

for p in d['properties']:
    pname = p.get('name', '')
    tenant_name = p.get('tenant_name', '')
    has_tenant = bool(tenant_name and str(tenant_name).strip())
    start_dt = parse_date(p.get('start_date'))
    
    payments = p.get('payments', {}).get('2026', [])
    paid_indices = []
    delivery_indices = []
    for idx, m in enumerate(payments):
        val_upper = str(m.get('value')).strip().upper()
        num_val = 0
        try: num_val = float(re.sub(r'[^\d.]', '', str(m.get('value'))))
        except: pass
        if num_val > 0 or m.get('status') in ('PAID', 'NEW_CONTRACT') or 'CONTRATO' in val_upper or 'NUEVO' in val_upper:
            paid_indices.append(idx)
        elif m.get('status') == 'DELIVERY' or 'ENTREGA' in val_upper:
            delivery_indices.append(idx)

    has_any_payment = len(paid_indices) > 0
    duration_m = 12
    try:
        if p.get('duration'): duration_m = int(float(p.get('duration')))
    except: duration_m = 12

    is_vacant_by_name = 'DESOCUPAD' in str(pname).upper()
    is_occupied_prop = not is_vacant_by_name and (has_tenant or bool(start_dt) or has_any_payment)

    # Roll forward start_dt if contract is active (no delivery terminating it)
    rolled_end = None
    c_start = None
    if start_dt and is_occupied_prop:
        c_start = date(start_dt.year, start_dt.month, 1)
        cur_end_y = start_dt.year + (start_dt.month + duration_m - 1) // 12
        cur_end_m = (start_dt.month + duration_m - 1) % 12 + 1
        rolled_end = date(cur_end_y, cur_end_m, 1)

        # If last delivery is NOT after last paid, roll forward if expired
        last_delivery = max(delivery_indices, default=-1)
        last_paid = max(paid_indices, default=-1)
        has_delivered = (last_delivery > last_paid)

        if not has_delivered:
            # Roll forward in duration_m steps while rolled_end <= date(_curr_year, _curr_month_idx + 1, 1)
            target_date = date(_curr_year, _curr_month_idx + 1, 1)
            while rolled_end <= target_date:
                r_y = rolled_end.year + (rolled_end.month + duration_m - 1) // 12
                r_m = (rolled_end.month + duration_m - 1) % 12 + 1
                rolled_end = date(r_y, r_m, 1)

    # Check August (idx 7) and Sept (idx 8)
    results = {}
    for idx_m, m_name in [(7, 'AUG'), (8, 'SEP')]:
        m = payments[idx_m]
        st = m.get('status')
        val_upper = str(m.get('value')).strip().upper()
        num_val = 0
        try: num_val = float(re.sub(r'[^\d.]', '', str(m.get('value'))))
        except: pass
        is_paid = (num_val > 0) or st in ('PAID', 'NEW_CONTRACT') or 'CONTRATO' in val_upper or 'NUEVO' in val_upper
        is_delivery = st == 'DELIVERY' or 'ENTREGA' in val_upper
        
        m_date = date(2026, idx_m + 1, 1)
        is_before_start = (c_start and m_date < c_start)
        is_after_end = (rolled_end and m_date >= rolled_end)

        last_delivery_m = max([i for i in delivery_indices if i <= idx_m], default=-1)
        last_paid_m = max([i for i in paid_indices if i <= idx_m], default=-1)

        if is_paid:
            results[m_name] = 'PAID'
        elif is_delivery:
            results[m_name] = 'DELIVERY'
        elif last_delivery_m > last_paid_m or is_before_start or is_after_end or is_vacant_by_name or (not has_tenant and not start_dt and not has_any_payment):
            results[m_name] = 'VACANT'
        elif idx_m > _curr_month_idx:
            results[m_name] = 'FUTURE'
        elif idx_m == _curr_month_idx:
            due_day = p.get('due_day') or 5
            try: due_day = int(float(due_day))
            except: due_day = 5
            results[m_name] = 'AL_DIA' if _today.day < due_day else 'PENDING'
        else:
            results[m_name] = 'PENDING'

    print(f"{pname[:30]:<30} | {str(tenant_name)[:20]:<20} | {str(p.get('start_date')):<10} | {str(rolled_end):<10} | {results['AUG']:<10} | {results['SEP']}")
