/**
 * Google Apps Script para sincronización del CRM ICDE
 * 
 * Instrucciones:
 * 1. En tu Google Sheet, ve a Extensiones > Apps Script.
 * 2. Borra todo el código y pega este.
 * 3. Cambia 'Hoja1' por el nombre de tu hoja de propiedades si es necesario.
 * 4. Crea una hoja nueva llamada 'CRM_Leads' para guardar los clientes.
 * 5. Haz clic en 'Implementar' > 'Nueva implementación' > 'Aplicación web'.
 * 6. En 'Quién tiene acceso', elige 'Cualquiera'.
 * 7. Copia la URL generada y pégala en la variable CRM_SCRIPT_URL del archivo admin.html.
 */

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getData') {
    return getData();
  }
}

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  if (params.action === 'saveLead') {
    return saveLeadToSheet(JSON.parse(params.lead));
  }
}

function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Hoja1'); // Nombre de la hoja de propiedades
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const json = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveLeadToSheet(lead) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('CRM_Leads');
  
  if (!sheet) {
    sheet = ss.insertSheet('CRM_Leads');
    sheet.appendRow(['ID', 'Fecha', 'Nombre', 'Celular', 'Tipo', 'Inmobiliaria', 'Estado', 'Etiqueta', 'Notas']);
  }
  
  // Buscar si el lead ya existe para actualizarlo o agregarlo
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == lead.id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    lead.id,
    new Date().toISOString(),
    lead.nombre,
    lead.celular,
    lead.tipo,
    lead.nombreInmobiliaria || '',
    lead.estado,
    lead.etiqueta,
    lead.notas || ''
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
