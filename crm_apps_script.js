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
    if (action === 'getCitas') {
      return getCitas();
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
    if (params.action === 'saveCita') {
      return saveCitaToSheet(JSON.parse(params.cita));
    }
    if (params.action === 'saveProperty') {
      return savePropertyToSheet(JSON.parse(params.property));
    }
    return createJsonResponse({error: 'Acción no válida'});
  } catch (err) {
    return createJsonResponse({error: err.toString()});
  }
}


function getCitas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('CRM_Citas');
  if (!sheet) return createJsonResponse([]);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const citas = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  
  return createJsonResponse(citas);
}

function saveCitaToSheet(cita) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('CRM_Citas');
  
  const headers = ['id', 'codigo', 'fecha', 'hora', 'estado', 'oferto', 'oferta', 'notas', 'cliente', 'celular', 'inmobiliaria'];
  
  if (!sheet) {
    sheet = ss.insertSheet('CRM_Citas');
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  
  const rowData = headers.map(h => cita[h] || '');
  
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  if (cita.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == cita.id) {
        rowIndex = i + 1;
        break;
      }
    }
  }
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return createJsonResponse({success: true});
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
 * Guarda o actualiza una propiedad en la hoja principal
 */
function savePropertyToSheet(prop) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Hoja1') || ss.getSheetByName('Propiedades') || ss.getSheets()[0];
  if (!sheet) return createJsonResponse({error: 'No se encontró la hoja de propiedades'});

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Encontrar columna de código de forma flexible
  const codIdx = headers.findIndex(h => {
    const nk = String(h || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return nk === 'codigo' || nk === 'cdigo' || nk === 'cod' || nk === 'id';
  });

  if (codIdx === -1) return createJsonResponse({error: 'No se encontró columna de código en el Excel'});

  // Mapeo de campos de admin.html a los encabezados del Excel
  const rowData = headers.map(h => {
    const nk = String(h || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    if (nk === 'codigo' || nk === 'cdigo' || nk === 'cod' || nk === 'id') return prop['Código'] || '';
    if (nk === 'nombre' || nk === 'titulo' || nk === 'propiedad') return prop['Nombre'] || '';
    if (nk.includes('precio') && !nk.includes('rango') && !nk.includes('administracion')) return prop['Precio'] || '';
    if (nk === 'tipo' || nk === 'tipo de inmueble' || nk === 'clase') return prop['Tipo de inmueble'] || '';
    if (nk === 'zona' || nk === 'sector') return prop['Zona'] || '';
    if (nk === 'barrio') return prop['Barrio'] || '';
    if (nk.includes('ubicaci') || nk === 'direccion') return prop['Ubicación'] || '';
    if (nk.includes('habitaci') || nk === 'alcobas' || nk === 'cuartos') return prop['Habitaciones'] || '';
    if (nk.includes('bano') || nk === 'sanitarios') return prop['Baños'] || '';
    if (nk.includes('garaje') || nk.includes('parquea')) return prop['Garaje'] || '';
    if (nk.includes('area') || nk === 'mt2' || nk === 'superficie') return prop['Área'] || '';
    if (nk.includes('latitud') || nk === 'lat') return prop['Latitud'] || '';
    if (nk.includes('longitud') || nk === 'lng' || nk === 'lon') return prop['Longitud'] || '';
    if (nk.includes('inmobiliaria') || nk.includes('inmob') || nk === 'aliado') return prop['Inmobiliaria'] || '';
    if (nk.includes('descrip') || nk === 'detalle') return prop['Descripción'] || '';
    if (nk.includes('imagen') || nk.includes('foto') || nk === 'galeria') return prop['Imagenes'] || '';
    
    // Fallback: buscar coincidencia exacta en el objeto prop
    return prop[h] !== undefined ? prop[h] : '';
  });

  let rowIndex = -1;
  const targetCod = String(prop['Código']).trim();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][codIdx]).trim() === targetCod) {
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
 * Crea una respuesta JSON compatible con CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
