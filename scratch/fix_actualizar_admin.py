file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\actualizar_admin.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the hardcoded check for May 2026
old_python_block = """        # Overall status is usually Occupied, unless latest May 2026 status is VACANT
        overall_status = "Ocupado"
        if "DESOCUPAD" in raw_name.upper():
            overall_status = "Desocupado"
        else:
            # Check May 2026 payment status
            may_2026_pay = payments_history["2026"][4] # index 4 is May
            if may_2026_pay["status"] == "VACANT":
                overall_status = "Desocupado\""""

new_python_block = """        # Overall status is usually Occupied, unless latest current month status is VACANT
        overall_status = "Ocupado"
        if "DESOCUPAD" in raw_name.upper():
            overall_status = "Desocupado"
        else:
            # Check current month payment status
            from datetime import datetime
            _today = datetime.now()
            _curr_year_str = str(_today.year)
            _curr_month_idx = _today.month - 1
            if _curr_year_str in payments_history and len(payments_history[_curr_year_str]) > _curr_month_idx:
                _curr_pay = payments_history[_curr_year_str][_curr_month_idx]
                if _curr_pay["status"] == "VACANT":
                    overall_status = "Desocupado\""""

content = content.replace(old_python_block, new_python_block)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
