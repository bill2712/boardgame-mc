// Renders og/home.png and og/<game>.png (1200×630) with Playwright, then convert to JPEG:
//   python3 -c "from PIL import Image;import glob,os;[(Image.open(p).convert('RGB').save(p[:-4]+'.jpg',quality=84,optimize=True,progressive=True),os.remove(p)) for p in glob.glob('og/*.png')]"
// Usage: node scripts/build.mjs && python3 -m http.server 8765 & NODE_PATH=$(npm root -g) node scripts/og.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const { GAMES } = await import('../js/games/index.js');
  const out = path.join(__dirname, '..', 'og');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const card = ({ c1, c2, emoji, zh, en, sub }) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;800;900&display=swap">
<style>
body{margin:0;width:1200px;height:630px;font-family:Outfit,"Noto Sans CJK TC","Noto Sans TC","PingFang HK",sans-serif;color:#fff;overflow:hidden;
background:radial-gradient(circle at 18% 20%,rgba(255,255,255,.35),transparent 40%),linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;gap:56px;padding:0 80px;box-sizing:border-box;position:relative}
body::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.06) 0 14px,transparent 14px 28px)}
.e{font-size:220px;filter:drop-shadow(0 20px 30px rgba(0,0,0,.35));position:relative;z-index:1}
.t{position:relative;z-index:1}
h1{font-size:96px;margin:0;line-height:1.05;font-weight:900;letter-spacing:-.02em}
h2{font-size:44px;margin:10px 0 0;font-weight:700;opacity:.92}
p{font-size:30px;margin:26px 0 0;opacity:.9}
.b{position:absolute;right:48px;bottom:36px;z-index:1;font-size:28px;font-weight:800;background:rgba(0,0,0,.25);padding:10px 22px;border-radius:999px}
</style></head><body><div class="e">${emoji}</div><div class="t"><h1>${zh}</h1><h2>${en}</h2><p>${sub}</p></div><div class="b">🎲 桌遊主持人 · Board Game MC</div></body></html>`;
  const jobs = [{ file: 'home', c1: '#5b4dff', c2: '#ff5fa2', emoji: '🎲', zh: '桌遊主持人', en: 'Board Game MC', sub: '語音主持＋計時 · Voice moderator & timer' }]
    .concat(GAMES.map((g) => ({ file: g.id, c1: g.colors[0], c2: g.colors[1], emoji: g.emoji, zh: g.name.zh, en: g.name.en, sub: '語音主持＋計時 · Voice moderator & timer' })));
  for (const j of jobs) {
    await page.setContent(card(j), { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(out, `${j.file}.png`) });
  }
  await browser.close();
  console.log(`rendered ${jobs.length} images`);
})();
