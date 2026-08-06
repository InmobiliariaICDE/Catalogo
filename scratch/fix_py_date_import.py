with open("actualizar_admin.py", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("from datetime import datetime", "from datetime import datetime, date")

with open("actualizar_admin.py", "w", encoding="utf-8") as f:
    f.write(c)

print("Imported date in actualizar_admin.py!")
