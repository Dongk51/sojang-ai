const CACHE_NAME = 'sojang-ai-v1';
const APP_SHELL = ['/'];

// 설치: 앱 셸 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 네트워크 요청 처리: 오프라인 시 캐시 제공
self.addEventListener('fetch', (event) => {
  // API 요청은 캐싱하지 않음
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.url.includes('/api/')) return;

  if (event.request.mode === 'navigate') {
    // 페이지 이동: 네트워크 우선, 실패 시 캐시된 index 제공
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // 정적 자원: 캐시 우선, 없으면 네트워크 후 캐시 저장
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        return response;
      });
    })
  );
});

// 메인 스레드에서 postMessage로 알림 요청을 받아 처리
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, id } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      tag: `order-memo-${id}`,
      requireInteraction: false,
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/order-memo') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/order-memo');
    })
  );
});
