// ============================================================
//  ICDE Inmobiliaria – Extractor v5.2 (Optimizado, Ultra rápido y Ahorro de Cuota)
//  Extracción de fotos y detección de videos en segundo plano
// ============================================================

var HOJA_NOMBRE   = "Base de Datos";
var COL_FOTOS     = "Google Fotos";
var COL_IMAGENES  = "Imagenes";
var COL_PUBLICAR  = "Publicar";
var SEPARADOR     = "|";

// Configuración de lotes (CAPACIDAD DUPLICADA)
var FOTOS_POR_LOTE = 10; // Cantidad de álbumes a extraer por minuto en segundo plano (Antes era 5)
var URLS_POR_LOTE  = 20; // Cantidad de URLs de fotos a validar (para videos) por minuto (Antes era 10)

function onEdit(e) {
  EF_onEdit(e);
  SC_onEdit(e);
}

function onOpen() {
  EF_onOpen();
  SC_onOpen();
}

// ─────────────────────────────────────────────────────────────
// MENÚ DE LA HOJA
// ─────────────────────────────────────────────────────────────
function EF_onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📷 ICDE Fotos")
    .addItem("1. Extraer URLs de álbumes (en lotes)", "iniciarExtraccionFotos")
    .addItem("▶ Continuar extracción manual", "continuarExtraccionFotos")
    .addItem("⏹ Cancelar extracción", "cancelarExtraccionFotos")
    .addSeparator()
    .addItem("2. Detectar videos (en lotes)", "iniciarDeteccionVideos")
    .addItem("▶ Continuar detección manual", "continuarDeteccionVideos")
    .addItem("⏹ Cancelar detección", "cancelarDeteccion")
    .addSeparator()
    .addItem("Reintentar errores de extracción", "reintentarErrores")
    .addItem("Ver estado completo", "verEstadoCompleto")
    .addToUi();

  SpreadsheetApp.getUi()
    .createMenu("🔢 Sincronizar orden")
    .addItem("Actualizar orden en la web", "sincronizarOrden")
    .addItem("🔄 Sincronizar todo con Firebase", "sincronizarFirestore")
    .addToUi();
}

// ─────────────────────────────────────────────────────────────
// ON EDIT — EXTRACTOR DE FOTOS (Fila individual en tiempo real)
// ─────────────────────────────────────────────────────────────
function EF_onEdit(e) {
  try {
    var sheet = e.range.getSheet();
    if (sheet.getName() !== HOJA_NOMBRE) return;
    var row = e.range.getRow();
    if (row <= 1) return;

    var headers     = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var colFotos    = headers.indexOf(COL_FOTOS) + 1;
    var colImagenes = headers.indexOf(COL_IMAGENES) + 1;
    var colPublicar = headers.indexOf(COL_PUBLICAR) + 1;
    if (colFotos === 0) return;
    if (colImagenes === 0) {
      colImagenes = sheet.getLastColumn() + 1;
      sheet.getRange(1, colImagenes).setValue(COL_IMAGENES);
    }

    var col          = e.range.getColumn();
    var valorEditado = (e.value || "").toString().trim().toUpperCase();
    var esEdicionFotos = col === colFotos;
    var esPublicarSI   = colPublicar > 0 && col === colPublicar && valorEditado === "SI";
    if (!esEdicionFotos && !esPublicarSI) return;

    var linkFotos = sheet.getRange(row, colFotos).getValue();
    var actual    = sheet.getRange(row, colImagenes).getValue().toString();
    if (!linkFotos) return;
    if (actual && !actual.startsWith("❌") && !actual.startsWith("⚠️") && !actual.startsWith("⏳")) return;

    sheet.getRange(row, colImagenes).setValue("⏳ Extrayendo...");
    SpreadsheetApp.flush();

    var rawUrls = extraerURLsDeAlbum(linkFotos.toString().trim());
    if (rawUrls.length > 0) {
      sheet.getRange(row, colImagenes).setValue(rawUrls.join(SEPARADOR));
    } else {
      sheet.getRange(row, colImagenes).setValue("⚠️ Sin fotos encontradas");
    }
  } catch (err) {
    Logger.log("Error en EF_onEdit: " + err.message);
    try {
      var s2 = e.range.getSheet();
      var h2 = s2.getRange(1, 1, 1, s2.getLastColumn()).getValues()[0];
      var c2 = h2.indexOf(COL_IMAGENES) + 1;
      if (c2 > 0) s2.getRange(e.range.getRow(), c2).setValue("❌ Error: " + err.message);
    } catch(e2) {}
  }
}

