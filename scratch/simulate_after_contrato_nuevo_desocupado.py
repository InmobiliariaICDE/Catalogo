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
    payments = p.get('payments', {})
    
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
            
    is_after_event = False
    
    for item in all_months:
        val_upper = item['val'].upper()
        
        # Check if this cell is CONTRATO NUEVO, ENTREGA, or DESOCUPADO
        if any(k in val_upper for k in ['CONTRATO NUEVO', 'NUEVO', 'ENTREGA', 'DESOCUPAD']):
            is_after_event = True
        elif any(k in val_upper for k in ['PREAVISO']) or item['status'] == 'PAID' or (val_upper.replace('.','',1).isdigit() and float(val_upper) > 0):
            # Real payment or preaviso -> does not trigger vacant mode unless followed by event
            # But if a real payment exists, we keep it!
            pass
            
        if is_after_event:
            # If current cell is empty or '-' or 'FUTURE' without a numeric payment, change to DESOCUPADO
            if item['val'] in ['-', ''] and not any(k in val_upper for k in ['CONTRATO', 'PREAVISO', 'ENTREGA', 'DESOCUPAD']):
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': item['year'],
                    'monthIndex': item['monthIndex'],
                    'monthName': item['monthName'],
                    'targetVal': 'DESOCUPADO'
                })

print(f"Total cells after CONTRATO NUEVO / ENTREGA / DESOCUPADO to update to DESOCUPADO: {len(updates_to_send)}")

by_prop = {}
for u in updates_to_send:
    pname = u['propertyName']
    if pname not in by_prop:
        by_prop[pname] = []
    by_prop[pname].append(f"{u['monthName']} {u['year']}")

for pname, m_list in by_prop.items():
    print(f"\nProperty '{pname}' ({len(m_list)} cells):")
    print("  ", ", ".join(m_list))
