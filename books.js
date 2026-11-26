// 书单（index.html / reader.html / share.html 共用）。
// 在本机存一份 books.json 的副本（localStorage 的 wr-books）：页面先同步用副本，书立刻开始加载，不用等网络；
// 同时后台请求最新书单并更新副本。
(() => {
  const KEY = 'wr-books';
  const cached = () => {
    try { const l = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(l) ? l : null; } catch { return null; }
  };
  const refresh = () => fetch('books.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('books.json ' + r.status))))
    .then((l) => {
      if (!Array.isArray(l)) throw new Error('books.json 格式不对');
      try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {}
      return l;
    });
  window.WRB = { cached, refresh };
})();
