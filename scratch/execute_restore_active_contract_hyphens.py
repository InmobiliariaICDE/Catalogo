import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

# List of rows with active contracts:
active_rows = [9, 10, 12, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24]

updates_to_send = []

for p in props:
    row = p.get('excel_row')
    if row not in active_rows:
        continue
        
    pid = p.get('id')
    name = p.get('name')
    s_date = p.get('start_date')
    dur = int(p.get('duration') or 12)
    
    if not s_date or '-' not in str(s_date):
        continue
        
    try:
        parts = str(s_date).split('-')
        start_yr = int(parts[0])
        start_mo = int(parts[1])
    except:
        continue
        
    payments = p.get('payments', {})
    
    all_months = []
    for yr in [2026, 2027]:
        m_list = payments.get(str(yr), [])
        for m_idx, m_item in enumerate(m_list):
            all_months.append({
                'year': yr,
                'monthIndex': m_idx,
                'monthName': m_item.get('month'),
                'val': str(m_item.get('value', '-')).strip(),
                'status': m_item.get('status')
            })
            
    for item in all_months:
        yr = item['year']
        m_num = item['monthIndex'] + 1
        val_upper = item['val'].upper()
        
        total_months_diff = (yr - start_yr) * 12 + (m_num - start_mo)
        is_renov = (total_months_diff > 0 and (total_months_diff % dur) == 0)
        
        next_m_num = m_num + 1
        next_yr = yr
        if next_m_num > 12:
            next_m_num = 1
            next_yr = yr + 1
        next_months_diff = (next_yr - start_yr) * 12 + (next_m_num - start_mo)
        is_preaviso = (next_months_diff > 0 and (next_months_diff % dur) == 0)
        
        if not is_renov and not is_preaviso and not (val_upper.replace('.','',1).isdigit() and float(val_upper) > 0) and item['status'] != 'PAID':
            if item['val'] == 'DESOCUPADO':
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': yr,
                    'monthIndex': item['monthIndex'],
                    'monthName': item['monthName'],
                    'targetVal': '-'
                })

print(f"Pushing {len(updates_to_send)} updates to restore '-' for active contracts...")

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

success_count = 0
for i, u in enumerate(updates_to_send):
    payload = {
        'action': 'saveAdminPayment',
        'propertyId': str(u['propertyId']),
        'propertyName': u['propertyName'],
        'year': str(u['year']),
        'monthIndex': u['monthIndex'],
        'value': '-'
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
                    print(f"Progress: [{i+1}/{len(updates_to_send)}] - Last: Row {u['row']} {u['propertyName']} ({u['monthName']} {u['year']}) -> '-'")
            else:
                print(f"[{i+1}/{len(updates_to_send)}] ERR: {u['propertyName']} -> {res.get('error')}")
    except Exception as e:
        print(f"[{i+1}/{len(updates_to_send)}] FAIL: {u['propertyName']} -> {e}")

print(f"\nCOMPLETED! {success_count} / {len(updates_to_send)} active contract cells restored to '-' in Google Sheets!")
