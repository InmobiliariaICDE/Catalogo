import json, requests

# Read LOCAL 1 from recovered file
with open("recovered_local_1.json", encoding="utf-8") as f:
    local_1 = json.load(f)

local_1["id"] = "24"
local_1["excel_row"] = 24

script_url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec"

# Send each PAID payment directly to the sheet cell
months_names = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"]
property_id = "24"
property_name = "LOCAL 1"

success_count = 0
fail_count = 0
for yr, m_list in local_1.get("payments", {}).items():
    for m_idx, m_obj in enumerate(m_list):
        val = m_obj.get("value")
        st = m_obj.get("status")
        if val and str(val) not in ("-", "") and st == "PAID":
            payload = {
                "action": "saveAdminPayment",
                "propertyId": property_id,
                "propertyName": property_name,
                "year": int(yr),
                "monthIndex": m_idx,
                "value": val,
                "status": "PAID"
            }
            try:
                resp = requests.post(script_url, json=payload, timeout=30, headers={"Content-Type": "application/json"})
                r = resp.json()
                if r.get("success"):
                    success_count += 1
                else:
                    print(f"FAIL {yr}/{m_obj.get('month')}: {r}")
                    fail_count += 1
            except Exception as e:
                print(f"Error {yr}/{m_idx}: {e}")
                fail_count += 1

print(f"Done! {success_count} paid months restored, {fail_count} failed.")