// ─────────────────────────────────────────────────────────────
// PROCESO A: EXTRACCIÓN DE URLs EN LOTES AUTOMÁTICOS
// ─────────────────────────────────────────────────────────────
function iniciarExtraccionFotos() {
  var props = PropertiesService.getScriptProperties();
  var enCurso = props.getProperty("EF_enCurso");
  if (enCurso === "true") {
    var ui = SpreadsheetApp.getUi();
    var resp = ui.alert("Ya hay una extracción de fotos en curso. ¿Deseas reiniciar desde cero?", ui.ButtonSet.YES_NO);
    if (resp !== ui.Button.YES) return;
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_NOMBRE);
  if (!sheet) { SpreadsheetApp.getUi().alert('No se encontró la hoja "' + HOJA_NOMBRE + '"'); return; }

  // OPTIMIZACIÓN CRÍTICA: Leer toda la hoja en una sola llamada de alta velocidad (0.05 segundos)
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert("La hoja está vacía.");
    return;
  }

  var headers     = data[0];
  var colFotos    = headers.indexOf(COL_FOTOS) + 1;
  var colImagenes = headers.indexOf(COL_IMAGENES) + 1;
  if (colFotos === 0) { SpreadsheetApp.getUi().alert('No se encontró "' + COL_FOTOS + '"'); return; }
  if (colImagenes === 0) {
    colImagenes = headers.length + 1;
    sheet.getRange(1, colImagenes).setValue(COL_IMAGENES);
  }

  var cola = [];

  // Recorrer la matriz en memoria en lugar de hacer llamadas individuales a la hoja
  for (var i = 2; i <= data.length; i++) {
    var filaData = data[i - 1];
    var link = (filaData[colFotos - 1] || "").toString().trim();
    var actual = colImagenes <= filaData.length ? (filaData[colImagenes - 1] || "").toString().trim() : "";
    
    if (!link) continue;
    // Procesar solo si está vacío, tiene error o quedó en "Extrayendo"
    if (!actual || actual.startsWith("❌") || actual.startsWith("⚠️") || actual.startsWith("⏳")) {
      cola.push(i);
    }
  }

  if (cola.length === 0) {
    SpreadsheetApp.getUi().alert("No hay álbumes pendientes de extracción.");
    return;
  }

  props.setProperty("EF_enCurso", "true");
  props.setProperty("EF_cola", JSON.stringify(cola));
  props.setProperty("EF_colFotos", colFotos.toString());
  props.setProperty("EF_colImagenes", colImagenes.toString());
  props.setProperty("EF_procesadas", "0");
  props.setProperty("EF_errores", "0");

  // Mostrar "⏳ Extrayendo..." en los primeros de la cola para dar un feedback visual inmediato al usuario
  var numFeedback = Math.min(cola.length, FOTOS_POR_LOTE);
  for (var k = 0; k < numFeedback; k++) {
    sheet.getRange(cola[k], colImagenes).setValue("⏳ Extrayendo...");
  }
  SpreadsheetApp.flush();

  _eliminarTriggersEF();
  ScriptApp.newTrigger("continuarExtraccionFotos").timeBased().everyMinutes(1).create();

  SpreadsheetApp.getUi().alert(
    "📸 Proceso de extracción iniciado\nÁlbumes a procesar: " + cola.length +
    "\nLote por ejecución: " + FOTOS_POR_LOTE +
    "\n\nEl extractor se ejecutará automáticamente cada minuto en segundo plano.\nPuedes verificar el progreso en 'Ver estado completo'."
  );

  // Ejecutamos la primera tanda de inmediato
  continuarExtraccionFotos();
}

function continuarExtraccionFotos() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("EF_enCurso") !== "true") return;

  var lock = LockService.getScriptLock();
  try {
    // Intentar adquirir bloqueo por 15 segundos para evitar solapamiento de ejecuciones
    if (!lock.tryLock(15000)) return;
  } catch(e) {
    return;
  }

  try {
    var cola       = JSON.parse(props.getProperty("EF_cola") || "[]");
    var colFotos   = parseInt(props.getProperty("EF_colFotos") || "0");
    var colImg     = parseInt(props.getProperty("EF_colImagenes") || "0");
    var procesadas = parseInt(props.getProperty("EF_procesadas") || "0");
    var errores    = parseInt(props.getProperty("EF_errores") || "0");

    if (cola.length === 0 || colFotos === 0 || colImg === 0) {
      _finalizarExtraccionFotos(procesadas, errores);
      return;
    }

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(HOJA_NOMBRE);
    var lote  = cola.splice(0, FOTOS_POR_LOTE);

    for (var k = 0; k < lote.length; k++) {
      var row = lote[k];
      var link = sheet.getRange(row, colFotos).getValue().toString().trim();
      if (!link) {
        procesadas++;
        continue;
      }

      sheet.getRange(row, colImg).setValue("⏳ Extrayendo...");
      SpreadsheetApp.flush();

      try {
        var rawUrls = extraerURLsDeAlbum(link);
        if (rawUrls.length > 0) {
          sheet.getRange(row, colImg).setValue(rawUrls.join(SEPARADOR));
          procesadas++;
        } else {
          sheet.getRange(row, colImg).setValue("⚠️ Sin fotos encontradas");
          errores++;
        }
      } catch (err) {
        sheet.getRange(row, colImg).setValue("❌ Error: " + err.message);
        errores++;
      }
      Utilities.sleep(500); // Respetar rate limits
    }

    props.setProperty("EF_cola", JSON.stringify(cola));
    props.setProperty("EF_procesadas", procesadas.toString());
    props.setProperty("EF_errores", errores.toString());

    if (cola.length === 0) {
      _finalizarExtraccionFotos(procesadas, errores);
    }
  } catch(err) {
    Logger.log("Error en continuarExtraccionFotos: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

function _finalizarExtraccionFotos(procesadas, errores) {
  PropertiesService.getScriptProperties().setProperty("EF_enCurso", "false");
  _eliminarTriggersEF();
  try {
    SpreadsheetApp.getUi().alert("✅ Extracción de fotos completada\nProcesadas con éxito: " + procesadas + "\nErrores detectados: " + errores);
  } catch(e) {}
}

function cancelarExtraccionFotos() {
  PropertiesService.getScriptProperties().setProperty("EF_enCurso", "false");
  _eliminarTriggersEF();
  SpreadsheetApp.getUi().alert("⏹ Extracción de fotos cancelada.");
}

function _eliminarTriggersEF() {
  try {
    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getHandlerFunction() === "continuarExtraccionFotos") ScriptApp.deleteTrigger(t);
    });
  } catch(e) {}
}

