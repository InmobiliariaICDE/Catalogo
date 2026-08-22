// Service Worker con Polling, Temporizadores y Voz en Segundo Plano - ICDE Inmobiliaria Admin
const CACHE_NAME = 'icde-admin-v7';
const DEFAULT_ICON = 'https://i.imgur.com/s3dvfne.png';
const DEFAULT_BADGE = 'https://i.imgur.com/s3dvfne.png';

let CRM_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyvZg9LqnWm1n1iXe3eFgj-PtUbKTumrIJdA8BnJXpH9H4e8OXJcC7-fpmhbQJA5TvX/exec';
let lastCitasCount = -1;
let backgroundTimer = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      iniciarPollingBackground();
    })
  );
});

function transmitirLecturaVoz(texto) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.postMessage({ type: 'SPEAK_TEXT', text: texto });
    }
  });
}

// Listener de mensajes desde admin.html
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SET_CONFIG' && event.data.crmUrl) {
    CRM_SCRIPT_URL = event.data.crmUrl;
  }

  // Programar notificación diferida en segundo plano
  if (event.data.type === 'SCHEDULE_TEST_NOTIFICATION') {
    const delay = event.data.delayMs || 10000;
    
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          const title = '🔔 Alerta ICDE Inmobiliaria';
          const body = '¡Confirmado! Notificación recibida en segundo plano con lectura de voz activa.';
          
          self.registration.showNotification(title, {
            body: body,
            icon: DEFAULT_ICON,
            badge: DEFAULT_BADGE,
            vibrate: [500, 200, 500, 200, 800],
            silent: false,
            tag: 'icde-test-10s-' + Date.now(),
            renotify: true,
            requireInteraction: true,
            data: { url: '/admin.html' }
          }).then(() => {
            transmitirLecturaVoz(title + '. ' + body);
            resolve();
          }).catch(resolve);
        }, delay);
      })
    );
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || '🔔 ICDE Inmobiliaria';
    const body = event.data.body || 'Tienes una nueva actualización en tu panel de control.';
    const options = {
      body: body,
      icon: event.data.icon || DEFAULT_ICON,
      badge: event.data.badge || DEFAULT_BADGE,
      vibrate: [500, 200, 500, 200, 800],
      silent: false,
      tag: event.data.tag || 'icde-notif-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: {
        url: event.data.url || '/admin.html'
      }
    };
    event.waitUntil(
      self.registration.showNotification(title, options).then(() => {
        transmitirLecturaVoz(title + '. ' + body);
      })
    );
  }
});

// Polling continuo en segundo plano (funciona aunque la pestaña esté minimizada o cerrada)
function iniciarPollingBackground() {
  if (backgroundTimer) clearInterval(backgroundTimer);
  backgroundTimer = setInterval(verificarNovedadesBackground, 20000);
}

async function verificarNovedadesBackground() {
  if (!CRM_SCRIPT_URL) return;
  try {
    const resCitas = await fetch(CRM_SCRIPT_URL + '?action=getCitas&t=' + Date.now());
    if (resCitas.ok) {
      const citas = await resCitas.json();
      if (Array.isArray(citas)) {
        if (lastCitasCount !== -1 && citas.length > lastCitasCount) {
          const masReciente = citas[citas.length - 1];
          const clienteNom = masReciente.cliente || 'Nuevo Cliente';
          const fechaCita = masReciente.fecha || 'Hoy';
          const title = '📅 ¡Nueva Cita Registrada en ICDE!';
          const body = `Cliente: ${clienteNom} | Fecha: ${fechaCita} | Inmueble: ${masReciente.codigo || ''}`;
          
          self.registration.showNotification(title, {
            body: body,
            icon: DEFAULT_ICON,
            badge: DEFAULT_BADGE,
            vibrate: [500, 200, 500, 200, 800],
            silent: false,
            tag: 'icde-cita-' + Date.now(),
            renotify: true,
            requireInteraction: true,
            data: { url: '/admin.html' }
          });
          
          transmitirLecturaVoz(`${title}. Cliente ${clienteNom}, agendó cita para el inmueble ${masReciente.codigo || ''}`);
        }
        lastCitasCount = citas.length;
      }
    }
  } catch (e) {
    // Silencioso en background
  }
}

// Soporte para Sync en segundo plano del navegador (Android PeriodicSync)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'icde-check-updates') {
    event.waitUntil(verificarNovedadesBackground());
  }
});

// Listener para notificaciones Push enviadas desde servidor (Web Push API)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.json();
  } catch (e) {
    data = { title: '🔔 Notificación ICDE', body: event.text() };
  }

  const title = data.title || '🔔 Alerta ICDE Inmobiliaria';
  const body = data.body || 'Nuevo evento registrado en tu panel de administración.';
  const options = {
    body: body,
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    vibrate: [500, 200, 500, 200, 800],
    silent: false,
    tag: data.tag || 'icde-push-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/admin.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      transmitirLecturaVoz(title + '. ' + body);
    })
  );
});

// Al hacer clic en la notificación del celular (en la barra superior o pantalla de bloqueo)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/admin.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
