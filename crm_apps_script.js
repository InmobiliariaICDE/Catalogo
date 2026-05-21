/**
 * Google Apps Script para sincronización del CRM ICDE
 * 
 * Versión 2.4 - Corrección apertura por ID para Web App desplegado
 */

// ID del Google Sheet que contiene los datos del CRM y Administración
const SPREADSHEET_ID = '1aMucFmmKbvA0HRONGfDGwHIPTEgf1dBx';

/**
 * Función central que abre el Spreadsheet por ID.
 * NUNCA usar getActiveSpreadsheet() en un Web App desplegado —
 * siempre retorna null fuera del contexto del editor.
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

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
    if (action === 'getLeadName') {
      return getLeadName(e.parameter.leadId);
    }
    if (action === 'saveFeedback') {
      return saveLeadFeedback(e.parameter.leadId, e.parameter.cod, e.parameter.type, e.parameter.comment);
    }
    if (action === 'getAdminData') {
      return getAdminData();
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
    if (params.action === 'saveFeedback') {
      return saveLeadFeedback(params.leadId, params.cod, params.type, params.comment);
    }
    if (params.action === 'saveAdminPayment') {
      return saveAdminPaymentToSheet(params);
    }
    return createJsonResponse({error: 'Acción no válida'});
  } catch (err) {
    return createJsonResponse({error: err.toString()});
  }
}


function getCitas() {
  const ss = getSpreadsheet();
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
  const ss = getSpreadsheet();
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
  const ss = getSpreadsheet();
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
  const ss = getSpreadsheet();
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
  const ss = getSpreadsheet();
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
  const ss = getSpreadsheet();
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
  const ss = getSpreadsheet();
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

/**
 * Obtiene el nombre del lead por su ID de manera segura para el saludo del cliente
 */
function getLeadName(leadId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse({error: 'Hoja CRM_Leads no encontrada'});
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jsonIdx = headers.indexOf('Full_JSON');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == leadId) {
      let feedback = {};
      if (jsonIdx !== -1 && data[i][jsonIdx]) {
        try {
          const lead = JSON.parse(data[i][jsonIdx]);
          feedback = lead.feedback || {};
        } catch(e) {}
      }
      return createJsonResponse({
        nombre: data[i][2] || 'Cliente',
        feedback: feedback
      });
    }
  }
  return createJsonResponse({nombre: 'Cliente', feedback: {}});
}

/**
 * Guarda el feedback (likes, dislikes, comentarios) del cliente
 */
function saveLeadFeedback(leadId, cod, type, comment) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse({error: 'Hoja CRM_Leads no encontrada'});
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jsonIdx = headers.indexOf('Full_JSON');
  const notasIdx = headers.indexOf('Notas');
  
  if (jsonIdx === -1) return createJsonResponse({error: 'Columna Full_JSON no encontrada'});
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == leadId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) return createJsonResponse({error: 'Lead no encontrado'});
  
  // Leer y parsear lead JSON
  let lead = {};
  const jsonVal = sheet.getRange(rowIndex, jsonIdx + 1).getValue();
  if (jsonVal) {
    try {
      lead = JSON.parse(jsonVal);
    } catch (e) {
      lead = { id: leadId, nombre: data[rowIndex-1][2], celular: data[rowIndex-1][3] };
    }
  }
  
  // Inicializar estructura de feedback en el objeto lead
  if (!lead.feedback) lead.feedback = {};
  if (!lead.feedback[cod]) lead.feedback[cod] = {};
  
  const fechaStr = new Date().toISOString().split('T')[0];
  let logMsg = "";
  
  if (type === 'like') {
    lead.feedback[cod].interes = 'LIKE';
    logMsg = `[Co-Creación: Código ${cod} -> ❤️ Me Interesa! (${fechaStr})]`;
  } else if (type === 'dislike') {
    lead.feedback[cod].interes = 'DISLIKE';
    logMsg = `[Co-Creación: Código ${cod} -> 👎 Descartada (${fechaStr})]`;
  } else if (type === 'comment') {
    lead.feedback[cod].comentario = comment || '';
    logMsg = `[Co-Creación: Comentario sobre ${cod} -> "${comment}" (${fechaStr})]`;
  }
  lead.feedback[cod].fecha = fechaStr;
  
  // Guardar JSON actualizado
  sheet.getRange(rowIndex, jsonIdx + 1).setValue(JSON.stringify(lead));
  
  // Opcional: registrar en la columna de Notas para visibilidad rápida
  if (notasIdx !== -1) {
    let currentNotas = String(sheet.getRange(rowIndex, notasIdx + 1).getValue() || '');
    if (currentNotas) {
      currentNotas += '\n' + logMsg;
    } else {
      currentNotas = logMsg;
    }
    sheet.getRange(rowIndex, notasIdx + 1).setValue(currentNotas);
  }
  
  return createJsonResponse({success: true, feedback: lead.feedback});
}