// ─────────────────────────────────────────────────────────────
// PROCESO B: DETECTAR VIDEOS EN LOTES (Optimizado con lectura en memoria)
// ─────────────────────────────────────────────────────────────
function iniciarDeteccionVideos() {
  var props = PropertiesService.getScriptProperties();
  var enCurso = props.getProperty("DV_enCurso");
  if (enCurso === "true") {
    var ui = SpreadsheetApp.getUi();
    var resp = ui.alert("Ya hay una detección en curso. ¿Reiniciar desde cero?", ui.ButtonSet.YES_NO);
    if (resp !== ui.Button.YES) return;
  }
 
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var sheet   = ss.getSheetByName(HOJA_NOMBRE);
  if (!sheet) { SpreadsheetApp.getUi().alert('No se encontró la hoja "' + HOJA_NOMBRE + '"'); return; }

  // OPTIMIZACIÓN CRÍTICA: Leer toda la hoja en una sola llamada de alta velocidad
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) { SpreadsheetApp.getUi().alert("La hoja está vacía."); return; }

  var headers = data[0];
  var colImagenes = headers.indexOf(COL_IMAGENES) + 1;
  if (colImagenes === 0) { SpreadsheetApp.getUi().alert('No se encontró "' + COL_IMAGENES + '"'); return; }
 
  var cola = [], snapshot = {};
 
  for (var i = 2; i <= data.length; i++) {
    var celda = (data[i - 1][colImagenes - 1] || "").toString().trim();
    if (!celda || celda.startsWith("❌") || celda.startsWith("⚠️") || celda.startsWith("⏳")) continue;
    var urls = celda.split(SEPARADOR);
    snapshot[i] = urls;
    for (var j = 0; j < urls.length; j++) {
      if (!urls[j].startsWith("video:")) cola.push({row: i, urlIdx: j});
    }
  }
 
  if (cola.length === 0) { SpreadsheetApp.getUi().alert("No hay URLs para verificar."); return; }
 
  props.setProperty("DV_enCurso", "true");
  props.setProperty("DV_cola", JSON.stringify(cola));
  props.setProperty("DV_snapshot", JSON.stringify(snapshot));
  props.setProperty("DV_colImagenes", colImagenes.toString());
  props.setProperty("DV_procesadas", "0");
  props.setProperty("DV_videosEncontrados", "0");
 
  _eliminarTriggersDV();
  ScriptApp.newTrigger("continuarDeteccionVideos").timeBased().everyMinutes(1).create();
 
  SpreadsheetApp.getUi().alert(
    "🎬 Detección iniciada\nURLs a verificar: " + cola.length +
    "\nLote por ejecución: " + URLS_POR_LOTE +
    "\n\nCorre automáticamente cada minuto.\nUsa 'Ver estado completo' para monitorear."
  );
 
  continuarDeteccionVideos();
}
 
