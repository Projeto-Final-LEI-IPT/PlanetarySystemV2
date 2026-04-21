const CACHE_NAME = 'sistema-solar-v1';

// Lista de todos os ficheiros que queres que funcionem sem net
const urlsToCache = [
  './',
  './index.html',
  './Pages/GamePageX1.html',
  './Pages/GamePageX2.html',
  './Pages/GamePageX3.html',
  './Pages/GamePageX5.html',
  './js/script.js',
  './js/components.js',
  './js/componentsV2.js',
  './css/style.css',
  './SystemData.json',
  './system2.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Se tiver offline e o ficheiro estiver na cache, devolve a cache. Senão tenta a net.
      return response || fetch(event.request);
    })
  );
});