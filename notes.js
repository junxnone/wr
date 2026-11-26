// 笔记存储与公共函数（reader.html / notes.html / share.html 共用）。
// 数据放 localStorage 的 wr-notes（不和 new_kg 的 kg-notes 共用；两个站同域名，所以键名要不同）。
// 每条笔记 = 一个待办：{ id, book, title, quote, text, done, ts, upd }
(() => {
  const KEY = 'wr-notes';
  const load = () => {
    try { const l = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(l) ? l : []; } catch { return []; }
  };
  const save = (l) => {
    try { localStorage.setItem(KEY, JSON.stringify(l)); return true; } catch { alert('保存失败：浏览器存储不可用或已满'); return false; }
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const when = (t) => new Date(t).toLocaleString('zh-CN', { hour12: false }).slice(0, 16);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const add = ({ book = '', title = '', quote = '', text = '' }) => {
    const now = Date.now();
    const n = { id: uid(), book, title, quote, text, done: false, ts: now, upd: now };
    save(load().concat(n));
    return n;
  };
  const patch = (id, fn) => {
    const all = load(), n = all.find((x) => x.id === id);
    if (!n) return false;
    fn(n);
    return save(all);
  };
  const remove = (id) => save(load().filter((x) => x.id !== id));
  // 一条笔记的 HTML：引用（> 样式）在上，自己写的文字在下；整条是一个复选框
  const body = (n) => `<label class="todo${n.done ? ' done' : ''}"><input type="checkbox" data-id="${n.id}"${n.done ? ' checked' : ''}><span>${n.quote ? `<blockquote class="nq">${esc(n.quote)}</blockquote>` : ''}${esc(n.text)}</span></label>`;
  // 笔记归属的书（n.book）：书架上的书用 id；自定义网址用 "url:" + 去掉 # 的网址（见 recent.js 的 keyOf）；空 = 独立待办
  const bookHref = (book) => !book ? '' : book.startsWith('url:')
    ? `reader.html?url=${encodeURIComponent(book.slice(4))}`
    : `reader.html?id=${encodeURIComponent(book)}`;
  const books = () => fetch('books.json').then((r) => r.json()).catch(() => []);

  // 请浏览器别自动清理本站数据（不保证授予；防不了手动清除，仍建议定期导出）
  try { navigator.storage?.persist?.(); } catch {}

  window.WRN = { KEY, load, save, add, patch, remove, body, bookHref, esc, when, books };
})();
