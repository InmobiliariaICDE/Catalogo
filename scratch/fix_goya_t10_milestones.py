import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

goya_t10 = None
for p in data['properties']:
    if 'GOYA T-10' in p.get('name', '').upper() or ('GOYA' in p.get('name', '').upper() and '101' in p.get('name', '')):
        goya_t10 = p
        break

if goya_t10:
    print(f"GOYA T-10 APTO 101 found: Row {goya_t10.get('excel_row')} | ID: {goya_t10.get('id')} | Name: {goya_t10.get('name')} | Tenant: {goya_t10.get('tenant_name')} | Start: {goya_t10.get('start_date')} | Dur: {goya_t10.get('duration')}")

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

# Month indices for 2027: 5=JUNIO, 6=JULIO
p1 = {
    'action': 'saveAdminPayment',
    'propertyId': str(goya_t10.get('id')),
    'propertyName': goya_t10.get('name'),
    'year': '2027',
    'monthIndex': 5,
    'value': 'PREAVISO'
}

p2 = {
    'action': 'saveAdminPayment',
    'propertyId': str(goya_t10.get('id')),
    'propertyName': goya_t10.get('name'),
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

print("\nGOYA T-10 APTO 101 milestones updated successfully!")