function continuarDeteccionVideos() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("DV_enCurso") !== "true") return;

  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(15000)) return;
  } catch(e) {
    return;
  }
 
  try {
    var cola       = JSON.parse(props.getProperty("DV_cola") || "[]");
    var snapshot   = JSON.parse(props.getProperty("DV_snapshot") || "{}");
    var colImg     = parseInt(props.getProperty("DV_colImagenes") || "0");
    var procesadas = parseInt(props.getProperty("DV_procesadas") || "0");
    var videos     = parseInt(props.getProperty("DV_videosEncontrados") || "0");
   
    if (cola.length === 0 || colImg === 0) { _finalizarDeteccion(procesadas, videos); return; }
   
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(HOJA_NOMBRE);
    var lote  = cola.splice(0, URLS_POR_LOTE);
   
    for (var k = 0; k < lote.length; k++) {
      var item = lote[k], rowKey = item.row.toString();
      var urls = snapshot[rowKey];
      if (!urls) continue;
      var url = urls[item.urlIdx];
      if (!url || url.startsWith("video:")) continue;
      try {
        var r  = UrlFetchApp.fetch(url, { method:"HEAD", followRedirects:true, muteHttpExceptions:true, headers:{"User-Agent":"Mozilla/5.0"} });
        var ct = (r.getHeaders()["Content-Type"] || r.getHeaders()["content-type"] || "").toLowerCase();
        if (ct.indexOf("video") !== -1) {
          urls[item.urlIdx] = "video:" + url.replace(/=w\d+$/, "");
          snapshot[rowKey]  = urls;
          videos++;
        }
        procesadas++;
      } catch(e) { procesadas++; }
      Utilities.sleep(150);
    }
   
    var filasModificadas = {};
    lote.forEach(function(item) { filasModificadas[item.row] = true; });
    Object.keys(filasModificadas).forEach(function(rk) {
      var u = snapshot[rk];
      if (u) sheet.getRange(parseInt(rk), colImg).setValue(u.join(SEPARADOR));
    });
    SpreadsheetApp.flush();
   
    props.setProperty("DV_cola", JSON.stringify(cola));
    props.setProperty("DV_snapshot", JSON.stringify(snapshot));
    props.setProperty("DV_procesadas", procesadas.toString());
    props.setProperty("DV_videosEncontrados", videos.toString());
   
    if (cola.length === 0) _finalizarDeteccion(procesadas, videos);
  } catch(err) {
    Logger.log("Error en continuarDeteccionVideos: " + err.message);
  } finally {
    lock.releaseLock();
  }
}
 
function _finalizarDeteccion(procesadas, videos) {
  PropertiesService.getScriptProperties().setProperty("DV_enCurso", "false");
  _eliminarTriggersDV();
  try { SpreadsheetApp.getUi().alert("✅ Detección completada\nURLs: " + procesadas + "\nVideos: " + videos); } catch(e) {}
}
 
function cancelarDeteccion() {
  PropertiesService.getScriptProperties().setProperty("DV_enCurso", "false");
  _eliminarTriggersDV();
  SpreadsheetApp.getUi().alert("⏹ Detección cancelada.");
}

function _eliminarTriggersDV() {
  try {
    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getHandlerFunction() === "continuarDeteccionVideos") ScriptApp.deleteTrigger(t);
    });
  } catch(e) {}
}

// ─────────────────────────────────────────────────────────────
// ESTADO DE AMBOS PROCESOS
// ─────────────────────────────────────────────────────────────
function verEstadoCompleto() {
  var p = PropertiesService.getScriptProperties();
  
  var efEnCurso = p.getProperty("EF_enCurso") || "false";
  var efCola = JSON.parse(p.getProperty("EF_cola") || "[]").length;
  var efProcesadas = p.getProperty("EF_procesadas") || "0";
  var efErrores = p.getProperty("EF_errores") || "0";
  
  var dvEnCurso = p.getProperty("DV_enCurso") || "false";
  var dvCola = JSON.parse(p.getProperty("DV_cola") || "[]").length;
  var dvProcesadas = p.getProperty("DV_procesadas") || "0";
  var dvVideos = p.getProperty("DV_videosEncontrados") || "0";
  
  var msg = "📊 ESTADO DE LOS PROCESOS EN SEGUNDO PLANO\n\n" +
            "📷 EXTRACTOR DE FOTOS:\n" +
            "• En curso: " + (efEnCurso === "true" ? "SÍ ⏳" : "NO ⏹") + "\n" +
            "• Pendientes por extraer: " + efCola + " álbumes\n" +
            "• Procesados exitosos: " + efProcesadas + "\n" +
            "• Con errores o vacíos: " + efErrores + "\n\n" +
            "🎬 DETECTOR DE VIDEOS:\n" +
            "• En curso: " + (dvEnCurso === "true" ? "SÍ ⏳" : "NO ⏹") + "\n" +
            "• Pendientes por verificar: " + dvCola + " URLs\n" +
            "• Procesadas: " + dvProcesadas + "\n" +
            "• Videos detectados: " + dvVideos + "\n\n" +
            "💡 Nota: Los procesos en curso corren de manera automática cada 1 minuto en segundo plano. Puedes continuar trabajando en la hoja de cálculo sin interrupciones.";
            
  SpreadsheetApp.getUi().alert(msg);
}

