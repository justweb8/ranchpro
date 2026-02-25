// Service Worker — El Faical (compatible iPhone, Android, Windows)
const CACHE = 'elfaical-v2';
const ASSETS = [
  '/ranchpro/',
  '/ranchpro/index.html',
];

// Instalar y cachear
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // Google Script — siempre red, nunca cachear
  if(url.includes('script.google.com') || url.includes('googleapis.com')) {
    e.respondWith(
      fetch(e.request).catch(() => 
        new Response(JSON.stringify({error:'offline', rows:[]}), {
          headers:{'Content-Type':'application/json'}
        })
      )
    );
    return;
  }

  // Fuentes Google — caché primero
  if(url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || 
        fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => new Response(''))
      )
    );
    return;
  }

  // App principal — caché primero, red como respaldo
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('/ranchpro/index.html'));
    })
  );
});
