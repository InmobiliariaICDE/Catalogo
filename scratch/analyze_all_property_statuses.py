import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

print("=== ALL 22 PROPERTIES STATUS & TENANT ANALYSIS ===")
for p in props:
    row = p.get('excel_row')
    name = p.get('name')
    tenant = p.get('tenant_name')
    rent = p.get('monthly_rent')
    start = p.get('start_date')
    dur = p.get('duration')
    
    # Check 2026 and 2027 payment sample values
    p2026 = [m['value'] for m in p.get('payments', {}).get('2026', [])]
    p2027 = [m['value'] for m in p.get('payments', {}).get('2027', [])]
    
    print(f"\nRow {row:<2} | {name:<32}")
    print(f"       Tenant: '{tenant}' | Rent: {rent} | Start: {start} | Dur: {dur}")
    print(f"       2026 values: {p2026}")
    print(f"       2027 values: {p2027}")
