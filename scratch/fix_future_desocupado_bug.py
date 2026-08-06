import os, re

# 1. Update admin.html
admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove line 9774-9777 override:
# if (pay.status === 'PENDING' && p.status === 'Desocupado') { pay = { ...pay, status: 'VACANT' }; }
old_override = """                  // Si la propiedad está desocupada y el status quedó PENDING, mostrar VACANT
                  if (pay.status === 'PENDING' && p.status === 'Desocupado') {
                    pay = { ...pay, status: 'VACANT' };
                  }"""

if old_override in content:
    content = content.replace(old_override, "")
    print("Removed legacy PENDING->VACANT override from matrix render in admin.html!")
else:
    print("WARNING: old_override not found in admin.html")

# Fix finalValue assignment in admin.html
old_final_val_1 = "} else if (status === 'VACANT' || status === 'FUTURE') { finalValue = 'DESOCUPADO'; }"
new_final_val_1 = "} else if (status === 'VACANT') { finalValue = 'DESOCUPADO'; }\n  else if (status === 'FUTURE' || status === 'AL_DIA') { finalValue = '-'; }"

if old_final_val_1 in content:
    content = content.replace(old_final_val_1, new_final_val_1)
    print("Fixed status === 'FUTURE' finalValue assignment in admin.html!")
else:
    print("WARNING: old_final_val_1 not found in admin.html")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Check and clean up m.value = '-' for FUTURE cells in nuevo_admin_apps_script.js, crm_apps_script.js, actualizar_admin.py
for fname in ["nuevo_admin_apps_script.js", "crm_apps_script.js"]:
    with open(fname, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace("else if (status === 'VACANT' || status === 'FUTURE') { finalValue = 'DESOCUPADO'; }",
                  "else if (status === 'VACANT') { finalValue = 'DESOCUPADO'; }\n  else if (status === 'FUTURE' || status === 'AL_DIA') { finalValue = '-'; }")
    with open(fname, "w", encoding="utf-8") as f:
        f.write(c)

print("Done fixing FUTURE status values!")
