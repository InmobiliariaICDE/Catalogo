/**
 * Google Apps Script para sincronización del CRM ICDE
 *
 * Versión 3.0 - Tiempo real, multi-computador, funciones completas
 *
 * ⚠️ IMPORTANTE: Reemplaza el ID de abajo con el ID de tu Google Sheet
 *    (lo encuentras en la URL del Sheet: docs.google.com/spreadsheets/d/[ID_AQUI]/edit)
 */

const SPREADSHEET_ID = '1TwqwHBo0yvkKwu9ZK1xm7fyRFEdaxSfDuNoeHA3KV-c';

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
    if (action === 'deleteLead')   return deleteLeadFromSheet(e.parameter.id, e.parameter.celular);
    if (action === 'deleteLeadByPhone') return deleteLeadByPhoneFromSheet(e.parameter.celular);
    if (action === 'repairFullJSON')    return repairFullJSON();
    if (action === 'deduplicateLeads')  return deduplicateLeads();
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
    if (params.action === 'saveAdminProperty') return saveAdminPropertyToSheet(params);
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

  const headers = data[0].map(h => String(h).trim());
  const nh = h => headers.findIndex(c => normalizeHeader(c) === normalizeHeader(h));

  const jsonIdx       = nh('Full_JSON');
  const idIdx         = nh('ID');
  const nombreIdx     = nh('Nombre');
  const celularIdx    = nh('Celular');
  const tipoIdx       = nh('Tipo');
  const estadoIdx     = nh('Estado');
  const etiquetaIdx   = nh('Etiqueta');
  const notasIdx      = nh('Notas');
  const metodoPagoIdx = nh('Método Pago');
  const presupuestoIdx= nh('Presupuesto');
  const frecuenciaIdx = nh('Frecuencia');

  const leads = data.slice(1).map(row => {
    let lead = {};
    if (jsonIdx !== -1 && row[jsonIdx]) {
      try { lead = JSON.parse(row[jsonIdx]); } catch (e) {}
    }
    
    // Sobrescribir con valores de las columnas para respetar ediciones manuales
    if (idIdx !== -1 && row[idIdx] !== undefined && row[idIdx] !== '') lead.id = String(row[idIdx]);
    if (nombreIdx !== -1 && row[nombreIdx] !== undefined) lead.nombre = String(row[nombreIdx]);
    if (celularIdx !== -1 && row[celularIdx] !== undefined) lead.celular = String(row[celularIdx]);
    if (tipoIdx !== -1 && row[tipoIdx] !== undefined) lead.tipo = String(row[tipoIdx]);
    if (estadoIdx !== -1 && row[estadoIdx] !== undefined) lead.estado = String(row[estadoIdx]);
    if (etiquetaIdx !== -1 && row[etiquetaIdx] !== undefined) lead.etiqueta = String(row[etiquetaIdx]);
    if (notasIdx !== -1 && row[notasIdx] !== undefined) lead.notas = String(row[notasIdx]);
    if (frecuenciaIdx !== -1 && row[frecuenciaIdx] !== undefined) lead.frecuencia = String(row[frecuenciaIdx]);
    
    if (metodoPagoIdx !== -1 && row[metodoPagoIdx] !== undefined) {
      const val = String(row[metodoPagoIdx]).trim();
      lead.metodoPago = val ? val.split(',').map(s => s.trim()).filter(s => s) : [];
    } else if (!lead.metodoPago) {
      lead.metodoPago = [];
    }

    if (presupuestoIdx !== -1 && row[presupuestoIdx] !== undefined && row[presupuestoIdx] !== '') {
      if (!lead.filtros) lead.filtros = {};
      lead.filtros.maxPrice = parseFloat(String(row[presupuestoIdx]).replace(/[^\d.]/g, '')) || null;
    }
    
    if (!lead.id && row[0]) {
      lead.id = String(row[0]);
    }
    return lead;
  }).filter(l => l && l.id); // Filtrar filas vacías

  return createJsonResponse(leads);
}

