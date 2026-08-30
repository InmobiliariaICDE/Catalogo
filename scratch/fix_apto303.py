import urllib.request
import json
import time

url_get = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url_get, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    drive_data = json.loads(resp.read().decode('utf-8'))

apto303 = None
for p in drive_data.get('properties', []):
    print(f"Prop ID: {p.get('id')}, ExcelRow: {p.get('excel_row')}, Name: {p.get('name')}")
    if '303' in p['name']:
        apto303 = p

if apto303:
    print("\nTarget APTO 303:", apto303['id'], apto303['name'])
    post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'
    
    # 2026 payments from original backup for APTO 303
    pay_map = {
        0: 450000,    # Enero
        1: 450000,    # Febrero
        2: 450000,    # Marzo
        3: 450000,    # Abril
        4: 450000,    # Mayo
        5: 'ENTREGA', # Junio
        6: 450000,    # Julio
        7: 450000     # Agosto
    }
    
    for m_idx, val in pay_map.items():
        payload = {
            'action': 'saveAdminPayment',
            'propertyId': apto303['id'],
            'propertyName': apto303['name'],
            'year': 2026,
            'monthIndex': m_idx,
            'value': val
        }
        req_p = urllib.request.Request(post_url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'text/plain'})
        with urllib.request.urlopen(req_p) as r:
            print(f"Setting month {m_idx} -> {val}:", json.loads(r.read().decode('utf-8')))
        time.sleep(0.3)

print("Finished restoring APTO 303!")
