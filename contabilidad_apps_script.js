/**
 * Google Apps Script para la Sincronización del Módulo de Contabilidad (ICDE)
 * Este script debe ser vinculado a la hoja de cálculo de Google Drive "Contabilidad ICDE"
 */

// ROUTER GET: Procesa las peticiones GET desde el Panel de Control
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'getContabilidad') {
      return getContabilidad();
    }
    return createJsonResponse({ error: 'Acción no válida en GET' });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

// ROUTER POST: Procesa las peticiones POST desde el Panel de Control
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (params.action === 'saveMovimiento') {
      const movimiento = JSON.parse(params.movimiento);
      return saveMovimiento(movimiento);
    }
    if (params.action === 'deleteMovimiento') {
      return deleteMovimiento(params.id);
    }
    if (params.action === 'saveMetas') {
      const metas = JSON.parse(params.metas);
      return saveMetas(metas);
    }
    return createJsonResponse({ error: 'Acción no válida en POST' });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

// OBTENER TODOS LOS MOVIMIENTOS Y METAS
function getContabilidad() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Obtener la hoja de Movimientos
  let sheetMovs = ss.getSheetByName("Movimientos");
  if (!sheetMovs) {
    const sheets = ss.getSheets();
    sheetMovs = sheets.find(s => s.getName().toUpperCase().includes("MOVIMIENTO"));
  }
  if (!sheetMovs) {
    return createJsonResponse({ error: 'No se encontró la hoja "Movimientos"' });
  }
  
  const valuesMovs = sheetMovs.getDataRange().getValues();
  if (valuesMovs.length === 0) {
    return createJsonResponse({ movimientos: [], metas: { ingMes: 0, ingAnual: 0, gastoMes: 0 } });
  }
  
  const headersMovs = valuesMovs[0].map(h => String(h).trim().toLowerCase());
  
  // Buscar índices de las columnas necesarias
  const colIndices = {
    id: headersMovs.indexOf("id"),
    fecha: headersMovs.indexOf("fecha"),
    tipo: headersMovs.indexOf("tipo"),
    categoria: headersMovs.indexOf("categoría") !== -1 ? headersMovs.indexOf("categoría") : headersMovs.indexOf("categoria"),
    monto: headersMovs.indexOf("monto"),
    mes: headersMovs.indexOf("mes"),
    ano: headersMovs.indexOf("año") !== -1 ? headersMovs.indexOf("año") : headersMovs.indexOf("ano"),
    descripcion: headersMovs.indexOf("descripción") !== -1 ? headersMovs.indexOf("descripción") : headersMovs.indexOf("descripcion"),
    notas: headersMovs.indexOf("notas"),
    creadoEn: headersMovs.indexOf("creado en") !== -1 ? headersMovs.indexOf("creado en") : headersMovs.indexOf("creadoen")
  };
  
  const movimientos = [];
  for (let i = 1; i < valuesMovs.length; i++) {
    const row = valuesMovs[i];
    // Se salta filas vacías. Debe tener al menos ID.
    const idVal = colIndices.id !== -1 ? row[colIndices.id] : "";
    if (idVal === null || idVal === undefined || String(idVal).trim() === "") continue;
    
    movimientos.push({
      id: String(idVal).trim(),
      fecha: colIndices.fecha !== -1 ? _formatDate(row[colIndices.fecha]) : "",
      tipo: colIndices.tipo !== -1 ? String(row[colIndices.tipo]).trim().toLowerCase() : "",
      categoria: colIndices.categoria !== -1 ? String(row[colIndices.categoria]).trim() : "",
      monto: colIndices.monto !== -1 ? _parseNum(row[colIndices.monto]) : 0,
      mes: colIndices.mes !== -1 ? parseInt(row[colIndices.mes]) || 1 : 1,
      ano: colIndices.ano !== -1 ? parseInt(row[colIndices.ano]) || new Date().getFullYear() : new Date().getFullYear(),
      descripcion: colIndices.descripcion !== -1 ? String(row[colIndices.descripcion]).trim() : "",
      notas: colIndices.notas !== -1 ? String(row[colIndices.notas]).trim() : "",
      creadoEn: colIndices.creadoEn !== -1 ? _formatDateTime(row[colIndices.creadoEn]) : ""
    });
  }
  
  // 2. Obtener la hoja de Metas
  let sheetMetas = ss.getSheetByName("Metas");
  if (!sheetMetas) {
    const sheets = ss.getSheets();
    sheetMetas = sheets.find(s => s.getName().toUpperCase().includes("META"));
  }
  
  const metas = {
    ingMes: 20000000,
    ingAnual: 240000000,
    gastoMes: 8000000
  };
  
  if (sheetMetas) {
    const valuesMetas = sheetMetas.getDataRange().getValues();
    // Se espera que la columna A sea la Clave, y la columna C sea el Valor
    for (let i = 1; i < valuesMetas.length; i++) {
      const row = valuesMetas[i];
      if (row.length < 3) continue;
      const key = String(row[0]).trim();
      const val = _parseNum(row[2]);
      if (key === 'ingMes') metas.ingMes = val;
      else if (key === 'ingAnual') metas.ingAnual = val;
      else if (key === 'gastoMes') metas.gastoMes = val;
    }
  }
  
  return createJsonResponse({ movimientos: movimientos, metas: metas });
}

