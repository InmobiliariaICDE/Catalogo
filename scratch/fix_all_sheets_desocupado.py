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
    
    # Check if property is completely unrented / no tenant
    is_unrented = not tenant or tenant.strip() == ''
    
    # Chronological list of all months
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
        # For unrented properties (like LOS NOGALES, PORTAL DEL CAMPO, HABITACION AZUL),
        # all empty/hyphen cells should be DESOCUPADO!
        for item in all_months:
            if item['val'] in ['-', '']:
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': item['year'],
                    'monthIndex': item['monthIndex'],
                    'monthName': item['monthName'],
                    'targetVal': 'DESOCUPADO',
                    'reason': 'Unrented property'
                })
    else:
        # For rented properties:
        # Trace state. If state becomes DESOCUPADO or ENTREGA or NO_RENEW and no subsequent payment is present,
        # set empty/hyphen cells to DESOCUPADO.
        vacant_state = False
        for item in all_months:
            val_upper = item['val'].upper()
            if 'DESOCUPAD' in val_upper or 'ENTREGA' in val_upper or 'NO RENOVARA' in val_upper:
                vacant_state = True
            elif any(k in val_upper for k in ['CONTRATO', 'PREAVISO']) or item['status'] == 'PAID' or (val_upper.replace('.','',1).isdigit() and float(val_upper) > 0):
                vacant_state = False
                
            if vacant_state and item['val'] in ['-', '']:
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': item['year'],
                    'monthIndex': item['monthIndex'],
                    'monthName': item['monthName'],
                    'targetVal': 'DESOCUPADO',
                    'reason': 'Vacant state after contract end'
                })

print(f"Total DESOCUPADO updates to send to Google Drive: {len(updates_to_send)}")

by_prop = {}
for u in updates_to_send:
    pname = u['propertyName']
    if pname not in by_prop:
        by_prop[pname] = []
    by_prop[pname].append(f"{u['monthName']} {u['year']}")

for pname, m_list in by_prop.items():
    print(f"\nProperty: '{pname}' ({len(m_list)} cells):")
    print("  ", ", ".join(m_list[:15]), ("..." if len(m_list) > 15 else ""))
