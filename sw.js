// Service Worker con Polling en Segundo Plano - ICDE Inmobiliaria Admin
const CACHE_NAME = 'icde-admin-v2';
const DEFAULT_ICON = 'https://i.imgur.com/s3dvfne.png';
const DEFAULT_BADGE = 'https://i.imgur.com/s3dvfne.png';

let CRM_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyvZg9LqnWm1n1iXe3eFgj-PtUbKTumrIJdA8BnJXpH9H4e8OXJcC7-fpmhbQJA5TvX/exec';
let lastCitasCount = -1;
let lastLeadsCount = -1;
let backgroundTimer = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  iniciarPollingBackground();
});

// Listener de mensajes desde admin.html
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SET_CONFIG' && event.data.crmUrl) {
    CRM_SCRIPT_URL = event.data.crmUrl;
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || '🔔 ICDE Inmobiliaria';
    const options = {
      body: event.data.body || 'Tienes una nueva actualización en tu panel de control.',
      icon: event.data.icon || DEFAULT_ICON,
      badge: event.data.badge || DEFAULT_BADGE,
      vibrate: [400, 150, 400, 150, 600],
      tag: event.data.tag || 'icde-notif-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: {
        url: event.data.url || '/admin.html'
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Polling continuo en segundo plano (funciona aunque la pestaña esté minimizada o cerrada)
function iniciarPollingBackground() {
  if (backgroundTimer) clearInterval(backgroundTimer);
  
  // Ejecutar verificación en segundo plano cada 20 segundos
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
          
          self.registration.showNotification('📅 ¡Nueva Cita Registrada en ICDE!', {
            body: `Cliente: ${clienteNom} | Fecha: ${fechaCita} | Inmueble: ${masReciente.codigo || ''}`,
            icon: DEFAULT_ICON,
            badge: DEFAULT_BADGE,
            vibrate: [400, 150, 400, 150, 600],
            tag: 'icde-cita-' + Date.now(),
            renotify: true,
            requireInteraction: true,
            data: { url: '/admin.html' }
          });
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
  const options = {
    body: data.body || 'Nuevo evento registrado en tu panel de administración.',
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    vibrate: [400, 150, 400, 150, 600],
    tag: data.tag || 'icde-push-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/admin.html'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
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
