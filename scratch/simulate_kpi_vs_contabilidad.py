import json

d = json.load(open('admin_data.json', encoding='utf-8'))

months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]

print(f"{'Month':<12} | {'KPI Recaudado':<16} | {'KPI Comis (10%)':<18} | {'Contab Auto-Admin Comis':<24} | {'Diff'}")
print("="*88)

for m_idx, m_name in enumerate(months):
    total_esperado = 0
    total_recaudado = 0
    contab_comis = 0
    
    for p in d['properties']:
        rent = float(p.get('monthly_rent') or 0)
        payments = p.get('payments', {}).get('2026', [])
        payment_month = next((x for x in payments if x.get('month') == m_name), None)
        
        if payment_month:
            st = payment_month.get('status')
            val_raw = payment_month.get('value')
            val = 0
            try: val = float(val_raw)
            except: pass
            
            # KPI logic (from line 10702 in admin.html):
            if st == 'PAID':
                total_esperado += rent
                total_recaudado += val if val > 0 else rent
            elif st == 'PENDING':
                total_esperado += rent
            elif st in ('PREAVISO', 'NEW_CONTRACT', 'NO_RENEW', 'AL_DIA'):
                total_esperado += rent
                if val > 0: total_recaudado += val
            elif st == 'DELIVERY':
                if val > 0: total_recaudado += val

            # Contabilidad logic (from line 16704 in admin.html):
            if st == 'PAID':
                com_val = rent * 0.10
                if com_val > 0:
                    contab_comis += com_val

    kpi_comis = total_recaudado * 0.10
    diff = kpi_comis - contab_comis
    str_rec = f"${total_recaudado:,.0f}"
    str_kpi = f"${kpi_comis:,.0f}"
    str_cnt = f"${contab_comis:,.0f}"
    str_dif = f"${diff:+,.0f}"
    print(f"{m_name:<12} | {str_rec:<16} | {str_kpi:<18} | {str_cnt:<24} | {str_dif}")
