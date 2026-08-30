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
            
    vacant_state = False
    
    for item in all_months:
        val_upper = item['val'].upper()
        if 'DESOCUPAD' in val_upper:
            vacant_state = True
        elif any(k in val_upper for k in ['CONTRATO', 'PREAVISO', 'ENTREGA', 'RENOVA']) or item['status'] == 'PAID' or (val_upper.replace('.','',1).isdigit() and float(val_upper) > 0):
            vacant_state = False
            
        if vacant_state and item['val'] in ['-', '']:
            updates_to_send.append({
                'propertyId': pid,
                'propertyName': name,
                'row': row,
                'year': item['year'],
                'monthIndex': item['monthIndex'],
                'monthName': item['monthName'],
                'targetVal': 'DESOCUPADO'
            })

print(f"Total DESOCUPADO cells to update in Google Drive: {len(updates_to_send)}")

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

success_count = 0
for i, u in enumerate(updates_to_send):
    payload = {
        'action': 'saveAdminPayment',
        'propertyId': str(u['propertyId']),
        'propertyName': u['propertyName'],
        'year': str(u['year']),
        'monthIndex': u['monthIndex'],
        'value': 'DESOCUPADO'
    }
    try:
        post_req = urllib.request.Request(
            post_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'text/plain'}
        )
        with urllib.request.urlopen(post_req) as post_resp:
            res = json.loads(post_resp.read().decode('utf-8'))
            if res.get('success'):
                success_count += 1
                print(f"[{i+1}/{len(updates_to_send)}] Row {u['row']:<2} {u['propertyName']:<25} {u['monthName']} {u['year']} -> DESOCUPADO")
            else:
                print(f"[{i+1}/{len(updates_to_send)}] ERR: {u['propertyName']} -> {res.get('error')}")
    except Exception as e:
        print(f"[{i+1}/{len(updates_to_send)}] FAIL: {u['propertyName']} -> {e}")

print(f"\nFINISHED! Updated {success_count} / {len(updates_to_send)} cells to DESOCUPADO in Google Sheets!")
