with open("actualizar_admin.py", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("if start_date_str:", "if start_date:\n            start_date_str = str(start_date)")
with open("actualizar_admin.py", "w", encoding="utf-8") as f:
    f.write(c)

print("Fixed start_date in actualizar_admin.py!")