// ─────────────────────────────────────────────────────────────
// EXTRACCIÓN Y RESOLUCIÓN DE URLs
// ─────────────────────────────────────────────────────────────
function extraerURLsDeAlbum(albumUrl) {
  try {
    var urlFinal = resolverRedireccion(albumUrl);
    var response = UrlFetchApp.fetch(urlFinal, {
      followRedirects:    true,
      muteHttpExceptions: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (response.getResponseCode() !== 200) {
      throw new Error("HTTP " + response.getResponseCode() + " para: " + urlFinal);
    }
    return extraerURLsDelHTML(response.getContentText());
  } catch (err) {
    if (err.message && err.message.indexOf("script.external_request") !== -1) {
      throw new Error(
        "Sin permiso de red. Solución: ejecuta FORZAR_REAUTORIZACION() " +
        "desde el editor de Apps Script y vuelve a intentar."
      );
    }
    throw err;
  }
}
 
function resolverRedireccion(url) {
  if (url.indexOf("photos.app.goo.gl") === -1 && url.indexOf("goo.gl") === -1) return url;
  try {
    var r = UrlFetchApp.fetch(url, { followRedirects: false, muteHttpExceptions: true });
    var loc = r.getHeaders()["Location"] || r.getHeaders()["location"];
    if (loc) return loc;
  } catch(e) {}
  return url;
}
 
function extraerURLsDelHTML(html) {
  var urls = [], seen = {};
  var matches = (html.match(/https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_\-]+/g) || []);
  matches.forEach(function(url) {
    var base = url.split("=")[0];
    if (!seen[base]) { seen[base] = true; urls.push(base + "=w1200"); }
  });
  if (urls.length === 0) {
    (html.match(/https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9_\-\/]+/g) || []).forEach(function(u) {
      if (u.indexOf("/pw/") > -1) {
        var base = u.split("=")[0];
        if (!seen[base]) { seen[base] = true; urls.push(base + "=w1200"); }
      }
    });
  }
  return urls;
}
 
function reintentarErrores() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_NOMBRE);
  var headers     = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colFotos    = headers.indexOf(COL_FOTOS) + 1;
  var colImagenes = headers.indexOf(COL_IMAGENES) + 1;
  if (colFotos === 0 || colImagenes === 0) return;
 
  var lastRow = sheet.getLastRow(), count = 0;
  for (var i = 2; i <= lastRow; i++) {
    var actual = sheet.getRange(i, colImagenes).getValue().toString();
    if (!actual.startsWith("❌") && !actual.startsWith("⚠️")) continue;
    var link = sheet.getRange(i, colFotos).getValue();
    if (!link) continue;
    sheet.getRange(i, colImagenes).setValue("⏳ Extrayendo...");
    SpreadsheetApp.flush();
    try {
      var urls = extraerURLsDeAlbum(link.toString().trim());
      if (urls.length > 0) { sheet.getRange(i, colImagenes).setValue(urls.join(SEPARADOR)); count++; }
      else sheet.getRange(i, colImagenes).setValue("⚠️ Sin fotos encontradas");
    } catch(err) {
      sheet.getRange(i, colImagenes).setValue("❌ Error: " + err.message);
    }
    Utilities.sleep(500);
  }
  SpreadsheetApp.getUi().alert("Reintento completado. " + count + " fila(s) recuperadas.");
}

