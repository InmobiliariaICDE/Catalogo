import json, re
from datetime import datetime, date

def parse_date(d_val):
    if not d_val:
        return None
    s_str = str(d_val).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d-%b-%y"):
        try:
            return datetime.strptime(s_str, fmt).date()
        except:
            pass
    return None

d = json.load(open('admin_data.json', encoding='utf-8'))
_today = datetime.now().date() # 2026-08-07

print(f"{'Property Name':<32} | {'Tenant':<25} | {'Due':<5} | {'Aug Status':<12} | {'Symbol'}")
print("="*85)

for p in d['properties']:
    pname = p.get('name', '')
    raw_name = str(pname).upper()
    tenant_name = p.get('tenant_name', '')
    has_tenant = bool(tenant_name and str(tenant_name).strip())
    start_dt = parse_date(p.get('start_date'))
    
    payments = p.get('payments', {}).get('2026', [])
    paid_indices = []
    delivery_indices = []
    for idx, m in enumerate(payments):
        val_upper = str(m.get('value')).strip().upper()
        num_val = 0
        try:
            num_val = float(re.sub(r'[^\d.]', '', str(m.get('value'))))
        except:
            pass
        if num_val > 0 or m.get('status') in ('PAID', 'NEW_CONTRACT') or 'CONTRATO' in val_upper or 'NUEVO' in val_upper:
            paid_indices.append(idx)
        elif m.get('status') == 'DELIVERY' or 'ENTREGA' in val_upper:
            delivery_indices.append(idx)

    has_any_payment = len(paid_indices) > 0
    duration_m = 12
    try:
        if p.get('duration'): duration_m = int(float(p.get('duration')))
    except: duration_m = 12

    is_vacant_by_name = 'DESOCUPAD' in raw_name
    is_occupied_prop = not is_vacant_by_name and (has_tenant or bool(start_dt) or has_any_payment)

    # August cell (idx 7)
    m = payments[7]
    val_upper = str(m.get('value')).strip().upper()
    st = m.get('status')
    num_val = 0
    try: num_val = float(re.sub(r'[^\d.]', '', str(m.get('value'))))
    except: pass

    is_paid = (num_val > 0) or st in ('PAID', 'NEW_CONTRACT') or 'CONTRATO' in val_upper or 'NUEVO' in val_upper
    is_delivery = st == 'DELIVERY' or 'ENTREGA' in val_upper
    
    m_date = date(2026, 8, 1)
    is_before_start = False
    is_after_end = False
    if start_dt:
        c_start = date(start_dt.year, start_dt.month, 1)
        end_y = start_dt.year + (start_dt.month + duration_m - 1) // 12
        end_m = (start_dt.month + duration_m - 1) % 12 + 1
        c_end = date(end_y, end_m, 1)
        if m_date < c_start: is_before_start = True
        if m_date >= c_end: is_after_end = True

    final_st = ''
    symbol = ''
    if is_paid:
        final_st = 'PAID'
        symbol = 'PAID (Pagado)'
    elif is_delivery:
        final_st = 'DELIVERY'
        symbol = 'DELIVERY (Entrega)'
    elif not is_occupied_prop or is_before_start or is_after_end:
        final_st = 'VACANT'
        symbol = 'VACANT (Desocupado)'
    else:
        due_day = p.get('due_day') or 5
        try: due_day = int(float(due_day))
        except: due_day = 5
        
        if _today.day < due_day:
            final_st = 'AL_DIA'
            symbol = 'AL_DIA (Al dia)'
        else:
            final_st = 'PENDING'
            symbol = 'PENDING (Pendiente)'

    print(f"{pname[:32]:<32} | {str(tenant_name)[:25]:<25} | {str(p.get('due_day')):<5} | {final_st:<12} | {symbol}")
