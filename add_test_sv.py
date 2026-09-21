import sys, json, time
sys.stdout.reconfigure(encoding='utf-8')

with open('citas.json','r',encoding='utf-16') as f:
    citas = json.load(f)

# Add a test solicito_visita for TODAY (2026-09-21) and TOMORROW
test_citas = [
    {
        "id": int(time.time() * 1000),
        "codigo": 520,
        "fecha": "2026-09-21",
        "hora": "11:00",
        "estado": "solicito_visita",
        "oferto": "no",
        "oferta": "",
        "notas": "El cliente solicito ver el inmueble esta semana",
        "cliente": "Maria Garcia (Prueba)",
        "celular": "3101234567",
        "observaciones": "",
        "leadId": "",
        "updatedAt": int(time.time() * 1000),
        "creadoEn": "2026-09-21T20:00:00.000Z"
    },
    {
        "id": int(time.time() * 1000) + 1,
        "codigo": 1373,
        "fecha": "2026-09-22",
        "hora": "15:00",
        "estado": "solicito_visita",
        "oferto": "no",
        "oferta": "",
        "notas": "Interesado urgente",
        "cliente": "Juan Lopez (Prueba)",
        "celular": "3209876543",
        "observaciones": "",
        "leadId": "",
        "updatedAt": int(time.time() * 1000) + 1,
        "creadoEn": "2026-09-21T20:00:00.000Z"
    }
]

# Remove old Paola solicito_visita and add new test ones
citas = [c for c in citas if c.get('estado') != 'solicito_visita']
citas.extend(test_citas)

with open('citas.json','w',encoding='utf-16') as f:
    json.dump(citas, f, ensure_ascii=False, indent=2)

sv = [c for c in citas if c.get('estado') == 'solicito_visita']
print(f"Total citas: {len(citas)}")
print(f"solicito_visita: {len(sv)}")
for c in sv:
    print(f"  {c['fecha']} {c['hora']} - {c['cliente']}")
