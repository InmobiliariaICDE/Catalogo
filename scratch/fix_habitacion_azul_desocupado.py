import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

updates_to_send = []

for p in props:
    name = p.get('name', '').upper()
    pid = p.get('id')
    row = p.get('excel_row')
    
    if 'HABITACION AZUL' in name or 'HABITACIÓN AZUL' in name:
        payments = p.get('payments', {})
        m2027 = payments.get('2027', [])
        
        for m_idx, m_item in enumerate(m2027):
            val = str(m_item.get('value', '-')).strip()
            if val != 'DESOCUPADO':
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': p.get('name'),
                    'row': row,
                    'year': 2027,
                    'monthIndex': m_idx,
                    'monthName': m_item.get('month'),
                    'currentVal': val,
                    'targetVal': 'DESOCUPADO'
                })

print(f"HABITACION AZUL updates to send: {len(updates_to_send)}")
for u in updates_to_send:
    print(f"  Row {u['row']} {u['monthName']} 2027: '{u['currentVal']}' -> DESOCUPADO")

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
                print(f"[{i+1}/{len(updates_to_send)}] OK: HABITACION AZUL {u['monthName']} 2027 -> DESOCUPADO")
            else:
                print(f"[{i+1}/{len(updates_to_send)}] ERR: {res.get('error')}")
    except Exception as e:
        print(f"[{i+1}/{len(updates_to_send)}] FAIL: {e}")

print(f"\nCOMPLETED! {success_count} / {len(updates_to_send)} HABITACION AZUL cells set to DESOCUPADO in Google Sheets!")
