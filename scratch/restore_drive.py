import urllib.request
import json
import time

# 1. Load original backup admin_data.json
with open('admin_data.json', encoding='utf-8') as f:
    local_data = json.load(f)

# 2. Fetch current Drive data via getAdminData
url_get = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url_get, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    drive_data = json.loads(resp.read().decode('utf-8'))

drive_props = {p['name']: p for p in drive_data.get('properties', [])}
months_names = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"]

updates_to_make = []

for lp in local_data.get('properties', []):
    name = lp['name']
    prop_id = lp.get('id') or lp.get('excel_row')
    lp_pays = lp.get('payments', {}).get('2026', [])
    dp = drive_props.get(name)
    if not dp:
        continue
    dp_pays = dp.get('payments', {}).get('2026', [])
    
    for m1, m2 in zip(lp_pays, dp_pays):
        val1 = str(m1.get('value'))
        val2 = str(m2.get('value'))
        # If Drive cell has 'Pendiente' but local_data has actual value/number/status
        if val2 == 'Pendiente' and val1 != 'Pendiente' and val1 != '-' and val1 != '0':
            month_idx = months_names.index(m1['month'].upper())
            updates_to_make.append({
                'propertyId': prop_id,
                'propertyName': name,
                'year': 2026,
                'monthIndex': month_idx,
                'monthName': m1['month'],
                'value': m1.get('value')
            })

print(f"Total updates to restore via POST: {len(updates_to_make)}")
post_url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec"

for u in updates_to_make:
    payload = {
        "action": "saveAdminPayment",
        "propertyId": u['propertyId'],
        "propertyName": u['propertyName'],
        "year": u['year'],
        "monthIndex": u['monthIndex'],
        "value": u['value']
    }
    print(f"Restoring {u['propertyName']} {u['monthName']} -> {u['value']}")
    req_post = urllib.request.Request(
        post_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'text/plain', 'User-Agent': 'Mozilla/5.0'}
    )
    try:
        with urllib.request.urlopen(req_post) as resp_post:
            res = json.loads(resp_post.read().decode('utf-8'))
            print("  Result:", res)
    except Exception as e:
        print("  Error:", e)
    time.sleep(0.3)

print("POST restoration complete.")
