// sw.js — Service Worker for offline vocab
const CACHE = 'vocab-v69';
const ASSETS = [
  './',
  './index.html',
  './vocab-data.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.includes('vocab-audio/') || url.pathname.includes('shadow-audio/') || url.pathname.includes('shadow-audio-v2/')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }))
    );
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});