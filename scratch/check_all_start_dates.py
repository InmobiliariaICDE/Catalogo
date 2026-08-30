import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

months_map = {
    1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL", 5: "MAYO", 6: "JUNIO",
    7: "JULIO", 8: "AGOSTO", 9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
}

print("=== CHECKING START DATES & RENEWAL MONTHS FOR ALL PROPERTIES ===")
for p in data.get('properties', []):
    pid = str(p.get('id'))
    pname = p.get('name')
    sdate = p.get('start_date')
    dur = p.get('duration', '12')
    
    start_m_str = ""
    if sdate and '-' in sdate:
        parts = sdate.split('-')
        if len(parts) >= 2:
            m_num = int(parts[1])
            start_m_str = months_map.get(m_num, "")
    
    # Check 2026 status for start_m_str
    status_in_2026 = ""
    if start_m_str:
        pays = p.get('payments', {}).get('2026', [])
        for m in pays:
            if m.get('month') == start_m_str:
                status_in_2026 = m.get('status')
    
    print(f"Prop ID {pid:<3} | {pname:<36} | Start: {str(sdate):<10} | Renews in: {start_m_str:<10} | 2026 Status in {start_m_str}: '{status_in_2026}'")
