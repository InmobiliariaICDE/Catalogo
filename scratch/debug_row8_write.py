import urllib.request, json

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

for m_idx in range(12):
    payload = {
        'action': 'saveAdminPayment',
        'propertyId': '8',
        'propertyName': 'HABITACION AZUL',
        'year': '2027',
        'monthIndex': m_idx,
        'value': 'DESOCUPADO'
    }
    req = urllib.request.Request(
        post_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'text/plain'}
    )
    with urllib.request.urlopen(req) as resp:
        print(f"Month {m_idx}:", resp.read().decode('utf-8'))
