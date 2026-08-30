import requests

url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec?action=getAdminData"
res = requests.get(url, timeout=15)
print("HTTP Status:", res.status_code)
data = res.json()

props = data.get('properties', [])
print(f"Apps Script getAdminData returned {len(props)} properties:")
for i, p in enumerate(props):
    print(f" {i+1:2d}. ID: {str(p.get('id')):<4} | Name: {p.get('name'):<38} | Owner: {p.get('owner')}")
