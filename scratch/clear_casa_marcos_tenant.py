import urllib.request, json

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

payload = {
    'action': 'saveAdminProperty',
    'propertyId': '10',
    'propertyNameOld': 'CASA MARCOS - GRANJAS',
    'name': 'CASA MARCOS - GRANJAS',
    'tenant_name': '',
    'tenant_phone': '',
    'monthly_rent': 1000000,
    'deposit': 0,
    'start_date': '',
    'duration': 12,
    'due_day': 5,
    'max_due_day': 10,
    'increase_notes': '',
    'damage_notes': ''
}

req = urllib.request.Request(
    post_url,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'text/plain'}
)
with urllib.request.urlopen(req) as resp:
    print("Response:", resp.read().decode('utf-8'))

print("CASA MARCOS - GRANJAS tenant_name cleared successfully in Drive!")
