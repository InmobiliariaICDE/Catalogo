import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

# Map of specific properties whose contract ended in 2026/earlier and should be 100% DESOCUPADO in 2027:
# LIMONAR, APTO MARCOS - GRANJAS, APTO CHAPINERO, APTO 101, APTO 202, APTO AZUL, CASA AZUL, LOCAL 1, APTO 102, APTO 303
vacant_ended_properties = [
    'LIMONAR',
    'APTO MARCOS - GRANJAS',
    'APTO MARCOS-GRANJAS',
    'APTO CHAPINER0',
    'APTO CHAPINERO',
    'APTO 101',
    'APTO 202',
    'APTO AZUL',
    'CASA AZUL',
    'LOCAL 1',
    'APTO 102',
    'APTO 303'
]

updates_to_send = []

for p in props:
    pid = p.get('id')
    row = p.get('excel_row')
    name = p.get('name')
    payments = p.get('payments', {})
    
    # Check if this property is in our vacant ended list
    is_target = any(t.lower() in name.lower() for t in vacant_ended_properties)
    
    if is_target:
        # Check 2027 months: if value is PREAVISO, CONTRATO NUEVO, ENTREGA, or '-', set to DESOCUPADO!
        m2027 = payments.get('2027', [])
        for m_idx, m_item in enumerate(m2027):
            val = str(m_item.get('value', '-')).strip()
            if val != 'DESOCUPADO':
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': 2027,
                    'monthIndex': m_idx,
                    'monthName': m_item.get('month'),
                    'currentVal': val,
                    'targetVal': 'DESOCUPADO'
                })

print(f"Total cells to convert to DESOCUPADO in 2027: {len(updates_to_send)}")

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
                print(f"[{i+1}/{len(updates_to_send)}] Row {u['row']:<2} {u['propertyName']:<25} {u['monthName']} 2027: '{u['currentVal']}' -> DESOCUPADO")
            else:
                print(f"[{i+1}/{len(updates_to_send)}] ERR: {u['propertyName']} -> {res.get('error')}")
    except Exception as e:
        print(f"[{i+1}/{len(updates_to_send)}] FAIL: {u['propertyName']} -> {e}")

print(f"\nCOMPLETED! Updated {success_count} / {len(updates_to_send)} cells to DESOCUPADO in Google Sheets!")
