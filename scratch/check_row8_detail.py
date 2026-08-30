import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

for p in data['properties']:
    print(f"Row {p.get('excel_row'):<2} | ID {p.get('id'):<2} | Name: '{p.get('name')}'")
    if p.get('excel_row') == 8 or '8' in str(p.get('excel_row')):
        print("   2027 payments:", p.get('payments', {}).get('2027'))
