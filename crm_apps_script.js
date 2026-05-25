/**
 * Google Apps Script para sincronización del CRM ICDE
 *
 * Versión 3.0 - Tiempo real, multi-computador, funciones completas
 *
 * ⚠️ IMPORTANTE: Reemplaza el ID de abajo con el ID de tu Google Sheet
 *    (lo encuentras en la URL del Sheet: docs.google.com/spreadsheets/d/[ID_AQUI]/edit)
 */

const SPREADSHEET_ID = '1aMucFmmKbvA0HRONGfDGwHIPTEgf1dBx';

/**
 * CRÍTICO: Siempre abrir por ID en Web Apps desplegados.
 * getActiveSpreadsheet() devuelve null fuera del editor.
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ─────────────────────────────────────────────────────────────
// ROUTER GET
// ─────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'getData')      return getData();
    if (action === 'getLeads')     return getLeads();
    if (action === 'getCitas')     return getCitas();
    if (action === 'getLeadName')  return getLeadName(e.parameter.leadId);
    if (action === 'saveFeedback') return saveLeadFeedback(
      e.parameter.leadId, e.parameter.cod, e.parameter.type, e.parameter.comment
    );
    if (action === 'getAdminData') return getAdminData();
    return createJsonResponse({ error: 'Acción no válida' });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

// ─────────────────────────────────────────────────────────────
// ROUTER POST
// ─────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (params.action === 'saveLead')         return saveLeadToSheet(JSON.parse(params.lead));
    if (params.action === 'deleteLead')       return deleteLeadFromSheet(params.id);
    if (params.action === 'saveCita')         return saveCitaToSheet(JSON.parse(params.cita));
    if (params.action === 'saveProperty')     return savePropertyToSheet(JSON.parse(params.property));
    if (params.action === 'saveFeedback')     return saveLeadFeedback(params.leadId, params.cod, params.type, params.comment);
    if (params.action === 'saveAdminPayment') return saveAdminPaymentToSheet(params);
    return createJsonResponse({ error: 'Acción no válida' });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

// ─────────────────────────────────────────────────────────────
// LEADS
// ─────────────────────────────────────────────────────────────
function getLeads() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse([]);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);

  const headers = data[0];
  const jsonIdx = headers.indexOf('Full_JSON');

  const leads = data.slice(1).map(row => {
    if (jsonIdx !== -1 && row[jsonIdx]) {
      try { return JSON.parse(row[jsonIdx]); } catch (e) {}
    }
    return {
      id: row[0], fecha: row[1], nombre: row[2], celular: row[3],
      tipo: row[4], estado: row[6], etiqueta: row[7], notas: row[8]
    };
  }).filter(l => l && l.id); // Filtrar filas vacías

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
    headers.forEach((h) => {
      if (currentHeaders.indexOf(h) === -1) {
        sheet.getRange(1, currentHeaders.length + 1).setValue(h);
        currentHeaders.push(h);
      }
    });
  }

  let filtrosTxt = '';
  if (lead.filtros) {
    const f = lead.filtros;
    const parts = [];
    if (f.tipoInmueble && f.tipoInmueble.length) parts.push('Tipos: ' + f.tipoInmueble.join(', '));
    if (f.zona && f.zona.length)                 parts.push('Zonas: ' + f.zona.join(', '));
    if (f.minPrice || f.maxPrice)                parts.push('Precio: ' + (f.minPrice || 0) + ' - ' + (f.maxPrice || 'Max'));
    if (f.habitaciones && f.habitaciones.length) parts.push('Hab: ' + f.habitaciones.join(', '));
    if (f.barrio && f.barrio.length)             parts.push('Barrios: ' + f.barrio.join(', '));
    filtrosTxt = parts.join(' | ');
  }

  const historialTxt = (lead.historialEnvios || [])
    .map(h => h.fecha + ' (' + (h.codigos || []).length + ')').join(' | ');

  const rowData = [
    lead.id,
    new Date().toISOString(),
    lead.nombre,
    lead.celular,
    lead.tipo,
    (lead.nombreInmobiliaria || lead.nombreAgente || ''),
    lead.estado,
    lead.etiqueta,
    lead.notas || '',
    filtrosTxt,
    (lead.metodoPago || []).join(', '),
    lead.frecuencia,
    (lead.propsEnviadas || []).length,
    historialTxt,
    JSON.stringify(lead)
  ];

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == lead.id) { rowIndex = i + 1; break; }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true });
}

function deleteLeadFromSheet(id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse({ error: 'No se encontró CRM_Leads' });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, error: 'Lead no encontrado' });
}

function getLeadName(leadId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse({ nombre: 'Cliente', feedback: {} });

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jsonIdx = headers.indexOf('Full_JSON');

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == leadId) {
      let feedback = {};
      if (jsonIdx !== -1 && data[i][jsonIdx]) {
        try { feedback = (JSON.parse(data[i][jsonIdx]).feedback) || {}; } catch (e) {}
      }
      return createJsonResponse({ nombre: data[i][2] || 'Cliente', feedback: feedback });
    }
  }
  return createJsonResponse({ nombre: 'Cliente', feedback: {} });
}

function saveLeadFeedback(leadId, cod, type, comment) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse({ error: 'No se encontró CRM_Leads' });

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jsonIdx = headers.indexOf('Full_JSON');
  const notasIdx = headers.indexOf('Notas');
  if (jsonIdx === -1) return createJsonResponse({ error: 'Columna Full_JSON no encontrada' });

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == leadId) { rowIndex = i + 1; break; }
  }
  if (rowIndex === -1) return createJsonResponse({ error: 'Lead no encontrado' });

  let lead = {};
  const jsonVal = sheet.getRange(rowIndex, jsonIdx + 1).getValue();
  if (jsonVal) {
    try { lead = JSON.parse(jsonVal); } catch (e) {
      lead = { id: leadId, nombre: data[rowIndex - 1][2], celular: data[rowIndex - 1][3] };
    }
  }

  if (!lead.feedback) lead.feedback = {};
  if (!lead.feedback[cod]) lead.feedback[cod] = {};

  const fechaStr = new Date().toISOString().split('T')[0];
  let logMsg = '';

  if (type === 'like')    { lead.feedback[cod].interes = 'LIKE';    logMsg = '[❤️ Me Interesa: ' + cod + ' (' + fechaStr + ')]'; }
  if (type === 'dislike') { lead.feedback[cod].interes = 'DISLIKE'; logMsg = '[👎 Descartada: ' + cod + ' (' + fechaStr + ')]'; }
  if (type === 'comment') { lead.feedback[cod].comentario = comment || ''; logMsg = '[💬 Comentario ' + cod + ': "' + comment + '" (' + fechaStr + ')]'; }
  lead.feedback[cod].fecha = fechaStr;

  sheet.getRange(rowIndex, jsonIdx + 1).setValue(JSON.stringify(lead));

  if (notasIdx !== -1 && logMsg) {
    const current = String(sheet.getRange(rowIndex, notasIdx + 1).getValue() || '');
    sheet.getRange(rowIndex, notasIdx + 1).setValue(current ? current + '\n' + logMsg : logMsg);
  }

  return createJsonResponse({ success: true, feedback: lead.feedback });
}

// ─────────────────────────────────────────────────────────────
// CITAS
// ─────────────────────────────────────────────────────────────
function getCitas() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Citas');
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
      if (data[i][0] == cita.id) { rowIndex = i + 1; break; }
    }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true });
}

// ─────────────────────────────────────────────────────────────
// PROPIEDADES
// ─────────────────────────────────────────────────────────────
function getData() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Base de Datos') || ss.getSheetByName('Hoja1') || ss.getSheetByName('Propiedades') || ss.getSheets()[0];
  if (!sheet) return createJsonResponse({ error: 'No se encontró la hoja de propiedades' });

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);

  const headers = data[0];
  const json = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
    return obj;
  });

  return createJsonResponse(json);
}

function savePropertyToSheet(prop) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Base de Datos') || ss.getSheetByName('Hoja1') || ss.getSheetByName('Propiedades') || ss.getSheets()[0];
  if (!sheet) return createJsonResponse({ error: 'No se encontró la hoja de propiedades' });

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const norm = h => String(h || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const codIdx = headers.findIndex(h => {
    const nk = norm(h);
    return nk === 'codigo' || nk === 'cdigo' || nk === 'cod' || nk === 'id';
  });
  if (codIdx === -1) return createJsonResponse({ error: 'No se encontró columna de Código' });

  const rowData = headers.map(h => {
    const nk = norm(h);
    if (nk === 'codigo' || nk === 'cdigo' || nk === 'cod' || nk === 'id') return prop['Código'] || '';
    if (nk === 'nombre' || nk === 'titulo' || nk === 'propiedad') return prop['Nombre'] || '';
    if (nk.includes('precio') && !nk.includes('rango')) return prop['Precio'] || '';
    if (nk === 'tipo' || nk === 'tipo de inmueble' || nk === 'clase') return prop['Tipo de inmueble'] || '';
    if (nk === 'zona' || nk === 'sector') return prop['Zona'] || '';
    if (nk === 'barrio') return prop['Barrio'] || '';
    if (nk.includes('ubicaci') || nk === 'direccion') return prop['Ubicación'] || '';
    if (nk.includes('habitaci') || nk === 'alcobas' || nk === 'cuartos') return prop['Habitaciones'] || '';
    if (nk.includes('bano') || nk === 'sanitarios') return prop['Baños'] || '';
    if (nk.includes('garaje') || nk.includes('parquea')) return prop['Garaje'] || '';
    if (nk.includes('area') || nk === 'mt2') return prop['Área'] || '';
    if (nk === 'latitud' || nk === 'lat') return prop['Latitud'] || '';
    if (nk === 'longitud' || nk === 'lng' || nk === 'lon') return prop['Longitud'] || '';
    if (nk.includes('inmobiliaria') || nk === 'aliado') return prop['Inmobiliaria'] || '';
    if (nk.includes('descrip') || nk === 'detalle') return prop['Descripción'] || '';
    if (nk.includes('imagen') || nk.includes('foto') || nk === 'galeria') return prop['Imagenes'] || '';
    return prop[h] !== undefined ? prop[h] : '';
  });

  const targetCod = String(prop['Código']).trim();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][codIdx]).trim() === targetCod) { rowIndex = i + 1; break; }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true });
}

// ─────────────────────────────────────────────────────────────
// ADMINISTRACIÓN
// ─────────────────────────────────────────────────────────────
function getAdminSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('ADMINISTRACION DETALLADA');
  if (sheet) return sheet;
  return ss.getSheets().find(s => s.getName().toUpperCase().includes('ADMINISTRACION')) || null;
}

function getAdminData() {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ error: 'No se encontró la hoja de administración' });

  const values = sheet.getDataRange().getValues();
  const properties = [];

  const yearsMap = {
    2023: [12,13,14,15,16,17,18,19,20,21,22,23],
    2024: [25,26,27,28,29,30,31,32,33,34,35,36],
    2025: [38,39,40,41,42,43,44,45,46,47,48,49],
    2026: [51,52,53,54,55,56,57,58,59,60,61,62],
    2027: [64,65,66,67,68,69,70,71,72,73,74,75]
  };
  const monthsNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

  for (let i = 5; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length < 12) continue;
    const rawName = row[5] ? String(row[5]).trim() : '';
    if (!rawName || rawName.toLowerCase() === 'nan') continue;

    const rowId = row[0] ? String(row[0]).trim() : String(i - 4);
    const owner = row[4] ? String(row[4]).trim() : 'Sin Propietario';
    const nameParts = rawName.split(/\s{2,}|(?=Aumento)/);
    const propName = nameParts[0].trim().replace(/\.$/, '');
    const increaseNotes = nameParts.slice(1).map(p => p.trim()).filter(p => p).join(' | ');

    const startDate = _formatDate(row[8]);
    const dueDay = _parseNum(row[9]);
    const maxDueDay = _parseNum(row[10]);
    const monthlyRent = _parseNum(row[11]);

    const paymentsHistory = {};
    Object.keys(yearsMap).forEach(year => {
      paymentsHistory[year] = yearsMap[year].map((colIdx, mIdx) => {
        const cell = row[colIdx];
        const { status, value } = _getMonthStatus(cell, parseInt(year), mIdx, startDate, monthlyRent);
        return { month: monthsNames[mIdx], value, status };
      });
    });

    let overallStatus = rawName.toUpperCase().includes('DESOCUPAD') ? 'Desocupado' : 'Ocupado';
    if (paymentsHistory['2026'] && paymentsHistory['2026'][4] && paymentsHistory['2026'][4].status === 'VACANT') {
      overallStatus = 'Desocupado';
    }

    properties.push({
      id: rowId, excel_row: i, owner, name: propName,
      increase_notes: increaseNotes, damage_notes: row[3] ? String(row[3]).trim() : '',
      duration: row[6] ? String(row[6]).trim() : '',
      deposit: row[7] ? String(row[7]).trim() : '',
      start_date: startDate, due_day: dueDay, max_due_day: maxDueDay,
      monthly_rent: monthlyRent, status: overallStatus, payments: paymentsHistory
    });
  }

  return createJsonResponse({
    last_update: new Date().toISOString(),
    properties: properties,
    silvia_ledger: {}
  });
}

function saveAdminPaymentToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración' });

  const yearsMap = { 2023: 13, 2024: 26, 2025: 39, 2026: 52, 2027: 65 };
  const year = parseInt(params.year, 10);
  const monthIndex = parseInt(params.monthIndex, 10);
  const colStart = yearsMap[year];
  if (!colStart) return createJsonResponse({ success: false, error: 'Año no válido' });

  const colIdx = colStart + monthIndex;
  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(params.propertyId).trim()) { rowIdx = i + 1; break; }
  }
  if (rowIdx === -1 && params.propertyName) {
    const cleanName = String(params.propertyName).trim().toLowerCase();
    for (let i = 0; i < values.length; i++) {
      const cellName = String(values[i][5] || '').trim().toLowerCase();
      if (cellName && (cellName.includes(cleanName) || cleanName.includes(cellName))) { rowIdx = i + 1; break; }
    }
  }
  if (rowIdx === -1) return createJsonResponse({ success: false, error: 'Propiedad no encontrada' });

  sheet.getRange(rowIdx, colIdx).setValue(params.value);
  return createJsonResponse({ success: true, row: rowIdx, column: colIdx });
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function _formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.getFullYear() + '-' +
      String(val.getMonth() + 1).padStart(2, '0') + '-' +
      String(val.getDate()).padStart(2, '0');
  }
  return String(val).split(' ')[0];
}

function _parseNum(val) {
  if (val === null || val === undefined || val === '' || val === '-') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[$\.]/g, '').replace(',', '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function _getMonthStatus(val, year, monthIdx, startDateStr, monthlyRent) {
  const currentYear = 2026, currentMonthIdx = 4; // Mayo 2026
  if (val === null || val === undefined || val === '') val = '-';
  const valStr = String(val).trim().toUpperCase();

  if (valStr.includes('DESOCUPAD'))         return { status: 'VACANT', value: valStr };
  if (valStr.includes('PREAVISO'))          return { status: 'PREAVISO', value: valStr };
  if (valStr.includes('NUEVO') || valStr.includes('CONTRATO NUEVO')) return { status: 'NEW_CONTRACT', value: valStr };
  if (valStr.includes('NO RENOVARA'))       return { status: 'NO_RENEW', value: valStr };

  const numVal = _parseNum(val);
  if (numVal > 0) return { status: 'PAID', value: numVal };

  if (year > currentYear || (year === currentYear && monthIdx > currentMonthIdx)) {
    return { status: 'FUTURE', value: valStr };
  }

  if (startDateStr) {
    try {
      const parts = String(startDateStr).split('-');
      if (parts.length >= 2) {
        const startYear = parseInt(parts[0], 10);
        const startMonth = parseInt(parts[1], 10);
        if (startYear > year || (startYear === year && startMonth > (monthIdx + 1))) {
          return { status: 'UNSTARTED', value: valStr };
        }
      }
    } catch (e) {}
  }

  return { status: 'PENDING', value: valStr };
}
