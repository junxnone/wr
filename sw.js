// 只缓存外壳本身（同源）。被嵌入的跨域网站不经过这个 Service Worker，所以断网时只有外壳能打开。
const CACHE = 'wr-v6';
const SHELL = ['./', 'index.html', 'reader.html', 'notes.html', 'share.html', 'notes.js', 'notes.css', 'update.js', 'books.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];

// 不在 install 里 skipWaiting：新版本装好后等待，由页面上的"刷新"提示（update.js）发消息触发切换
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});
self.addEventListener('message', (e) => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));

const put = (c, req, res) => { if (res.ok) c.put(req, res.clone()); return res; };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // 页面和书单（books.json）：网络优先，改了书单立刻生效；离线时回退缓存
  const fresh = req.mode === 'navigate' || url.pathname.endsWith('/books.json');
  e.respondWith(caches.open(CACHE).then((c) => {
    if (fresh) return fetch(req).then((res) => put(c, req, res)).catch(() => c.match(req, { ignoreSearch: true }));
    // 图标、manifest 等：先用缓存，同时后台更新
    return c.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => put(c, req, res));
      if (hit) { net.catch(() => {}); return hit; }
      return net;
    });
  }));
});