// GUARDAR O ACTUALIZAR UN MOVIMIENTO
function saveMovimiento(m) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetMovs = ss.getSheetByName("Movimientos");
  if (!sheetMovs) {
    const sheets = ss.getSheets();
    sheetMovs = sheets.find(s => s.getName().toUpperCase().includes("MOVIMIENTO"));
  }
  if (!sheetMovs) {
    return createJsonResponse({ error: 'No se encontró la hoja "Movimientos"' });
  }
  
  const valuesMovs = sheetMovs.getDataRange().getValues();
  const headersMovs = valuesMovs[0].map(h => String(h).trim().toLowerCase());
  
  const colIndices = {
    id: headersMovs.indexOf("id"),
    fecha: headersMovs.indexOf("fecha"),
    tipo: headersMovs.indexOf("tipo"),
    categoria: headersMovs.indexOf("categoría") !== -1 ? headersMovs.indexOf("categoría") : headersMovs.indexOf("categoria"),
    monto: headersMovs.indexOf("monto"),
    mes: headersMovs.indexOf("mes"),
    ano: headersMovs.indexOf("año") !== -1 ? headersMovs.indexOf("año") : headersMovs.indexOf("ano"),
    descripcion: headersMovs.indexOf("descripción") !== -1 ? headersMovs.indexOf("descripción") : headersMovs.indexOf("descripcion"),
    notas: headersMovs.indexOf("notas"),
    creadoEn: headersMovs.indexOf("creado en") !== -1 ? headersMovs.indexOf("creado en") : headersMovs.indexOf("creadoen")
  };
  
  if (colIndices.id === -1) {
    return createJsonResponse({ error: 'No se encontró la columna ID en la hoja "Movimientos"' });
  }
  
  // Buscar si el ID ya existe en la hoja para actualizarlo
  let rowIdx = -1;
  for (let i = 1; i < valuesMovs.length; i++) {
    if (String(valuesMovs[i][colIndices.id]).trim() === String(m.id).trim()) {
      rowIdx = i + 1; // Fila real en la hoja (1-indexed)
      break;
    }
  }
  
  const numCols = sheetMovs.getLastColumn();
  
  if (rowIdx !== -1) {
    // Actualizar fila existente
    if (colIndices.fecha !== -1) sheetMovs.getRange(rowIdx, colIndices.fecha + 1).setValue(m.fecha);
    if (colIndices.tipo !== -1) sheetMovs.getRange(rowIdx, colIndices.tipo + 1).setValue(m.tipo);
    if (colIndices.categoria !== -1) sheetMovs.getRange(rowIdx, colIndices.categoria + 1).setValue(m.categoria);
    if (colIndices.monto !== -1) sheetMovs.getRange(rowIdx, colIndices.monto + 1).setValue(m.monto);
    if (colIndices.mes !== -1) sheetMovs.getRange(rowIdx, colIndices.mes + 1).setValue(m.mes);
    if (colIndices.ano !== -1) sheetMovs.getRange(rowIdx, colIndices.ano + 1).setValue(m.ano);
    if (colIndices.descripcion !== -1) sheetMovs.getRange(rowIdx, colIndices.descripcion + 1).setValue(m.descripcion);
    if (colIndices.notas !== -1) sheetMovs.getRange(rowIdx, colIndices.notas + 1).setValue(m.notas);
    if (colIndices.creadoEn !== -1) sheetMovs.getRange(rowIdx, colIndices.creadoEn + 1).setValue(m.creadoEn);
  } else {
    // Construir nueva fila alineada con el orden de las columnas
    const newRow = new Array(numCols > 0 ? numCols : 10).fill("");
    
    const assign = (key, val) => {
      const idx = colIndices[key];
      if (idx !== -1 && idx < newRow.length) {
        newRow[idx] = val;
      }
    };
    
    assign('id', m.id);
    assign('fecha', m.fecha);
    assign('tipo', m.tipo);
    assign('categoria', m.categoria);
    assign('monto', m.monto);
    assign('mes', m.mes);
    assign('ano', m.ano);
    assign('descripcion', m.descripcion);
    assign('notas', m.notas);
    assign('creadoEn', m.creadoEn);
    
    sheetMovs.appendRow(newRow);
    rowIdx = sheetMovs.getLastRow();
  }
  
  return createJsonResponse({ success: true, row: rowIdx });
}