// ─────────────────────────────────────────────────────────────
// FIREBASE — CONFIGURACIÓN Y SINCRONIZACIÓN (OPTIMIZADO PARA AHORRAR CUOTAS)
// ─────────────────────────────────────────────────────────────
var FIREBASE_CONFIG = {
  project_id:   "inmobiliariaicde",
  private_key:  "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCs1B/ntycZf90k\nB0ZscRNKfmYLXGsRb2HJCBZSZS5YW6eOKgON6925Gm5yOWtZGhd2omokBqnPGsGW\njWSoGBMDZvTH+vWQaJN3yo8GeqHKKsqiriheUF3/P2fXdd8ihgKarlMbOB7hryxe\nVj6dEQvexWwBqNoGECoILjPONbtT3H+JNHv3sdu5pKTs+av4q/UAxIo8wWIrRG8N\n6Dh9H9JGM8kr+mR3Hhf4EGwybUKbJnNQFTn5IpWyYbM8+g3AgmtnDbG956QV02CU\nvW6ZbZAaokh8MFyXtdQ1gyqx5gRjD7jbbw5VFf8lKmwNBfIonEI2D7keAz+SYgEJ\nHrbX4ZLZAgMBAAECggEAQKRstI4ALVzyWTXxZMEcbon9X/V2xIQtBnSkaLgYkArk\nDlvvjWcxvLjCo62PVbnZGdHgsk3duK1wx/9lrSun/OdG2f+nVpaOxcj5GvrGRegg\nd519Ut1rcvuDuwaG6ZJHKhTW18DzaAVNqpFGhRfpoS6lWa+OsKLeHcYuMUxOnywl\n4kWMX3bZtgRi5MSsQVlZC03iDeqakgm94DQwbHuRglKeMaoS29yIbQPozm+lPndG\n+gCQ1iPR7VDdzM1HVt++J9uNLlMAbjJ0krmj4z0sHIyMm3wP5qRx1d1VQHOQrTKg\n6we+TJGrzzLtAvC3I2rKRLgZiPnO6YlWqM/ZvDkJ2wKBgQDd7cP37fUU4w5eteQj\nPPju07JEeBPbcq51evr9tNs+Wi99tL0KrtMFjicy+EkRleNDQDGpxY6CRN8F8Zxp\ncUG6kDo2avXqikEa8pjlU3sTJ/aqyRSEyuaxTBcu/ZGLESJt5RR9lmUtKjLERIO9\nejCZ/fYANYEKxba3NRkF86y6/wKBgQDHXKB7YU9wt06oaks62stRMknq887yMfbD\nKGlEfOVo/pQ79uZpjDpL4na8pCUaeg23g2fcI+1ORWddljGYIXTYl4UOAvhWkujD\ndONd3Y6cnbGlRVwhS4tg0Yu9u+n6iV0l+Xbb6j8LC7odLoUTtEEKM427ohwO3VL4\nOE6qXlzqJwKBgQCiyW0dx2YmVAaOYk1dq7PNO2tf3dRy+8QMWJES2D6Zlf2P76ta\n0rHnOUZ3lLfENnXlNok3Rropw+rzqS5aCcF036ZTlFGeIJtw8NJGJN36Ry4gSC7M\n2SgulOnMhiLkJ0Vh5s8I7/B3GKT0Ym1f5ukPi8GOlbB5/lzwNfqM6xigcQKBgQCt\n4dtTYZ+RN0CS4gr1rWnSSyNvmvEwC2Yn97JA+xJ4zjrqRkHXY2hhUYewpxZ5jmUy\nX5mRx4AuWZh7Zwmgn+WzGA0EGJETqZT9DZFWCG1fqqcL+IAPxj0t1/ajKSg9zduB\nyKDj1N7hunu9AhsuAXUM+cQwGIeSa3X3a90o+Z7e1wKBgFw50Oo/GxyE8Y+PgnUp\nokKDzP6nSQmHccD7nJtZccBDsPGkVsKkwS4YFuMDcILS+EBFi0FCHR/BdVQPskIy\nEMNs9lmigmzBtsW7m3WRQziFGW/bbquCUmbgRjb9dS/wKBgQDHXKB7YU9wt06o\naks62stRMknq887yMfbDKGlEfOVo/pQ79uZpjDpL4na8pCUaeg23g2fcI+1ORWd\ndljGYIXTYl4UOAvhWkujD\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@inmobiliariaicde.iam.gserviceaccount.com",
  token_uri:    "https://oauth2.googleapis.com/token"
};
 
var FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_CONFIG.project_id + "/databases/(default)/documents";
var SHEET_ID       = '1o4W4k1rxPq7t20RTd-1tC10ObsRUG3k-WewOKHshJdg';
 
var CAMPOS_FB = [
  'Código', 'Nombre', 'Tipo de inmueble', 'Barrio', 'Conjunto',
  'Precio', 'Rango de precio', 'Zona', 'Comuna', 'Habitaciones',
  'Baños', 'Garaje', 'Pisos', 'Área Construida', 'Área lote',
  'Rentabilidad', 'Ciudad', 'Estrato', 'Ubicación', 'Closet',
  'Piscina', 'Administración', 'Retorno de la Inversión',
  'Image', 'Google Fotos', 'Descripción', 'Puntos Clave',
  'Buscar', 'Cocina', 'Contrato', 'Inmobiliaria', 'Imagenes', 'Publicar'
];
 
function FIREBASE_onEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== HOJA_NOMBRE) return;

  var row = e.range.getRow();
  if (row <= 1) return;

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idx     = {};
  headers.forEach(function(h, i) { if (h) idx[String(h).trim()] = i; });

  var token = getAccessToken();

  if (row > data.length) {
    _sincronizarTodos(token, data, headers, idx);
    return;
  }

  var filaData  = data[row - 1];
  var publicar  = String(filaData[idx['Publicar']] || '').trim().toUpperCase();
  var codigoRaw = filaData[idx['Código']] || row;
  var docId     = String(codigoRaw).replace(/[^a-zA-Z0-9]/g, '_');

  var filaVacia = filaData.every(function(c) {
    return c === '' || c === null || c === undefined;
  });
  if (filaVacia) {
    if (codigoRaw && codigoRaw !== row) {
      borrarDocumento(token, docId);
    } else {
      _sincronizarTodos(token, data, headers, idx);
    }
    return;
  }

  if (publicar !== 'SI') {
    borrarDocumento(token, docId);
    // OPTIMIZACIÓN DE CUOTAS: No reordenar todo en cada edición individual
    return;
  }

  var obj = {};
  CAMPOS_FB.forEach(function(campo) {
    var i = idx[campo];
    obj[campo] = i !== undefined ? String(filaData[i] != null ? filaData[i] : '') : '';
  });
  obj['_sheetOrder'] = String(row);

  escribirDocumento(token, docId, obj);
  // OPTIMIZACIÓN DE CUOTAS CRÍTICA: Eliminamos _actualizarSheetOrder en cada tecla/edición individual
  // que consumía hasta 200 peticiones urlfetch por cada celda modificada.
}

