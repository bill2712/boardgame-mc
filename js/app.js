import { h, fmtTime, pick } from './util.js';
import { settings, saveSettings, loadSetup, saveSetup, markPlayed, toggleFavorite, loadStats, recordPlay, recordWinner, clearStats } from './settings.js';
import { t, L, N, UI_LANGS } from './i18n.js';
import { GAMES, gameById, makeSetup, restoreSetup } from './games/index.js';
import { CATEGORIES, ROLE_TIPS } from './content.js';
import { customPairs, customWords } from './games/words.js';
import { GUIDES } from './guides.js';
import { Runner, renderRoleCard, seatLabel, playerName as playerNameOf } from './runner.js';
import { supported as ttsSupported, voicesFor, currentVoice, onVoices, cancel, unlockWith, onStatus, status as ttsStatus, resetVoiceMemory } from './speech.js';
import { unlockAudio } from './sound.js';
import { confetti, sky } from './fx.js';

const app = document.getElementById('app');
let runner = null;
let wakeLock = null;
let clockTimer = null;
let offStatus = null;

/** Plain-language reason why speech isn't working. */
function voiceProblemText(st) {
  if (st.state === 'unsupported') return t('voiceUnsupported');
  if (st.state === 'blocked') return t('voiceBlocked');
  if (st.state === 'silent') return t('voiceSilent');
  return `${t('voiceFailed')} (${st.error})`;
}
const ui = { query: '', cat: 'all', players: 0 };

// Language from ?lang=… or from the /en/ and /zh-hans/ landing pages (<html data-lang>).
const forcedLang = new URLSearchParams(location.search).get('lang') || document.documentElement.dataset.lang;
if (forcedLang && UI_LANGS.some((l) => l.id === forcedLang)) { settings.uiLang = forcedLang; saveSettings(); }

// ---------- theme & language ----------
function applyTheme() {
  const root = document.documentElement;
  if (settings.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', settings.theme);
  root.lang = UI_LANGS.find((l) => l.id === settings.uiLang)?.html || 'en';
}

/** Relative link to a game's static guide page in the current language. */
function guideHref(id) {
  const prefix = settings.uiLang === 'en' ? 'en/' : settings.uiLang === 'zhs' ? 'zh-hans/' : '';
  return `${prefix}games/${id}/`;
}

/** Relative link to a long-form guide article in the current language. */
function articleHref(id) {
  const prefix = settings.uiLang === 'en' ? 'en/' : settings.uiLang === 'zhs' ? 'zh-hans/' : '';
  return `${prefix}guides/${id}/`;
}

/** Link to an in-app screen on the current page (ignores <base href>). */
const hashHref = (hash) => `${location.pathname}${location.search}${hash}`;

const rulesOf = (game) => (settings.uiLang === 'en' ? game.rules.en : game.rules.zh.map((r) => L({ zh: r })));

/** Display name for a winner id: good / evil / neutral, team1…team4, or a game's own team names. */
function teamLabel(game, team) {
  if (game.teamNames?.[team]) return L(game.teamNames[team]);
  if (team === 'good') return t('teamGood');
  if (team === 'evil') return t('teamEvil');
  if (team === 'neutral') return t('teamNeutral');
  const m = /^team(\d+)$/.exec(team);
  return m ? t('teamN', { n: m[1] }) : team;
}

/** Sides that can win a game, for the "who won?" buttons. Party games without sides return []. */
function winnerChoices(game) {
  if (game.teamNames) return Object.keys(game.teamNames);
  const teams = new Set(game.roles.map((r) => r.team));
  return ['good', 'evil', 'neutral'].filter((x) => teams.has(x));
}

const tracksStats = (game) => game.category !== 'tool';

function statsLine(game) {
  const st = loadStats(game.id);
  if (!st.plays) return null;
  const wins = Object.entries(st.wins).sort((a, b) => b[1] - a[1]);
  return h('section', { class: 'card-sec stats-sec' },
    h('div', { class: 'stats-head' },
      h('b', {}, '📊 ', t('stats')),
      h('span', { class: 'muted small' }, t('statsPlays', { n: st.plays })),
      h('button', { class: 'link-btn small', onclick: (e) => { clearStats(game.id); e.target.closest('.stats-sec').remove(); toast(t('statsCleared')); } }, t('statsClear'))),
    wins.length ? h('div', { class: 'stats-bars' }, wins.map(([team, n]) => {
      const total = wins.reduce((a, [, v]) => a + v, 0);
      return h('div', { class: `stat-bar win-${team}` },
        h('span', { class: 'sb-label' }, teamLabel(game, team)),
        h('span', { class: 'sb-track' }, h('span', { class: 'sb-fill', style: { width: `${Math.round((n / total) * 100)}%` } })),
        h('span', { class: 'sb-num' }, String(n)));
    })) : null);
}

// ---------- routing ----------
function route() {
  stopGame();
  applyTheme();
  const [, page, id] = location.hash.split('/');
  if (page === 'game' && gameById(id)) {
    const g = gameById(id);
    document.title = `${L(g.name)} · ${t('appTitle')}`;
    return renderSetup(g);
  }
  document.title = `${t('appTitle')} · Board Game MC`;
  renderHome();
}
window.addEventListener('hashchange', route);

function langMenu() {
  return h('div', { class: 'lang-seg', role: 'group', 'aria-label': t('uiLang') }, UI_LANGS.map((l) => h('button', {
    class: settings.uiLang === l.id ? 'on' : '',
    'aria-pressed': settings.uiLang === l.id ? 'true' : 'false',
    title: l.label,
    onclick: () => switchLang(l.id),
  }, l.short)));
}

/** Change language and move to that language's URL (/, /zh-hans/, /en/), keeping the current screen. */
function switchLang(id) {
  settings.uiLang = id;
  saveSettings();
  const prefix = { zh: '', zhs: 'zh-hans/', en: 'en/' }[id];
  const target = new URL(prefix || './', document.baseURI);
  target.hash = location.hash;
  if (target.pathname !== location.pathname) location.href = target.href;
  else route();
}

function header({ back } = {}) {
  return h('header', { class: 'topbar' },
    back
      ? h('button', { class: 'icon-btn', 'aria-label': t('back'), onclick: () => { location.hash = '#/'; } }, '←')
      : h('a', { class: 'brand', href: hashHref('#/') }, h('img', { src: 'icons/icon.svg', alt: '', width: 30, height: 30 }), h('span', {}, t('appTitle'))),
    h('div', { class: 'topbar-actions' },
      langMenu(),
      h('button', { class: 'icon-btn', 'aria-label': t('share'), title: t('share'), onclick: share }, '↗'),
      h('button', { class: 'icon-btn', 'aria-label': t('settings'), title: t('settings'), onclick: openSettings }, '⚙'),
    ),
  );
}

async function share() {
  const url = location.href.split('#')[0];
  const data = { title: t('appTitle'), text: t('appSub'), url };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(url); toast(t('copied')); }
  } catch { /* cancelled */ }
}