// ELIMINAR UN MOVIMIENTO POR ID
function deleteMovimiento(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetMovs = ss.getSheetByName("Movimientos");
  if (!sheetMovs) {
    const sheets = ss.getSheets();
    sheetMovs = sheets.find(s => s.getName().toUpperCase().includes("MOVIMIENTO"));
  }
  if (!sheetMovs) {
    return createJsonResponse({ error: 'No se encontró la hoja "Movimientos"' });
  }
  
  const valuesMovs = sheetMovs.getDataRange().getValues();
  const headersMovs = valuesMovs[0].map(h => String(h).trim().toLowerCase());
  const idColIdx = headersMovs.indexOf("id");
  
  if (idColIdx === -1) {
    return createJsonResponse({ error: 'No se encontró la columna ID en la hoja "Movimientos"' });
  }
  
  let deleted = false;
  // Buscar y eliminar la fila (recorremos de abajo hacia arriba)
  for (let i = valuesMovs.length - 1; i >= 1; i--) {
    if (String(valuesMovs[i][idColIdx]).trim() === String(id).trim()) {
      sheetMovs.deleteRow(i + 1);
      deleted = true;
    }
  }
  
  return createJsonResponse({ success: deleted });
}

// GUARDAR LAS METAS FINANCIERAS
function saveMetas(metas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetMetas = ss.getSheetByName("Metas");
  if (!sheetMetas) {
    const sheets = ss.getSheets();
    sheetMetas = sheets.find(s => s.getName().toUpperCase().includes("META"));
  }
  if (!sheetMetas) {
    return createJsonResponse({ error: 'No se encontró la hoja "Metas"' });
  }
  
  const valuesMetas = sheetMetas.getDataRange().getValues();
  // Clave en columna A (0), Valor en columna C (2)
  for (let i = 1; i < valuesMetas.length; i++) {
    const key = String(valuesMetas[i][0]).trim();
    let updatedVal = null;
    if (key === 'ingMes' && metas.ingMes !== undefined) updatedVal = metas.ingMes;
    else if (key === 'ingAnual' && metas.ingAnual !== undefined) updatedVal = metas.ingAnual;
    else if (key === 'gastoMes' && metas.gastoMes !== undefined) updatedVal = metas.gastoMes;
    
    if (updatedVal !== null) {
      sheetMetas.getRange(i + 1, 3).setValue(Number(updatedVal));
    }
  }
  
  return createJsonResponse({ success: true });
}

// AUXILIARES Y FORMATOS
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function _formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(val).split(' ')[0];
}

function _formatDateTime(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString();
  }
  return String(val);
}

function _parseNum(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  
  let clean = String(val).replace(/[^0-9\.\,\-]/g, '').trim();
  
  if (clean.includes(',') && !clean.includes('.')) {
    clean = clean.replace(',', '.');
  } else if (clean.includes('.') && clean.includes(',')) {
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');
    if (lastComma > lastDot) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      clean = clean.replace(/\./g, '');
    }
  }
  return parseFloat(clean) || 0;
}
