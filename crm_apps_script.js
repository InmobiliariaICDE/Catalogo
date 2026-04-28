/**
 * Google Apps Script para sincronización del CRM ICDE
 * 
 * Versión 2.3 - Solución de errores de CORS y Autorización
 */

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'getData') {
      return getData();
    }
    if (action === 'getLeads') {
      return getLeads();
    }
    return createJsonResponse({error: 'Acción no válida'});
  } catch (err) {
    return createJsonResponse({error: err.toString()});
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (params.action === 'saveLead') {
      return saveLeadToSheet(JSON.parse(params.lead));
    }
    if (params.action === 'deleteLead') {
      return deleteLeadFromSheet(params.id);
    }
    return createJsonResponse({error: 'Acción no válida'});
  } catch (err) {
    return createJsonResponse({error: err.toString()});
  }
}

function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Hoja1') || ss.getSheetByName('Propiedades') || ss.getSheets()[0]; 
  
  if (!sheet) return createJsonResponse({error: 'No se encontró la hoja de propiedades'});

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const json = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = row[i];
    });
    return obj;
  });
  
  return createJsonResponse(json);
}

function getLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse([]);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const jsonIdx = headers.indexOf('Full_JSON');
  
  const leads = data.slice(1).map(row => {
    if (jsonIdx !== -1 && row[jsonIdx]) {
      try {
        return JSON.parse(row[jsonIdx]);
      } catch (e) {
        return { id: row[0], nombre: row[2], celular: row[3] };
      }
    }
    return {
      id: row[0],
      fecha: row[1],
      nombre: row[2],
      celular: row[3],
      tipo: row[4],
      estado: row[6],
      etiqueta: row[7],
      notas: row[8]
    };
  });
  
  return createJsonResponse(leads);
}

function saveLeadToSheet(lead) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('CRM_Leads');
  
  const headers = [
    'ID', 'Fecha Actualización', 'Nombre', 'Celular', 'Tipo', 
    'Inmobiliaria/Agente', 'Estado', 'Etiqueta', 'Notas', 
    'Preferencias (Filtros)', 'Método Pago', 'Frecuencia', 
    'Total Enviadas', 'Historial (Resumen)', 'Full_JSON'
  ];
  
  if (!sheet) {
    sheet = ss.insertSheet('CRM_Leads');
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    headers.forEach((h, i) => {
      if (currentHeaders.indexOf(h) === -1) {
        sheet.getRange(1, currentHeaders.length + 1).setValue(h);
        currentHeaders.push(h);
      }
    });
  }
  
  let filtrosTxt = "";
  if (lead.filtros) {
    const f = lead.filtros;
    const parts = [];
    if (f.tipoInmueble && f.tipoInmueble.length) parts.push("Tipos: " + f.tipoInmueble.join(", "));
    if (f.zona && f.zona.length) parts.push("Zonas: " + f.zona.join(", "));
    if (f.minPrice || f.maxPrice) parts.push("Precio: " + (f.minPrice || 0) + " - " + (f.maxPrice || "Max"));
    if (f.habitaciones && f.habitaciones.length) parts.push("Hab: " + f.habitaciones.join(", "));
    if (f.barrio && f.barrio.length) parts.push("Barrios: " + f.barrio.join(", "));
    filtrosTxt = parts.join(" | ");
  }

  const historialTxt = (lead.historialEnvios || []).map(h => h.fecha + " (" + (h.codigos || []).length + ")").join(" | ");

  const rowData = [
    lead.id,
    new Date().toISOString(), // Usar ISO para evitar problemas de codificación local en la respuesta
    lead.nombre,
    lead.celular,
    lead.tipo,
    (lead.nombreInmobiliaria || lead.nombreAgente || ''),
    lead.estado,
    lead.etiqueta,
    lead.notas || '',
    filtrosTxt,
    (lead.metodoPago || []).join(", "),
    lead.frecuencia,
    (lead.propsEnviadas || []).length,
    historialTxt,
    JSON.stringify(lead)
  ];
  
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == lead.id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return createJsonResponse({success: true});
}

/**
 * Elimina un lead de la hoja de cálculo por su ID
 */
function deleteLeadFromSheet(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse({error: 'No se encontró la hoja CRM_Leads'});
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    // Usamos == para comparación agnóstica de tipos (string vs number)
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({success: true});
    }
  }
  return createJsonResponse({success: false, error: 'Lead no encontrado'});
}

/**
 * Crea una respuesta JSON compatible con CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
