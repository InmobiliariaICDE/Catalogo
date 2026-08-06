import json, datetime

data = json.load(open('admin_data.json', encoding='utf-8'))

today = datetime.date(2026, 8, 6)
curr_year = today.year
curr_month_idx = today.month - 1

for p in data['properties']:
    months_order = []
    sorted_years = sorted([int(y) for y in p['payments'].keys()])
    for y in sorted_years:
        for m_idx, m in enumerate(p['payments'][str(y)]):
            months_order.append({'year': int(y), 'month_idx': m_idx, 'cell': m})
    
    paid_indices = []
    delivery_indices = []
    
    for idx, item in enumerate(months_order):
        m = item['cell']
        val_upper = str(m['value']).strip().upper()
        try:
            num_val = float(m['value'])
        except (ValueError, TypeError):
            num_val = 0
        if num_val > 0 or m['status'] in ('PAID', 'NEW_CONTRACT') or 'CONTRATO' in val_upper or 'NUEVO' in val_upper:
            paid_indices.append(idx)
        elif m['status'] == 'DELIVERY' or 'ENTREGA' in val_upper:
            delivery_indices.append(idx)

    has_any_payment = len(paid_indices) > 0
    default_vacant = ('DESOCUPAD' in p['name'].upper()) or (not has_any_payment and (not p.get('tenant_name') or not str(p.get('tenant_name')).strip()))

    max_paid_idx = max(paid_indices, default=-1)

    for idx, item in enumerate(months_order):
        m = item['cell']
        val_upper = str(m['value']).strip().upper()
        try:
            num_val = float(m['value'])
        except (ValueError, TypeError):
            num_val = 0
            
        is_paid = (num_val > 0) or m['status'] in ('PAID', 'NEW_CONTRACT') or 'CONTRATO' in val_upper or 'NUEVO' in val_upper
        is_delivery = m['status'] == 'DELIVERY' or 'ENTREGA' in val_upper
        is_vacant_cell = (m['status'] == 'VACANT' or 'DESOCUPAD' in val_upper) and not is_paid
        
        last_delivery = max([i for i in delivery_indices if i <= idx], default=-1)
        last_paid = max([i for i in paid_indices if i <= idx], default=-1)

        if is_paid:
            status = 'PAID'
        elif is_delivery:
            status = 'DELIVERY'
        elif last_delivery > last_paid:
            status = 'VACANT'
        elif idx < max_paid_idx:
            if is_vacant_cell or default_vacant:
                status = 'VACANT'
            else:
                status = 'PENDING'
        else:
            if default_vacant:
                status = 'VACANT'
            else:
                y = item['year']
                m_idx = item['month_idx']
                is_curr = (y == curr_year and m_idx == curr_month_idx)
                is_fut = (y == curr_year and m_idx > curr_month_idx) or (y > curr_year)
                if is_curr:
                    today_day = today.day
                    due_day = p.get('due_day') or 5
                    status = 'AL_DIA' if today_day < due_day else 'PENDING'
                elif is_fut:
                    status = 'FUTURE'
                else:
                    status = 'PENDING'
                    
        m['status'] = status
        if status == 'VACANT':
            m['value'] = 'DESOCUPADO'

print("Processed all properties successfully!")