// Helper: normaliza un header para comparación robusta (sin acentos, minúsculas, sin espacios extra)
function normalizeHeader(s) {
  return String(s || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function saveLeadToSheet(lead) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('CRM_Leads');

  const headers = [
    'ID', 'Fecha Actualización', 'Nombre', 'Celular', 'Tipo',
    'Inmobiliaria/Agente', 'Estado', 'Etiqueta', 'Notas',
    'Preferencias (Filtros)', 'Método Pago', 'Presupuesto', 'Frecuencia',
    'Total Enviadas', 'Historial (Resumen)', 'Full_JSON'
  ];

  if (!sheet) {
    sheet = ss.insertSheet('CRM_Leads');
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    // Leer headers actuales del sheet y detectar cuáles faltan
    const rawHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    const normalizedExisting = rawHeaders.map(h => normalizeHeader(h));
    headers.forEach((h) => {
      if (normalizedExisting.indexOf(normalizeHeader(h)) === -1) {
        sheet.getRange(1, rawHeaders.length + 1).setValue(h);
        rawHeaders.push(h);
        normalizedExisting.push(normalizeHeader(h));
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

  // Leer cabeceras actuales UNA SOLA VEZ (después de haber añadido las que faltan)
  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(h => String(h).trim());
  const normalizedHeaders = currentHeaders.map(h => normalizeHeader(h));

  // ── Buscar fila existente ──────────────────────────────────
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const cleanPhoneInput = String(lead.celular || '').replace(/\D/g, '');
  const targetId = String(lead.id || '').trim();
  const idColIdx    = normalizedHeaders.indexOf(normalizeHeader('ID'));
  const phoneColIdx = normalizedHeaders.indexOf(normalizeHeader('Celular'));

  // 1. Buscar primero por ID exacto
  if (targetId && idColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColIdx] || '').trim() === targetId) { rowIndex = i + 1; break; }
    }
  }
  // 2. Si no coincide por ID, buscar por teléfono celular
  if (rowIndex === -1 && cleanPhoneInput && phoneColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][phoneColIdx] || '').replace(/\D/g, '') === cleanPhoneInput) { rowIndex = i + 1; break; }
    }
  }

  // Mapa de: nombre de header normalizado → valor a escribir
  const fieldMap = {
    [normalizeHeader('ID')]:                     lead.id,
    [normalizeHeader('Fecha Actualización')]:    new Date().toISOString(),
    [normalizeHeader('Nombre')]:                 lead.nombre,
    [normalizeHeader('Celular')]:                lead.celular,
    [normalizeHeader('Tipo')]:                   lead.tipo,
    [normalizeHeader('Inmobiliaria/Agente')]:    (lead.nombreInmobiliaria || lead.nombreAgente || ''),
    [normalizeHeader('Estado')]:                 lead.estado,
    [normalizeHeader('Etiqueta')]:               lead.etiqueta,
    [normalizeHeader('Notas')]:                  (lead.notes || lead.notas || ''),
    [normalizeHeader('Preferencias (Filtros)')]: filtrosTxt,
    [normalizeHeader('Método Pago')]:            (lead.metodoPago || []).join(', '),
    [normalizeHeader('Presupuesto')]:            (lead.filtros && lead.filtros.maxPrice) ? lead.filtros.maxPrice : '',
    [normalizeHeader('Frecuencia')]:             (lead.frecuencia || ''),
    [normalizeHeader('Total Enviadas')]:         (lead.propsEnviadas || []).length,
    [normalizeHeader('Historial (Resumen)')]:    historialTxt,
    [normalizeHeader('Full_JSON')]:              JSON.stringify(lead),
  };

  if (rowIndex > 0) {
    // ESCRIBIR CELDA POR CELDA para evitar corrimiento de columnas
    normalizedHeaders.forEach((nh, colIdx) => {
      if (nh in fieldMap) {
        sheet.getRange(rowIndex, colIdx + 1).setValue(fieldMap[nh]);
      }
    });
  } else {
    // Fila nueva: construir rowData completo y agregar
    const newRow = new Array(currentHeaders.length).fill('');
    normalizedHeaders.forEach((nh, colIdx) => {
      if (nh in fieldMap) newRow[colIdx] = fieldMap[nh];
    });
    sheet.appendRow(newRow);
  }

  return createJsonResponse({ success: true });
}

