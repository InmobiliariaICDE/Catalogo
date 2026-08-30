import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])
print(f'Total properties in Drive: {len(props)}')
for p in props:
    pid = p.get("id")
    row = p.get("excel_row")
    name = p.get("name")
    tenant = p.get("tenant_name")
    print(f'ID: {pid:<5} Row: {row:<5} Name: {name:<35} Tenant: {tenant}')
