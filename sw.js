self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || '🔔 New delivery assigned', {
    body: d.body || 'Open the app to view the order',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'new-order',
    renotify: true,
    requireInteraction: true,
    vibrate: [400, 150, 400, 150, 800],
    data: { url: './ovenxrider.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      return clients.openWindow('./ovenxrider.html');
    })
  );
});