function _actualizarSheetOrder(token, data, idx) {
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (row.every(function(c){ return c === '' || c === null || c === undefined; })) continue;
    var pub = String(row[idx['Publicar']] || '').trim().toUpperCase();
    if (pub !== 'SI') continue;
    var codigo = row[idx['Código']] || (r + 1);
    var docId  = String(codigo).replace(/[^a-zA-Z0-9]/g, '_');
    UrlFetchApp.fetch(
      FIRESTORE_BASE + '/propiedades/' + docId + '?updateMask.fieldPaths=_sheetOrder',
      {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        payload: JSON.stringify({ fields: { _sheetOrder: { integerValue: String(r + 1) } } }),
        muteHttpExceptions: true
      }
    );
  }
}

function _sincronizarTodos(token, data, headers, idx) {
  var docsEnFirestore = _listarDocIds(token);
  var docsQueDebenExistir = {};
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (row.every(function(c){ return c === '' || c === null; })) continue;
    var pub = String(row[idx['Publicar']] || '').trim().toUpperCase();
    if (pub !== 'SI') continue;
    var codigo = row[idx['Código']] || (r + 1);
    var docId  = String(codigo).replace(/[^a-zA-Z0-9]/g, '_');
    docsQueDebenExistir[docId] = true;
    var obj = {};
    CAMPOS_FB.forEach(function(campo) {
      var i = idx[campo];
      obj[campo] = i !== undefined ? String(row[i] != null ? row[i] : '') : '';
    });
    obj['_sheetOrder'] = String(r + 1);
    escribirDocumento(token, docId, obj);
  }
  docsEnFirestore.forEach(function(docId) {
    if (!docsQueDebenExistir[docId]) borrarDocumento(token, docId);
  });
}

function _listarDocIds(token) {
  var ids = [], pageToken = null;
  do {
    var url = FIRESTORE_BASE + '/propiedades?pageSize=300';
    if (pageToken) url += '&pageToken=' + pageToken;
    var resp = UrlFetchApp.fetch(url, { headers: { 'Authorization': 'Bearer ' + token }, muteHttpExceptions: true });
    var data = JSON.parse(resp.getContentText());
    if (!data.documents) break;
    data.documents.forEach(function(doc) {
      var parts = doc.name.split('/');
      ids.push(parts[parts.length - 1]);
    });
    pageToken = data.nextPageToken;
  } while (pageToken);
  return ids;
}

function sincronizarFirestore() {
  var propiedades = leerPropiedades();
  var token = getAccessToken();
  borrarColeccion(token);
  propiedades.forEach(function(prop) {
    var docId = String(prop['Código'] || 'sin_codigo').replace(/[^a-zA-Z0-9]/g, '_');
    escribirDocumento(token, docId, prop);
  });
}
 
function leerPropiedades() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(HOJA_NOMBRE);
  var data  = sheet.getDataRange().getValues();
  var headers = data[0], idx = {};
  headers.forEach(function(h, i) { if (h) idx[String(h).trim()] = i; });
  var colPublicar = idx['Publicar'], rows = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (row.every(function(c) { return c === '' || c === null || c === undefined; })) continue;
    if (String(row[colPublicar] || '').trim().toUpperCase() !== 'SI') continue;
    var obj = {};
    CAMPOS_FB.forEach(function(campo) {
      var i = idx[campo];
      obj[campo] = i !== undefined ? String(row[i] != null ? row[i] : '') : '';
    });
    obj['_sheetOrder'] = String(r);
    rows.push(obj);
  }
  return rows;
}
 
function escribirDocumento(token, docId, datos) {
  var fields = {};
  Object.keys(datos).forEach(function(k) {
    fields[k] = k === '_sheetOrder'
      ? { integerValue: String(parseInt(datos[k]) || 9999) }
      : { stringValue: String(datos[k] != null ? datos[k] : '') };
  });
  UrlFetchApp.fetch(FIRESTORE_BASE + '/propiedades/' + docId, {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });
}
 
function borrarDocumento(token, docId) {
  try {
    UrlFetchApp.fetch(FIRESTORE_BASE + '/propiedades/' + docId, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token }, muteHttpExceptions: true });
  } catch(e) {}
}
 
