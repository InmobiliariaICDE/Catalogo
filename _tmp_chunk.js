async function test() {

  reproducirTonoNotificacion();
  hablarNotificacionTexto(`${titulo}. ${cuerpo}`);

  const iconUrl = datos.icon || 'https://i.imgur.com/s3dvfne.png';
  const tag = datos.tag || 'icde-sys-' + Date.now();

  enviarWebPushDirecto(titulo, cuerpo);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg && reg.showNotification) {
        reg.showNotification(titulo, {
          body: cuerpo,
          icon: iconUrl,
          badge: iconUrl,
          vibrate: [500, 200, 500, 200, 800],
          silent: false,
          tag: tag,
          renotify: true,
          data: { url: datos.url || '/admin.html' }
        });
      }
    });
  } else {
    try {
      new Notification(titulo, {
        body: cuerpo,
        icon: iconUrl,
        vibrate: [500, 200, 500, 200, 800]
      });
    } catch(e) {}
  }
}

/* ═════════════════════════════════════════════════════════════════
   MOTOR DE ALERTAS Y ALARMAS AUTOMÁTICAS PARA MÓVIL
   1. Citas: 30 minutos antes de la hora agendada
   2. Arriendos: 1 día antes y el mismo día del vencimiento de cobro
   3. Preaviso/Renovación: 30 días (1 mes) antes y 1 día antes del fin de contrato
   ═════════════════════════════════════════════════════════════════ */

function obtenerAlertasEnviadasMemoria() {
  try {
    const raw = localStorage.getItem('icde_alertas_enviadas');
    return raw ? JSON.parse(raw) : {};
  } catch(e) {
    return {};
  }
}

function guardarAlertaEnviadaMemoria(key) {
  try {
    const mem = obtenerAlertasEnviadasMemoria();
    mem[key] = Date.now();
    localStorage.setItem('icde_alertas_enviadas', JSON.stringify(mem));
  } catch(e) {}
}

