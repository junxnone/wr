// 只缓存外壳本身（同源）。被嵌入的跨域网站不经过这个 Service Worker，所以断网时只有外壳能打开。
const CACHE = 'wr-v8';
const SHELL = ['./', 'index.html', 'reader.html', 'notes.html', 'share.html', 'notes.js', 'recent.js', 'books.js', 'notes.css', 'update.js', 'books.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];

// 不在 install 里 skipWaiting：新版本装好后等待，由页面上的"立即更新"提示（update.js）发消息触发切换
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});
self.addEventListener('message', (e) => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));

const put = (c, key, res) => { if (res.ok) c.put(key, res.clone()); return res; };

// 页面和书单：网络优先，改了书单立刻生效。
// 但 3 秒没响应且有缓存就先用缓存（"有信号但很慢"时不至于一直空白）；断网时用缓存。
// 页面按"不带查询参数的地址"缓存：reader.html?id=a 和 ?id=b 是同一个文件，不必各存一份。
const fresh = (c, req, key) => new Promise((resolve) => {
  let done = false;
  const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
  const hit = () => c.match(key);
  const t = setTimeout(() => hit().then(finish), 3000);
  fetch(req).then((res) => { clearTimeout(t); finish(put(c, key, res)); })
    .catch(() => { clearTimeout(t); hit().then((r) => finish(r || Response.error())); });
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then((c) => {
    if (req.mode === 'navigate' || url.pathname.endsWith('/books.json')) return fresh(c, req, url.origin + url.pathname);
    // 脚本、样式、图标、manifest 等：先用缓存，同时后台更新
    return c.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => put(c, req, res));
      if (hit) { net.catch(() => {}); return hit; }
      return net;
    });
  }));
});
