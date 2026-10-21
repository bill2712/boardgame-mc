import { h, fmtTime } from './util.js';
import { settings, saveSettings, loadSetup, saveSetup } from './settings.js';
import { t, L } from './i18n.js';
import { GAMES, gameById, makeSetup } from './games/index.js';
import { Runner } from './runner.js';
import { supported as ttsSupported, voicesFor, currentVoice, onVoices, speak, cancel, unlock } from './speech.js';
import { unlockAudio } from './sound.js';

const app = document.getElementById('app');
let runner = null;
let wakeLock = null;
let clockTimer = null;

// ---------- routing ----------
function route() {
  stopGame();
  const [, page, id] = location.hash.split('/');
  document.documentElement.lang = settings.uiLang === 'zh' ? 'zh-Hant' : 'en';
  document.title = `${t('appTitle')} · Board Game MC`;
  if (page === 'game' && gameById(id)) return renderSetup(gameById(id));
  renderHome();
}
window.addEventListener('hashchange', route);

function header({ back } = {}) {
  return h('header', { class: 'topbar' },
    back
      ? h('button', { class: 'icon-btn', 'aria-label': t('back'), onclick: () => { location.hash = '#/'; } }, '←')
      : h('div', { class: 'brand' }, h('span', { class: 'brand-logo' }, '🎲'), h('span', {}, t('appTitle'))),
    h('div', { class: 'topbar-actions' },
      h('button', { class: 'pill', onclick: () => { settings.uiLang = settings.uiLang === 'zh' ? 'en' : 'zh'; saveSettings(); route(); } },
        settings.uiLang === 'zh' ? 'EN' : '中文'),
      h('button', { class: 'icon-btn', 'aria-label': t('settings'), onclick: openSettings }, '⚙️'),
    ),
  );
}

// ---------- home ----------
function renderHome() {
  app.replaceChildren(
    header(),
    h('main', { class: 'wrap' },
      h('section', { class: 'hero' },
        h('h1', {}, t('appTitle')),
        h('p', {}, t('appSub')),
      ),
      h('h2', { class: 'section-title' }, t('gamesTitle')),
      h('div', { class: 'game-grid' }, GAMES.map((g) => h('a', { class: 'game-card', href: `#/game/${g.id}` },
        h('div', { class: 'game-emoji' }, g.emoji),
        h('div', { class: 'game-info' },
          h('div', { class: 'game-name' }, L(g.name)),
          h('div', { class: 'game-tag' }, L(g.tagline)),
          h('div', { class: 'game-meta' },
            h('span', {}, `👥 ${g.players.min}–${g.players.max}`),
            g.time !== '—' ? h('span', {}, `⏳ ${g.time} ${t('minutes')}`) : null),
        ),
      ))),
      h('p', { class: 'tip' }, '💡 ', t('tipVoice')),
      h('p', { class: 'tip' }, '📱 ', t('installHint')),
      h('footer', { class: 'foot' }, t('footer')),
    ),
  );
}

