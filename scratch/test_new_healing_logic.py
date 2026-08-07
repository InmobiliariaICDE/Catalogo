import json, re
from datetime import datetime, date

def parse_currency(val):
    if val is None:
        return 0
    val_str = str(val).strip()
    if val_str.upper() in ('DESOCUPADO', '-', 'PENDIENTE', 'CONTRATO NUEVO', 'PREAVISO', 'NO RENOVARA', 'ENTREGA'):
        return 0
    cleaned = re.sub(r'[^\d]', '', val_str)
    try:
        return float(cleaned) if cleaned else 0
    except:
        return 0

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
_today = datetime.now().date()
_curr_year = _today.year
_curr_month_idx = _today.month - 1

for p in d['properties']:
    pname = p.get('name', '')
    start_dt = parse_date(p.get('start_date'))
    duration_m = 12
    try:
        if p.get('duration'):
            duration_m = int(float(p.get('duration')))
    except:
        duration_m = 12

    tenant_name = p.get('tenant_name', '')
    has_tenant = bool(tenant_name and str(tenant_name).strip())
    raw_name = str(pname).upper()

    print("==================================================")
    print(f"Prop: {pname} | Tenant: '{tenant_name}' | Start: {start_dt}")
    
    payments = p.get('payments', {}).get('2026', [])
    res_status = []
    for m_idx, m in enumerate(payments):
        val_raw = m.get('value')
        val_upper = str(val_raw).strip().upper()
        num_val = parse_currency(val_raw)
        st = m.get('status')

        is_paid = (num_val > 0) or st in ('PAID', 'NEW_CONTRACT') or 'CONTRATO' in val_upper or 'NUEVO' in val_upper
        is_delivery = st == 'DELIVERY' or 'ENTREGA' in val_upper
        is_vacant_explicit = (st == 'VACANT' or 'DESOCUPAD' in val_upper) and not is_paid

        m_date = date(2026, m_idx + 1, 1)
        
        is_before_start = False
        is_after_end = False
        if start_dt:
            c_start = date(start_dt.year, start_dt.month, 1)
            end_y = start_dt.year + (start_dt.month + duration_m - 1) // 12
            end_m = (start_dt.month + duration_m - 1) % 12 + 1
            c_end = date(end_y, end_m, 1)

            if m_date < c_start:
                is_before_start = True
            if m_date >= c_end:
                is_after_end = True

        final_st = ''
        if is_paid:
            final_st = st if st in ('PAID', 'NEW_CONTRACT') else 'PAID'
        elif is_delivery:
            final_st = 'DELIVERY'
        elif is_before_start or is_after_end:
            final_st = 'VACANT'
        elif 'DESOCUPAD' in raw_name or (not has_tenant and not start_dt):
            final_st = 'VACANT'
        else:
            is_current = (2026 == _curr_year and m_idx == _curr_month_idx)
            is_future = (2026 > _curr_year or (2026 == _curr_year and m_idx > _curr_month_idx))

            if is_future:
                final_st = 'FUTURE'
            elif is_current:
                due_day = p.get('due_day') or 5
                try:
                    due_day = int(float(due_day))
                except:
                    due_day = 5
                final_st = 'AL_DIA' if _today.day < due_day else 'PENDING'
            else:
                if is_vacant_explicit:
                    final_st = 'VACANT'
                else:
                    final_st = 'PENDING'

        res_status.append((m.get('month')[:3], final_st))
    print("  " + " | ".join([f"{m}:{s}" for m, s in res_status]))
