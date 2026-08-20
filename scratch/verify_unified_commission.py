import json

d = json.load(open('admin_data.json', encoding='utf-8'))
year = '2026'

months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]

print("UNIFIED COMMISSION TEST (2026):")
print(f"{'Month':<12} | {'Admin Total Recaudado':<22} | {'Admin Comis (10%)':<22} | {'Contab Comis':<22} | {'Diff'}")
print("="*95)

grand_admin_com = 0
grand_contab_com = 0

for m_idx, m_name in enumerate(months):
    admin_recaudado = 0
    contab_comision_sum = 0
    
    for p in d['properties']:
        rent = float(p.get('monthly_rent') or 0)
        payments = p.get('payments', {}).get(year, [])
        m = next((x for x in payments if x.get('month') == m_name), None)
        
        if m:
            st = m.get('status')
            val_raw = m.get('value')
            num_val = 0
            try: num_val = float(val_raw)
            except: pass
            
            recaudado = 0
            if st == 'PAID':
                recaudado = num_val if num_val > 0 else rent
            elif st in ('PREAVISO', 'NEW_CONTRACT', 'NO_RENEW', 'AL_DIA', 'DELIVERY'):
                if num_val > 0:
                    recaudado = num_val
            
            comision = recaudado * 0.10
            admin_recaudado += recaudado
            contab_comision_sum += comision
            
    admin_comision = admin_recaudado * 0.10
    diff = admin_comision - contab_comision_sum
    grand_admin_com += admin_comision
    grand_contab_com += contab_comision_sum
    
    s_rec = f"${admin_recaudado:,.0f}"
    s_adm = f"${admin_comision:,.0f}"
    s_cnt = f"${contab_comision_sum:,.0f}"
    s_dif = f"${diff:+,.0f}"
    print(f"{m_name:<12} | {s_rec:<22} | {s_adm:<22} | {s_cnt:<22} | {s_dif}")

print("="*95)
print(f"YEAR CUMULATIVE ADMIN COMMISSION: ${grand_admin_com:,.0f}")
print(f"YEAR CUMULATIVE CONTABILIDAD COMMISSION: ${grand_contab_com:,.0f}")
print(f"YEAR DIFFERENCE: ${grand_admin_com - grand_contab_com:,.0f}")
