importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js');

// ═════════════════════════════════════════════════════════════════
// MANEJADOR DE NOTIFICACIONES SERVICE WORKER EN SEGUNDO PLANO
// ═════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  if (!event.data) return;

  const data = event.data;

  // Mostrar notificación de inmediato desde el Service Worker
  if (data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(data.title || 'Alerta ICDE', {
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
    setTimeout(() => {
      self.registration.showNotification(data.title || 'Alerta ICDE Inmobiliaria', {
        body: data.body || '',
        icon: data.icon || 'https://i.imgur.com/s3dvfne.png',
        badge: data.badge || 'https://i.imgur.com/s3dvfne.png',
        vibrate: [500, 200, 500, 200, 800],
        renotify: true,
        tag: data.tag || 'icde-sched-' + Date.now(),
        data: { url: data.url || '/admin.html' }
      });
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