// ---------- setup ----------
function renderSetup(game) {
  const saved = loadSetup(game.id);
  let setup = saved && saved.n >= game.players.min && saved.n <= game.players.max
    ? { ...makeSetup(game, saved.n, saved.opts), roles: { ...game.defaults(saved.n).roles, ...saved.roles } }
    : makeSetup(game, game.players.default);

  const body = h('div', { class: 'setup-body' });
  const startBtn = h('button', { class: 'btn big primary start', onclick: () => startGame(game, setup) }, '▶ ', t('start'));

  const paint = () => {
    const res = game.check(setup);
    const deck = game.deck(setup);
    const counts = {};
    for (const id of deck) counts[id] = (counts[id] || 0) + 1;
    startBtn.disabled = res.errors.length > 0;

    body.replaceChildren(
      // players
      h('section', { class: 'card-sec' },
        h('div', { class: 'row' },
          h('div', { class: 'row-label' }, h('b', {}, t('players'))),
          stepper(setup.n, game.players.min, game.players.max, 1, (v) => {
            setup = makeSetup(game, v, setup.opts);
            paint();
          }, t('playersShort')),
        ),
      ),
      // roles
      game.roles.length ? h('section', { class: 'card-sec' },
        h('h3', {}, t('roles')),
        game.roles.map((r) => {
          let control;
          if (r.fixed) control = h('span', { class: 'count-tag' }, `${t('fixed')} ×${counts[r.id] || 1}`);
          else if (r.auto) control = h('span', { class: 'count-tag' }, `${t('auto')} ×${counts[r.id] || 0}`);
          else if ((r.max || 1) === 1 && !r.min) {
            control = toggle(!!setup.roles[r.id], (v) => { setup.roles[r.id] = v ? 1 : 0; paint(); });
          } else {
            control = stepper(setup.roles[r.id] || 0, r.min || 0, r.max || 1, 1, (v) => { setup.roles[r.id] = v; paint(); });
          }
          return h('div', { class: `row role team-${r.team}` },
            h('div', { class: 'row-label' },
              h('div', {}, r.emoji ? `${r.emoji} ` : '', h('b', {}, L(r.name))),
              r.desc ? h('div', { class: 'row-desc' }, L(r.desc)) : null),
            control);
        }),
      ) : null,
      // options
      game.options.length ? h('section', { class: 'card-sec' },
        h('h3', {}, t('options')),
        game.options.filter((o) => !o.showIf || o.showIf(setup)).map((o) => {
          let control;
          const set = (v) => { setup.opts[o.id] = v; paint(); };
          if (o.type === 'toggle') control = toggle(!!setup.opts[o.id], set);
          else if (o.type === 'number') control = stepper(setup.opts[o.id], o.min, o.max, o.step || 1, set, unitLabel(o.unit));
          else if (o.type === 'select') {
            control = h('select', { class: 'select', onchange: (e) => set(e.target.value) },
              o.choices.map((c) => h('option', { value: c.value, selected: setup.opts[o.id] === c.value }, L(c.label))));
          }
          return h('div', { class: 'row' }, h('div', { class: 'row-label' }, L(o.label)), control);
        }),
      ) : null,
      // summary
      h('section', { class: `card-sec summary ${res.errors.length ? 'has-errors' : ''}` },
        h('div', {}, '📋 ', L(res.summary)),
        res.errors.map((e) => h('div', { class: 'msg error' }, '⛔ ', L(e))),
        res.warnings.map((w) => h('div', { class: 'msg warn' }, '⚠️ ', L(w))),
      ),
    );
  };

  app.replaceChildren(
    header({ back: true }),
    h('main', { class: 'wrap' },
      h('div', { class: 'setup-head' },
        h('div', { class: 'game-emoji big' }, game.emoji),
        h('div', {}, h('h1', {}, L(game.name)), h('p', { class: 'muted' }, L(game.tagline)))),
      h('details', { class: 'rules card-sec' },
        h('summary', {}, '📖 ', t('rules')),
        h('ul', {}, (game.rules[settings.uiLang] || game.rules.en).map((line) => h('li', {}, line)))),
      body,
      h('div', { class: 'sticky-start' }, startBtn),
    ),
  );
  paint();
}

function unitLabel(unit) {
  if (unit === 'min') return t('minutes');
  if (unit === 'sec') return settings.uiLang === 'zh' ? '秒' : 's';
  return '';
}

function stepper(value, min, max, step, onChange, unit) {
  const val = h('span', { class: 'step-val' }, String(value), unit ? h('small', {}, ` ${unit}`) : null);
  return h('div', { class: 'stepper' },
    h('button', { type: 'button', class: 'step-btn', disabled: value <= min, 'aria-label': '−', onclick: () => onChange(Math.max(min, value - step)) }, '−'),
    val,
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
  saveSetup(game.id, setup);
  unlock();
  unlockAudio();
  requestWakeLock();

  const els = {
    phase: h('div', { class: 'phase' }),
    clock: h('div', { class: 'clock' }, '0:00'),
    board: h('div', { class: 'board' }),
    caption: h('div', { class: 'caption' }),
    countdown: h('div', { class: 'countdown hidden' }),
    stage: h('div', { class: 'stage' }),
    pauseBtn: null,
    pausedBadge: h('div', { class: 'paused-badge hidden' }, '⏸ ', t('paused')),
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
      document.body.classList.toggle('night', !!night);
    },
    onPause(p) {
      els.pausedBadge.classList.toggle('hidden', !p);
      if (els.pauseBtn) els.pauseBtn.replaceChildren(h('span', { class: 'ctl-ico' }, p ? '▶' : '⏸'), h('span', {}, p ? t('resume') : t('pause')));
    },
  };

  runner = new Runner(view);
  const r = runner;
  els.pauseBtn = h('button', { class: 'ctl', onclick: () => r.togglePause() }, h('span', { class: 'ctl-ico' }, '⏸'), h('span', {}, t('pause')));

  app.replaceChildren(h('div', { class: 'play' },
    h('header', { class: 'play-top' },
      h('button', { class: 'icon-btn', 'aria-label': t('exit'), onclick: () => { if (confirm(t('exitConfirm'))) { location.hash = `#/game/${game.id}`; route(); } } }, '✕'),
      h('div', { class: 'play-title' }, h('div', { class: 'play-game' }, `${game.emoji} ${L(game.name)}`), els.phase),
      els.clock,
    ),
    els.board,
    h('div', { class: 'play-main' }, els.pausedBadge, els.caption, els.countdown),
    els.stage,
    h('footer', { class: 'controls' },
      h('button', { class: 'ctl', onclick: () => r.repeat() }, h('span', { class: 'ctl-ico' }, '🔁'), h('span', {}, t('repeat'))),
      els.pauseBtn,
      h('button', { class: 'ctl', onclick: () => r.skip() }, h('span', { class: 'ctl-ico' }, '⏭'), h('span', {}, t('skip'))),
    ),
  ));

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
    view.stage(h('div', { class: 'panel end' },
      h('div', { class: 'panel-title' }, '🎉 ', t('gameOver')),
      h('div', { class: 'btn-col' },
        h('button', { class: 'btn big primary', onclick: () => startGame(game, setup) }, '🔄 ', t('playAgain')),
        h('button', { class: 'btn big', onclick: () => { location.hash = `#/game/${game.id}`; route(); } }, '⚙️ ', t('changeSetup')),
        h('button', { class: 'btn big', onclick: () => { location.hash = '#/'; } }, '🏠 ', t('backToList')),
      ),
    ));
  }
}