function deleteLeadFromSheet(id, phone) {
  Logger.log("Iniciando eliminación. ID recibido: '" + id + "', Celular recibido: '" + phone + "'");
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) {
    Logger.log("ERROR: No se encontró la hoja CRM_Leads");
    return createJsonResponse({ error: 'No se encontró CRM_Leads' });
  }

  const data = sheet.getDataRange().getValues();
  const cleanPhoneInput = String(phone || '').replace(/\D/g, '');
  const targetId = String(id || '').trim();

  if (!targetId && !cleanPhoneInput) {
    Logger.log("ERROR: ID y celular vacíos.");
    return createJsonResponse({ error: 'ID o teléfono requerido' });
  }

  // Determinar índices de columnas dinámicamente desde la fila de cabecera (comparación normalizada)
  const headerRow = data[0].map(h => String(h).trim());
  const idColIdx  = headerRow.findIndex(c => normalizeHeader(c) === normalizeHeader('ID'));
  const celColIdx = headerRow.findIndex(c => normalizeHeader(c) === normalizeHeader('Celular'));

  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const rowId    = idColIdx  !== -1 ? String(data[i][idColIdx]  || '').trim()            : '';
    const rowPhone = celColIdx !== -1 ? String(data[i][celColIdx] || '').replace(/\D/g, '') : '';
    
    let match = false;
    if (targetId && rowId === targetId) {
      match = true;
    }
    if (cleanPhoneInput && rowPhone === cleanPhoneInput) {
      match = true;
    }
    
    if (match) {
      Logger.log("Match encontrado en fila " + (i + 1) + " (ID: '" + rowId + "', Celular: '" + rowPhone + "'). Borrando fila...");
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  Logger.log("Eliminación completada. Total filas borradas: " + deletedCount);
  return createJsonResponse({ success: true, deletedCount: deletedCount });
}

function deleteLeadByPhoneFromSheet(phone) {
  return deleteLeadFromSheet(null, phone);
}

