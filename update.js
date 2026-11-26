// 所有页面共用：① "安装应用"按钮（带 data-install 属性的元素）② 注册 Service Worker 并在有新版本时提示更新。
// 新版本装好后先等待（sw.js 不会自动 skipWaiting），用户点"立即更新"才切换并重载，避免读到一半页面突然变。
(() => {
  // ---- 安装应用：Chromium 系浏览器拦下 beforeinstallprompt，点按钮再弹出安装确认；iOS 没有这个事件，只给操作提示 ----
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferred = null;
  const sync = () => document.querySelectorAll('[data-install]').forEach((b) => { b.hidden = standalone() || !(deferred || ios); });
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; sync(); });
  addEventListener('appinstalled', () => { deferred = null; sync(); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-install]')) return;
    e.preventDefault();
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.finally(() => { deferred = null; sync(); });
    } else if (ios) alert('在 Safari 里点底部的“分享”按钮，再选“添加到主屏幕”。');
  });
  sync();

  // ---- 更新提示 ----
  if (!('serviceWorker' in navigator)) return;
  let wantReload = false, asked = false;

  const toast = (reg) => {
    if (asked) return;
    asked = true;
    const d = document.createElement('div');
    d.setAttribute('role', 'status');
    d.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(8px + env(safe-area-inset-top,0px));z-index:1000;display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:10px;background:rgba(17,24,39,.92);color:#fff;font:14px/1.4 -apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35);max-width:calc(100vw - 16px)';
    d.innerHTML = '<span>有新版本</span><button type="button" data-a="go">立即更新</button><button type="button" data-a="later">稍后</button>';
    d.querySelectorAll('button').forEach((b) => { b.style.cssText = 'padding:3px 10px;border:1px solid rgba(255,255,255,.5);border-radius:6px;background:transparent;color:#fff;font:inherit;cursor:pointer'; });
    d.querySelector('[data-a=go]').style.background = '#2563eb';
    d.addEventListener('click', (e) => {
      const a = e.target.dataset.a;
      if (a === 'later') d.remove();
      else if (a === 'go') {
        wantReload = true;
        if (reg.waiting) reg.waiting.postMessage('skip');
        else location.reload();
      }
    });
    document.body.append(d);
  };

  // 只在"用户点了刷新"之后才重载；第一次安装时 clients.claim 也会触发 controllerchange，那种情况不能重载
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (wantReload) location.reload(); });

  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const hasOld = () => !!navigator.serviceWorker.controller;
      if (reg.waiting && hasOld()) toast(reg);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed' && hasOld()) toast(reg); });
      });
      // 长时间开着的应用（已安装的 PWA）也要定期检查，回到前台时检查一次
      const check = () => reg.update().catch(() => {});
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    }).catch(() => {});
  });
})();
