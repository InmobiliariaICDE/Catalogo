import urllib.request, json

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

# HABITACION AZUL is ID 8 (Row 8 in Sheet)
# New active contract: Start date 2026-10-01, duration 8 months (Oct 2026 to May 2027)

updates = [
    # 2026: Octubre, Noviembre, Diciembre -> '-'
    {'year': '2026', 'monthIndex': 9, 'value': '-'},  # Octubre
    {'year': '2026', 'monthIndex': 10, 'value': '-'}, # Noviembre
    {'year': '2026', 'monthIndex': 11, 'value': '-'}, # Diciembre
    
    # 2027: Enero - Abril -> '-'
    {'year': '2027', 'monthIndex': 0, 'value': '-'}, # Enero
    {'year': '2027', 'monthIndex': 1, 'value': '-'}, # Febrero
    {'year': '2027', 'monthIndex': 2, 'value': '-'}, # Marzo
    {'year': '2027', 'monthIndex': 3, 'value': '-'}, # Abril
    
    # 2027: Mayo -> PREAVISO (Month 8 of 8)
    {'year': '2027', 'monthIndex': 4, 'value': 'PREAVISO'}, # Mayo
    
    # 2027: Junio -> CONTRATO NUEVO (Month of renewal)
    {'year': '2027', 'monthIndex': 5, 'value': 'CONTRATO NUEVO'}, # Junio
    
    # 2027: Julio onwards -> DESOCUPADO
    {'year': '2027', 'monthIndex': 6, 'value': 'DESOCUPADO'}, # Julio
    {'year': '2027', 'monthIndex': 7, 'value': 'DESOCUPADO'}, # Agosto
    {'year': '2027', 'monthIndex': 8, 'value': 'DESOCUPADO'}, # Septiembre
    {'year': '2027', 'monthIndex': 9, 'value': 'DESOCUPADO'}, # Octubre
    {'year': '2027', 'monthIndex': 10, 'value': 'DESOCUPADO'}, # Noviembre
    {'year': '2027', 'monthIndex': 11, 'value': 'DESOCUPADO'}, # Diciembre
]

print(f"Pushing timeline updates for HABITACION AZUL (ID 8)...")
for u in updates:
    payload = {
        'action': 'saveAdminPayment',
        'propertyId': '8',
        'propertyName': 'HABITACION AZUL',
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

print("COMPLETED PUSH TO GOOGLE DRIVE FOR HABITACION AZUL!")