/**
 * Módulos de Administración y Sincronización Bilateral
 */

function getAdminSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('ADMINISTRACION DETALLADA');
  if (sheet) return sheet;
  
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toUpperCase().includes('ADMINISTRACION')) {
      return sheets[i];
    }
  }
  return null;
}

function getColumnForYearMonth(year, monthIndex) {
  const yearsMap = {
    2023: 12,
    2024: 25,
    2025: 38,
    2026: 51,
    2027: 64
  };
  if (yearsMap[year] !== undefined) {
    return yearsMap[year] + monthIndex + 1; // 1-based column
  }
  return -1;
}

function findPropertyRowByIdOrName(sheet, propertyId, propertyName) {
  const values = sheet.getDataRange().getValues();
  for (let i = 0; i < values.length; i++) {
    const col0 = String(values[i][0] || "").trim();
    if (col0 && col0 === String(propertyId).trim()) {
      return i + 1; // 1-based row
    }
  }
  if (propertyName) {
    const cleanName = String(propertyName).trim().toLowerCase();
    for (let i = 0; i < values.length; i++) {
      const col5 = String(values[i][5] || "").trim().toLowerCase();
      if (col5 && (col5.includes(cleanName) || cleanName.includes(col5))) {
        return i + 1; // 1-based row
      }
    }
  }
  return -1;
}

function formatDateJs(val) {
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  if (!val) return "";
  let valStr = String(val).trim();
  if (valStr.includes(" 00:00:00")) {
    valStr = valStr.split(" ")[0];
  }
  return valStr;
}

function parseNumberJs(val) {
  if (val === null || val === undefined || val === "" || val === "-") {
    return 0;
  }
  if (typeof val === 'number') {
    return val;
  }
  try {
    const cleaned = String(val).replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    return 0;
  }
}

function cleanPropName(rawName) {
  if (!rawName) return { name: "", notes: "" };
  rawName = String(rawName).trim();
  const parts = rawName.split(/\s{2,}|(?=1\.\s*Aumento)|(?=Aumento)/);
  let name = parts[0].trim();
  if (name.endsWith('.')) {
    name = name.slice(0, -1).trim();
  }
  const notes = parts.slice(1).map(p => p.trim()).filter(p => p).join(" | ");
  return { name: name, notes: notes };
}

function getMonthStatus(val, year, monthIdx, startDateStr, dueDay, monthlyRent) {
  const currentYear = 2026;
  const currentMonthIdx = 4; // Mayo (0-indexed)
  
  if (val === null || val === undefined || val === '') {
    val = "-";
  }
  
  const valStr = String(val).trim().toUpperCase();
  
  if (valStr.includes("DESOCUPAD")) {
    return { status: "VACANT", value: valStr };
  } else if (valStr.includes("PREAVISO")) {
    return { status: "PREAVISO", value: valStr };
  } else if (valStr.includes("NUEVO") || valStr.includes("CONTRATO NUEVO")) {
    return { status: "NEW_CONTRACT", value: valStr };
  } else if (valStr.includes("NO RENOVARA")) {
    return { status: "NO_RENEW", value: valStr };
  }
  
  const numVal = parseNumberJs(val);
  if (numVal > 0) {
    return { status: "PAID", value: numVal };
  }
  
  if (year > currentYear || (year === currentYear && monthIdx > currentMonthIdx)) {
    return { status: "FUTURE", value: valStr };
  }
  
  if (startDateStr) {
    try {
      let startYear = null;
      let startMonth = null;
      if (startDateStr instanceof Date) {
        startYear = startDateStr.getFullYear();
        startMonth = startDateStr.getMonth() + 1;
      } else {
        const parts = String(startDateStr).split('-');
        if (parts.length >= 2) {
          startYear = parseInt(parts[0], 10);
          startMonth = parseInt(parts[1], 10);
        }
      }
      if (startYear !== null && startMonth !== null) {
        if (startYear > year || (startYear === year && startMonth > (monthIdx + 1))) {
          return { status: "UNSTARTED", value: valStr };
        }
      }
    } catch (e) {
      // ignore
    }
  }
  
  return { status: "PENDING", value: valStr };
}

