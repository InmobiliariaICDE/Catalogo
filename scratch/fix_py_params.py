with open("actualizar_admin.py", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("""    # 2. Check if the contract had not started yet
    if start_date:
        start_date_str = str(start_date)
        try:""",
"""    # 2. Check if the contract had not started yet
    if start_date_str:
        try:""")

with open("actualizar_admin.py", "w", encoding="utf-8") as f:
    f.write(c)

print("Fixed get_month_status in actualizar_admin.py!")
