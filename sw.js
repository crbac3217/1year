// 파일을 수정해서 재배포할 때는 CACHE 버전을 올리세요.
const CACHE = 'anniv-v34';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './stages.js',
  './lib/jsQR.js',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
  './icons/apple-touch-icon.png',
  './images/sample.svg',
  './images/image1.jpg',
  './tools/hash.html'
  // lib/ 에 라이브러리를 추가하면 여기에도 적어주세요.
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// cache-first, 없으면 네트워크
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request))
  );
});

// 페이지가 "캐시 다 됐나?" 물어보면 답해줌
self.addEventListener('message', async e => {
  if (e.data !== 'CHECK') return;
  const c = await caches.open(CACHE);
  const keys = await c.keys();
  e.source.postMessage({ cached: keys.length, total: ASSETS.length, cache: CACHE });
});
