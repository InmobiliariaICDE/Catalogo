// Service Worker para Notificaciones en Segundo Plano - ICDE Inmobiliaria Admin
const CACHE_NAME = 'icde-admin-v1';
const DEFAULT_ICON = 'https://i.imgur.com/s3dvfne.png';
const DEFAULT_BADGE = 'https://i.imgur.com/s3dvfne.png';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener para notificaciones enviadas directamente desde admin.html
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || '🔔 ICDE Inmobiliaria';
    const options = {
      body: event.data.body || 'Tienes una nueva actualización en tu panel de control.',
      icon: event.data.icon || DEFAULT_ICON,
      badge: event.data.badge || DEFAULT_BADGE,
      vibrate: [300, 100, 300, 100, 400],
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
    vibrate: [300, 100, 300, 100, 400],
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
