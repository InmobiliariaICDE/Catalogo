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
  const sheets = ss.getSheets();
  
  // 1. Buscar "ADMINISTRACION DETALLADA" (insensible a acentos y mayúsculas)
  let sheet = sheets.find(s => {
    const name = s.getName().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name === "ADMINISTRACION DETALLADA";
  });
  if (sheet) return sheet;
  
  // 2. Fallback: buscar cualquier hoja que contenga "ADMINISTRACION"
  sheet = sheets.find(s => {
    const name = s.getName().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes("ADMINISTRACION");
  });
  return sheet || null;
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

  // Mapeo fijo y exacto según Base de datos Admin.xlsx
  const damageNotesColIdx = 5;  // Col F (Daños y Reportes)
  const ownerColIdx = 6;        // Col G (Propietario)
  const ownerPhoneColIdx = 7;   // Col H (Celular propietario)
  const nameColIdx = 8;         // Col I (Inmueble / Incrementos)
  const tenantColIdx = 9;       // Col J (Inquilino)
  const tenantPhoneColIdx = 10; // Col K (Celular inquilino)
  const durationColIdx = 11;    // Col L (Contrato (Meses))
  const depositColIdx = 12;     // Col M (Depósito)
  const startDateColIdx = 13;   // Col N (Fecha Inicio)
  const dueDayColIdx = 14;      // Col O (Día Pago)
  const maxDueDayColIdx = 15;   // Col P (Límite Pago)
  const rentColIdx = 16;        // Col Q (Canon)

  const yearsMap = {
    2023: [17,18,19,20,21,22,23,24,25,26,27,28],
    2024: [30,31,32,33,34,35,36,37,38,39,40,41],
    2025: [43,44,45,46,47,48,49,50,51,52,53,54],
    2026: [56,57,58,59,60,61,62,63,64,65,66,67],
    2027: [69,70,71,72,73,74,75,76,77,78,79,80]
  };
  const monthsNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

  // Logging para diagnosticar qué información se lee en qué columna
  if (values.length > 5) {
    const r5 = values[5];
    Logger.log("DIAGNOSTICO DE COLUMNAS (Fila 6 del Sheet):");
    Logger.log("Col 0 (A) ID: " + r5[0]);
    Logger.log("Col 5 (F) Daños y Reportes: " + r5[5]);
    Logger.log("Col 6 (G) Propietario: " + r5[6]);
    Logger.log("Col 7 (H) Celular Propietario: " + r5[7]);
    Logger.log("Col 8 (I) Inmueble / Incrementos: " + r5[8]);
    Logger.log("Col 9 (J) Inquilino: " + r5[9]);
    Logger.log("Col 10 (K) Celular Inquilino: " + r5[10]);
    Logger.log("Col 11 (L) Contrato (Meses): " + r5[11]);
    Logger.log("Col 12 (M) Depósito: " + r5[12]);
    Logger.log("Col 13 (N) Fecha Inicio: " + r5[13]);
    Logger.log("Col 14 (O) Día Pago: " + r5[14]);
    Logger.log("Col 15 (P) Límite Pago: " + r5[15]);
    Logger.log("Col 16 (Q) Canon: " + r5[16]);
  }

  for (let i = 5; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length <= nameColIdx) continue;
    const rawName = row[nameColIdx] ? String(row[nameColIdx]).trim() : '';
    if (!rawName || rawName.toLowerCase() === 'nan') continue;

    const rowId = row[0] ? String(row[0]).trim() : String(i - 4);
    const owner = row[ownerColIdx] ? String(row[ownerColIdx]).trim() : 'Sin Propietario';
    const ownerPhone = row[ownerPhoneColIdx] ? String(row[ownerPhoneColIdx]).trim() : '';
    const nameParts = rawName.split(/\s{2,}|(?=Aumento)/);
    const propName = nameParts[0].trim().replace(/\.$/, '');
    const increaseNotes = nameParts.slice(1).map(p => p.trim()).filter(p => p).join(' | ');

    const tenantName = row[tenantColIdx] ? String(row[tenantColIdx]).trim() : '';
    const tenantPhone = row[tenantPhoneColIdx] ? String(row[tenantPhoneColIdx]).trim() : '';

    const duration = row[durationColIdx] ? String(row[durationColIdx]).trim() : '';
    const deposit = row[depositColIdx] ? String(row[depositColIdx]).trim() : '';
    const startDate = _formatDate(row[startDateColIdx]);
    const dueDay = _parseNum(row[dueDayColIdx]);
    const maxDueDay = _parseNum(row[maxDueDayColIdx]);
    const monthlyRent = _parseNum(row[rentColIdx]);

    const paymentsHistory = {};
    Object.keys(yearsMap).forEach(year => {
      paymentsHistory[year] = yearsMap[year].map((colIdx, mIdx) => {
        if (colIdx >= row.length) {
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
      increase_notes: increaseNotes, damage_notes: row[damageNotesColIdx] ? String(row[damageNotesColIdx]).trim() : '',
      duration: duration,
      deposit: deposit,
      start_date: startDate, due_day: dueDay, max_due_day: maxDueDay,
      monthly_rent: monthlyRent, status: overallStatus, payments: paymentsHistory
    });
  }

  // Diagnostic mapping output returned directly in JSON
  const debugMapping = {};
  if (values.length > 5) {
    const r5 = values[5];
    debugMapping["Fila 6 - Col 0 (A) ID"] = String(r5[0]);
    debugMapping["Fila 6 - Col 5 (F) Daños"] = String(r5[5]);
    debugMapping["Fila 6 - Col 6 (G) Propietario"] = String(r5[6]);
    debugMapping["Fila 6 - Col 7 (H) Celular Prop"] = String(r5[7]);
    debugMapping["Fila 6 - Col 8 (I) Inmueble"] = String(r5[8]);
    debugMapping["Fila 6 - Col 9 (J) Inquilino"] = String(r5[9]);
    debugMapping["Fila 6 - Col 10 (K) Celular Inq"] = String(r5[10]);
    debugMapping["Fila 6 - Col 11 (L) Contrato"] = String(r5[11]);
    debugMapping["Fila 6 - Col 12 (M) Depósito"] = String(r5[12]);
    debugMapping["Fila 6 - Col 13 (N) Fecha Inicio"] = String(r5[13]);
    debugMapping["Fila 6 - Col 14 (O) Día Pago"] = String(r5[14]);
    debugMapping["Fila 6 - Col 15 (P) Límite Pago"] = String(r5[15]);
    debugMapping["Fila 6 - Col 16 (Q) Canon"] = String(r5[16]);
  }

  return createJsonResponse({
    last_update: new Date().toISOString(),
    properties: properties,
    silvia_ledger: {},
    debug_raw_column_mapping: debugMapping
  });
}

// INICIALIZACIÓN DE LA HOJA
function importAdminDataFromJSON(data) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('ADMINISTRACION DETALLADA');
  if (!sheet) {
    sheet = ss.insertSheet('ADMINISTRACION DETALLADA');
  }

  const values = sheet.getDataRange().getValues();
  
  data.properties.forEach((p) => {
    const rowIdx = p.excel_row;
    if (rowIdx) {
      // Usar el mapeo de columnas exacto de 1-based index (Col F = 6, Col G = 7, etc.)
      sheet.getRange(rowIdx + 1, 1).setValue(String(rowIdx)); // ID (Col A)
      sheet.getRange(rowIdx + 1, 6).setValue(p.damage_notes || ''); // Daños (Col F)
      sheet.getRange(rowIdx + 1, 7).setValue(p.owner || 'Sin Propietario'); // Propietario (Col G)
      sheet.getRange(rowIdx + 1, 8).setValue(p.owner_phone || ''); // Celular Propietario (Col H)
      
      let rawNameVal = p.name || '';
      if (p.increase_notes) {
        rawNameVal += '  ' + p.increase_notes;
      }
      sheet.getRange(rowIdx + 1, 9).setValue(rawNameVal); // Inmueble (Col I)
      sheet.getRange(rowIdx + 1, 10).setValue(p.tenant_name || ''); // Inquilino (Col J)
      sheet.getRange(rowIdx + 1, 11).setValue(p.tenant_phone || ''); // Celular Inquilino (Col K)
      sheet.getRange(rowIdx + 1, 12).setValue(p.duration || ''); // Contrato Meses (Col L)
      sheet.getRange(rowIdx + 1, 13).setValue(p.deposit || ''); // Depósito (Col M)
      sheet.getRange(rowIdx + 1, 14).setValue(p.start_date || ''); // Fecha Inicio (Col N)
      sheet.getRange(rowIdx + 1, 15).setValue(p.due_day || 5); // Día Pago (Col O)
      sheet.getRange(rowIdx + 1, 16).setValue(p.max_due_day || 10); // Límite Pago (Col P)
      sheet.getRange(rowIdx + 1, 17).setValue(p.monthly_rent || 0); // Canon (Col Q)
    }
  });

  return createJsonResponse({ success: true, count: data.properties.length });
}

