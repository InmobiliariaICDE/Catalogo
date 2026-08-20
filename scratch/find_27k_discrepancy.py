import json

d = json.load(open('admin_data.json', encoding='utf-8'))
year = '2026'

print(f"{'Prop ID':<8} | {'Property Name':<32} | {'Rent':<10} | {'Month':<10} | {'Status':<12} | {'Val':<10} | {'KPI Com (10% val)':<18} | {'Contab Com (10% rent)':<20} | {'Diff'}")
print("="*145)

tot_kpi = 0
tot_contab = 0

for p in d['properties']:
    rent = float(p.get('monthly_rent') or 0)
    payments = p.get('payments', {}).get(year, [])
    for m in payments:
        st = m.get('status')
        val_raw = m.get('value')
        val = 0
        try:
            val = float(val_raw)
        except:
            if st == 'PAID':
                val = rent
        
        # KPI logic:
        kpi_paid_val = 0
        if st == 'PAID':
            kpi_paid_val = val if val > 0 else rent
        elif st in ('PREAVISO', 'NEW_CONTRACT', 'NO_RENEW', 'AL_DIA', 'DELIVERY'):
            if val > 0:
                kpi_paid_val = val

        kpi_com = kpi_paid_val * 0.10

        # Old Contabilidad logic:
        contab_com = 0
        if st == 'PAID':
            contab_com = rent * 0.10

        diff = kpi_com - contab_com
        if kpi_com > 0 or contab_com > 0:
            tot_kpi += kpi_com
            tot_contab += contab_com
            if diff != 0:
                print(f"{str(p.get('id')):<8} | {p.get('name','')[:32]:<32} | {rent:<10.0f} | {m.get('month'):<10} | {st:<12} | {str(val_raw):<10} | ${kpi_com:<17.0f} | ${contab_com:<19.0f} | ${diff:+.0f}")

print("="*145)
print(f"TOTAL KPI COMMISSION: ${tot_kpi:,.0f}")
print(f"TOTAL CONTABILIDAD COMMISSION: ${tot_contab:,.0f}")
print(f"DIFFERENCE: ${tot_kpi - tot_contab:,.0f}")
