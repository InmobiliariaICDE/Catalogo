import zlib
import os
import json
import urllib.request
import time

obj_dir = r'c:\Users\USUARIO\Documents\GitHub\Catalogo\.git\objects'
target_data = None

for root, dirs, files in os.walk(obj_dir):
    for file in files:
        if len(file) == 38:
            sha = os.path.basename(root) + file
            if sha.startswith('cea4696c') or sha.startswith('887ca2dc') or sha.startswith('d613c211'):
                path = os.path.join(root, file)
                with open(path, 'rb') as f:
                    data = zlib.decompress(f.read())
                b_null = data.find(b'\x00')
                target_data = json.loads(data[b_null+1:].decode('utf-8'))
                print("Found target blob SHA:", sha)
                break
    if target_data:
        break

if not target_data:
    print("Error: Could not find target JSON blob.")
    exit(1)

props = target_data.get('properties', [])
print(f"Restoring all {len(props)} properties to Google Drive...")

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

months_names = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"]

for p in props:
    prop_id = p.get('id') or p.get('excel_row')
    prop_name = p.get('name')
    print(f"\nProcessing property: {prop_name} (ID: {prop_id})")

    # 1. Restore property contract details
    payload_prop = {
        'action': 'saveAdminProperty',
        'propertyId': prop_id,
        'propertyNameOld': prop_name,
        'name': prop_name,
        'tenant_name': p.get('tenant_name', ''),
        'tenant_phone': p.get('tenant_phone', ''),
        'monthly_rent': p.get('monthly_rent', 0),
        'deposit': p.get('deposit', ''),
        'start_date': p.get('start_date', ''),
        'duration': p.get('duration', ''),
        'due_day': p.get('due_day', 5),
        'max_due_day': p.get('max_due_day', 10),
        'increase_notes': p.get('increase_notes', ''),
        'damage_notes': p.get('damage_notes', '')
    }
    
    req_prop = urllib.request.Request(post_url, data=json.dumps(payload_prop).encode('utf-8'), headers={'Content-Type': 'text/plain'})
    try:
        with urllib.request.urlopen(req_prop) as r:
            res = json.loads(r.read().decode('utf-8'))
            print(f"  Prop info: {res}")
    except Exception as e:
        print(f"  Prop info error: {e}")

    time.sleep(0.2)

    # 2. Restore payments for 2026
    p2026 = p.get('payments', {}).get('2026', [])
    for m_idx, m_obj in enumerate(p2026):
        val = m_obj.get('value')
        if val is None or val == '':
            val = '-'
        payload_pay = {
            'action': 'saveAdminPayment',
            'propertyId': prop_id,
            'propertyName': prop_name,
            'year': 2026,
            'monthIndex': m_idx,
            'value': val
        }
        req_pay = urllib.request.Request(post_url, data=json.dumps(payload_pay).encode('utf-8'), headers={'Content-Type': 'text/plain'})
        try:
            with urllib.request.urlopen(req_pay) as r:
                res = json.loads(r.read().decode('utf-8'))
                # print(f"  {m_obj.get('month')}: {val} -> {res}")
        except Exception as e:
            print(f"  Payment error {m_obj.get('month')}: {e}")
        time.sleep(0.15)

print("\nFull Google Drive restoration completed successfully!")