// ─────────────────────────────────────────────────────────────
// REPAIR: Regenerar Full_JSON para filas que lo tienen vacío
// ─────────────────────────────────────────────────────────────
function repairFullJSON() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('CRM_Leads');
  if (!sheet) return createJsonResponse({ error: 'No se encontró CRM_Leads' });

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse({ repaired: 0 });

  const headers = data[0].map(h => String(h).trim());
  const idIdx       = headers.indexOf('ID');
  const fechaIdx    = headers.indexOf('Fecha Actualización');
  const nombreIdx   = headers.indexOf('Nombre');
  const celularIdx  = headers.indexOf('Celular');
  const tipoIdx     = headers.indexOf('Tipo');
  const inmoIdx     = headers.indexOf('Inmobiliaria/Agente');
  const estadoIdx   = headers.indexOf('Estado');
  const etiquetaIdx = headers.indexOf('Etiqueta');
  const notasIdx    = headers.indexOf('Notas');
  const filtrosIdx  = headers.indexOf('Preferencias (Filtros)');
  const metodoIdx   = headers.indexOf('Método Pago');
  const presIdx     = headers.indexOf('Presupuesto');
  const frecIdx     = headers.indexOf('Frecuencia');
  const jsonIdx     = headers.indexOf('Full_JSON');

  if (jsonIdx === -1) return createJsonResponse({ error: 'Columna Full_JSON no encontrada' });

  let repaired = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const existingJson = row[jsonIdx];

    // Solo reparar filas que tienen ID pero sin Full_JSON
    const rowId = idIdx !== -1 ? String(row[idIdx] || '').trim() : '';
    if (!rowId) continue;
    if (existingJson && String(existingJson).trim().startsWith('{')) continue; // ya tiene JSON válido

    // Construir objeto base desde columnas
    const metodoPagoRaw = metodoIdx !== -1 ? String(row[metodoIdx] || '').trim() : '';
    const metodoPago = metodoPagoRaw ? metodoPagoRaw.split(',').map(s => s.trim()).filter(s => s) : [];

    const lead = {
      id:                rowId,
      fecha:             fechaIdx !== -1 ? String(row[fechaIdx] || '') : '',
      nombre:            nombreIdx !== -1 ? String(row[nombreIdx] || '') : '',
      celular:           celularIdx !== -1 ? String(row[celularIdx] || '') : '',
      tipo:              tipoIdx !== -1 ? String(row[tipoIdx] || 'cliente') : 'cliente',
      nombreInmobiliaria: inmoIdx !== -1 ? String(row[inmoIdx] || '') : '',
      nombreAgente:      inmoIdx !== -1 ? String(row[inmoIdx] || '') : '',
      estado:            estadoIdx !== -1 ? String(row[estadoIdx] || 'enviando') : 'enviando',
      etiqueta:          etiquetaIdx !== -1 ? String(row[etiquetaIdx] || 'activo') : 'activo',
      notas:             notasIdx !== -1 ? String(row[notasIdx] || '') : '',
      metodoPago:        metodoPago,
      frecuencia:        frecIdx !== -1 ? String(row[frecIdx] || 'manual') : 'manual',
      filtros:           {
        maxPrice: presIdx !== -1 && row[presIdx] !== '' ? (parseFloat(String(row[presIdx]).replace(/[^\d.]/g, '')) || null) : null
      },
      propsEnviadas:     [],
      proximosEnvios:    [],
      historialEnvios:   [],
      visitas:           [],
      creadoEn:          fechaIdx !== -1 ? String(row[fechaIdx] || new Date().toISOString()) : new Date().toISOString()
    };

    // Intentar parsear los filtros del texto resumido
    if (filtrosIdx !== -1 && row[filtrosIdx]) {
      const fTxt = String(row[filtrosIdx]);
      const tiposM = fTxt.match(/Tipos:\s*([^|]+)/);
      if (tiposM) lead.filtros.tipoInmueble = tiposM[1].split(',').map(s => s.trim());
      const zonaM = fTxt.match(/Zonas:\s*([^|]+)/);
      if (zonaM) lead.filtros.zona = zonaM[1].split(',').map(s => s.trim());
      const precioM = fTxt.match(/Precio:\s*(\d+)\s*-\s*(\w+)/);
      if (precioM) {
        lead.filtros.minPrice = parseInt(precioM[1]) || null;
        lead.filtros.maxPrice = precioM[2] === 'Max' ? null : (parseInt(precioM[2]) || null);
      }
    }

    try {
      sheet.getRange(i + 1, jsonIdx + 1).setValue(JSON.stringify(lead));
      repaired++;
    } catch(e) {
      Logger.log('Error reparando fila ' + (i + 1) + ': ' + e);
    }
  }

  return createJsonResponse({ success: true, repaired: repaired });
}

function deduplicateLeads() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('CRM_Leads');
    if (!sheet) return createJsonResponse({ error: 'No se encontró CRM_Leads' });

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse({ deduplicated: 0 });

    const headers = data[0];
    const celularIdx = headers.indexOf('Celular');
    const idIdx = headers.indexOf('ID');
    const jsonIdx = headers.indexOf('Full_JSON');

    if (celularIdx === -1) return createJsonResponse({ error: 'Columna Celular no encontrada' });

    const seenPhones = new Map();
    const rowsToDelete = [];

    for (let i = 1; i < data.length; i++) {
      const phone = String(data[i][celularIdx] || '').replace(/\D/g, '');
      if (!phone) continue;

      const hasJson = jsonIdx !== -1 && String(data[i][jsonIdx] || '').trim().startsWith('{');
      const rowNum = i + 1;

      if (seenPhones.has(phone)) {
        const prevRowIdx = seenPhones.get(phone);
        const prevRow = data[prevRowIdx - 1];
        const prevHasJson = jsonIdx !== -1 && String(prevRow[jsonIdx] || '').trim().startsWith('{');

        if (hasJson && !prevHasJson) {
          rowsToDelete.push(prevRowIdx);
          seenPhones.set(phone, rowNum);
        } else {
          rowsToDelete.push(rowNum);
        }
      } else {
        seenPhones.set(phone, rowNum);
      }
    }

    rowsToDelete.sort((a, b) => b - a);
    rowsToDelete.forEach(r => {
      sheet.deleteRow(r);
    });

    return createJsonResponse({ success: true, deletedCount: rowsToDelete.length });
  } catch(e) {
    return createJsonResponse({ error: e.toString() });
  }
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
    silvia_ledger: {}
  });
}

function saveAdminPaymentToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración' });

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
    const standardYearsMap = { 2023: 16, 2024: 29, 2025: 42, 2026: 55, 2027: 68 };
    const colStart = standardYearsMap[year];
    if (colStart !== undefined) {
      colIdx = colStart + monthIndex;
    }
  }

  if (colIdx === -1) {
    return createJsonResponse({ success: false, error: 'Columna de pago no encontrada para ' + targetMonthName + ' (' + year + ')' });
  }

  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(params.propertyId).trim()) { rowIdx = i + 1; break; }
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
      if (cellName && (cellName.includes(cleanName) || cleanName.includes(cellName))) { rowIdx = i + 1; break; }
    }
  }
  if (rowIdx === -1) return createJsonResponse({ success: false, error: 'Propiedad no encontrada' });

  sheet.getRange(rowIdx, colIdx).setValue(params.value);
  return createJsonResponse({ success: true, row: rowIdx, column: colIdx });
}

function saveAdminPropertyToSheet(params) {
  const sheet = getAdminSheet();
  if (!sheet) return createJsonResponse({ success: false, error: 'No se encontró la hoja de administración' });

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
    if (damageNotesCol !== -1) newRowValues[damageNotesCol - 1] = params.damage_notes || '';
    if (ownerCol !== -1) newRowValues[ownerCol - 1] = params.owner || '';
    if (ownerPhoneCol !== -1) newRowValues[ownerPhoneCol - 1] = params.owner_phone || '';

    let rawNameVal = params.name || '';
    if (params.increase_notes) {
      rawNameVal += "  " + params.increase_notes;
    }
    if (nameCol !== -1) newRowValues[nameCol - 1] = rawNameVal;

    if (tenantCol !== -1) newRowValues[tenantCol - 1] = params.tenant_name || '';
    if (tenantPhoneCol !== -1) newRowValues[tenantPhoneCol - 1] = params.tenant_phone || '';
    if (durationCol !== -1) newRowValues[durationCol - 1] = params.duration || '';
    if (depositCol !== -1) newRowValues[depositCol - 1] = params.deposit || '';
    if (startDateCol !== -1) newRowValues[startDateCol - 1] = params.start_date || '';
    if (dueDayCol !== -1) newRowValues[dueDayCol - 1] = params.due_day !== undefined ? Number(params.due_day) : 5;
    if (maxDueDayCol !== -1) newRowValues[maxDueDayCol - 1] = params.max_due_day !== undefined ? Number(params.max_due_day) : 10;
    if (rentCol !== -1) newRowValues[rentCol - 1] = params.monthly_rent !== undefined ? Number(params.monthly_rent) : 0;

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
    if (String(values[i][0]).trim() === String(params.propertyId).trim()) { rowIdx = i + 1; break; }
  }
  if (rowIdx === -1 && params.propertyNameOld) {
    const cleanName = String(params.propertyNameOld).trim().toLowerCase();
    const nameCol0Idx = nameCol - 1;
    for (let i = 0; i < values.length; i++) {
      const cellName = String(values[i][nameCol0Idx] || '').trim().toLowerCase();
      if (cellName && (cellName.includes(cleanName) || cleanName.includes(cellName))) { rowIdx = i + 1; break; }
    }
  }
  if (rowIdx === -1) return createJsonResponse({ success: false, error: 'Propiedad no encontrada' });

  if (params.damage_notes !== undefined) sheet.getRange(rowIdx, damageNotesCol).setValue(params.damage_notes);
  if (params.owner !== undefined) sheet.getRange(rowIdx, ownerCol).setValue(params.owner);
  if (params.owner_phone !== undefined) sheet.getRange(rowIdx, ownerPhoneCol).setValue(params.owner_phone);
  
  if (params.name !== undefined) {
    var rawNameVal = params.name;
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
  if (valStr.includes('ENTREGA'))           return { status: 'DELIVERY', value: valStr };

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
