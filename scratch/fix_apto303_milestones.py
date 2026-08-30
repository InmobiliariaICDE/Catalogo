import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

apto303 = None
for p in data['properties']:
    if '303' in p.get('name', ''):
        apto303 = p
        break

if apto303:
    print(f"APTO 303 found: Row {apto303.get('excel_row')} | ID: {apto303.get('id')} | Tenant: {apto303.get('tenant_name')} | Start: {apto303.get('start_date')} | Dur: {apto303.get('duration')}")

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

# Month indices for 2027: 5=JUNIO, 6=JULIO
p1 = {
    'action': 'saveAdminPayment',
    'propertyId': str(apto303.get('id')),
    'propertyName': apto303.get('name'),
    'year': '2027',
    'monthIndex': 5,
    'value': 'PREAVISO'
}

p2 = {
    'action': 'saveAdminPayment',
    'propertyId': str(apto303.get('id')),
    'propertyName': apto303.get('name'),
    'year': '2027',
    'monthIndex': 6,
    'value': 'CONTRATO NUEVO'
}

for payload in [p1, p2]:
    post_req = urllib.request.Request(
        post_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'text/plain'}
    )
    with urllib.request.urlopen(post_req) as post_resp:
        print(f"Update {payload['monthIndex']}:", post_resp.read().decode('utf-8'))

print("\nAPTO 303 milestones updated successfully!")
