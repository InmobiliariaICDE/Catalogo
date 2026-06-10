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
  
  if (values.length <= 5) {
    return createJsonResponse({ last_update: new Date().toISOString(), properties: [], silvia_ledger: {} });
  }

  // Row 5 is values[4]
  const headers = values[4];
  
  // Find column indices (0-based) dynamically
  let ownerColIdx = -1;
  let ownerPhoneColIdx = -1;
  let nameColIdx = -1;
  let tenantColIdx = -1;
  let tenantPhoneColIdx = -1;
  let durationColIdx = -1;
  let depositColIdx = -1;
  let startDateColIdx = -1;
  let dueDayColIdx = -1;
  let maxDueDayColIdx = -1;
  let rentColIdx = -1;
  let damageNotesColIdx = -1;

  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    if (h === 'PROPIETARIO') {
      ownerColIdx = c;
    } else if (h === 'INQUILINO') {
      tenantColIdx = c;
    } else if (h.includes('DAÑOS Y REPORTES') || h.includes('DAÑOS') || h.includes('REPORTES')) {
      damageNotesColIdx = c;
    } else if (h.includes('INMUEBLE') || h.includes('INCREMENTOS')) {
      nameColIdx = c;
    } else if (h.includes('CONTRATO')) {
      durationColIdx = c;
    } else if (h.includes('DEPÓSITO') || h.includes('DEPOSITO')) {
      depositColIdx = c;
    } else if (h.includes('FECHA INICIO') || h.includes('FECHA')) {
      startDateColIdx = c;
    } else if (h.includes('DÍA PAGO') || h.includes('DIA PAGO') || h.includes('DÍA DE PAGO')) {
      dueDayColIdx = c;
    } else if (h.includes('LÍMITE PAGO') || h.includes('LIMITE PAGO') || h.includes('LÍMITE DE PAGO')) {
      maxDueDayColIdx = c;
    } else if (h === 'CANON') {
      rentColIdx = c;
    } else if (h === 'CELULAR') {
      if (ownerColIdx !== -1 && tenantColIdx === -1) {
        ownerPhoneColIdx = c;
      } else {
        tenantPhoneColIdx = c;
      }
    }
  }

  // Fallbacks if not found (defaulting to the expected indices)
  if (damageNotesColIdx === -1) damageNotesColIdx = 3;
  if (ownerColIdx === -1) ownerColIdx = 4;
  if (ownerPhoneColIdx === -1) ownerPhoneColIdx = 5;
  if (nameColIdx === -1) nameColIdx = 6;
  if (tenantColIdx === -1) tenantColIdx = 7;
  if (tenantPhoneColIdx === -1) tenantPhoneColIdx = 8;
  if (durationColIdx === -1) durationColIdx = 9;
  if (depositColIdx === -1) depositColIdx = 10;
  if (startDateColIdx === -1) startDateColIdx = 11;
  if (dueDayColIdx === -1) dueDayColIdx = 12;
  if (maxDueDayColIdx === -1) maxDueDayColIdx = 13;
  if (rentColIdx === -1) rentColIdx = 14;

  const yearsMap = {};
  const monthsNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    const match = h.match(/([A-Z]+)\s*\((\d{4})\)/);
    if (match) {
      const monthName = match[1];
      const year = match[2];
      const mIdx = monthsNames.indexOf(monthName);
      if (mIdx !== -1) {
        if (!yearsMap[year]) {
          yearsMap[year] = new Array(12).fill(-1);
        }
        yearsMap[year][mIdx] = c;
      }
    }
  }

  if (Object.keys(yearsMap).length === 0) {
    const standardYearsMap = {
      2023: [15,16,17,18,19,20,21,22,23,24,25,26],
      2024: [28,29,30,31,32,33,34,35,36,37,38,39],
      2025: [41,42,43,44,45,46,47,48,49,50,51,52],
      2026: [54,55,56,57,58,59,60,61,62,63,64,65],
      2027: [67,68,69,70,71,72,73,74,75,76,77,78]
    };
    Object.assign(yearsMap, standardYearsMap);
  }

  for (let i = 5; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length <= nameColIdx) continue;
    const rawName = row[nameColIdx] ? String(row[nameColIdx]).trim() : '';
    if (!rawName || rawName.toLowerCase() === 'nan') continue;

    const rowId = row[0] ? String(row[0]).trim() : String(i - 4);
    const owner = row[ownerColIdx] ? String(row[ownerColIdx]).trim() : 'Sin Propietario';
    const ownerPhone = ownerPhoneColIdx !== -1 && row[ownerPhoneColIdx] ? String(row[ownerPhoneColIdx]).trim() : '';
    const nameParts = rawName.split(/\s{2,}|(?=Aumento)/);
    const propName = nameParts[0].trim().replace(/\.$/, '');
    const increaseNotes = nameParts.slice(1).map(p => p.trim()).filter(p => p).join(' | ');

    const tenantName = tenantColIdx !== -1 && row[tenantColIdx] ? String(row[tenantColIdx]).trim() : '';
    const tenantPhone = tenantPhoneColIdx !== -1 && row[tenantPhoneColIdx] ? String(row[tenantPhoneColIdx]).trim() : '';

    const duration = durationColIdx !== -1 && row[durationColIdx] ? String(row[durationColIdx]).trim() : '';
    const deposit = depositColIdx !== -1 && row[depositColIdx] ? String(row[depositColIdx]).trim() : '';
    const startDate = startDateColIdx !== -1 ? _formatDate(row[startDateColIdx]) : '';
    const dueDay = dueDayColIdx !== -1 ? _parseNum(row[dueDayColIdx]) : 5;
    const maxDueDay = maxDueDayColIdx !== -1 ? _parseNum(row[maxDueDayColIdx]) : 10;
    const monthlyRent = rentColIdx !== -1 ? _parseNum(row[rentColIdx]) : 0;

    const paymentsHistory = {};
    Object.keys(yearsMap).forEach(year => {
      paymentsHistory[year] = yearsMap[year].map((colIdx, mIdx) => {
        if (colIdx === -1 || colIdx >= row.length) {
          return { month: monthsNames[mIdx], value: '-', status: 'FUTURE' };
        }
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
      id: rowId, excel_row: i, owner, owner_phone: ownerPhone, name: propName,
      tenant_name: tenantName, tenant_phone: tenantPhone,
      increase_notes: increaseNotes, damage_notes: damageNotesColIdx !== -1 && row[damageNotesColIdx] ? String(row[damageNotesColIdx]).trim() : '',
      duration: duration,
      deposit: deposit,
      start_date: startDate, due_day: dueDay, max_due_day: maxDueDay,
      monthly_rent: monthlyRent, status: overallStatus, payments: paymentsHistory
    });
  }

  return createJsonResponse({
    last_update: new Date().toISOString(),
    properties: properties,
    silvia_ledger: {},
    debug_raw_row_and_headers: {
      headers: headers,
      first_row: values[5] || []
    }
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

  const headers = new Array(79).fill('');
  headers[0] = 'ID';
  headers[1] = 'Item';
  headers[2] = 'CRA';
  headers[3] = 'Daños y Reportes';
  headers[4] = 'Propietario';
  headers[5] = 'Celular';
  headers[6] = 'Inmueble / Incrementos';
  headers[7] = 'Inquilino';
  headers[8] = 'Celular';
  headers[9] = 'Contrato (Meses)';
  headers[10] = 'Depósito';
  headers[11] = 'Fecha Inicio';
  headers[12] = 'Día Pago';
  headers[13] = 'Límite Pago';
  headers[14] = 'Canon';

  const yearsMap = { 2023: 15, 2024: 28, 2025: 41, 2026: 54, 2027: 67 };
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
    const row = new Array(79).fill('');
    row[0] = String(p.excel_row || (index + 5));
    row[1] = index + 1;
    row[3] = p.damage_notes || '';
    row[4] = p.owner || 'Sin Propietario';
    row[5] = p.owner_phone || '';
    
    let rawNameVal = p.name || '';
    if (p.increase_notes) {
      rawNameVal += '  ' + p.increase_notes;
    }
    row[6] = rawNameVal;
    row[7] = p.tenant_name || '';
    row[8] = p.tenant_phone || '';
    row[9] = p.duration || '';
    row[10] = p.deposit || '';
    row[11] = p.start_date || '';
    row[12] = p.due_day || 5;
    row[13] = p.max_due_day || 10;
    row[14] = p.monthly_rent || 0;

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
    sheet.getRange(6, 1, rowsToWrite.length, 79).setValues(rowsToWrite);
  }

  sheet.setFrozenRows(5);
  sheet.setFrozenColumns(7);

  return createJsonResponse({ success: true, count: rowsToWrite.length });
}

// GUARDAR ESTADO DE PAGO DE UN INMUEBLE
function saveAdminPaymentToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración en el Sheet' });

  const year = parseInt(params.year, 10);
  const monthIndex = parseInt(params.monthIndex, 10);
  const monthsNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  const targetMonthName = monthsNames[monthIndex];

  // Dynamic header search to find the correct column for payment status
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(5, 1, 1, lastCol).getValues()[0];
  let colIdx = -1;

  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    if (h.includes(targetMonthName) && h.includes(String(year))) {
      colIdx = c + 1;
      break;
    }
  }

  // Fallback to static mapping if not found dynamically
  if (colIdx === -1) {
    const standardYearsMap = { 2023: 15, 2024: 28, 2025: 41, 2026: 54, 2027: 67 };
    const colStart = standardYearsMap[year];
    if (colStart !== undefined) {
      colIdx = colStart + monthIndex + 1;
    }
  }

  if (colIdx === -1) {
    return createJsonResponse({ success: false, error: 'Columna de pago no encontrada para ' + targetMonthName + ' (' + year + ')' });
  }

  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;

  for (let i = 0; i < values.length; i++) {
    const sheetId = String(values[i][0]).trim();
    const targetId = String(params.propertyId).trim();
    if (sheetId === targetId || (parseFloat(sheetId) === parseFloat(targetId) && !isNaN(parseFloat(sheetId)))) {
      rowIdx = i + 1;
      break;
    }
  }
  
  if (rowIdx === -1 && params.propertyName) {
    const cleanName = String(params.propertyName).trim().toLowerCase();
    
    // Find Name Column index dynamically to perform safe approximate lookup
    let nameCol0Idx = 6; // default 0-indexed column 7
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c]).trim().toUpperCase();
      if (h.includes('INMUEBLE') || h.includes('INCREMENTOS')) {
        nameCol0Idx = c;
        break;
      }
    }

    for (let i = 0; i < values.length; i++) {
      const cellName = String(values[i][nameCol0Idx] || '').trim().toLowerCase();
      if (cellName && (cellName.indexOf(cleanName) !== -1 || cleanName.indexOf(cellName) !== -1)) {
        rowIdx = i + 1;
        break;
      }
    }
  }
  
  if (rowIdx === -1) {
    return createJsonResponse({ 
      success: false, 
      error: 'Inmueble no encontrado en el Sheet. ID buscado: ' + params.propertyId + ', Nombre buscado: ' + params.propertyName 
    });
  }

  sheet.getRange(rowIdx, colIdx).setValue(params.value);
  return createJsonResponse({ success: true, row: rowIdx, column: colIdx });
}

