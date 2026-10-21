// Small helpers shared by the app and the game scripts.
// Nothing here touches the DOM until h() is called, so games stay testable in Node.

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'text') el.textContent = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : String(c));
  }
  return el;
}

/** Bilingual text object. */
export const tx = (zh, en) => ({ zh, en });

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "2分15秒" / "2 minutes 15 seconds" for narration. */
export function spokenDuration(sec) {
  sec = Math.max(1, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const zh = (m ? `${m}分鐘` : '') + (s ? `${s}秒` : '');
  const en = [m ? `${m} minute${m > 1 ? 's' : ''}` : '', s ? `${s} second${s > 1 ? 's' : ''}` : '']
    .filter(Boolean).join(' ');
  return tx(zh, en);
}

/** Join a list of bilingual names: 梅林和莫甘娜 / Merlin and Morgana */
export function joinNames(items) {
  const zh = items.map((i) => i.zh);
  const en = items.map((i) => i.en);
  const joinZh = zh.length <= 1 ? zh.join('') : zh.slice(0, -1).join('、') + '和' + zh[zh.length - 1];
  const joinEn = en.length <= 1 ? en.join('') : en.slice(0, -1).join(', ') + ' and ' + en[en.length - 1];
  return tx(joinZh, joinEn);
}

/** Count occurrences of each id in a list. */
export function countBy(list) {
  const out = {};
  for (const x of list) out[x] = (out[x] || 0) + 1;
  return out;
}
