// sw.js — Service Worker for offline vocab
const CACHE = 'vocab-v47';
const ASSETS = [
  './',
  './index.html',
  './vocab-data.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 音频文件：缓存优先
  if (url.pathname.includes('vocab-audio/')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }))
    );
    return;
  }
  // 图片文件：从Pexels/Wikimedia CDN在线加载，缓存优先
  if (url.hostname.includes('pexels.com') || url.hostname.includes('wikimedia.org')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request, {mode:'cors'}).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }).catch(() => new Response('Image unavailable', {status: 404})))
    );
    return;
  }
  // 其他：网络优先
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
