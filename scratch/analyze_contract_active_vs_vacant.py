import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

print("=== DETAILED CONTRACT STATUS ANALYSIS ===")

# Properties with active tenant & active contract:
# They should show:
# - Payment amount (if paid e.g. 550000, 900000, 450000)
# - '-' during active contract months before preaviso
# - 'PREAVISO' on month before renewal
# - 'CONTRATO NUEVO' on renewal month

# Properties that are VACANT / UNRENTED (no tenant, or tenant left):
# - 'DESOCUPADO' on all vacant months

for p in props:
    row = p.get('excel_row')
    name = p.get('name')
    tenant = p.get('tenant_name')
    s_date = p.get('start_date')
    dur = p.get('duration')
    
    print(f"\nRow {row:<2} | {name:<32} | Tenant: '{tenant}' | Start: {s_date} | Dur: {dur}")