async function verificarAlertasProgramadasCRM() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const sentMem = obtenerAlertasEnviadasMemoria();

  // -------------------------------------------------------------
  // 1. REVISIÓN DE CITAS (30 minutos antes - Programación en Nube)
  // -------------------------------------------------------------
  if (typeof citas !== 'undefined' && Array.isArray(citas)) {
    citas.forEach(cita => {
      if (!cita.fecha || !cita.hora) return;
      if (String(cita.estado || '').toLowerCase() === 'cancelada') return;

      const [year, month, day] = cita.fecha.split('-').map(Number);
      const [hours, minutes] = cita.hora.split(':').map(Number);

      if (!year || !month || !day || isNaN(hours) || isNaN(minutes)) return;

      const citaDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const alertTime = new Date(citaDate.getTime() - 30 * 60 * 1000); // 30 minutos antes de la cita
      const alertKey = `cita_30m_${cita.id || cita.codigo}_${cita.fecha}_${cita.hora}`;

      const clienteNom = cita.cliente || 'Cliente';
      const codInm = cita.codigo ? `Inmueble: ${cita.codigo}` : '';
      const horaTxt = cita.hora;
      const titulo = '📅 Confirmar Cita (en 30 min)';
      const cuerpo = `Debes confirmar la cita de las ${horaTxt} con ${clienteNom}. ${codInm}`.trim();

      // Si la alerta es en el futuro (más de 1 minuto adelante), programar en NUBE OneSignal
      if (alertTime.getTime() > now.getTime() + 60000) {
        programarWebPushNube(titulo, cuerpo, alertTime, alertKey);
      } else {
        // Si la cita es inminente (entre 0 y 35 minutos), disparar de inmediato
        const diffMins = Math.round((citaDate.getTime() - now.getTime()) / 60000);
        if (diffMins >= 0 && diffMins <= 35) {
          if (!sentMem[alertKey]) {
            guardarAlertaEnviadaMemoria(alertKey);
            enviarWebPushDirecto(titulo, cuerpo);
            enviarNotificacionSistema(titulo, cuerpo);
          }
        }
      }
    });
  }

  // -------------------------------------------------------------
  // 2. REVISIÓN DE ARRIENDOS Y PREAVISOS DE CONTRATO (ADMINISTRACIÓN)
  // -------------------------------------------------------------
  if (typeof adminData !== 'undefined' && adminData && Array.isArray(adminData.properties)) {
    adminData.properties.forEach(p => {
      if (p.status !== 'Ocupado') return;
      const propId = String(p.id || p.name).trim();
      const propName = p.name ? p.name.trim() : 'Inmueble';
      const inquilino = p.tenant_name ? p.tenant_name.trim() : 'Inquilino';
      const canonNum = parseFloat(p.monthly_rent) || 0;
      const canonVal = canonNum > 0 ? safeFormatP(canonNum) : '';

      // --- A. ALERTAS DE COBRO DE ARRIENDO (1 día antes y el mismo día) ---
      if (p.due_day) {
        const dueDay = Math.round(p.due_day);
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();

        const monthNamesList = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        const monthName = monthNamesList[currentMonth];

        const paymentsYear = (p.payments && p.payments[String(currentYear)]) ? p.payments[String(currentYear)] : [];
        const payInfo = paymentsYear.find(m => m.month === monthName);
        const isPaid = payInfo && payInfo.status === 'PAID';

        if (!isPaid) {
          // Programar Alerta 1 Día Antes a las 08:00 AM en la Nube
          let dayBefore = dueDay - 1;
          let monthBefore = currentMonth;
          let yearBefore = currentYear;
          if (dayBefore < 1) {
            monthBefore = currentMonth - 1;
            if (monthBefore < 0) { monthBefore = 11; yearBefore--; }
            dayBefore = 28;
          }
          const target1DayDate = new Date(yearBefore, monthBefore, dayBefore, 8, 0, 0);
          const key1Day = `arriendo_1d_${propId}_${currentYear}_${currentMonth}`;

          const tit1D = '💰 Mañana Vence Cobro de Arriendo';
          const cue1D = `Mañana vence el arriendo de ${propName} (${inquilino}). ${canonVal ? 'Canon: ' + canonVal : ''}`.trim();

          if (target1DayDate.getTime() > now.getTime() + 60000) {
            programarWebPushNube(tit1D, cue1D, target1DayDate, key1Day);
          } else if (now.getDate() === dayBefore && !sentMem[key1Day]) {
            guardarAlertaEnviadaMemoria(key1Day);
            enviarWebPushDirecto(tit1D, cue1D);
            enviarNotificacionSistema(tit1D, cue1D);
          }

          // Programar Alerta El Mismo Día a las 08:00 AM en la Nube
          const targetTodayDate = new Date(currentYear, currentMonth, dueDay, 8, 0, 0);
          const keyToday = `arriendo_hoy_${propId}_${currentYear}_${currentMonth}`;

          const titHoy = '💰 Hoy Vence Cobro de Arriendo';
          const cueHoy = `Hoy es el día de cobro de arriendo de ${propName} (${inquilino}). ${canonVal ? 'Canon: ' + canonVal : ''}`.trim();

          if (targetTodayDate.getTime() > now.getTime() + 60000) {
            programarWebPushNube(titHoy, cueHoy, targetTodayDate, keyToday);
          } else if (currentDate === dueDay && !sentMem[keyToday]) {
            guardarAlertaEnviadaMemoria(keyToday);
            enviarWebPushDirecto(titHoy, cueHoy);
            enviarNotificacionSistema(titHoy, cueHoy);
          }
        }
      }

      // --- B. PREAVISO Y RENOVACIÓN DE CONTRATO (1 mes antes y 1 día antes) ---
      const startDateStr = p.start_date;
      const durationMonths = parseInt(p.contract_duration_months, 10) || 12;

      if (startDateStr) {
        const endDateStr = calculateAdminEndDate(startDateStr, durationMonths);
        if (endDateStr) {
          const [endY, endM, endD] = endDateStr.split('-').map(Number);
          const endDate = new Date(endY, endM - 1, endD, 8, 0, 0);

          // 1 Mes (30 días) antes
          const target30dDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          const keyMonth = `preaviso_30d_${propId}_${endDateStr}`;
          const tit30d = '💼 Preaviso de Contrato (Faltan 30 días)';
          const cue30d = `Faltan 30 días para terminar el contrato de arriendo de ${inquilino} en ${propName}. Preparar preaviso o renovación.`.trim();

          if (target30dDate.getTime() > now.getTime() + 60000) {
            programarWebPushNube(tit30d, cue30d, target30dDate, keyMonth);
          } else {
            const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 28 && diffDays <= 32 && !sentMem[keyMonth]) {
              guardarAlertaEnviadaMemoria(keyMonth);
              enviarWebPushDirecto(tit30d, cue30d);
              enviarNotificacionSistema(tit30d, cue30d);
            }
          }

          // 1 Día antes
          const target1dContrDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          const key1DayContr = `preaviso_1d_${propId}_${endDateStr}`;
          const tit1dC = '💼 Mañana Vence Contrato de Arriendo';
          const cue1dC = `Mañana finaliza el contrato de arriendo de ${inquilino} en ${propName}.`.trim();

          if (target1dContrDate.getTime() > now.getTime() + 60000) {
            programarWebPushNube(tit1dC, cue1dC, target1dContrDate, key1DayContr);
          } else {
            const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1 && !sentMem[key1DayContr]) {
              guardarAlertaEnviadaMemoria(key1DayContr);
              enviarWebPushDirecto(tit1dC, cue1dC);
              enviarNotificacionSistema(tit1dC, cue1dC);
            }
          }
        }
      }
    });
  }
}

