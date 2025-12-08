const CACHE_NAME = 'roommate-v1';
const urlsToCache = [
  'roommate'
];

// ติดตั้ง Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// การทำงานเมื่อมีการเรียกข้อมูล (ใช้ Network First เพื่อให้ได้ข้อมูลล่าสุดเสมอ)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});