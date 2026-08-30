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
            
    # Check if this property became DESOCUPADO in 2026 (or earlier) and remained unrented (no numeric payment > 0 after the vacancy)
    # Trace payments after the first DESOCUPADO / ENTREGA in 2026
    became_vacant = False
    vacant_from_index = -1
    has_subsequent_payment = False
    
    for idx, m in enumerate(all_months):
        val_str = m['val'].upper()
        num_val = 0
        try:
            num_val = float(m['val'].replace('.','',1))
        except:
            pass
            
        if num_val > 0 or m['status'] == 'PAID':
            if became_vacant:
                has_subsequent_payment = True
                break
        elif 'DESOCUPAD' in val_str or 'ENTREGA' in val_str or 'NO RENOVARA' in val_str:
            if not became_vacant:
                became_vacant = True
                vacant_from_index = idx
                
    if became_vacant and not has_subsequent_payment:
        # All months from vacant_from_index onwards should be DESOCUPADO!
        for idx in range(vacant_from_index, len(all_months)):
            m = all_months[idx]
            if m['val'] != 'DESOCUPADO':
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': m['year'],
                    'monthIndex': m['monthIndex'],
                    'monthName': m['monthName'],
                    'currentVal': m['val'],
                    'targetVal': 'DESOCUPADO'
                })

print(f"Total fake renewal / hyphen cells to fix to DESOCUPADO: {len(updates_to_send)}")

by_prop = {}
for u in updates_to_send:
    pname = u['propertyName']
    if pname not in by_prop:
        by_prop[pname] = []
    by_prop[pname].append(f"{u['monthName']} {u['year']} ('{u['currentVal']}')")

for pname, m_list in by_prop.items():
    print(f"\nRow for '{pname}' ({len(m_list)} cells):")
    for item in m_list:
        print(f"   {item}")
