import sys, json
sys.stdout.reconfigure(encoding='utf-8')

# Read
with open('citas.json','r',encoding='utf-16') as f:
    citas = json.load(f)

# Update solicito_visita dates to this week (2026-09-22 and 2026-09-23) with hours
today_dates = ['2026-09-22', '2026-09-23']
hours = ['10:00', '14:00']
sv_idx = 0
for c in citas:
    if c.get('estado') == 'solicito_visita':
        c['fecha'] = today_dates[sv_idx % len(today_dates)]
        c['hora'] = hours[sv_idx % len(hours)]
        print(f"Updated: {c.get('cliente')} -> {c['fecha']} {c['hora']}")
        sv_idx += 1

with open('citas.json','w',encoding='utf-16') as f:
    json.dump(citas, f, ensure_ascii=False, indent=2)
print(f"Saved. Total citas: {len(citas)}")