function toast(msg) {
  const el = h('div', { class: 'toast' }, msg);
  document.body.append(el);
  setTimeout(() => el.classList.add('out'), 1600);
  setTimeout(() => el.remove(), 2100);
}

// ---------- home ----------
function gameCard(g) {
  const fav = (settings.favorites || []).includes(g.id);
  const favBtn = h('button', {
    class: `fav ${fav ? 'on' : ''}`, 'aria-label': t('favorites'), 'aria-pressed': fav ? 'true' : 'false',
    onclick: (e) => {
      e.preventDefault(); e.stopPropagation();
      const on = toggleFavorite(g.id);
      favBtn.classList.toggle('on', on);
      favBtn.textContent = on ? '♥' : '♡';
      renderHome(true);
    },
  }, fav ? '♥' : '♡');
  // The ♥ button sits next to the link, not inside it (a button inside a link is invalid HTML).
  return h('div', { class: 'gc-wrap', style: { '--c1': g.colors[0], '--c2': g.colors[1] } },
    h('a', { class: 'game-card', href: hashHref(`#/game/${g.id}`) },
      h('div', { class: 'gc-art' }, h('span', { class: 'gc-emoji' }, g.emoji)),
      h('div', { class: 'gc-body' },
        h('div', { class: 'gc-name' }, L(g.name)),
        h('div', { class: 'gc-tag' }, L(g.tagline)),
        h('div', { class: 'gc-meta' },
          h('span', {}, `👥 ${g.players.min}–${g.players.max}`),
          g.time !== '—' ? h('span', {}, `⏳ ${g.time}′`) : null,
          h('span', { class: 'gc-cat' }, L(CATEGORIES[g.category])),
        ),
      ),
    ),
    favBtn,
  );
}

