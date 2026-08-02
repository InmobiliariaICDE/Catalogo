import json

with open('admin_data.json', 'r', encoding='utf-8') as f:
    adminData = json.load(f)

monthsNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]

print("--- ANTES (Proyectado/Esperado filtrado erróneamente como real) ---")
for m_idx, m_name in enumerate(monthsNames):
    m1 = m_idx + 1
    total_before = 0
    for p in adminData.get('properties', []):
        rent = float(p.get('monthly_rent', 0) or 0)
        comVal = rent * 0.10
        if comVal <= 0: continue
        for m in p.get('payments', {}).get('2026', []):
            if m.get('month', '').upper() == m_name:
                st = m.get('status')
                if st in ['PAID', 'PENDING', 'PREAVISO', 'NEW_CONTRACT', 'NO_RENEW', 'AL_DIA', 'FUTURE']:
                    total_before += comVal
    print(f"Mes {m1} ({m_name}): ${total_before:,.0f}")

print("\n--- DESPUÉS (Ingresos Reales Recaudados: st === 'PAID' || st === 'AL_DIA') ---")
for m_idx, m_name in enumerate(monthsNames):
    m1 = m_idx + 1
    total_after = 0
    for p in adminData.get('properties', []):
        rent = float(p.get('monthly_rent', 0) or 0)
        comVal = rent * 0.10
        if comVal <= 0: continue
        for m in p.get('payments', {}).get('2026', []):
            if m.get('month', '').upper() == m_name:
                st = m.get('status')
                if st in ['PAID', 'AL_DIA']:
                    total_after += comVal
    print(f"Mes {m1} ({m_name}): ${total_after:,.0f}")
