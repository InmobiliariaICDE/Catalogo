import requests

url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData"
res = requests.get(url, timeout=15)
data = res.json()

props = data.get('properties', [])
print(f"Total properties in Google Sheet ({len(props)}):")
for i, p in enumerate(props):
    print(f" Fila {p.get('excel_row', '?'):<3} | ID {str(p.get('id')):<4} | Name: {p.get('name'):<38} | Owner: {p.get('owner')}")
