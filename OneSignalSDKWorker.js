try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js');
} catch(e) {
  console.warn('SDK externo omitido, usando motor nativo de Service Worker.');
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ═════════════════════════════════════════════════════════════════
// MOTOR NATIVO DE ALARMAS Y NOTIFICACIONES PUSH (100% INDEPENDIENTE)
// ═════════════════════════════════════════════════════════════════
const pendingNotifications = [];

function checkPendingNotifications() {
  const now = Date.now();
  for (let i = pendingNotifications.length - 1; i >= 0; i--) {
    const item = pendingNotifications[i];
    if (now >= item.triggerTimeMs) {
      self.registration.showNotification(item.title || 'Alerta ICDE Inmobiliaria', {
        body: item.body || '',
        icon: item.icon || 'https://i.imgur.com/s3dvfne.png',
        badge: item.badge || 'https://i.imgur.com/s3dvfne.png',
        vibrate: [500, 200, 500, 200, 800],
        renotify: true,
        tag: item.tag || 'icde-sched-' + now,
        data: { url: item.url || '/admin.html' }
      });
      pendingNotifications.splice(i, 1);
    }
  }
}

// Revisión continua cada 10 segundos
setInterval(checkPendingNotifications, 10000);

self.addEventListener('message', (event) => {
  if (!event.data) return;

  const data = event.data;

  // Mostrar notificación de inmediato desde el Service Worker
  if (data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(data.title || 'Alerta ICDE Inmobiliaria', {
      body: data.body || '',
      icon: data.icon || 'https://i.imgur.com/s3dvfne.png',
      badge: data.badge || 'https://i.imgur.com/s3dvfne.png',
      vibrate: [500, 200, 500, 200, 800],
      renotify: true,
      tag: data.tag || 'icde-sys-' + Date.now(),
      data: { url: data.url || '/admin.html' }
    });
  }

  // Programar notificación diferida en segundo plano
  if (data.type === 'SCHEDULE_NOTIFICATION' || data.type === 'SCHEDULE_TEST_NOTIFICATION') {
    const delay = data.delayMs || 10000;
    const triggerTime = Date.now() + delay;

    pendingNotifications.push({
      title: data.title || 'Alerta ICDE Inmobiliaria',
      body: data.body || '',
      icon: data.icon || 'https://i.imgur.com/s3dvfne.png',
      badge: data.badge || 'https://i.imgur.com/s3dvfne.png',
      url: data.url || '/admin.html',
      tag: data.tag || 'icde-sched-' + triggerTime,
      triggerTimeMs: triggerTime
    });

    setTimeout(() => {
      checkPendingNotifications();
    }, delay);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/admin.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes('admin.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
