import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])

print("=== DETAILED PROPERTY CONTRACT END ANALYSIS ===")
for p in props:
    pid = p.get('id')
    row = p.get('excel_row')
    name = p.get('name')
    tenant = p.get('tenant_name')
    start = p.get('start_date')
    dur = p.get('duration')
    
    p2026 = [(m['month'], m['value']) for m in p.get('payments', {}).get('2026', [])]
    p2027 = [(m['month'], m['value']) for m in p.get('payments', {}).get('2027', [])]
    
    print(f"\nRow {row:<2} | {name:<32} | Tenant: '{tenant}' | Start: {start} | Dur: {dur}")
    print("   2026:", p2026)
    print("   2027:", p2027)
