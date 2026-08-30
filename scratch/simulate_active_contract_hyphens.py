import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

# List of rows with active contracts (Group B):
# Row 9 (APTO 302), Row 10 (CASA MARCOS-GRANJAS), Row 12 (CASA MANZANARES),
# Row 14 (LILOLA 302), Row 15 (GOYA T-33), Row 17 (APTO 201), Row 18 (CASA AZUL),
# Row 19 (APTO 301), Row 20 (LOCAL 1), Row 21 (GOYA T-10), Row 22 (APTO 102), Row 23 (APTO 303), Row 24 (APTO 203)

active_rows = [9, 10, 12, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24]

updates_to_send = []

for p in props:
    row = p.get('excel_row')
    if row not in active_rows:
        continue
        
    pid = p.get('id')
    name = p.get('name')
    tenant = p.get('tenant_name')
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
    
    # Chronological list of months from 2026 to 2027
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
        
        # Calculate contract renewal and preaviso
        total_months_diff = (yr - start_yr) * 12 + (m_num - start_mo)
        is_renov = (total_months_diff > 0 and (total_months_diff % dur) == 0)
        
        next_m_num = m_num + 1
        next_yr = yr
        if next_m_num > 12:
            next_m_num = 1
            next_yr = yr + 1
        next_months_diff = (next_yr - start_yr) * 12 + (next_m_num - start_mo)
        is_preaviso = (next_months_diff > 0 and (next_months_diff % dur) == 0)
        
        # If this is an active contract month (not preaviso, not renov, not payment numeric)
        if not is_renov and not is_preaviso and not (val_upper.replace('.','',1).isdigit() and float(val_upper) > 0) and item['status'] != 'PAID':
            # If current cell is 'DESOCUPADO', change back to '-'!
            if item['val'] == 'DESOCUPADO':
                updates_to_send.append({
                    'propertyId': pid,
                    'propertyName': name,
                    'row': row,
                    'year': yr,
                    'monthIndex': item['monthIndex'],
                    'monthName': item['monthName'],
                    'currentVal': item['val'],
                    'targetVal': '-'
                })

print(f"Total cells to restore from DESOCUPADO to '-' for ACTIVE contracts: {len(updates_to_send)}")

by_prop = {}
for u in updates_to_send:
    pname = u['propertyName']
    if pname not in by_prop:
        by_prop[pname] = []
    by_prop[pname].append(f"{u['monthName']} {u['year']}")

for pname, m_list in by_prop.items():
    print(f"\nRow for '{pname}' ({len(m_list)} cells):")
    print("  ", ", ".join(m_list))
