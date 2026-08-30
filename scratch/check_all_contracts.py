import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])
print("=== CONTRACT RENEWAL SCHEDULE IN DRIVE ===")
for p in props:
    name = p.get('name')
    row = p.get('excel_row')
    start_date = p.get('start_date')
    duration = p.get('duration')
    tenant = p.get('tenant_name')
    print(f"Row {row:<2} | {name:<32} | Start: {str(start_date):<12} | Dur: {str(duration):<3} | Tenant: {str(tenant)}")