function filtered() {
  const q = ui.query.trim().toLowerCase();
  return GAMES.filter((g) => {
    if (ui.cat !== 'all' && g.category !== ui.cat) return false;
    if (ui.players && (ui.players < g.players.min || ui.players > g.players.max)) return false;
    if (!q) return true;
    const hay = [g.name.zh, g.name.en, L(g.name), L(g.tagline), ...(g.aka || [])].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function renderHome(keepScroll) {
  const y = window.scrollY;
  const grid = h('div', { class: 'game-grid' });
  const paintGrid = () => {
    const list = filtered();
    grid.replaceChildren(...(list.length ? list.map(gameCard) : [h('p', { class: 'muted empty' }, t('noMatch'))]));
  };
  const chip = (label, on, onclick) => h('button', { class: `chip ${on ? 'on' : ''}`, onclick }, label);
  const toolbar = h('div', { class: 'toolbar' });
  const paintToolbar = () => toolbar.replaceChildren(
    h('label', { class: 'search' }, h('span', { 'aria-hidden': 'true' }, '🔍'),
      h('input', { type: 'search', placeholder: t('search'), value: ui.query, 'aria-label': t('search'),
        oninput: (e) => { ui.query = e.target.value; paintGrid(); } })),
    h('div', { class: 'chips' }, Object.entries(CATEGORIES).map(([id, label]) =>
      chip(L(label), ui.cat === id, () => { ui.cat = id; paintToolbar(); paintGrid(); }))),
    h('div', { class: 'chips' },
      chip(t('anyPlayers'), !ui.players, () => { ui.players = 0; paintToolbar(); paintGrid(); }),
      [3, 4, 5, 6, 7, 8, 10, 12].map((n) => chip(`${n}${settings.uiLang === 'en' ? '' : ' '}${settings.uiLang === 'en' ? 'p' : t('playersShort')}`, ui.players === n,
        () => { ui.players = ui.players === n ? 0 : n; paintToolbar(); paintGrid(); }))),
  );
  paintToolbar();
  paintGrid();

  const recent = (settings.recent || []).map(gameById).filter(Boolean);
  const favs = (settings.favorites || []).map(gameById).filter(Boolean);
  const mini = (g) => h('a', { class: 'mini', href: hashHref(`#/game/${g.id}`), style: { '--c1': g.colors[0], '--c2': g.colors[1] } },
    h('span', { class: 'mini-emoji' }, g.emoji), h('span', {}, L(g.name)));

  const orbit = ['🎲', '🃏', '🌙', '🐺', '🧀', '🙊', '🏰', '⏱️'];
  app.replaceChildren(
    header(),
    h('main', { class: 'wrap home' },
      h('section', { class: 'hero' },
        h('div', { class: 'hero-orbit', 'aria-hidden': 'true' }, orbit.map((e, i) => h('span', { style: { '--i': i } }, e))),
        h('span', { class: 'badge' }, '✨ ', t('heroBadge')),
        h('h1', { class: 'hero-title' }, h('span', { class: 'grad' }, t('appTitle'))),
        h('p', { class: 'hero-sub' }, t('appSub')),
        h('div', { class: 'hero-cta' },
          h('a', { class: 'btn primary big', href: '#games', onclick: (e) => { e.preventDefault(); document.getElementById('games').scrollIntoView({ behavior: 'smooth' }); } }, '🎲 ', t('heroCta')),
          h('button', { class: 'btn ghost big', onclick: () => { location.hash = `#/game/${pick(GAMES.filter((g) => g.category !== 'tool')).id}`; } }, '🔀 ', t('heroRandom')),
        ),
        h('div', { class: 'stats' },
          h('div', {}, h('b', {}, String(GAMES.filter((g) => g.category !== 'tool').length)), h('span', {}, t('statGames'))),
          h('div', {}, h('b', {}, '3'), h('span', {}, t('statLangs'))),
          h('div', {}, h('b', {}, '100%'), h('span', {}, t('statFree'))),
        ),
      ),
      h('section', { class: 'features' }, [
        ['🔊', 'featVoice'], ['🃏', 'featDeal'], ['⏱️', 'featTimer'], ['🗣️', 'featNames'],
      ].map(([icon, k]) => h('div', { class: 'feature' }, h('div', { class: 'feature-icon' }, icon), h('b', {}, t(k)), h('p', {}, t(`${k}Text`))))),
      favs.length ? h('section', {}, h('h2', { class: 'section-title' }, '♥ ', t('favorites')), h('div', { class: 'mini-row' }, favs.map(mini))) : null,
      recent.length ? h('section', {}, h('h2', { class: 'section-title' }, '🕘 ', t('recent')), h('div', { class: 'mini-row' }, recent.map(mini))) : null,
      h('section', { id: 'games' },
        h('h2', { class: 'section-title' }, '🎮 ', t('gamesTitle')),
        toolbar,
        grid,
      ),
      h('section', {},
        h('h2', { class: 'section-title' }, '📚 ', t('moreGuides')),
        h('div', { class: 'guide-cards' }, GUIDES.map((g) => h('a', { class: 'guide-card', href: articleHref(g.id) },
          h('span', { class: 'guide-emoji' }, g.emoji), h('span', {}, h('b', {}, L(g.short)), h('small', {}, L(g.desc))))))),
      h('section', { class: 'tips' },
        h('p', {}, '💡 ', t('tipVoice')),
        h('p', {}, '📱 ', t('installHint')),
      ),
      h('footer', { class: 'foot' },
        h('nav', { class: 'foot-links' }, GAMES.filter((g) => g.category !== 'tool').map((g) => h('a', { href: guideHref(g.id) }, L(g.name)))),
        h('p', {}, t('footer'), ' · ', h('a', { href: 'https://github.com/bill2712/boardgame-mc', rel: 'noopener' }, 'GitHub')),
      ),
    ),
  );
  if (keepScroll) window.scrollTo(0, y);
}

// ---------- setup ----------
function renderSetup(game) {
  let setup = restoreSetup(game, loadSetup(game.id));

  const body = h('div', { class: 'setup-body' });
  const startBtn = h('button', { class: 'btn big primary start', onclick: () => startGame(game, setup) }, '▶ ', t('start'));
  const usesSeats = game.id !== 'codenames' && game.id !== 'charades';

  const paint = () => {
    const res = game.check(setup);
    const counts = {};
    for (const id of game.deck(setup)) counts[id] = (counts[id] || 0) + 1;
    startBtn.disabled = res.errors.length > 0;

    body.replaceChildren(
      h('section', { class: 'card-sec players-sec' },
        h('div', { class: 'row' },
          h('div', { class: 'row-label' }, h('b', {}, t('players'))),
          stepper(setup.n, game.players.min, game.players.max, 1, (v) => { setup = makeSetup(game, v, setup.opts); paint(); }, t('playersShort')),
        ),
        h('div', { class: 'people', 'aria-hidden': 'true' }, Array.from({ length: setup.n }, (_, i) => h('span', { style: { '--i': i } }, String(i + 1)))),
        usesSeats ? namesEditor(setup.n) : null,
      ),
      game.roles.length ? h('section', { class: 'card-sec' },
        h('h3', {}, t('roles')),
        h('div', { class: 'role-list' }, game.roles.map((r) => {
          let control;
          if (r.fixed) control = h('span', { class: 'count-tag' }, `${t('fixed')} ×${counts[r.id] || 1}`);
          else if (r.auto) control = h('span', { class: 'count-tag' }, `${t('auto')} ×${counts[r.id] || 0}`);
          else if ((r.max || 1) === 1 && !r.min) control = toggle(!!setup.roles[r.id], (v) => { setup.roles[r.id] = v ? 1 : 0; paint(); });
          else control = stepper(setup.roles[r.id] || 0, r.min || 0, r.max || 1, 1, (v) => { setup.roles[r.id] = v; paint(); });
          const active = r.fixed || r.auto ? (counts[r.id] || 0) > 0 : (setup.roles[r.id] || 0) > 0;
          return h('div', { class: `role team-${r.team} ${active ? 'active' : ''}` },
            h('div', { class: 'role-emoji' }, r.emoji || '🎭'),
            h('div', { class: 'row-label' }, h('b', {}, L(r.name)), r.desc ? h('div', { class: 'row-desc' }, L(r.desc)) : null),
            control);
        })),
      ) : null,
      game.options.length ? h('section', { class: 'card-sec' },
        h('h3', {}, t('options')),
        game.options.filter((o) => !o.showIf || o.showIf(setup)).map((o) => {
          let control;
          const set = (v) => { setup.opts[o.id] = v; paint(); };
          if (o.type === 'toggle') control = toggle(!!setup.opts[o.id], set);
          else if (o.type === 'number') control = stepper(setup.opts[o.id], o.min, o.max, o.step || 1, set, unitLabel(o.unit));
          else control = h('select', { class: 'select', onchange: (e) => set(e.target.value) },
            o.choices.map((c) => h('option', { value: c.value, selected: setup.opts[o.id] === c.value }, L(c.label))));
          return h('div', { class: 'row' }, h('div', { class: 'row-label' }, L(o.label)), control);
        }),
      ) : null,
      h('section', { class: `card-sec summary ${res.errors.length ? 'has-errors' : ''}` },
        h('div', { class: 'summary-main' }, '📋 ', L(res.summary)),
        res.errors.map((e) => h('div', { class: 'msg error' }, '⛔ ', L(e))),
        res.warnings.map((w) => h('div', { class: 'msg warn' }, '⚠️ ', L(w))),
      ),
    );
  };

  app.replaceChildren(
    header({ back: true }),
    h('main', { class: 'wrap setup', style: { '--c1': game.colors[0], '--c2': game.colors[1] } },
      h('div', { class: 'setup-hero' },
        h('div', { class: 'setup-emoji' }, game.emoji),
        h('div', { class: 'setup-title' },
          h('h1', {}, L(game.name)),
          h('p', {}, L(game.tagline)),
          h('div', { class: 'gc-meta light' },
            h('span', {}, `👥 ${game.players.min}–${game.players.max}`),
            game.time !== '—' ? h('span', {}, `⏳ ${game.time} ${t('minutes')}`) : null,
            game.best && game.best !== '—' ? h('span', {}, `⭐ ${t('best')} ${game.best}`) : null,
            h('span', {}, L(CATEGORIES[game.category]))),
        ),
      ),
      h('details', { class: 'rules card-sec' },
        h('summary', {}, '📖 ', t('rules')),
        h('ul', {}, rulesOf(game).map((line) => h('li', {}, line))),
        h('a', { class: 'guide-link', href: guideHref(game.id) }, t('guide'), ' →')),
      tracksStats(game) ? statsLine(game) : null,
      body,
      h('div', { class: 'sticky-start' }, startBtn),
    ),
  );
  paint();
}

function namesEditor(n) {
  const names = settings.names || [];
  const filled = names.slice(0, n).some((x) => x && x.trim());
  return h('details', { class: 'names', open: filled },
    h('summary', {}, '🗣️ ', t('names')),
    h('p', { class: 'muted small' }, t('namesHint')),
    h('div', { class: 'names-grid' }, Array.from({ length: n }, (_, i) => h('label', { class: 'name-field' },
      h('span', {}, String(i + 1)),
      h('input', {
        type: 'text', maxlength: 12, value: names[i] || '', placeholder: t('namePh', { n: i + 1 }), autocomplete: 'off',
        oninput: (e) => { settings.names = [...(settings.names || [])]; settings.names[i] = e.target.value; saveSettings(); },
      })))),
    filled ? h('button', { type: 'button', class: 'btn small', onclick: () => { settings.names = []; saveSettings(); route(); } }, t('clearNames')) : null,
  );
}

function unitLabel(unit) {
  if (unit === 'min') return t('minutes');
  if (unit === 'sec') return settings.uiLang === 'en' ? 's' : '秒';
  return '';
}

function stepper(value, min, max, step, onChange, unit) {
  return h('div', { class: 'stepper' },
    h('button', { type: 'button', class: 'step-btn', disabled: value <= min, 'aria-label': '−', onclick: () => onChange(Math.max(min, value - step)) }, '−'),
    h('span', { class: 'step-val' }, String(value), unit ? h('small', {}, ` ${unit}`) : null),
    h('button', { type: 'button', class: 'step-btn', disabled: value >= max, 'aria-label': '+', onclick: () => onChange(Math.min(max, value + step)) }, '+'),
  );
}

function toggle(on, onChange) {
  return h('button', {
    type: 'button', class: `switch ${on ? 'on' : ''}`, role: 'switch', 'aria-checked': on ? 'true' : 'false',
    onclick: () => onChange(!on),
  }, h('span', { class: 'knob' }));
}

// ---------- play ----------
async function startGame(game, setup) {
  stopGame();
  // Must run synchronously inside the tap: a real spoken line unlocks speech for the session.
  resetVoiceMemory();
  unlockWith(N(game.name));
  saveSetup(game.id, setup);
  markPlayed(game.id);
  unlockAudio();
  requestWakeLock();

  const els = {
    phase: h('div', { class: 'phase' }),
    clock: h('div', { class: 'clock' }, '0:00'),
    board: h('div', { class: 'board' }),
    caption: h('div', { class: 'caption' }),
    countdown: h('div', { class: 'countdown hidden' }),
    stage: h('div', { class: 'stage' }),
    pausedBadge: h('div', { class: 'paused-badge hidden' }, '⏸ ', t('paused')),
    voiceBanner: h('div', { class: 'voice-banner hidden', role: 'alert' }),
    roleBtn: h('button', { class: 'icon-btn small role-btn hidden', 'aria-label': t('myRole'), title: t('myRole') }, '🪪'),
    rulesBtn: h('button', { class: 'icon-btn small', 'aria-label': t('rulesNow'), title: t('rulesNow') }, '📖'),
  };
  const view = {
    caption(text) {
      els.caption.textContent = text;
      els.caption.classList.remove('pop');
      void els.caption.offsetWidth;
      els.caption.classList.add('pop');
    },
    countdown(rem, total, label) {
      if (rem == null) { els.countdown.classList.add('hidden'); return; }
      els.countdown.classList.remove('hidden');
      const pct = total ? Math.max(0, Math.min(1, rem / total)) : 0;
      els.countdown.replaceChildren(
        h('div', { class: 'cd-ring', style: { '--p': pct } }, h('span', {}, String(Math.ceil(rem)))),
        label ? h('div', { class: 'cd-label' }, label) : null,
      );
    },
    stage(node) { els.stage.replaceChildren(...(node ? [node] : [])); },
    board(node) { els.board.replaceChildren(...(node ? [node] : [])); },
    phase(text, night) {
      els.phase.textContent = text;
      els.phase.classList.remove('pop'); void els.phase.offsetWidth; els.phase.classList.add('pop');
      document.body.classList.toggle('night', !!night);
      document.body.classList.toggle('day', !night);
    },
    onDealt() { els.roleBtn.classList.remove('hidden'); },
    onPause(p) {
      els.pausedBadge.classList.toggle('hidden', !p);
      pauseBtn.replaceChildren(h('span', { class: 'ctl-ico' }, p ? '▶' : '⏸'), h('span', {}, p ? t('resume') : t('pause')));
    },
  };

  runner = new Runner(view);
  const r = runner;
  els.roleBtn.addEventListener('click', () => { if (r.dealtCards) openRoleRecall(r, r.dealtCards); });
  els.rulesBtn.addEventListener('click', () => openRulesDuringPlay(r, game, setup));
  const paintVoice = (st) => {
    const bad = ['failed', 'blocked', 'silent', 'unsupported'].includes(st.state);
    els.voiceBanner.classList.toggle('hidden', !bad);
    if (!bad) return;
    els.voiceBanner.replaceChildren(
      h('div', { class: 'vb-text' }, '🔇 ', voiceProblemText(st)),
      h('div', { class: 'vb-actions' },
        st.state !== 'unsupported' ? h('button', { class: 'btn small', onclick: () => { resetVoiceMemory(); unlockWith(r.lastLine || N(game.name)); } }, '🔊 ', t('voiceRetry')) : null,
        h('button', { class: 'btn small', onclick: openSettings }, '⚙ ', t('settings'))),
    );
  };
  offStatus?.();
  offStatus = onStatus(paintVoice);
  paintVoice(ttsStatus);
  const pauseBtn = h('button', { class: 'ctl main', onclick: () => r.togglePause() }, h('span', { class: 'ctl-ico' }, '⏸'), h('span', {}, t('pause')));
  document.body.classList.add('playing', 'day');

  app.replaceChildren(sky(h), h('div', { class: 'play', style: { '--c1': game.colors[0], '--c2': game.colors[1] } },
    h('header', { class: 'play-top' },
      h('button', { class: 'icon-btn', 'aria-label': t('exit'), onclick: () => { if (confirm(t('exitConfirm'))) { location.hash = `#/game/${game.id}`; route(); } } }, '✕'),
      h('div', { class: 'play-title' }, h('div', { class: 'play-game' }, `${game.emoji} ${L(game.name)}`), els.phase),
      h('div', { class: 'play-right' },
        els.roleBtn,
        els.rulesBtn,
        els.clock,
        document.fullscreenEnabled ? h('button', { class: 'icon-btn small', 'aria-label': t('fullscreen'), onclick: toggleFullscreen }, '⛶') : null),
    ),
    els.board,
    els.voiceBanner,
    h('div', { class: 'play-main' }, els.pausedBadge, h('div', { class: 'caption-card' }, els.caption), els.countdown),
    els.stage,
    h('footer', { class: 'controls' },
      h('button', { class: 'ctl', onclick: () => r.repeat() }, h('span', { class: 'ctl-ico' }, '↺'), h('span', {}, t('repeat'))),
      pauseBtn,
      h('button', { class: 'ctl', onclick: () => r.skip() }, h('span', { class: 'ctl-ico' }, '⏭'), h('span', {}, t('skip'))),
    ),
  ));
  window.scrollTo(0, 0);

  const t0 = Date.now();
  let pausedFor = 0;
  let pauseStart = null;
  clockTimer = setInterval(() => {
    if (r.paused) { pauseStart ??= Date.now(); return; }
    if (pauseStart) { pausedFor += Date.now() - pauseStart; pauseStart = null; }
    els.clock.textContent = fmtTime((Date.now() - t0 - pausedFor) / 1000);
  }, 500);

  let finished = false;
  try {
    finished = await r.run(game, setup);
  } catch (e) {
    console.error(e);
    view.caption(String(e?.message || e));
  }
  if (runner !== r) return; // user left
  clearInterval(clockTimer);
  document.body.classList.remove('night');
  releaseWakeLock();
  if (finished) {
    els.phase.textContent = t('gameOver');
    view.countdown(null);
    confetti();
    let statBox = null;
    if (tracksStats(game)) {
      recordPlay(game.id, r.result);
      const choices = winnerChoices(game);
      if (r.result) statBox = h('div', { class: 'win-saved' }, '🏆 ', t('winSaved', { w: teamLabel(game, r.result) }));
      else if (choices.length) {
        statBox = h('div', { class: 'who-won' },
          h('div', { class: 'muted small' }, t('whoWon')),
          h('div', { class: 'btn-row wrap' },
            choices.map((c) => h('button', { class: `btn win-${c}`, onclick: () => {
              recordWinner(game.id, c);
              statBox.replaceChildren(h('div', { class: 'win-saved' }, '🏆 ', t('winSaved', { w: teamLabel(game, c) })));
            } }, teamLabel(game, c))),
            h('button', { class: 'btn ghost', onclick: () => statBox.remove() }, t('noRecord'))));
      }
    }
    view.stage(h('div', { class: 'panel end' },
      h('div', { class: 'panel-title' }, '🎉 ', t('gameOver')),
      statBox,
      h('div', { class: 'btn-col' },
        h('button', { class: 'btn big primary', onclick: () => startGame(game, setup) }, '🔄 ', t('playAgain')),
        h('button', { class: 'btn big', onclick: () => { location.hash = `#/game/${game.id}`; route(); } }, '⚙️ ', t('changeSetup')),
        h('button', { class: 'btn big', onclick: () => { location.hash = '#/'; } }, '🏠 ', t('backToList')),
      ),
    ));
  }
}

/** Rules and role tips while playing. The narration pauses while this is open. */
function openRulesDuringPlay(r, game, setup) {
  const wasPaused = r.paused;
  if (!wasPaused) r.pause();
  const dlg = h('dialog', { class: 'dialog rules-dlg' });
  dlg.addEventListener('close', () => { dlg.remove(); if (!wasPaused) r.resume(); });
  const inPlay = new Set(game.deck(setup));
  const lang = settings.uiLang === 'en' ? 'en' : 'zh';
  const roles = game.roles.filter((ro) => inPlay.has(ro.id));
  dlg.append(h('div', { class: 'dialog-body' },
    h('div', { class: 'dialog-head' },
      h('h2', {}, '📖 ', L(game.name)),
      h('button', { class: 'icon-btn', 'aria-label': t('close'), onclick: () => dlg.close() }, '✕')),
    h('h3', {}, t('rulesNow')),
    h('ol', { class: 'rules-list' }, rulesOf(game).map((line) => h('li', {}, line))),
    roles.length ? [
      h('h3', {}, t('rolesNow')),
      h('div', { class: 'role-tips' }, roles.map((ro) => {
        const tips = ROLE_TIPS[game.id]?.[ro.id];
        return h('div', { class: `role-tip team-${ro.team}` },
          h('div', { class: 'rt-head' }, h('span', { class: 'role-emoji' }, ro.emoji || '🎭'), h('b', {}, L(ro.name))),
          ro.desc ? h('div', { class: 'row-desc' }, L(ro.desc)) : null,
          tips ? h('ul', { class: 'rt-list' }, tips[lang].map((x) => h('li', {}, L({ zh: x, en: x })))) : null);
      })),
    ] : null,
    h('a', { class: 'guide-link', href: guideHref(game.id), target: '_blank', rel: 'noopener' }, t('guide'), ' ↗'),
    h('button', { type: 'button', class: 'btn big primary', onclick: () => dlg.close() }, '▶ ', t('resume')),
  ));
  document.body.append(dlg);
  dlg.showModal();
}

/**
 * Let one player look at their role again: pick the seat, hand the phone over,
 * then hold a button to see the card (it hides as soon as they let go).
 * The narration pauses while this is open.
 */
function openRoleRecall(r, cards) {
  const wasPaused = r.paused;
  if (!wasPaused) r.pause();
  const dlg = h('dialog', { class: 'dialog recall' });
  dlg.addEventListener('close', () => { dlg.remove(); if (!wasPaused) r.resume(); });
  const head = () => h('div', { class: 'dialog-head' },
    h('h2', {}, '🪪 ', t('recallTitle')),
    h('button', { class: 'icon-btn', 'aria-label': t('close'), onclick: () => dlg.close() }, '✕'));

  const pick = () => dlg.replaceChildren(h('div', { class: 'dialog-body' },
    head(),
    h('p', { class: 'muted' }, t('recallPick')),
    h('div', { class: 'grid' }, cards.map((c) => h('button', { class: 'cell', onclick: () => pass(c) },
      h('span', { class: 'cell-main' }, String(c.seat)),
      playerNameOf(c.seat) ? h('span', { class: 'cell-name' }, playerNameOf(c.seat)) : null))),
  ));

  const pass = (card) => {
    const who = seatLabel(card.seat);
    const slot = h('div', { class: 'recall-slot' }, h('div', { class: 'flip-card' }, h('div', { class: 'flip-back' }, h('span', {}, '?'))));
    const show = () => { slot.replaceChildren(renderRoleCard(card)); };
    const hide = () => { slot.replaceChildren(h('div', { class: 'flip-card' }, h('div', { class: 'flip-back' }, h('span', {}, '?')))); };
    dlg.replaceChildren(h('div', { class: 'dialog-body recall-body' },
      head(),
      h('div', { class: 'deal-pass' }, t('passTo')),
      h('div', { class: 'deal-seat' }, who),
      h('div', { class: 'muted small' }, t('recallHint')),
      slot,
      h('button', {
        type: 'button', class: 'btn big primary hold',
        oncontextmenu: (e) => e.preventDefault(),
        // Capture the pointer so lifting the finger anywhere hides the card again.
        onpointerdown: (e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ } show(); },
        onpointerup: hide, onpointercancel: hide, onlostpointercapture: hide,
        onkeydown: (e) => { if (e.key === ' ' || e.key === 'Enter') show(); },
        onkeyup: hide,
      }, '👆 ', t('holdToSee')),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn', onclick: pick }, '← ', t('recallOther')),
        h('button', { type: 'button', class: 'btn', onclick: () => dlg.close() }, '✓ ', t('recallDone'))),
    ));
  };

  pick();
  document.body.append(dlg);
  dlg.showModal();
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

function stopGame() {
  offStatus?.();
  offStatus = null;
  if (runner) { runner.abort(); runner = null; }
  clearInterval(clockTimer);
  document.body.classList.remove('night', 'day', 'playing');
  releaseWakeLock();
}

async function requestWakeLock() {
  if (!settings.wakeLock || !('wakeLock' in navigator)) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch { /* not allowed */ }
}
function releaseWakeLock() {
  try { wakeLock?.release(); } catch { /* ignore */ }
  wakeLock = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && runner && !wakeLock) requestWakeLock();
});