// Iniciar revisión continua del motor de alertas cada 2 minutos
setInterval(verificarAlertasProgramadasCRM, 120000);
setTimeout(verificarAlertasProgramadasCRM, 8000);
function hardResetData() {
  if (confirm("¿Estás seguro? Esto borrará la memoria local del navegador (caché) y recargará todo desde la nube. Úsalo si la página se queda trabada.")) {
    localStorage.clear();
    location.reload();
  }
}

/* Sube TODOS los leads del localStorage actual a Google Sheets.
   Úsalo en el computador que tiene los datos correctos para
   enviarlos a la nube y que el otro los pueda ver. */
async function forzarPushTotal() {
  if (!CRM_SCRIPT_URL) { toast('No hay URL de sincronización configurada', 'error'); return; }
  if (!leads.length)    { toast('No hay leads en este computador', 'error'); return; }

  const btn = document.getElementById('btnForzarPush');
  if (btn) { btn.disabled = true; btn.textContent = 'Subiendo...'; }

  let ok = 0, err = 0;
  // Enviar de a 3 en paralelo para no saturar el servidor
  const chunks = [];
  for (let i = 0; i < leads.length; i += 3) chunks.push(leads.slice(i, i + 3));

  for (const chunk of chunks) {
    await Promise.all(chunk.map(async lead => {
      try {
        await fetch(CRM_SCRIPT_URL, {
          method: 'POST',
          
          body: JSON.stringify({ action: 'saveLead', lead: JSON.stringify(lead) })
        });
        ok++;
      } catch (e) { err++; }
    }));
    // Pequeña pausa para no bloquear Apps Script
    await new Promise(r => setTimeout(r, 400));
  }

  if (btn) { btn.disabled = false; btn.textContent = '☁️ Subir todo a la nube'; }
  toast(`Push total: ${ok} leads subidos${err ? `, ${err} con error` : ''} ✓`, ok > 0 ? 'success' : 'error');
  console.log(`[forzarPushTotal] OK: ${ok}, ERR: ${err}`);
}

async function repararFullJSON() {
  if (!CRM_SCRIPT_URL) { toast('No hay URL configurada', 'error'); return; }
  const btn = document.getElementById('btnRepairJSON');
  if (btn) { btn.disabled = true; btn.textContent = 'Deduplicando en Drive...'; }

  try {
    // 1. Ejecutar deduplicación en el servidor
    const resDedup = await fetch(CRM_SCRIPT_URL + '?action=deduplicateLeads&t=' + Date.now());
    const dataDedup = await resDedup.json();
    const deletedCount = dataDedup.deletedCount || 0;

    if (btn) btn.textContent = 'Reparando Full_JSON...';

    // 2. Ejecutar reparación de Full_JSON en el servidor
    const resRep = await fetch(CRM_SCRIPT_URL + '?action=repairFullJSON&t=' + Date.now());
    const dataRep = await resRep.json();
    const repaired = dataRep.repaired || 0;

    toast(`✓ Deduplicados: ${deletedCount} borrados. Reparados: ${repaired} Full_JSON actualizados.`, 'success');

    // 3. Recargar leads del Drive para mostrar datos corregidos
    await cargarLeads();

  } catch(e) {
    console.error('[repararFullJSON] Error general:', e);
    toast('Error al procesar. Asegúrate de desplegar el Apps Script.', 'error');
  }
  if (btn) { btn.disabled = false; btn.textContent = '🛠 Reparar datos faltantes en Drive (Full_JSON)'; }
}
function doLogout(){
  localStorage.removeItem('icde_logged_in');
  document.documentElement.classList.remove('is-logged-in');
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) loginScreen.style.display = 'flex';

}