import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

for p in data['properties']:
    if 'MARCOS' in p.get('name', '').upper():
        print(f"Row {p.get('excel_row')} | ID {p.get('id')} | Name: '{p.get('name')}' | Tenant: '{p.get('tenant_name')}' | Start: {p.get('start_date')}")
        print("   2026 payments:", [(m['month'], m['value']) for m in p.get('payments', {}).get('2026', [])])
        print("   2027 payments:", [(m['month'], m['value']) for m in p.get('payments', {}).get('2027', [])])