// GUARDAR DETALLES DE UN INMUEBLE / CONTRATO
function saveAdminPropertyToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración en el Sheet' });

  // Read headers from row 5
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(5, 1, 1, lastCol).getValues()[0];
  
  // Find column indices (1-based) dynamically
  let ownerCol = -1;
  let ownerPhoneCol = -1;
  let nameCol = -1;
  let tenantCol = -1;
  let tenantPhoneCol = -1;
  let durationCol = -1;
  let depositCol = -1;
  let startDateCol = -1;
  let dueDayCol = -1;
  let maxDueDayCol = -1;
  let rentCol = -1;
  let damageNotesCol = -1;

  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    const colNum = c + 1;
    
    if (h === 'PROPIETARIO') {
      ownerCol = colNum;
    } else if (h === 'INQUILINO') {
      tenantCol = colNum;
    } else if (h.includes('DAÑOS Y REPORTES') || h.includes('DAÑOS') || h.includes('REPORTES')) {
      damageNotesCol = colNum;
    } else if (h.includes('INMUEBLE') || h.includes('INCREMENTOS')) {
      nameCol = colNum;
    } else if (h.includes('CONTRATO')) {
      durationCol = colNum;
    } else if (h.includes('DEPÓSITO') || h.includes('DEPOSITO')) {
      depositCol = colNum;
    } else if (h.includes('FECHA INICIO') || h.includes('FECHA')) {
      startDateCol = colNum;
    } else if (h.includes('DÍA PAGO') || h.includes('DIA PAGO') || h.includes('DÍA DE PAGO')) {
      dueDayCol = colNum;
    } else if (h.includes('LÍMITE PAGO') || h.includes('LIMITE PAGO') || h.includes('LÍMITE DE PAGO')) {
      maxDueDayCol = colNum;
    } else if (h === 'CANON') {
      rentCol = colNum;
    } else if (h === 'CELULAR') {
      // Disambiguate owner vs tenant phone based on position relative to Propietario and Inquilino
      if (ownerCol !== -1 && tenantCol === -1) {
        ownerPhoneCol = colNum;
      } else {
        tenantPhoneCol = colNum;
      }
    }
  }

  // Fallbacks if not found (defaulting to the expected indices)
  if (damageNotesCol === -1) damageNotesCol = 4;
  if (ownerCol === -1) ownerCol = 5;
  if (ownerPhoneCol === -1) ownerPhoneCol = 6;
  if (nameCol === -1) nameCol = 7;
  if (tenantCol === -1) tenantCol = 8;
  if (tenantPhoneCol === -1) tenantPhoneCol = 9;
  if (durationCol === -1) durationCol = 10;
  if (depositCol === -1) depositCol = 11;
  if (startDateCol === -1) startDateCol = 12;
  if (dueDayCol === -1) dueDayCol = 13;
  if (maxDueDayCol === -1) maxDueDayCol = 14;
  if (rentCol === -1) rentCol = 15;

  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;

  for (let i = 0; i < values.length; i++) {
    const sheetId = String(values[i][0]).trim();
    const targetId = String(params.propertyId).trim();
    if (sheetId === targetId || (parseFloat(sheetId) === parseFloat(targetId) && !isNaN(parseFloat(sheetId)))) {
      rowIdx = i + 1;
      break;
    }
  }
  
  if (rowIdx === -1 && params.propertyNameOld) {
    const cleanName = String(params.propertyNameOld).trim().toLowerCase();
    const nameCol0Idx = nameCol - 1;
    for (let i = 0; i < values.length; i++) {
      const cellName = String(values[i][nameCol0Idx] || '').trim().toLowerCase();
      if (cellName && (cellName.indexOf(cleanName) !== -1 || cleanName.indexOf(cellName) !== -1)) {
        rowIdx = i + 1;
        break;
      }
    }
  }
  
  if (rowIdx === -1) {
    return createJsonResponse({ 
      success: false, 
      error: 'Inmueble no encontrado en el Sheet para editar. ID buscado: ' + params.propertyId + ', Nombre: ' + params.propertyNameOld 
    });
  }

  if (params.damage_notes !== undefined) sheet.getRange(rowIdx, damageNotesCol).setValue(params.damage_notes);
  if (params.owner !== undefined) sheet.getRange(rowIdx, ownerCol).setValue(params.owner);
  if (params.owner_phone !== undefined) sheet.getRange(rowIdx, ownerPhoneCol).setValue(params.owner_phone);
  
  if (params.name !== undefined) {
    let rawNameVal = params.name;
    if (params.increase_notes) {
      rawNameVal += "  " + params.increase_notes;
    }
    sheet.getRange(rowIdx, nameCol).setValue(rawNameVal);
  }
  
  if (params.tenant_name !== undefined) sheet.getRange(rowIdx, tenantCol).setValue(params.tenant_name);
  if (params.tenant_phone !== undefined) sheet.getRange(rowIdx, tenantPhoneCol).setValue(params.tenant_phone);
  
  if (params.duration !== undefined) sheet.getRange(rowIdx, durationCol).setValue(params.duration);
  if (params.deposit !== undefined) sheet.getRange(rowIdx, depositCol).setValue(params.deposit);
  if (params.start_date !== undefined) sheet.getRange(rowIdx, startDateCol).setValue(params.start_date);
  
  if (params.due_day !== undefined) sheet.getRange(rowIdx, dueDayCol).setValue(Number(params.due_day));
  if (params.max_due_day !== undefined) sheet.getRange(rowIdx, maxDueDayCol).setValue(Number(params.max_due_day));
  if (params.monthly_rent !== undefined) sheet.getRange(rowIdx, rentCol).setValue(Number(params.monthly_rent));

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
  if (valStr.includes('ENTREGA'))     return { status: 'DELIVERY', value: 'ENTREGA' };

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
