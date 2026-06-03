/**
 * AGREGAR ESTO AL APPS SCRIPT DEL CRM (el que tiene la URL AKfycbzFUuzwKA...)
 * Buscar el bloque if(action === 'deleteLead') y agregar DESPUÉS:
 */

// ── En doPost(e), dentro del bloque de actions, AGREGAR: ──

if (action === 'deleteLeadByPhone') {
  var celular = params.celular ? String(params.celular).replace(/\D/g, '') : '';
  if (!celular) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: 'celular requerido'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var ss = SpreadsheetApp.openById(LEADS_SHEET_ID); // usa la variable correcta del sheet de leads
  var sheet = ss.getSheetByName('Leads') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Buscar columna de celular
  var celIdx = -1;
  for (var i = 0; i < headers.length; i++) {
    var hh = String(headers[i] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (hh === 'celular' || hh === 'telefono' || hh === 'cel' || hh === 'phone') {
      celIdx = i;
      break;
    }
  }
  
  if (celIdx === -1) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: 'Columna celular no encontrada'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var deletedCount = 0;
  // Recorrer desde abajo para borrar sin alterar índices
  for (var r = data.length - 1; r >= 1; r--) {
    var rowCel = String(data[r][celIdx] || '').replace(/\D/g, '');
    if (rowCel === celular) {
      sheet.deleteRow(r + 1); // +1 porque deleteRow es 1-indexed
      deletedCount++;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ok: true, deleted: deletedCount}))
    .setMimeType(ContentService.MimeType.JSON);
}
