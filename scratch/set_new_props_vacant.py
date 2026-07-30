import os

# 1. Update admin.html
admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

old_html = """        let isVacantWave = false;
        let dynamicOverallStatus = 'Ocupado';
        if (p.name && String(p.name).toUpperCase().includes('DESOCUPAD')) {
          isVacantWave = true;
          dynamicOverallStatus = 'Desocupado';
        }"""

new_html = """        let hasAnyPaymentOrActiveContract = false;
        chronologicalMonths.forEach(item => {
          const m = item.cell;
          const valUpper = String(m.value).trim().toUpperCase();
          const numVal = parseFloat(m.value);
          if ((!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO')) {
            hasAnyPaymentOrActiveContract = true;
          }
        });

        let isVacantWave = false;
        let dynamicOverallStatus = 'Ocupado';
        if ((p.name && String(p.name).toUpperCase().includes('DESOCUPAD')) || !p.tenant_name || String(p.tenant_name).trim() === '' || !hasAnyPaymentOrActiveContract) {
          isVacantWave = true;
          dynamicOverallStatus = 'Desocupado';
        }"""

if old_html in content:
    content = content.replace(old_html, new_html)
    print("Updated admin.html!")
else:
    print("WARNING: old_html not found in admin.html")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)


# 2. Update nuevo_admin_apps_script.js
nuevo_path = "nuevo_admin_apps_script.js"
with open(nuevo_path, "r", encoding="utf-8") as f:
    content = f.read()

old_nuevo = """    let isVacantWave = false;
    let overallStatus = 'Ocupado';
    if (rawName.toUpperCase().includes('DESOCUPAD')) {
      isVacantWave = true;
      overallStatus = 'Desocupado';
    }"""

new_nuevo = """    let hasAnyPaymentOrActiveContract = false;
    chronologicalMonths.forEach(item => {
      const m = item.cell;
      const valUpper = String(m.value).trim().toUpperCase();
      const numVal = parseFloat(m.value);
      if ((!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO')) {
        hasAnyPaymentOrActiveContract = true;
      }
    });

    let isVacantWave = false;
    let overallStatus = 'Ocupado';
    if (rawName.toUpperCase().includes('DESOCUPAD') || !tenantName || String(tenantName).trim() === '' || !hasAnyPaymentOrActiveContract) {
      isVacantWave = true;
      overallStatus = 'Desocupado';
    }"""

if old_nuevo in content:
    content = content.replace(old_nuevo, new_nuevo)
    print("Updated nuevo_admin_apps_script.js getAdminData!")
else:
    print("WARNING: old_nuevo not found in nuevo_admin_apps_script.js")

old_nuevo_save = """    for (let c = 17; c < totalCols; c++) {
      const headerVal = String(values[4][c] || '').trim();
      if (headerVal && headerVal !== 'None' && headerVal !== '') {
        newRowValues[c] = '-';
      } else {
        newRowValues[c] = '';
      }
    }"""

new_nuevo_save = """    for (let c = 17; c < totalCols; c++) {
      const headerVal = String(values[4][c] || '').trim();
      if (headerVal && headerVal !== 'None' && headerVal !== '') {
        newRowValues[c] = 'DESOCUPADO';
      } else {
        newRowValues[c] = '';
      }
    }"""

if old_nuevo_save in content:
    content = content.replace(old_nuevo_save, new_nuevo_save)
    print("Updated nuevo_admin_apps_script.js saveAdminPropertyToSheet!")
else:
    print("WARNING: old_nuevo_save not found in nuevo_admin_apps_script.js")

with open(nuevo_path, "w", encoding="utf-8") as f:
    f.write(content)


# 3. Update crm_apps_script.js
crm_path = "crm_apps_script.js"
with open(crm_path, "r", encoding="utf-8") as f:
    content = f.read()

if old_nuevo in content:
    content = content.replace(old_nuevo, new_nuevo)
    print("Updated crm_apps_script.js getAdminData!")
else:
    print("WARNING: old_nuevo not found in crm_apps_script.js")

if old_nuevo_save in content:
    content = content.replace(old_nuevo_save, new_nuevo_save)
    print("Updated crm_apps_script.js saveAdminPropertyToSheet!")
else:
    print("WARNING: old_nuevo_save not found in crm_apps_script.js")

with open(crm_path, "w", encoding="utf-8") as f:
    f.write(content)


# 4. Update actualizar_admin.py
py_path = "actualizar_admin.py"
with open(py_path, "r", encoding="utf-8") as f:
    content = f.read()

old_py = """        is_vacant_wave = False
        overall_status = "Ocupado"
        if "DESOCUPAD" in raw_name.upper():
            is_vacant_wave = True
            overall_status = "Desocupado\""""

new_py = """        has_any_payment_or_contract = False
        for item in months_order:
            m = item["cell"]
            val_upper = str(m["value"]).strip().upper()
            try:
                num_val = float(m["value"])
            except (ValueError, TypeError):
                num_val = 0
            if num_val > 0 or m["status"] in ("PAID", "NEW_CONTRACT") or "CONTRATO" in val_upper or "NUEVO" in val_upper:
                has_any_payment_or_contract = True

        is_vacant_wave = False
        overall_status = "Ocupado"
        if "DESOCUPAD" in raw_name.upper() or not tenant_name or not str(tenant_name).strip() or not has_any_payment_or_contract:
            is_vacant_wave = True
            overall_status = "Desocupado\""""

if old_py in content:
    content = content.replace(old_py, new_py)
    print("Updated actualizar_admin.py!")
else:
    print("WARNING: old_py not found in actualizar_admin.py")

with open(py_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done updating all files!")
