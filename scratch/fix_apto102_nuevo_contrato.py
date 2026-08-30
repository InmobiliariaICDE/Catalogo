import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

apto102 = None
for p in data['properties']:
    if '102' in p.get('name', '') and 'GOYA' not in p.get('name', '').upper() and 'LILOLA' not in p.get('name', '').upper():
        apto102 = p
        break

if apto102:
    print(f"APTO 102 found: Row {apto102.get('excel_row')} | ID: {apto102.get('id')} | Name: {apto102.get('name')} | Tenant: {apto102.get('tenant_name')} | Start: {apto102.get('start_date')} | Dur: {apto102.get('duration')}")

post_url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

# Month index 0 for 2027 = ENERO
payload = {
    'action': 'saveAdminPayment',
    'propertyId': str(apto102.get('id')),
    'propertyName': apto102.get('name'),
    'year': '2027',
    'monthIndex': 0,
    'value': 'CONTRATO NUEVO'
}

post_req = urllib.request.Request(
    post_url,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'text/plain'}
)
with urllib.request.urlopen(post_req) as post_resp:
    print("Response:", post_resp.read().decode('utf-8'))

print("\nAPTO 102 ENERO 2027 set to CONTRATO NUEVO successfully!")
