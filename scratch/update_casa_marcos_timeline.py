import urllib.request, json

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

# CASA MARCOS - GRANJAS is Row 10 in sheet
# Active contract from Sept 2026 to Aug 2027 (12 months)

updates = [
    # 2026: Sept, Oct, Nov, Dec -> '-'
    {'year': '2026', 'monthIndex': 8, 'value': '-'}, # Septiembre
    {'year': '2026', 'monthIndex': 9, 'value': '-'}, # Octubre
    {'year': '2026', 'monthIndex': 10, 'value': '-'}, # Noviembre
    {'year': '2026', 'monthIndex': 11, 'value': '-'}, # Diciembre
    
    # 2027: Enero - Julio -> '-'
    {'year': '2027', 'monthIndex': 0, 'value': '-'}, # Enero
    {'year': '2027', 'monthIndex': 1, 'value': '-'}, # Febrero
    {'year': '2027', 'monthIndex': 2, 'value': '-'}, # Marzo
    {'year': '2027', 'monthIndex': 3, 'value': '-'}, # Abril
    {'year': '2027', 'monthIndex': 4, 'value': '-'}, # Mayo
    {'year': '2027', 'monthIndex': 5, 'value': '-'}, # Junio
    {'year': '2027', 'monthIndex': 6, 'value': '-'}, # Julio
    
    # 2027: Agosto -> PREAVISO
    {'year': '2027', 'monthIndex': 7, 'value': 'PREAVISO'}, # Agosto
    
    # 2027: Septiembre -> CONTRATO NUEVO
    {'year': '2027', 'monthIndex': 8, 'value': 'CONTRATO NUEVO'}, # Septiembre
    
    # 2027: Octubre, Noviembre, Diciembre -> DESOCUPADO
    {'year': '2027', 'monthIndex': 9, 'value': 'DESOCUPADO'}, # Octubre
    {'year': '2027', 'monthIndex': 10, 'value': 'DESOCUPADO'}, # Noviembre
    {'year': '2027', 'monthIndex': 11, 'value': 'DESOCUPADO'}, # Diciembre
]

print(f"Pushing {len(updates)} timeline updates for CASA MARCOS - GRANJAS (Row 10)...")
for u in updates:
    payload = {
        'action': 'saveAdminPayment',
        'propertyId': '10',
        'propertyName': 'CASA MARCOS - GRANJAS',
        'year': u['year'],
        'monthIndex': u['monthIndex'],
        'value': u['value']
    }
    req = urllib.request.Request(
        post_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'text/plain'}
    )
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        print(f"  {u['year']} month {u['monthIndex']} -> '{u['value']}' | Result: {res_data}")

print("COMPLETED PUSH TO GOOGLE DRIVE FOR CASA MARCOS!")
