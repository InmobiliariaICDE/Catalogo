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
        # Unrented property: all empty or '-' cells set to DESOCUPADO
        for item in all_months:
            if item['val'] in ['-', '']:
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': item['year'],
                    'monthIndex': item['monthIndex'],
                    'monthName': item['monthName'],
                    'targetVal': 'DESOCUPADO'
                })
    else:
        # Rented property:
        # Trace month by month.
        # State: post_event_vacant = True AFTER encountering CONTRATO NUEVO, ENTREGA, or DESOCUPADO
        post_event_vacant = False
        
        for item in all_months:
            val_upper = item['val'].upper()
            
            if any(k in val_upper for k in ['CONTRATO NUEVO', 'ENTREGA', 'DESOCUPAD']):
                post_event_vacant = True
            elif item['status'] == 'PAID' or (val_upper.replace('.','',1).isdigit() and float(val_upper) > 0):
                post_event_vacant = False
                
            if post_event_vacant:
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

print(f"Pushing {len(updates_to_send)} updates to Google Drive for perfect timeline rules...")

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

success_count = 0
for i, u in enumerate(updates_to_send):
    payload = {
        'action': 'saveAdminPayment',
        'propertyId': str(u['propertyId']),
        'propertyName': u['propertyName'],
        'year': str(u['year']),
        'monthIndex': u['monthIndex'],
        'value': u['targetVal']
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
                if (i+1) % 15 == 0 or (i+1) == len(updates_to_send):
                    print(f"Progress: [{i+1}/{len(updates_to_send)}] - Last: Row {u['row']} {u['propertyName']} ({u['monthName']} {u['year']}) -> {u['targetVal']}")
            else:
                print(f"[{i+1}/{len(updates_to_send)}] ERR: {u['propertyName']} -> {res.get('error')}")
    except Exception as e:
        print(f"[{i+1}/{len(updates_to_send)}] FAIL: {u['propertyName']} -> {e}")

print(f"\nCOMPLETED! {success_count} / {len(updates_to_send)} cells updated in Google Sheets!")
