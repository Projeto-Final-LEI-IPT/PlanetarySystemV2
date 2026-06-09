const CACHE_NAME = 'sistema-solar-v2';

const urlsToCache = [
  './',
  './index.html',
  './Pages/GamePageX1.html',
  './Pages/GamePageX2.html',
  './Pages/GamePageX3.html',
  './Pages/GamePageX5.html',
  './js/script.js',
  './js/utils.js',
  './js/componentsV2.js',
  './js/initializerX1.js',
  './js/initializerX2.js',
  './js/initializerX3.js',
  './js/initializerX5.js',
  './css/styleVH.css',
  './data/SystemDataX1.json',
  './data/SystemDataX2.json',
  './data/SystemDataX3.json',
  './data/SystemDataX5.json',
  // Bibliotecas externas para garantir funcionamento offline total
  'https://aframe.io/releases/1.7.1/aframe.min.js',
  'https://raw.githack.com/AR-js-org/AR.js/3.4.7/three.js/build/ar-threex-location-only.js',
  'https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js'
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