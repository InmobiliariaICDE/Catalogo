import urllib.request, json

ADMIN_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

req = urllib.request.Request(ADMIN_SCRIPT_URL + '?action=getAdminData')
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))

props = data.get('properties', [])
print("Total properties from Apps Script:", len(props))
for p in props[:10]:
    print(f"ID: '{p.get('id')}', excel_row: '{p.get('excel_row')}', name: '{p.get('name')}', tenant: '{p.get('tenant_name')}'")
