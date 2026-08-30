import urllib.request, json, time

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

updates_to_send = []

for p in props:
    pid = p.get('id')
    name = p.get('name')
    row = p.get('excel_row')
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
    
    for yr_str, m_list in payments.items():
        try:
            yr = int(yr_str)
        except:
            continue
            
        for m_idx, m_item in enumerate(m_list):
            m_num = m_idx + 1
            m_name = m_item.get('month')
            curr_val = str(m_item.get('value', '-')).strip()
            curr_status = m_item.get('status')
            
            total_months_diff = (yr - start_yr) * 12 + (m_num - start_mo)
            
            is_renov = (total_months_diff > 0 and (total_months_diff % dur) == 0)
            
            # Check if this month is preaviso (month before renov)
            next_m_num = m_num + 1
            next_yr = yr
            if next_m_num > 12:
                next_m_num = 1
                next_yr = yr + 1
            next_months_diff = (next_yr - start_yr) * 12 + (next_m_num - start_mo)
            is_preaviso = (next_months_diff > 0 and (next_months_diff % dur) == 0)
            
            target_val = None
            if is_renov:
                target_val = "CONTRATO NUEVO"
            elif is_preaviso:
                target_val = "PREAVISO"
                
            if target_val:
                # Only populate if current cell is empty, '-', UNSTARTED, FUTURE, or PENDING without a real paid amount
                if curr_val in ['-', '', 'DESOCUPADO', 'Pendiente'] or curr_status in ['UNSTARTED', 'FUTURE', 'VACANT', 'PENDING']:
                    updates_to_send.append({
                        'propertyId': pid,
                        'propertyName': name,
                        'year': yr,
                        'monthIndex': m_idx,
                        'monthName': m_name,
                        'targetVal': target_val
                    })

print(f"Sending {len(updates_to_send)} updates to Google Drive...")

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

success_count = 0
for i, item in enumerate(updates_to_send):
    payload = {
        'action': 'saveAdminPayment',
        'propertyId': str(item['propertyId']),
        'propertyName': item['propertyName'],
        'year': str(item['year']),
        'monthIndex': item['monthIndex'],
        'value': item['targetVal']
    }
    
    try:
        post_req = urllib.request.Request(
            post_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'text/plain'}
        )
        with urllib.request.urlopen(post_req) as post_resp:
            resp_text = post_resp.read().decode('utf-8')
            res = json.loads(resp_text)
            if res.get('success'):
                success_count += 1
                print(f"[{i+1}/{len(updates_to_send)}] OK: {item['propertyName']} ({item['monthName']} {item['year']}) -> {item['targetVal']}")
            else:
                print(f"[{i+1}/{len(updates_to_send)}] ERR: {item['propertyName']} -> {res.get('error')}")
    except Exception as e:
        print(f"[{i+1}/{len(updates_to_send)}] FAIL: {item['propertyName']} -> {e}")

print(f"\nCompleted! {success_count} / {len(updates_to_send)} milestone cells updated in Google Sheets!")