function stopGame() {
  if (runner) { runner.abort(); runner = null; }
  clearInterval(clockTimer);
  document.body.classList.remove('night');
  releaseWakeLock();
}

async function requestWakeLock() {
  if (!settings.wakeLock || !('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch { /* not allowed */ }
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

  const paint = () => {
    const vl = settings.voiceLang;
    const list = voicesFor(vl);
    const cur = currentVoice(vl);
    voiceInfo.classList.toggle('hidden', ttsSupported() && list.length > 0);
    voiceInfo.textContent = ttsSupported() ? t('noVoice') : t('noSpeech');

    dlg.replaceChildren(h('form', { method: 'dialog', class: 'dialog-body' },
      h('div', { class: 'dialog-head' }, h('h2', {}, '⚙️ ', t('settings')), h('button', { class: 'icon-btn', value: 'close' }, '✕')),
      field(t('uiLang'), seg([['zh', '中文'], ['en', 'English']], settings.uiLang, (v) => { settings.uiLang = v; saveSettings(); paint(); route(); })),
      field(t('voiceLang'), h('select', { class: 'select', onchange: (e) => { settings.voiceLang = e.target.value; saveSettings(); paint(); } },
        ['yue', 'cmn', 'en'].map((v) => h('option', { value: v, selected: v === vl }, t(v))))),
      field(t('voice'), h('select', { class: 'select', disabled: !list.length, onchange: (e) => { settings.voices[vl] = e.target.value; saveSettings(); } },
        list.length ? list.map((v) => h('option', { value: v.voiceURI, selected: cur && v.voiceURI === cur.voiceURI }, `${v.name} (${v.lang})`))
          : h('option', {}, t('voiceDefault')))),
      voiceInfo,
      field(`${t('rate')} · ${settings.rate.toFixed(1)}×`, h('input', { type: 'range', min: 0.6, max: 1.5, step: 0.1, value: settings.rate,
        oninput: (e) => { settings.rate = +e.target.value; saveSettings(); e.target.closest('.field').querySelector('.field-label').textContent = `${t('rate')} · ${settings.rate.toFixed(1)}×`; } })),
      field(t('volume'), h('input', { type: 'range', min: 0, max: 1, step: 0.1, value: settings.volume, oninput: (e) => { settings.volume = +e.target.value; saveSettings(); } })),
      field(t('pace'), seg([[1.5, t('paceSlow')], [1, t('paceNormal')], [0.7, t('paceFast')]], settings.pace, (v) => { settings.pace = v; saveSettings(); paint(); })),
      h('div', { class: 'row' }, h('div', { class: 'row-label' }, t('sfx')), toggle(settings.sfx, (v) => { settings.sfx = v; saveSettings(); paint(); })),
      h('div', { class: 'row' }, h('div', { class: 'row-label' }, t('wakeLock')), toggle(settings.wakeLock, (v) => { settings.wakeLock = v; saveSettings(); paint(); })),
      h('div', { class: 'row' }, h('div', { class: 'row-label' }, t('nightDim')), toggle(settings.nightDim, (v) => { settings.nightDim = v; saveSettings(); paint(); })),
      h('button', { type: 'button', class: 'btn big primary', onclick: () => {
        unlock(); cancel();
        speak(settings.voiceLang === 'en' ? 'Everyone, close your eyes. Welcome to Board Game MC!' : '天黑請閉眼。歡迎使用桌遊主持人！');
      } }, '🔊 ', t('testVoice')),
    ));
  };
  paint();
  onVoices(() => { if (dlg.open) paint(); });
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}

function field(label, control) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), control);
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
