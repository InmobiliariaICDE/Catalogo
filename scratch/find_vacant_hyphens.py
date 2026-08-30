import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

print("=== VACANCY ANALYSIS PER PROPERTY ===")
for p in props:
    row = p.get('excel_row')
    name = p.get('name')
    tenant = p.get('tenant_name')
    payments = p.get('payments', {})
    
    # Chronological list of all months
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
            
    # Trace vacancy state
    # A property is vacant if it hit DESOCUPADO, or if tenant is empty and contract ended
    print(f"\nRow {row:<2} | {name} (Tenant: '{tenant}')")
    
    vacant_state = False
    hyphens_to_fix = []
    
    for item in all_months:
        val_upper = item['val'].upper()
        if 'DESOCUPAD' in val_upper:
            vacant_state = True
        elif any(k in val_upper for k in ['CONTRATO', 'PREAVISO', 'ENTREGA', 'RENOVA']) or item['status'] == 'PAID' or (val_upper.replace('.','',1).isdigit() and float(val_upper) > 0):
            # Hit an active contract or payment or milestone
            vacant_state = False
            
        if vacant_state and item['val'] in ['-', '']:
            hyphens_to_fix.append(f"{item['monthName']} {item['year']}")
            
    if hyphens_to_fix:
        print(f"  -> NEEDS FIX ({len(hyphens_to_fix)} cells): {', '.join(hyphens_to_fix)}")
    else:
        print("  -> Clean / No trailing hyphens in vacancy")
