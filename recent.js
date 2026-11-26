// 最近阅读（index.html / reader.html 共用）。
// 数据放 localStorage 的 wr-recent：[{ key, url, id, title, renamed, ts }]，最近的在前，最多 30 条。
// 书架上的书用 id 作 key；自定义地址用"去掉 # 的网址"作 key（同一本书的页内路由算一条）。
(() => {
  const KEY = 'wr-recent', MAX = 30;
  const load = () => {
    try { const l = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(l) ? l : []; } catch { return []; }
  };
  const save = (l) => { try { localStorage.setItem(KEY, JSON.stringify(l)); return true; } catch { return false; } };
  const keyOf = (url) => { try { const u = new URL(url); u.hash = ''; return u.href; } catch { return url; } };

  // 把用户输入变成合法网址：没写协议就补 https://；不是网址返回 ''
  const parse = (s) => {
    s = String(s || '').trim();
    if (!s) return '';
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
    try {
      const u = new URL(s);
      const h = u.hostname;
      const ok = /^https?:$/.test(u.protocol) && (h.includes('.') || h === 'localhost');
      return ok ? u.href : '';
    } catch { return ''; }
  };

  // 默认书名：主机名（路径有第一段就带上），例如 example.com/book
  const nameOf = (url) => {
    try {
      const u = new URL(url);
      const seg = u.pathname.split('/').filter(Boolean)[0];
      return u.hostname + (seg ? '/' + seg : '');
    } catch { return url; }
  };

  // 记录一次阅读，返回保存后的条目（用户改过名的标题会保留）
  const touch = ({ url, title = '', id = '' }) => {
    const key = id ? 'id:' + id : keyOf(url);
    const all = load();
    const old = all.find((x) => x.key === key);
    const e = { key, url, id, title: old && old.renamed ? old.title : (title || nameOf(url)), renamed: !!(old && old.renamed), ts: Date.now() };
    save([e].concat(all.filter((x) => x.key !== key)).slice(0, MAX));
    return e;
  };
  const rename = (key, title) => {
    const all = load(), e = all.find((x) => x.key === key);
    if (!e) return false;
    e.title = title; e.renamed = true;
    return save(all);
  };
  const remove = (key) => save(load().filter((x) => x.key !== key));
  const clear = () => save([]);

  window.WRR = { load, parse, keyOf, nameOf, touch, rename, remove, clear };
})();
