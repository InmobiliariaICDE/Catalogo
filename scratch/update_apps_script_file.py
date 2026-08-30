with open('nuevo_admin_apps_script.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      sheet.getRange(rowIdx + 1, 10).setValue(p.tenant_name || ''); // Inquilino (Col J)
      sheet.getRange(rowIdx + 1, 11).setValue(p.tenant_phone || ''); // Celular Inquilino (Col K)"""

replacement = """      if (p.tenant_name && p.tenant_name.trim() !== '') {
        sheet.getRange(rowIdx + 1, 10).setValue(p.tenant_name); // Inquilino (Col J)
      }
      if (p.tenant_phone && p.tenant_phone.trim() !== '') {
        sheet.getRange(rowIdx + 1, 11).setValue(p.tenant_phone); // Celular Inquilino (Col K)
      }"""

assert target in content, "Target code not found in nuevo_admin_apps_script.js"

content = content.replace(target, replacement)

with open('nuevo_admin_apps_script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Updated nuevo_admin_apps_script.js!")
