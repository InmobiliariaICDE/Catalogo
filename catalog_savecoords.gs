/**
 * Agregar este código al Apps Script del catálogo principal de ICDE
 * (El que tiene la URL AKfycbz-HipJ... / acción getData)
 *
 * Pega esta función dentro del mismo archivo .gs del catálogo,
 * luego ve a Implementar > Administrar implementaciones > Nueva versión > Implementar
 */

/**
 * saveCoords: guarda Latitud y Longitud de una propiedad por su Código.
 * Si la hoja no tiene esas columnas, las crea automáticamente.
 * 
 * Uso desde doPost:
 *   { action: 'saveCoords', codigo: '101', lat: '2.9273', lng: '-75.2819' }
 */
function saveCoords(codigo, lat, lng) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Intentar diferentes nombres de hoja
  const sheet = ss.getSheetByName('Base de Datos')
    || ss.getSheetByName('Hoja1')
    || ss.getSheetByName('Propiedades')
    || ss.getSheets()[0];

  if (!sheet) return { success: false, error: 'No se encontró la hoja' };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Normalizar nombres de columna
  const norm = h => String(h || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Encontrar columna Código
  let codIdx = -1;
  let latIdx = -1;
  let lngIdx = -1;

  headers.forEach((h, i) => {
    const nk = norm(h);
    if (nk === 'codigo' || nk === 'cdigo' || nk === 'cod' || nk === 'id') codIdx = i;
    if (nk === 'latitud' || nk === 'lat') latIdx = i;
    if (nk === 'longitud' || nk === 'lng' || nk === 'lon') lngIdx = i;
  });

  if (codIdx === -1) return { success: false, error: 'No se encontró columna Código' };

  // Si no existe columna Latitud, crearla
  if (latIdx === -1) {
    latIdx = sheet.getLastColumn();
    sheet.getRange(1, latIdx + 1).setValue('Latitud');
    headers.push('Latitud');
  }
  // Si no existe columna Longitud, crearla
  if (lngIdx === -1) {
    lngIdx = sheet.getLastColumn();
    sheet.getRange(1, lngIdx + 1).setValue('Longitud');
    headers.push('Longitud');
  }

  // Buscar la fila del código
  const lastRow = sheet.getLastRow();
  const codValues = sheet.getRange(2, codIdx + 1, lastRow - 1, 1).getValues();

  let rowIndex = -1;
  for (let i = 0; i < codValues.length; i++) {
    if (String(codValues[i][0]).trim() === String(codigo).trim()) {
      rowIndex = i + 2; // +2 porque empezamos desde fila 2
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: 'Código no encontrado: ' + codigo };

  // Guardar coordenadas
  sheet.getRange(rowIndex, latIdx + 1).setValue(lat);
  sheet.getRange(rowIndex, lngIdx + 1).setValue(lng);

  return { success: true, row: rowIndex, lat: lat, lng: lng };
}


/**
 * MODIFICAR doPost existente para agregar el caso saveCoords:
 * 
 * function doPost(e) {
 *   try {
 *     const params = JSON.parse(e.postData.contents);
 *     
 *     // AGREGAR ESTE BLOQUE:
 *     if (params.action === 'saveCoords') {
 *       return createJsonResponse(saveCoords(params.codigo, params.lat, params.lng));
 *     }
 *     
 *     // ... resto de casos existentes
 *   } catch(err) {
 *     return createJsonResponse({ error: err.toString() });
 *   }
 * }
 * 
 * Si el script del catálogo NO tiene doPost, agrégalo completo así:
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (params.action === 'saveCoords') {
      return createJsonResponse(saveCoords(params.codigo, params.lat, params.lng));
    }
    return createJsonResponse({ error: 'Acción no válida: ' + params.action });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
