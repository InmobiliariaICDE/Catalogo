import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    adminData = json.load(f)

monthsNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]

print("--- SOLAMENTE st === 'PAID' (Pagos efectivamente recaudados) ---")
for m_idx, m_name in enumerate(monthsNames):
    m1 = m_idx + 1
    paid_comm = 0
    paid_count = 0
    for p in adminData.get('properties', []):
        rent = float(p.get('monthly_rent', 0) or 0)
        comVal = rent * 0.10
        if comVal <= 0: continue
        for m in p.get('payments', {}).get('2026', []):
            if m.get('month', '').upper() == m_name:
                st = m.get('status')
                if st == 'PAID':
                    paid_comm += comVal
                    paid_count += 1
    print(f"Mes {m1:02d} ({m_name}): {paid_count} pagos recibidos | Comisiones recaudadas: ${paid_comm:,.0f}")