// GUARDAR ESTADO DE PAGO DE UN INMUEBLE
function saveAdminPaymentToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración en el Sheet' });

  const year = parseInt(params.year, 10);
  const monthIndex = parseInt(params.monthIndex, 10);
  const standardYearsMap = { 2023: 17, 2024: 30, 2025: 43, 2026: 56, 2027: 69 };
  const colStart = standardYearsMap[year];
  
  if (colStart === undefined) {
    return createJsonResponse({ success: false, error: 'Año no válido: ' + year });
  }
  
  const colIdx = colStart + monthIndex + 1; // 1-based index para getRange
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
    const nameCol0Idx = 8; // Col I (Inmueble / Incrementos)
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

  // Mapeo fijo según Base de datos Admin.xlsx
  const damageNotesCol = 6;  // Col F
  const ownerCol = 7;        // Col G
  const ownerPhoneCol = 8;   // Col H
  const nameCol = 9;         // Col I
  const tenantCol = 10;      // Col J
  const tenantPhoneCol = 11; // Col K
  const durationCol = 12;    // Col L
  const depositCol = 13;     // Col M
  const startDateCol = 14;   // Col N
  const dueDayCol = 15;      // Col O
  const maxDueDayCol = 16;   // Col P
  const rentCol = 17;        // Col Q

  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;

  const isNew = params.isNew === true || params.isNew === 'true';

  if (isNew) {
    let maxId = 0;
    let maxItem = 0;
    for (let i = 5; i < values.length; i++) {
      const idVal = parseFloat(values[i][0]);
      if (!isNaN(idVal) && idVal > maxId) maxId = idVal;
      const itemVal = parseFloat(values[i][1]);
      if (!isNaN(itemVal) && itemVal > maxItem) maxItem = itemVal;
    }
    const newId = maxId + 1;
    const newItem = maxItem + 1;

    const totalCols = sheet.getLastColumn() || 81;
    const newRowValues = [];
    for (let c = 0; c < totalCols; c++) {
      newRowValues.push('');
    }

    newRowValues[0] = newId;
    newRowValues[1] = newItem;
    newRowValues[2] = newId;
    newRowValues[3] = newItem;
    newRowValues[4] = '';
    newRowValues[damageNotesCol - 1] = params.damage_notes || '';
    newRowValues[ownerCol - 1] = params.owner || '';
    newRowValues[ownerPhoneCol - 1] = params.owner_phone || '';

    let rawNameVal = params.name || '';
    if (params.increase_notes) {
      rawNameVal += "  " + params.increase_notes;
    }
    newRowValues[nameCol - 1] = rawNameVal;

    newRowValues[tenantCol - 1] = params.tenant_name || '';
    newRowValues[tenantPhoneCol - 1] = params.tenant_phone || '';
    newRowValues[durationCol - 1] = params.duration || '';
    newRowValues[depositCol - 1] = params.deposit || '';
    newRowValues[startDateCol - 1] = params.start_date || '';
    newRowValues[dueDayCol - 1] = params.due_day !== undefined ? Number(params.due_day) : 5;
    newRowValues[maxDueDayCol - 1] = params.max_due_day !== undefined ? Number(params.max_due_day) : 10;
    newRowValues[rentCol - 1] = params.monthly_rent !== undefined ? Number(params.monthly_rent) : 0;

    for (let c = 17; c < totalCols; c++) {
      const headerVal = String(values[4][c] || '').trim();
      if (headerVal && headerVal !== 'None' && headerVal !== '') {
        newRowValues[c] = '-';
      } else {
        newRowValues[c] = '';
      }
    }

    rowIdx = sheet.getLastRow() + 1;
    sheet.getRange(rowIdx, 1, 1, totalCols).setValues([newRowValues]);
    return createJsonResponse({ success: true, row: rowIdx, propertyId: newId });
  }

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
  if (valStr.includes('PENDIENTE')) return { status: 'PENDING', value: 'Pendiente' };

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
