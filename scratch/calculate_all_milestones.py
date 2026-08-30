import urllib.request, json
from datetime import datetime

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

months_names = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]

props = data.get('properties', [])

print("=== CALCULATED MILESTONES FOR ALL PROPERTIES ===")
for p in props:
    name = p.get('name')
    row = p.get('excel_row')
    s_date = p.get('start_date')
    dur = int(p.get('duration') or 12)
    
    if not s_date:
        print(f"Row {row:<2} | {name:<32} | NO START DATE")
        continue
    
    # Parse date
    try:
        if '-' in str(s_date):
            parts = str(s_date).split('-')
            start_yr = int(parts[0])
            start_mo = int(parts[1])
        else:
            print(f"Row {row:<2} | {name:<32} | INVALID DATE: {s_date}")
            continue
    except Exception as e:
        print(f"Row {row:<2} | {name:<32} | ERROR PARSING DATE: {s_date}")
        continue
    
    milestones = []
    # Calculate for 2023 to 2027
    for yr in range(2023, 2028):
        for m_idx, m_name in enumerate(months_names):
            m_num = m_idx + 1
            total_months_diff = (yr - start_yr) * 12 + (m_num - start_mo)
            
            if total_months_diff > 0 and (total_months_diff % dur) == 0:
                # Renewal month -> CONTRATO NUEVO
                milestones.append(f"{m_name} {yr}: CONTRATO NUEVO")
                # Preaviso month -> Month before renewal
                prev_m_idx = m_idx - 1
                prev_yr = yr
                if prev_m_idx < 0:
                    prev_m_idx = 11
                    prev_yr = yr - 1
                if prev_yr >= 2023:
                    milestones.append(f"{months_names[prev_m_idx]} {prev_yr}: PREAVISO")

    print(f"Row {row:<2} | {name:<32} | Start: {s_date} ({dur}m) | Milestones: {', '.join(milestones)}")
