import urllib.request, json

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

updates = []

# 2026 Septiembre to Diciembre (monthIndex 8 to 11)
for m in range(8, 12):
    updates.append({'year': '2026', 'monthIndex': m})

# 2027 Enero to Diciembre (monthIndex 0 to 11)
for m in range(0, 12):
    updates.append({'year': '2027', 'monthIndex': m})

print(f"Pushing {len(updates)} updates for CASA MARCOS - GRANJAS (Row 10)...")

success_count = 0
for u in updates:
    payload = {
        'action': 'saveAdminPayment',
        'propertyId': '10',
        'propertyName': 'CASA MARCOS - GRANJAS',
        'year': u['year'],
        'monthIndex': u['monthIndex'],
        'value': 'DESOCUPADO'
    }
    try:
        req = urllib.request.Request(
            post_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'text/plain'}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            if res.get('success'):
                success_count += 1
                print(f"OK: CASA MARCOS {u['monthIndex']} {u['year']} -> DESOCUPADO (Row {res.get('row')}, Col {res.get('column')})")
            else:
                print(f"ERR: {res.get('error')}")
    except Exception as e:
        print(f"FAIL: {e}")

print(f"\nCOMPLETED! {success_count} / {len(updates)} cells updated to DESOCUPADO for CASA MARCOS - GRANJAS in Google Sheets!")