function borrarColeccion(token) {
  var pageToken = null;
  do {
    var url = FIRESTORE_BASE + '/propiedades?pageSize=300';
    if (pageToken) url += '&pageToken=' + pageToken;
    var resp = UrlFetchApp.fetch(url, { headers: { 'Authorization': 'Bearer ' + token }, muteHttpExceptions: true });
    var data = JSON.parse(resp.getContentText());
    if (!data.documents) break;
    data.documents.forEach(function(doc) {
      UrlFetchApp.fetch('https://firestore.googleapis.com/v1/' + doc.name, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token }, muteHttpExceptions: true });
    });
    pageToken = data.nextPageToken;
  } while (pageToken);
}
 
function getAccessToken() {
  var now = Math.floor(Date.now() / 1000);
  var h   = Utilities.base64EncodeWebSafe(JSON.stringify({ alg:'RS256', typ:'JWT' })).replace(/=+$/,'');
  var p   = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: FIREBASE_CONFIG.client_email, sub: FIREBASE_CONFIG.client_email,
    aud: FIREBASE_CONFIG.token_uri, iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore'
  })).replace(/=+$/,'');
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(h + '.' + p, FIREBASE_CONFIG.private_key.replace(/\\n/g,'\n'))).replace(/=+$/,'');
  var resp = UrlFetchApp.fetch(FIREBASE_CONFIG.token_uri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, payload: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + h + '.' + p + '.' + sig, muteHttpExceptions: true });
  var d = JSON.parse(resp.getContentText());
  if (!d.access_token) throw new Error('No se pudo obtener access_token');
  return d.access_token;
}
 
var DOMINIO = 'https://icdeinmobiliaria.com';
 
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getData') return ContentService.createTextOutput(JSON.stringify(leerPropiedades())).setMimeType(ContentService.MimeType.JSON);
  if (e && e.parameter && e.parameter.action === 'sitemap') return ContentService.createTextOutput(construirSitemapXML()).setMimeType(ContentService.MimeType.XML);
  return HtmlService.createHtmlOutputFromFile('prueba estilos').setTitle('ICDE - Negocios inmobiliarios');
}
 
function construirSitemapXML() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(HOJA_NOMBRE);
  var data  = sheet.getDataRange().getValues();
  var headers = data[0], idx = {};
  headers.forEach(function(h, i) { if (h) idx[String(h).trim()] = i; });
  var hoy = new Date().toISOString().split('T')[0];
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += urlEntry(DOMINIO + '/', hoy, 'daily', '1.0');
  xml += urlEntry(DOMINIO + '/mapa.html', hoy, 'weekly', '0.8');
  xml += urlEntry(DOMINIO + '/quienes-somos.html', hoy, 'monthly', '0.6');
  for (var r = 1; r < data.length; r++) {
    if (data[r].every(function(c){ return c===''||c===null||c===undefined; })) continue;
    if (String(data[r][idx['Publicar']]||'').trim().toUpperCase() !== 'SI') continue;
    var slug = generarSlug({ Nombre: data[r][idx['Nombre']], Código: data[r][idx['Código']] });
    if (slug) xml += urlEntry(DOMINIO + '/propiedad/' + slug, hoy, 'weekly', '0.9');
  }
  return xml + '</urlset>';
}
 
function urlEntry(loc, lastmod, changefreq, priority) { return '  <url>\n    <loc>'+loc+'</loc>\n    <lastmod>'+lastmod+'</lastmod>\n    <changefreq>'+changefreq+'</changefreq>\n    <priority>'+priority+'</priority>\n  </url>\n'; }
 
function generarSlug(inmueble) {
  var nombre = String(inmueble['Nombre']||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').substring(0,60);
  var codigo = String(inmueble['Código']||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  return nombre ? nombre+'-'+codigo : (codigo ? 'propiedad-'+codigo : '');
}

function FORZAR_REAUTORIZACION() { UrlFetchApp.fetch("https://www.google.com", { muteHttpExceptions: true }); }

function RECREAR_TRIGGERS() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("FIREBASE_onEdit").forSpreadsheet(SpreadsheetApp.openById(SHEET_ID)).onEdit().create();
}

function sincronizarOrden() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_NOMBRE);
  var data  = sheet.getDataRange().getValues();
  var headers = data[0], idx = {};
  headers.forEach(function(h, i) { if (h) idx[String(h).trim()] = i; });
  var token = getAccessToken();
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (row.every(function(c){ return c === '' || c === null || c === undefined; })) continue;
    if (String(row[idx['Publicar']] || '').trim().toUpperCase() !== 'SI') continue;
    var codigo = row[idx['Código']] || (r + 1);
    var docId  = String(codigo).replace(/[^a-zA-Z0-9]/g, '_');
    UrlFetchApp.fetch(FIRESTORE_BASE + '/propiedades/' + docId + '?updateMask.fieldPaths=_sheetOrder', { method: 'PATCH', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, payload: JSON.stringify({ fields: { _sheetOrder: { integerValue: String(r + 1) } } }), muteHttpExceptions: true });
  }
}
