import json, requests

with open("recovered_local_1.json", encoding="utf-8") as f:
    local_1 = json.load(f)

script_url = "https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec"

property_id = "24"
property_name = "LOCAL 1"

payments = local_1.get("payments", {})
success_count = 0
fail_count = 0

for yr, m_list in payments.items():
    for m_idx, m_obj in enumerate(m_list):
        st = m_obj.get("status")
        val = m_obj.get("value")
        month_name = m_obj.get("month", "")
        # Restore all payments that have actual values (PAID or VACANT markers)
        if val and str(val) not in ("-", ""):
            payload = {
                "action": "saveAdminPayment",
                "propertyId": property_id,
                "propertyName": property_name,
                "year": int(yr),
                "monthIndex": m_idx,
                "value": val,
                "status": st
            }
            try:
                resp = requests.post(script_url, json=payload, timeout=25, headers={"Content-Type": "application/json"})
                r = resp.json()
                if r.get("success"):
                    success_count += 1
                    print(f"OK {yr}/{month_name}: {val}")
                else:
                    print(f"FAIL {yr}/{month_name}: {r}")
                    fail_count += 1
            except Exception as e:
                print(f"Error {yr}/{m_idx}: {e}")
                fail_count += 1

print(f"\nDone! {success_count} payments restored, {fail_count} failed.")