function parseSilviaLedgerJs() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();
  const silviaData = {};
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (sheetName.includes("ADMT - SILVIA")) {
      const parts = sheetName.split(" ");
      const year = parts[parts.length - 1];
      const values = sheet.getDataRange().getValues();
      
      const transactions = [];
      const headerRow = 5;
      
      for (let rIdx = headerRow + 1; rIdx < values.length; rIdx++) {
        const row = values[rIdx];
        if (!row || row.length <= 7) continue;
        
        const desc = row[4] ? String(row[4]).trim() : "";
        if (!desc || desc === "" || desc.toLowerCase() === "nan") {
          continue;
        }
        
        const date = formatDateJs(row[3]);
        const recaudo = parseNumberJs(row[5]);
        const abono = parseNumberJs(row[6]);
        const saldo = parseNumberJs(row[7]);
        
        transactions.push({
          date: date,
          description: desc,
          recaudo: recaudo,
          abono: abono,
          saldo: saldo
        });
      }
      silviaData[year] = transactions;
    }
  });
  
  return silviaData;
}

function getAdminData() {
  const sheet = getAdminSheet();
  if (!sheet) {
    return createJsonResponse({ error: 'No se encontró la hoja de administración' });
  }
  
  const values = sheet.getDataRange().getValues();
  const properties = [];
  const startRow = 5;
  const endRow = values.length - 1;
  
  const yearsMap = {
    2023: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    2024: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    2025: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    2026: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62],
    2027: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75]
  };
  
  const monthsNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  
  for (let i = startRow; i <= endRow; i++) {
    const row = values[i];
    if (!row || row.length < 12) continue;
    
    const rawName = row[5] ? String(row[5]).trim() : "";
    if (!rawName || rawName === "" || rawName.toLowerCase() === "nan") continue;
    
    const rowId = row[0] ? String(row[0]).trim() : String(i - 4);
    const damageNotes = row[3] ? String(row[3]).trim() : "";
    const owner = row[4] ? String(row[4]).trim() : "Sin Propietario";
    
    const cleaned = cleanPropName(rawName);
    const propName = cleaned.name;
    const increaseNotes = cleaned.notes;
    
    const duration = row[6] ? String(row[6]).trim() : "";
    const deposit = row[7] ? String(row[7]).trim() : "";
    const startDate = formatDateJs(row[8]);
    const dueDay = parseNumberJs(row[9]);
    const maxDueDay = parseNumberJs(row[10]);
    const monthlyRent = parseNumberJs(row[11]);
    
    const paymentsHistory = {};
    Object.keys(yearsMap).forEach(year => {
      paymentsHistory[year] = [];
      const cols = yearsMap[year];
      cols.forEach((colIdx, mIdx) => {
        const cellVal = row[colIdx];
        const monthStatus = getMonthStatus(cellVal, parseInt(year, 10), mIdx, startDate, dueDay, monthlyRent);
        paymentsHistory[year].push({
          month: monthsNames[mIdx],
          value: monthStatus.value,
          status: monthStatus.status
        });
      });
    });
    
    let overallStatus = "Ocupado";
    if (rawName.toUpperCase().includes("DESOCUPAD")) {
      overallStatus = "Desocupado";
    } else {
      if (paymentsHistory["2026"] && paymentsHistory["2026"][4]) {
        const may2026Pay = paymentsHistory["2026"][4];
        if (may2026Pay.status === "VACANT") {
          overallStatus = "Desocupado";
        }
      }
    }
    
    properties.push({
      id: rowId,
      excel_row: i,
      owner: owner,
      name: propName,
      increase_notes: increaseNotes,
      damage_notes: damageNotes,
      duration: duration,
      deposit: deposit,
      start_date: startDate,
      due_day: dueDay,
      max_due_day: maxDueDay,
      monthly_rent: monthlyRent,
      status: overallStatus,
      payments: paymentsHistory
    });
  }
  
  const silviaLedger = parseSilviaLedgerJs();
  
  return createJsonResponse({
    last_update: new Date().toISOString(),
    properties: properties,
    silvia_ledger: silviaLedger
  });
}

function saveAdminPaymentToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) {
    return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración' });
  }
  
  const propertyId = params.propertyId;
  const propertyName = params.propertyName;
  const year = parseInt(params.year, 10);
  const monthIndex = parseInt(params.monthIndex, 10);
  const value = params.value;
  
  const rowIdx = findPropertyRowByIdOrName(sheet, propertyId, propertyName);
  if (rowIdx === -1) {
    return createJsonResponse({ success: false, error: 'Propiedad no encontrada en la hoja' });
  }
  
  const colIdx = getColumnForYearMonth(year, monthIndex);
  if (colIdx === -1) {
    return createJsonResponse({ success: false, error: 'Año o mes no válido para columnas' });
  }
  
  // Guardar en la celda correspondiente sin sobreescribir nada más
  sheet.getRange(rowIdx, colIdx).setValue(value);
  
  return createJsonResponse({ success: true, row: rowIdx, column: colIdx });
}