// ---------- settings dialog ----------
function openSettings() {
  const dlg = h('dialog', { class: 'dialog' });
  const voiceInfo = h('div', { class: 'msg warn hidden' });
  const testResult = h('div', { class: 'test-result muted small', 'aria-live': 'polite' });
  const describeVoice = () => (ttsStatus.state === 'ok'
    ? `✅ ${t('voiceOk')} ${ttsStatus.voice || ttsStatus.lang || ''}`
    : `🔇 ${voiceProblemText(ttsStatus)}`);

  const paint = () => {
    const vl = settings.voiceLang;
    const list = voicesFor(vl);
    const cur = currentVoice(vl);
    voiceInfo.classList.toggle('hidden', ttsSupported() && list.length > 0);
    voiceInfo.textContent = ttsSupported() ? t('noVoice') : t('noSpeech');

    dlg.replaceChildren(h('form', { method: 'dialog', class: 'dialog-body' },
      h('div', { class: 'dialog-head' }, h('h2', {}, '⚙ ', t('settings')), h('button', { class: 'icon-btn', value: 'close', 'aria-label': t('close') }, '✕')),
      field(t('uiLang'), seg(UI_LANGS.map((l) => [l.id, l.label]), settings.uiLang, (v) => { dlg.close(); switchLang(v); })),
      field(t('voiceLang'), h('select', { class: 'select', onchange: (e) => { settings.voiceLang = e.target.value; saveSettings(); resetVoiceMemory(); paint(); } },
        ['yue', 'cmn', 'en'].map((v) => h('option', { value: v, selected: v === vl }, t(v))))),
      field(t('voice'), h('select', { class: 'select', disabled: !list.length, onchange: (e) => { settings.voices[vl] = e.target.value; saveSettings(); resetVoiceMemory(); } },
        list.length ? list.map((v) => h('option', { value: v.voiceURI, selected: cur && v.voiceURI === cur.voiceURI }, `${v.name} (${v.lang})`))
          : h('option', {}, t('voiceDefault')))),
      voiceInfo,
      h('button', { type: 'button', class: 'btn big primary', onclick: () => {
        cancel();
        resetVoiceMemory();
        testResult.textContent = t('voiceTesting');
        unlockWith(settings.voiceLang === 'en' ? 'Everyone, close your eyes. Welcome to Board Game MC!' : '天黑請閉眼。歡迎使用桌遊主持人！')
          .then(() => { testResult.textContent = describeVoice(); });
        setTimeout(() => { if (ttsStatus.state !== 'idle') testResult.textContent = describeVoice(); }, 3000);
      } }, '🔊 ', t('testVoice')),
      testResult,
      field(`${t('rate')} · ${settings.rate.toFixed(1)}×`, h('input', { type: 'range', min: 0.6, max: 1.5, step: 0.1, value: settings.rate,
        oninput: (e) => { settings.rate = +e.target.value; saveSettings(); e.target.closest('.field').querySelector('.field-label').textContent = `${t('rate')} · ${settings.rate.toFixed(1)}×`; } })),
      field(t('volume'), h('input', { type: 'range', min: 0, max: 1, step: 0.1, value: settings.volume, oninput: (e) => { settings.volume = +e.target.value; saveSettings(); } })),
      field(t('pace'), seg([[1.5, t('paceSlow')], [1, t('paceNormal')], [0.7, t('paceFast')]], settings.pace, (v) => { settings.pace = v; saveSettings(); paint(); })),
      field(t('theme'), seg([['auto', t('themeAuto')], ['dark', t('themeDark')], ['light', t('themeLight')]], settings.theme, (v) => { settings.theme = v; saveSettings(); applyTheme(); paint(); })),
      h('div', { class: 'row' }, h('div', { class: 'row-label' }, t('sfx')), toggle(settings.sfx, (v) => { settings.sfx = v; saveSettings(); paint(); })),
      h('div', { class: 'row' }, h('div', { class: 'row-label' }, t('wakeLock')), toggle(settings.wakeLock, (v) => { settings.wakeLock = v; saveSettings(); paint(); })),
      h('div', { class: 'row' }, h('div', { class: 'row-label' }, t('nightDim')), toggle(settings.nightDim, (v) => { settings.nightDim = v; saveSettings(); paint(); })),
      h('h3', { class: 'dialog-sub' }, '📝 ', t('customTitle')),
      h('p', { class: 'muted small' }, t('customHint')),
      customField('customPairs', t('customPairsLabel'), t('customPairsPh'), () => customPairs().length),
      customField('customWords', t('customWordsLabel'), t('customWordsPh'), () => customWords().length),
    ));
  };
  paint();
  const offVoices = onVoices(() => { if (dlg.open) paint(); });
  dlg.addEventListener('close', () => { offVoices(); dlg.remove(); });
  document.body.append(dlg);
  dlg.showModal();
}

/** A textarea for one custom word list, saved as you type, with a live count. */
function customField(key, label, placeholder, count) {
  const badge = h('span', { class: 'count-tag' }, t('customCount', { n: count() }));
  return h('label', { class: 'field' },
    h('span', { class: 'field-label' }, label, ' ', badge),
    h('textarea', { class: 'textarea', rows: 4, placeholder, spellcheck: 'false',
      oninput: (e) => { settings[key] = e.target.value; saveSettings(); badge.textContent = t('customCount', { n: count() }); } }, settings[key] || ''));
}

function field(label, control) {
  return h('div', { class: 'field' }, h('span', { class: 'field-label' }, label), control);
}

function seg(options, value, onChange) {
  return h('div', { class: 'seg' }, options.map(([v, label]) => h('button', {
    type: 'button', class: `seg-btn ${v === value ? 'on' : ''}`, onclick: () => onChange(v),
  }, label)));
}

// ---------- boot ----------
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
