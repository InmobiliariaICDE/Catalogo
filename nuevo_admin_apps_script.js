/**
 * Google Apps Script para la administración del catálogo e inmuebles (ICDE)
 * ID de la hoja: 1-XQNEVqgqLEK9g1xjV5YuqbNl_bnzJulXHWrJHCxN0M
 */

const SPREADSHEET_ID = '1-XQNEVqgqLEK9g1xjV5YuqbNl_bnzJulXHWrJHCxN0M';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getAdminSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('ADMINISTRACION DETALLADA');
  if (sheet) return sheet;
  return ss.getSheets().find(s => s.getName().toUpperCase().includes('ADMINISTRACION')) || null;
}

// ROUTER GET
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'getAdminData') return getAdminData();
    return createJsonResponse({ error: 'Acción no válida en GET' });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

// ROUTER POST
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (params.action === 'importAdminData')   return importAdminDataFromJSON(params.data);
    if (params.action === 'saveAdminPayment')  return saveAdminPaymentToSheet(params);
    if (params.action === 'saveAdminProperty') return saveAdminPropertyToSheet(params);
    return createJsonResponse({ error: 'Acción no válida en POST' });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

// LEER DATOS DE ADMINISTRACIÓN
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

// INICIALIZACIÓN DE LA HOJA
function importAdminDataFromJSON(data) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('ADMINISTRACION DETALLADA');
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('ADMINISTRACION DETALLADA');
  }

  const headers = new Array(76).fill('');
  headers[0] = 'ID';
  headers[1] = 'Item';
  headers[2] = 'CRA';
  headers[3] = 'Daños y Reportes';
  headers[4] = 'Propietario';
  headers[5] = 'Inmueble / Incrementos';
  headers[6] = 'Contrato (Meses)';
  headers[7] = 'Depósito';
  headers[8] = 'Fecha Inicio';
  headers[9] = 'Día Pago';
  headers[10] = 'Límite Pago';
  headers[11] = 'Canon';

  const yearsMap = { 2023: 12, 2024: 25, 2025: 38, 2026: 51, 2027: 64 };
  const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

  Object.keys(yearsMap).forEach(year => {
    const startIdx = yearsMap[year];
    months.forEach((m, idx) => {
      headers[startIdx + idx] = m + ' (' + year + ')';
    });
  });

  // Escribir las cabeceras en la fila 5 (para mantener el mismo índice del excel viejo)
  sheet.getRange(5, 1, 1, headers.length).setValues([headers]);

  const rowsToWrite = [];
  data.properties.forEach((p, index) => {
    const row = new Array(76).fill('');
    row[0] = String(p.excel_row || (index + 5));
    row[1] = index + 1;
    row[3] = p.damage_notes || '';
    row[4] = p.owner || 'Sin Propietario';
    
    let rawNameVal = p.name || '';
    if (p.increase_notes) {
      rawNameVal += '  ' + p.increase_notes;
    }
    row[5] = rawNameVal;
    row[6] = p.duration || '';
    row[7] = p.deposit || '';
    row[8] = p.start_date || '';
    row[9] = p.due_day || 5;
    row[10] = p.max_due_day || 10;
    row[11] = p.monthly_rent || 0;

    Object.keys(yearsMap).forEach(year => {
      const startIdx = yearsMap[year];
      const yearPays = p.payments[year] || [];
      yearPays.forEach((mPay, mIdx) => {
        row[startIdx + mIdx] = mPay.value === undefined ? '-' : mPay.value;
      });
    });

    rowsToWrite.push(row);
  });

  if (rowsToWrite.length > 0) {
    sheet.getRange(6, 1, rowsToWrite.length, 76).setValues(rowsToWrite);
  }

  sheet.setFrozenRows(5);
  sheet.setFrozenColumns(6);

  return createJsonResponse({ success: true, count: rowsToWrite.length });
}

// GUARDAR ESTADO DE PAGO DE UN INMUEBLE
function saveAdminPaymentToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración' });

  const yearsMap = { 2023: 12, 2024: 25, 2025: 38, 2026: 51, 2027: 64 };
  const year = parseInt(params.year, 10);
  const monthIndex = parseInt(params.monthIndex, 10);
  const colStart = yearsMap[year];
  if (colStart === undefined) return createJsonResponse({ success: false, error: 'Año no válido' });

  const colIdx = colStart + monthIndex + 1; // 1-based index para getRange
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

// GUARDAR DETALLES DE UN INMUEBLE / CONTRATO
function saveAdminPropertyToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración' });

  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(params.propertyId).trim()) { rowIdx = i + 1; break; }
  }
  if (rowIdx === -1 && params.propertyNameOld) {
    const cleanName = String(params.propertyNameOld).trim().toLowerCase();
    for (let i = 0; i < values.length; i++) {
      const cellName = String(values[i][5] || '').trim().toLowerCase();
      if (cellName && (cellName.includes(cleanName) || cleanName.includes(cellName))) { rowIdx = i + 1; break; }
    }
  }
  if (rowIdx === -1) return createJsonResponse({ success: false, error: 'Propiedad no encontrada' });

  if (params.damage_notes !== undefined) sheet.getRange(rowIdx, 4).setValue(params.damage_notes);
  if (params.owner !== undefined) sheet.getRange(rowIdx, 5).setValue(params.owner);
  
  if (params.name !== undefined) {
    let rawNameVal = params.name;
    if (params.increase_notes) {
      rawNameVal += "  " + params.increase_notes;
    }
    sheet.getRange(rowIdx, 6).setValue(rawNameVal);
  }
  
  if (params.duration !== undefined) sheet.getRange(rowIdx, 7).setValue(params.duration);
  if (params.deposit !== undefined) sheet.getRange(rowIdx, 8).setValue(params.deposit);
  if (params.start_date !== undefined) sheet.getRange(rowIdx, 9).setValue(params.start_date);
  
  if (params.due_day !== undefined) sheet.getRange(rowIdx, 10).setValue(Number(params.due_day));
  if (params.max_due_day !== undefined) sheet.getRange(rowIdx, 11).setValue(Number(params.max_due_day));
  if (params.monthly_rent !== undefined) sheet.getRange(rowIdx, 12).setValue(Number(params.monthly_rent));

  return createJsonResponse({ success: true, row: rowIdx });
}

// AUXILIARES
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
  if (valStr.includes('DESOCUPAD')) return { status: 'VACANT', value: 'DESOCUPADO' };
  if (valStr.includes('PREAVISO'))   return { status: 'PREAVISO', value: 'PREAVISO' };
  if (valStr.includes('NUEVO') || valStr.includes('CONTRATO NUEVO')) return { status: 'NEW_CONTRACT', value: 'CONTRATO NUEVO' };
  if (valStr.includes('NO RENOVARA')) return { status: 'NO_RENEW', value: 'NO RENOVARA' };

  const numVal = _parseNum(val);
  if (numVal > 0) return { status: 'PAID', value: numVal };

  if (year > currentYear || (year === currentYear && monthIdx > currentMonthIdx)) {
    return { status: 'FUTURE', value: val };
  }

  if (startDateStr) {
    try {
      const parts = startDateStr.split('-');
      if (parts.length === 3) {
        const sYear = parseInt(parts[0], 10);
        const sMonth = parseInt(parts[1], 10);
        if (sYear > year || (sYear === year && sMonth > (monthIdx + 1))) {
          return { status: 'UNSTARTED', value: val };
        }
      }
    } catch (e) {}
  }

  return { status: 'PENDING', value: val };
}
