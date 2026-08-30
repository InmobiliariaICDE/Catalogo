import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

props = data.get('properties', [])
print("=== CURRENT DRIVE PAYMENTS FOR 2026 ===")
for p in props:
    pname = p.get('name')
    pid = p.get('id')
    row = p.get('excel_row')
    pays = p.get('payments', {}).get('2026', [])
    pay_summary = ", ".join([f"{m['month'][:3]}:{m['value']}" for m in pays if m['value'] != '-'])
    print(f"ID {pid:<2} (Row {row:<2}) {pname:<32}: {pay_summary if pay_summary else 'ALL -'}")
