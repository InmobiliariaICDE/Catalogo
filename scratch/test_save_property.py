import urllib.request, json

ADMIN_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

print("1. Testing POST saveAdminProperty for ID '11' (APTO 101)...")
payloadProp = {
    'action': 'saveAdminProperty',
    'propertyId': '11',
    'propertyNameOld': 'APTO 101',
    'name': 'APTO 101',
    'tenant_name': 'Lizeth Natalia Vanegas López',
    'tenant_phone': '3001234567',
    'monthly_rent': 850000,
    'deposit': '500000',
    'start_date': '2026-07-26',
    'duration': '12',
    'due_day': 24,
    'max_due_day': 29,
    'increase_notes': 'Test increase',
    'damage_notes': 'Test damage'
}

try:
    req = urllib.request.Request(ADMIN_SCRIPT_URL, data=json.dumps(payloadProp).encode('utf-8'), headers={'Content-Type': 'text/plain'})
    with urllib.request.urlopen(req) as resp:
        print("saveAdminProperty Response:", resp.read().decode('utf-8'))
except Exception as e:
    print("saveAdminProperty Failed:", e)

print("\n2. Testing POST saveAdminPayment for ID '11' (APTO 101)...")
payloadPay = {
    'action': 'saveAdminPayment',
    'propertyId': '11',
    'propertyName': 'APTO 101',
    'year': '2026',
    'monthIndex': 6, # Julio
    'value': 850000
}

try:
    req = urllib.request.Request(ADMIN_SCRIPT_URL, data=json.dumps(payloadPay).encode('utf-8'), headers={'Content-Type': 'text/plain'})
    with urllib.request.urlopen(req) as resp:
        print("saveAdminPayment Response:", resp.read().decode('utf-8'))
except Exception as e:
    print("saveAdminPayment Failed:", e)
