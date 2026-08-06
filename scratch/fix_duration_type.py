with open("actualizar_admin.py", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("duration_m = duration if (duration and duration > 0) else 12",
              "try:\n            duration_m = int(float(duration)) if (duration and str(duration).strip() != '') else 12\n        except Exception:\n            duration_m = 12")

with open("actualizar_admin.py", "w", encoding="utf-8") as f:
    f.write(c)

print("Fixed duration parsing in actualizar_admin.py!")
