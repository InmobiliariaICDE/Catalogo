import re

file_path = r'c:\Users\USUARIO\Documents\GitHub\Catalogo\crm_apps_script.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_func = r"""function deleteLeadFromSheet(id, phone) {
  Logger.log("Iniciando eliminación. ID recibido: '" + id + "', Celular recibido: '" + phone + "'");
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) {
    Logger.log("ERROR: No se encontró la hoja CRM_Leads");
    return createJsonResponse({ error: 'No se encontró CRM_Leads' });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse({ success: true, deletedCount: 0 });

  const cleanPhoneInput = String(phone || '').replace(/\D/g, '');
  const targetId = String(id || '').trim();

  if (!targetId && !cleanPhoneInput) {
    Logger.log("ERROR: ID y celular vacíos.");
    return createJsonResponse({ error: 'ID o teléfono requerido' });
  }

  const headerRow = data[0].map(h => String(h).trim());
  const idColIdx   = headerRow.findIndex(c => normalizeHeader(c) === normalizeHeader('ID'));
  const celColIdx  = headerRow.findIndex(c => normalizeHeader(c) === normalizeHeader('Celular'));
  const jsonColIdx = headerRow.findIndex(c => normalizeHeader(c) === normalizeHeader('Full_JSON'));

  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const rowId    = idColIdx  !== -1 ? String(data[i][idColIdx]  || '').trim()            : '';
    const rowPhone = celColIdx !== -1 ? String(data[i][celColIdx] || '').replace(/\D/g, '') : '';
    let jsonId = '';
    let jsonPhone = '';
    if (jsonColIdx !== -1 && data[i][jsonColIdx]) {
      try {
        const item = JSON.parse(data[i][jsonColIdx]);
        if (item) {
          jsonId = String(item.id || item.ID || '').trim();
          jsonPhone = String(item.celular || item.Celular || '').replace(/\D/g, '');
        }
      } catch(e) {}
    }

    let match = false;
    if (targetId && (rowId === targetId || jsonId === targetId)) {
      match = true;
    }
    if (cleanPhoneInput) {
      if (rowPhone === cleanPhoneInput || jsonPhone === cleanPhoneInput) {
        match = true;
      }
      if (cleanPhoneInput.length >= 7) {
        const last10Input = cleanPhoneInput.slice(-10);
        if (rowPhone.length >= 7 && rowPhone.slice(-10) === last10Input) match = true;
        if (jsonPhone.length >= 7 && jsonPhone.slice(-10) === last10Input) match = true;
      }
    }

    if (match) {
      Logger.log("Match encontrado en fila " + (i + 1) + " (ID: '" + rowId + "', Celular: '" + rowPhone + "'). Borrando fila...");
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  Logger.log("Eliminación completada. Total filas borradas: " + deletedCount);
  return createJsonResponse({ success: true, deletedCount: deletedCount });
}"""

pattern = r'function deleteLeadFromSheet\(id, phone\)\s*\{[\s\S]*?return createJsonResponse\(\{\s*success:\s*true,\s*deletedCount:\s*deletedCount\s*\}\);\s*\}'
new_content, count = re.subn(pattern, lambda m: new_func, content)
print(f"Replaced {count} occurrence(s).")
if count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("crm_apps_script.js updated successfully.")
else:
    print("FAILED to replace deleteLeadFromSheet.")
