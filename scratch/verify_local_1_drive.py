import requests, json

script_url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec"
resp = requests.get(script_url + "?action=getAdminData&t=999", timeout=35)
d = resp.json()
props = d.get("properties", [])
print("Total en Drive:", len(props))
local1 = [p for p in props if "LOCAL 1" in p.get("name","").upper()]
if local1:
    p = local1[0]
    print("LOCAL 1 ID:", p.get("id"), "| Rent:", p.get("monthly_rent"))
    py2026 = p.get("payments", {}).get("2026", [])
    for m in py2026:
        print(f"  {m['month']}: {m['status']} | {m['value']}")
else:
    print("LOCAL 1 no encontrado en Drive")
