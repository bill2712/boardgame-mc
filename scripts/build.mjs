// Builds the static, search-engine friendly pages from the game data:
//   index.html, zh-hans/index.html, en/index.html   (app shell + pre-rendered home)
//   games/<id>/, zh-hans/games/<id>/, en/games/<id>/ (guide pages)
//   sitemap.xml, robots.txt, 404.html
// Run: node scripts/build.mjs   (no dependencies)
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { GAMES, makeSetup } from '../js/games/index.js';
import { CATEGORIES } from '../js/content.js';
import { inLang, strings, toHans } from '../js/i18n.js';

export const SITE = 'https://bill2712.github.io/boardgame-mc/';
const ROOT = new URL('..', import.meta.url).pathname;
const VERSION = '3';
const LANGS = [
  { id: 'zh', prefix: '', html: 'zh-Hant', og: 'zh_HK', label: '繁體中文' },
  { id: 'zhs', prefix: 'zh-hans/', html: 'zh-Hans', og: 'zh_CN', label: '简体中文' },
  { id: 'en', prefix: 'en/', html: 'en', og: 'en_US', label: 'English' },
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const write = (rel, content) => {
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
};
const T = (lang, zh, en) => (lang === 'en' ? en : lang === 'zhs' ? toHans(zh) : zh);
const lines = (lang, arr) => (lang === 'en' ? arr.en : arr.zh.map((x) => (lang === 'zhs' ? toHans(x) : x)));
const playable = GAMES.filter((g) => g.category !== 'tool');

function head({ lang, title, desc, path, image, alternates, jsonld, base }) {
  const L = LANGS.find((l) => l.id === lang);
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <base href="${base}">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${SITE}${path}">
${alternates.map((a) => `  <link rel="alternate" hreflang="${a.hreflang}" href="${SITE}${a.path}">`).join('\n')}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(T(lang, '桌遊主持人', 'Board Game MC'))}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${SITE}${path}">
  <meta property="og:image" content="${SITE}${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="${L.og}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${SITE}${image}">
  <meta name="theme-color" content="#0a0b1e">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap">
  <link rel="stylesheet" href="css/style.css?v=${VERSION}">
${jsonld.map((j) => `  <script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}`;
}

function topbar(lang, langLinks) {
  const S = strings(lang);
  const home = LANGS.find((l) => l.id === lang).prefix || './';
  return `<header class="topbar">
    <a class="brand" href="${home}"><img src="icons/icon.svg" alt="" width="30" height="30"><span>${esc(S('appTitle'))}</span></a>
    <nav class="topbar-actions"><div class="lang-seg">${langLinks.map((l) => `<a href="${l.href}" hreflang="${l.html}" class="${l.on ? 'on' : ''}" style="text-decoration:none;padding:5px 9px;border-radius:9px;font-size:13px;font-weight:700">${l.short}</a>`).join('')}</div></nav>
  </header>`;
}

const shortOf = (id) => ({ zh: '繁', zhs: '简', en: 'EN' }[id]);

// ---------- home (app shell) ----------
function homePage(lang) {
  const L = LANGS.find((l) => l.id === lang);
  const S = strings(lang);
  const path = L.prefix;
  const base = lang === 'zh' ? './' : '../';
  const title = T(lang, '桌遊主持人 · 免費語音主持＋計時器｜狼人殺、阿瓦隆、芝士大盜、誰是臥底', 'Board Game MC · Free voice moderator & timer for Werewolf, Avalon, Cheese Thief and more');
  const desc = T(lang,
    '免費網上桌遊主持人：粵語、普通話、英文語音自動主持夜晚流程，附討論計時、電子派牌。支援狼人殺、阿瓦隆、芝士大盜、一夜終極狼人、誰是臥底、間諜危機、機密代號等 14 款熱門桌遊，不用安裝。',
    'A free online moderator for party board games: voice narration in Cantonese, Mandarin or English, discussion timers and digital role dealing for Werewolf, Avalon, Cheese Thief, One Night Ultimate Werewolf, Spyfall, Codenames and more. No install.');
  const alternates = [...LANGS.map((l) => ({ hreflang: l.html, path: l.prefix })), { hreflang: 'x-default', path: '' }];
  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: T(lang, '桌遊主持人', 'Board Game MC'), alternateName: ['Board Game MC', '桌遊主持人', '桌游主持人'],
      url: SITE + path, applicationCategory: 'GameApplication', operatingSystem: 'Any (web browser)', inLanguage: L.html, description: desc,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org', '@type': 'ItemList', name: T(lang, '支援的桌遊', 'Supported games'),
      itemListElement: playable.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: inLang(g.name, lang), url: `${SITE}${L.prefix}games/${g.id}/` })),
    },
  ];
  const langLinks = LANGS.map((l) => ({ href: l.prefix || './', html: l.html, short: shortOf(l.id), on: l.id === lang }));
  const prerender = `${topbar(lang, langLinks)}
  <main class="wrap home">
    <section class="hero">
      <span class="badge">✨ ${esc(S('heroBadge'))}</span>
      <h1 class="hero-title"><span class="grad">${esc(S('appTitle'))}</span></h1>
      <p class="hero-sub">${esc(S('appSub'))}</p>
    </section>
    <section class="features">
      ${[['🔊', 'featVoice'], ['🃏', 'featDeal'], ['⏱️', 'featTimer'], ['🗣️', 'featNames']].map(([i, k]) => `<div class="feature"><div class="feature-icon">${i}</div><b>${esc(S(k))}</b><p>${esc(S(`${k}Text`))}</p></div>`).join('\n      ')}
    </section>
    <h2 class="section-title">🎮 ${esc(S('gamesTitle'))}</h2>
    <div class="game-grid">
      ${GAMES.map((g) => `<a class="game-card" href="${L.prefix}games/${g.id}/" style="--c1:${g.colors[0]};--c2:${g.colors[1]}"><div class="gc-art"><span class="gc-emoji">${g.emoji}</span></div><div class="gc-body"><h3 class="gc-name" style="margin:0">${esc(inLang(g.name, lang))}</h3><p class="gc-tag" style="margin:0">${esc(inLang(g.tagline, lang))}</p><div class="gc-meta"><span>👥 ${g.players.min}–${g.players.max}</span><span class="gc-cat">${esc(inLang(CATEGORIES[g.category], lang))}</span></div></div></a>`).join('\n      ')}
    </div>
    <noscript><p class="tips">${esc(T(lang, '請開啟 JavaScript 使用語音主持功能。', 'Please enable JavaScript to use the voice moderator.'))}</p></noscript>
  </main>`;
  return `<!doctype html>
<html lang="${L.html}"${lang === 'zh' ? '' : ` data-lang="${lang}"`}>
<head>
  ${head({ lang, title, desc, path, image: 'og/home.jpg', alternates, jsonld, base })}
</head>
<body>
  <div id="app">
  ${prerender}
  </div>
  <script type="module" src="js/app.js?v=${VERSION}"></script>
</body>
</html>
`;
}

