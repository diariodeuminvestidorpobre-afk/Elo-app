/* eslint-disable no-restricted-globals */

// Service Worker for Elo PWA with Push Notifications

const CACHE_NAME = 'elo-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Push event - Handle incoming push notifications
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch (e) {
    data = { title: 'Elo', body: event.data?.text() ?? 'Nova notificação' };
  }

  const options = {
    body: data.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: { 
      url: data.url || '/',
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ],
    tag: data.tag || 'default',
    requireInteraction: false,
    renotify: true
  };

  const badgePromise = self.navigator?.setAppBadge ? 
    self.navigator.setAppBadge(data.badgeCount || 1) : 
    Promise.resolve();

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'Elo', options),
      badgePromise
    ])
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (self.navigator?.clearAppBadge) {
    self.navigator.clearAppBadge();
  }

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync (for offline actions)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-prayers') {
    event.waitUntil(syncPrayers());
  }
});

async function syncPrayers() {
  // Implement background sync logic for prayers
  console.log('Syncing prayers in background...');
}