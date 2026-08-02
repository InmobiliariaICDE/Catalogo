import re, json

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('admin_data.json', 'r', encoding='utf-8') as f:
    adminData = json.load(f)

# Test function simulation matching JS exact logic
def contGetParaAno(year):
    lista = []
    monthsNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]
    for p in adminData.get('properties', []):
        rent = float(p.get('monthly_rent', 0) or 0)
        comVal = rent * 0.10
        if comVal <= 0: continue
        
        paymentsYear = p.get('payments', {}).get(str(year), [])
        for m in paymentsYear:
            m_month = m.get('month', '').upper()
            if m_month in monthsNames:
                mIdx = monthsNames.index(m_month)
                st = m.get('status')
                if st == 'PAID' or st == 'AL_DIA':
                    propName = p.get('name') or 'Propiedad'
                    mIdx1Based = mIdx + 1
                    lista.push if False else lista.append({
                        'id': f"AUTO-ADMIN-COMISION-{p.get('id') or propName}-{year}-{mIdx1Based}",
                        'tipo': 'ingreso',
                        'categoria': 'Gestión/Administración',
                        'descripcion': f"Comisión Administración - {propName}",
                        'monto': comVal,
                        'mes': mIdx1Based,
                        'ano': year,
                        'isAuto': True
                    })
    return lista

print("=== VERIFICACIÓN POST-FIX ===")
movs = contGetParaAno(2026)

for m in range(1, 13):
    mMovs = [x for x in movs if x['mes'] == m]
    totalIng = sum(x['monto'] for x in mMovs)
    print(f"Mes {m:02d}: {len(mMovs)} comisiones auto | Total Auto Ingresos = ${totalIng:,.0f}")