// ---------- guide pages ----------
function guidePage(game, lang) {
  const L = LANGS.find((l) => l.id === lang);
  const S = strings(lang);
  const name = inLang(game.name, lang);
  const path = `${L.prefix}games/${game.id}/`;
  const base = lang === 'zh' ? '../../' : '../../../';
  const homeHref = L.prefix || './';
  const appHref = `${homeHref}${lang === 'zh' ? '' : ''}#/game/${game.id}`;
  const isTool = game.category === 'tool';
  const title = isTool
    ? T(lang, `${name}｜免費桌遊發言計時器 · 桌遊主持人`, `${name} | Free board game speaking timer · Board Game MC`)
    : T(lang, `${name}主持人＋計時器｜玩法規則、角色、人數配置教學`, `${name} moderator & timer | Rules, roles and setup guide`);
  const rules = lines(lang, game.rules);
  const desc = `${inLang(game.tagline, lang)}${lang === 'en' ? '. ' : '。'}${rules[0]}`.slice(0, 160);
  const aka = (game.aka || []).filter((a) => a !== name);
  const alternates = [...LANGS.map((l) => ({ hreflang: l.html, path: `${l.prefix}games/${game.id}/` })), { hreflang: 'x-default', path: `games/${game.id}/` }];
  const faq = game.faq.map((f) => ({ q: inLang(f.q, lang), a: inLang(f.a, lang) }));
  const tips = lines(lang, game.tips);
  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: S('appTitle'), item: SITE + L.prefix },
        { '@type': 'ListItem', position: 2, name, item: SITE + path },
      ],
    },
    ...(isTool ? [] : [{
      '@context': 'https://schema.org', '@type': 'Game', name, alternateName: aka, description: desc, inLanguage: L.html, url: SITE + path,
      numberOfPlayers: { '@type': 'QuantitativeValue', minValue: game.players.min, maxValue: game.players.max },
      genre: inLang(CATEGORIES[game.category], lang),
    }]),
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];
  const langLinks = LANGS.map((l) => ({ href: `${l.prefix}games/${game.id}/`, html: l.html, short: shortOf(l.id), on: l.id === lang }));
  const teamLabel = (t) => ({ good: T(lang, '好人', 'Good'), evil: T(lang, '壞人', 'Evil'), neutral: T(lang, '第三方', 'Neutral') }[t]);

  const roleTable = game.roles.length ? `
    <h2>🎭 ${esc(T(lang, '角色介紹', 'Roles'))}</h2>
    <section class="card-sec table-scroll"><table class="role-table">
      <thead><tr><th>${esc(T(lang, '角色', 'Role'))}</th><th>${esc(T(lang, '陣營', 'Team'))}</th><th>${esc(T(lang, '能力', 'Ability'))}</th></tr></thead>
      <tbody>${game.roles.map((r) => `<tr><td><b>${r.emoji || ''} ${esc(inLang(r.name, lang))}</b></td><td><span class="team-pill ${r.team}">${esc(teamLabel(r.team))}</span></td><td>${esc(inLang(r.desc, lang))}</td></tr>`).join('')}</tbody>
    </table></section>` : '';

  const setupTable = game.roles.length ? `
    <h2>👥 ${esc(T(lang, '建議人數配置', 'Recommended setups'))}</h2>
    <section class="card-sec table-scroll"><table class="role-table">
      <thead><tr><th>${esc(T(lang, '人數', 'Players'))}</th><th>${esc(T(lang, '配置', 'Setup'))}</th></tr></thead>
      <tbody>${Array.from({ length: game.players.max - game.players.min + 1 }, (_, i) => game.players.min + i).map((n) => {
        const s = makeSetup(game, n);
        return `<tr><td><b>${n}</b></td><td>${esc(inLang(game.check(s).summary, lang))}</td></tr>`;
      }).join('')}</tbody>
    </table></section>` : '';

  const related = playable.filter((g) => g.id !== game.id && g.category === game.category).concat(playable.filter((g) => g.id !== game.id && g.category !== game.category)).slice(0, 4);

  return `<!doctype html>
<html lang="${L.html}">
<head>
  ${head({ lang, title, desc, path, image: `og/${game.id}.jpg`, alternates, jsonld, base })}
</head>
<body>
  ${topbar(lang, langLinks)}
  <main class="wrap guide setup" style="--c1:${game.colors[0]};--c2:${game.colors[1]}">
    <nav class="crumbs" aria-label="breadcrumb"><a href="${homeHref}">${esc(S('appTitle'))}</a> › ${esc(name)}</nav>
    <header class="setup-hero guide-hero">
      <div class="setup-emoji">${game.emoji}</div>
      <div class="setup-title">
        <h1>${esc(isTool ? name : T(lang, `${name} 主持人 · 玩法教學`, `${name}: moderator & rules guide`))}</h1>
        <p>${esc(inLang(game.tagline, lang))}</p>
        <div class="gc-meta light"><span>👥 ${game.players.min}–${game.players.max} ${esc(S('playersShort'))}</span>${game.time !== '—' ? `<span>⏳ ${game.time} ${esc(S('minutes'))}</span>` : ''}${game.best && game.best !== '—' ? `<span>⭐ ${esc(S('best'))} ${game.best}</span>` : ''}<span>${esc(inLang(CATEGORIES[game.category], lang))}</span></div>
        <div class="guide-cta"><a class="btn primary big" href="${appHref}">▶ ${esc(T(lang, '立即用 App 主持', 'Start with the app'))}</a></div>
      </div>
    </header>

    <section class="card-sec"><p>${esc(isTool
      ? T(lang, `${name}是桌遊主持人內置的免費工具，用語音提醒發言時間，適用於任何需要討論或輪流發言的桌遊。`, `${name} is a free tool in Board Game MC that keeps time with voice reminders, for any game with discussion or turn-based speaking.`)
      : T(lang, `想玩${name}但沒有人想當主持？桌遊主持人會用粵語、普通話或英文語音自動主持，包括夜晚流程、計時和電子派牌，所有人都可以一起玩。${aka.length ? `${name}又名${aka.slice(0, 3).join('、')}。` : ''}`,
        `Want to play ${name} without anyone sitting out as moderator? Board Game MC narrates it for you in Cantonese, Mandarin or English, with timers and optional digital role dealing.${aka.length ? ` Also known as ${aka.slice(0, 3).join(', ')}.` : ''}`))}</p></section>

    <h2>📖 ${esc(S('howToPlay'))}</h2>
    <section class="card-sec"><ol>${rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></section>
    ${roleTable}
    ${setupTable}
    <h2>💡 ${esc(S('tips'))}</h2>
    <section class="card-sec"><ul>${tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>

    <h2>❓ ${esc(S('faq'))}</h2>
    <section class="card-sec faq">${faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>

    <div style="margin:26px 0"><a class="btn primary big" href="${appHref}">▶ ${esc(T(lang, `開始主持${name}`, `Moderate ${name} now`))}</a></div>

    <h2>🎲 ${esc(T(lang, '更多熱門桌遊', 'More games'))}</h2>
    <div class="related">${related.map((g) => `<a class="mini" href="${L.prefix}games/${g.id}/" style="--c1:${g.colors[0]};--c2:${g.colors[1]}"><span class="mini-emoji">${g.emoji}</span><span>${esc(inLang(g.name, lang))}</span></a>`).join('')}</div>

    <footer class="foot">
      <nav class="foot-links">${GAMES.map((g) => `<a href="${L.prefix}games/${g.id}/">${esc(inLang(g.name, lang))}</a>`).join('')}</nav>
      <p>${esc(S('footer'))} · <a href="https://github.com/bill2712/boardgame-mc" rel="noopener">GitHub</a></p>
      <p class="small">${esc(T(lang, '非官方粉絲工具，與各遊戲出版商無關。請支持正版桌遊！', 'Unofficial fan-made helper, not affiliated with any publisher. Please support the original games!'))}</p>
    </footer>
  </main>
</body>
</html>
`;
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const group = (paths) => paths.map((p) => `  <url>
    <loc>${SITE}${p.self}</loc>
    <lastmod>${today}</lastmod>
${p.alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${SITE}${a.path}"/>`).join('\n')}
  </url>`).join('\n');
  const entries = [];
  const homeAlts = [...LANGS.map((l) => ({ hreflang: l.html, path: l.prefix })), { hreflang: 'x-default', path: '' }];
  for (const l of LANGS) entries.push({ self: l.prefix, alts: homeAlts });
  for (const g of GAMES) {
    const alts = [...LANGS.map((l) => ({ hreflang: l.html, path: `${l.prefix}games/${g.id}/` })), { hreflang: 'x-default', path: `games/${g.id}/` }];
    for (const l of LANGS) entries.push({ self: `${l.prefix}games/${g.id}/`, alts });
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${group(entries)}
</urlset>
`;
}

export function build() {
  for (const l of LANGS) {
    write(`${l.prefix}index.html`, homePage(l.id));
    for (const g of GAMES) write(`${l.prefix}games/${g.id}/index.html`, guidePage(g, l.id));
  }
  write('sitemap.xml', sitemap());
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
  write('404.html', `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 · 桌遊主持人</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/boardgame-mc/css/style.css"></head><body><main class="wrap" style="text-align:center;padding-top:80px"><div style="font-size:72px">🎲</div><h1>404</h1><p class="muted">找不到這個頁面 · Page not found</p><p><a class="btn primary" href="/boardgame-mc/">桌遊主持人 Board Game MC</a></p></main></body></html>\n`);
  return GAMES.length * LANGS.length + LANGS.length;
}

if (process.argv[1] && process.argv[1].endsWith('build.mjs')) {
  const n = build();
  console.log(`built ${n} pages${existsSync(join(ROOT, 'og')) ? '' : ' (og/ images missing: run scripts/og.cjs)'}`);
}
