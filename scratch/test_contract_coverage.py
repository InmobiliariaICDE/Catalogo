import json, datetime

data = json.load(open('admin_data.json', encoding='utf-8'))

today = datetime.date(2026, 8, 6)
curr_year = today.year
curr_month_idx = today.month - 1

for p in data['properties']:
    # Parse contract start date if present
    start_dt = None
    start_str = p.get('start_date') or ''
    if start_str:
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                start_dt = datetime.datetime.strptime(start_str.strip(), fmt).date()
                break
            except Exception:
                pass

    duration_months = 12
    try:
        if p.get('duration'):
            duration_months = int(p.get('duration'))
    except Exception:
        pass

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
    max_paid_idx = max(paid_indices, default=-1)

    # Check if property has active contract or active tenant
    has_tenant = bool(p.get('tenant_name') and str(p.get('tenant_name')).strip())
    default_vacant = ('DESOCUPAD' in p['name'].upper()) or (not has_any_payment and not has_tenant)

    if 'GOYA' in p['name'].upper():
        print(f"\nProperty: {p['name']} (Tenant: {p.get('tenant_name')}, StartDate: {start_str})")
        for idx, item in enumerate(months_order):
            if item['year'] != 2026: continue
            m = item['cell']
            val_upper = str(m['value']).strip().upper()
            try:
                num_val = float(m['value'])
            except (ValueError, TypeError):
                num_val = 0

            y = item['year']
            m_idx = item['month_idx']
            m_date = datetime.date(y, m_idx + 1, 1)

            is_paid = (num_val > 0) or m['status'] in ('PAID', 'NEW_CONTRACT') or 'CONTRATO' in val_upper or 'NUEVO' in val_upper
            is_delivery = m['status'] == 'DELIVERY' or 'ENTREGA' in val_upper
            is_vacant_cell = (m['status'] == 'VACANT' or 'DESOCUPAD' in val_upper) and not is_paid

            # Check if month is covered by contract date
            is_covered_by_contract = False
            if start_dt:
                # Contract covers from start_dt month to start_dt month + duration_months
                contract_start_month = datetime.date(start_dt.year, start_dt.month, 1)
                # end month
                end_y = start_dt.year + (start_dt.month + duration_months - 1) // 12
                end_m = (start_dt.month + duration_months - 1) % 12 + 1
                contract_end_month = datetime.date(end_y, end_m, 1)
                if contract_start_month <= m_date < contract_end_month:
                    is_covered_by_contract = True

            is_after_payment = (max_paid_idx != -1 and idx >= max_paid_idx)

            if is_paid:
                status = 'PAID'
            elif is_delivery:
                status = 'DELIVERY'
            elif is_covered_by_contract or is_after_payment:
                # Occupied active contract period!
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
            else:
                # Before contract start / before payment date
                if is_vacant_cell or default_vacant:
                    status = 'VACANT'
                else:
                    status = 'PENDING'

            print(f"  Month {m_idx+1}: orig_val='{m['value']}' orig_st='{m['status']}' -> new_st='{status}'")
