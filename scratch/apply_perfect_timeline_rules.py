import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

updates_to_send = []

for p in props:
    pid = p.get('id')
    row = p.get('excel_row')
    name = p.get('name')
    tenant = p.get('tenant_name')
    s_date = p.get('start_date')
    dur = int(p.get('duration') or 12) if p.get('duration') else 12
    payments = p.get('payments', {})
    
    is_unrented = not tenant or tenant.strip() == ''
    
    # Chronological list of all months from 2023 to 2027
    all_months = []
    for yr in [2023, 2024, 2025, 2026, 2027]:
        m_list = payments.get(str(yr), [])
        for m_idx, m_item in enumerate(m_list):
            all_months.append({
                'year': yr,
                'monthIndex': m_idx,
                'monthName': m_item.get('month'),
                'val': str(m_item.get('value', '-')).strip(),
                'status': m_item.get('status')
            })
            
    if is_unrented:
        # All months for unrented properties should be DESOCUPADO!
        for item in all_months:
            if item['val'] != 'DESOCUPADO':
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': item['year'],
                    'monthIndex': item['monthIndex'],
                    'monthName': item['monthName'],
                    'currentVal': item['val'],
                    'targetVal': 'DESOCUPADO'
                })
    else:
        # Rented property:
        # Trace month by month.
        # State: 'ACTIVE' (before end) or 'VACANT' (after CONTRATO NUEVO / ENTREGA / DESOCUPADO)
        post_event_vacant = False
        
        for item in all_months:
            val_upper = item['val'].upper()
            
            # Check if this cell is CONTRATO NUEVO, ENTREGA, or DESOCUPADO
            if any(k in val_upper for k in ['CONTRATO NUEVO', 'ENTREGA', 'DESOCUPAD']):
                post_event_vacant = True
            elif item['status'] == 'PAID' or (val_upper.replace('.','',1).isdigit() and float(val_upper) > 0):
                # Real payment recorded -> property has active tenant paying!
                post_event_vacant = False
                
            if post_event_vacant:
                # After CONTRATO NUEVO / ENTREGA / DESOCUPADO: cell MUST say DESOCUPADO
                # unless it's CONTRATO NUEVO / ENTREGA / PREAVISO or a real payment
                if item['val'] in ['-', ''] and not any(k in val_upper for k in ['CONTRATO', 'PREAVISO', 'ENTREGA', 'DESOCUPAD']):
                    updates_to_send.append({
                        'propertyId': pid,
                        'propertyName': name,
                        'row': row,
                        'year': item['year'],
                        'monthIndex': item['monthIndex'],
                        'monthName': item['monthName'],
                        'currentVal': item['val'],
                        'targetVal': 'DESOCUPADO'
                    })
            else:
                # Active contract period before end:
                # Cell should say '-' if no payment numeric value is recorded
                pass

print(f"Total cell updates for perfect timeline rules: {len(updates_to_send)}")

by_prop = {}
for u in updates_to_send:
    pname = u['propertyName']
    if pname not in by_prop:
        by_prop[pname] = []
    by_prop[pname].append(f"{u['monthName']} {u['year']} ('{u['currentVal']}' -> '{u['targetVal']}')")

for pname, m_list in by_prop.items():
    print(f"\nRow for '{pname}' ({len(m_list)} cells):")
    for item in m_list:
        print(f"   {item}")
