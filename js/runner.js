// Runs a game's narration script.
// A game script is an async function that receives `ctx` (built here) and calls
// ctx.say(), ctx.act(), ctx.timer(), ctx.choose(), ctx.buttons(), ctx.deal() ...
// The runner handles pause / skip / repeat / exit for all of them.

import { speak as ttsSpeak, cancel as ttsCancel } from './speech.js';
import { settings } from './settings.js';
import { L, N, t } from './i18n.js';
import { h, tx, fmtTime, sleep, shuffle, pick, randInt, range, spokenDuration, joinNames } from './util.js';
import { sfx } from './sound.js';

export const ABORT = Symbol('abort');

export class Runner {
  /** speech: { speak(text) → Promise, cancel() } — swappable for tests. */
  constructor(view, speech = { speak: ttsSpeak, cancel: ttsCancel }) {
    this.view = view;
    this.speech = speech;
    this.paused = false;
    this.aborted = false;
    this.kickers = new Set(); // resolvers of whoever is currently listening for a button
    this.lastKick = null;     // reason of the most recent kick (pause / skip / repeat …)
    this.lastLine = '';
    this.abortPromise = new Promise((_, rej) => { this.rejectAbort = rej; });
    this.abortPromise.catch(() => {});
  }

  speak(text) { return this.speech.speak(text); }
  cancelSpeech() { this.speech.cancel(); }

  // ---- control (called by the UI buttons) ----
  kick(reason) {
    this.lastKick = reason;
    const ks = [...this.kickers];
    this.kickers.clear();
    ks.forEach((k) => k(reason));
  }

  /** Race a promise against the next kick. Always removes its listener afterwards. */
  async raceKick(promise) {
    let resolve;
    const kicked = new Promise((r) => { resolve = r; });
    this.kickers.add(resolve);
    try {
      return await Promise.race([promise, kicked]);
    } finally {
      this.kickers.delete(resolve);
    }
  }

  pause() {
    if (this.paused || this.aborted) return;
    this.paused = true;
    this.pausedAt = performance.now();
    this.cancelSpeech();
    this.view.onPause(true);
    this.kick('pause');
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.view.onPause(false);
    this.kick('resume');
  }
  togglePause() { this.paused ? this.resume() : this.pause(); }
  skip() { if (this.paused || this.aborted) return; this.cancelSpeech(); this.kick('skip'); }
  repeat() {
    if (this.paused || this.aborted) return;
    this.cancelSpeech();
    // Inside say / wait / timer the loop re-speaks; on a button screen nobody listens, so speak here.
    if (this.kickers.size) this.kick('repeat');
    else if (this.lastLine) this.speak(this.lastLine);
  }
  abort() {
    this.aborted = true;
    this.cancelSpeech();
    this.rejectAbort(ABORT);
    this.kick('abort');
  }

  /** Running time since `start`, not counting time after a pause began. */
  elapsedSince(start) {
    const end = this.paused ? this.pausedAt : performance.now();
    return Math.max(0, end - start);
  }

  async gate() {
    if (this.aborted) throw ABORT;
    while (this.paused) {
      await this.raceKick(this.abortPromise.catch(() => {}));
      if (this.aborted) throw ABORT;
    }
  }

  async run(game, setup) {
    const ctx = this.makeCtx(setup);
    try {
      await game.run(ctx, setup);
      return true;
    } catch (e) {
      if (e === ABORT) return false;
      throw e;
    } finally {
      this.cancelSpeech();
    }
  }

  // ---- primitives ----

  /** Show + speak a line, then a short gap. */
  async say(text, opts = {}) {
    await this.gate();
    const spoken = N(text);
    this.lastLine = spoken;
    this.view.caption(L(text), opts);
    for (;;) {
      this.lastKick = null;
      const r = await this.raceKick(this.speak(spoken));
      // Pause / repeat cancel the speech first, which also settles speak(); lastKick says why.
      const why = this.lastKick ?? r;
      if (this.aborted) throw ABORT;
      if (why === 'pause') { await this.gate(); continue; } // say the interrupted line again
      if (why === 'repeat') continue;
      break;
    }
    await this.wait(opts.after ?? 0.6, { silent: true });
  }

  /** Wait `sec` seconds (paused time doesn't count). Skip ends it early. */
  async wait(sec, opts = {}) {
    let remaining = sec * 1000;
    const show = !opts.silent;
    if (show) this.view.countdown(remaining / 1000, sec, opts.label);
    while (remaining > 0) {
      await this.gate();
      const start = performance.now();
      const r = await this.raceKick(sleep(Math.min(200, remaining)));
      if (this.aborted) throw ABORT;
      remaining -= this.elapsedSince(start);
      if (r === 'skip') break;
      if (r === 'repeat' && this.lastLine) this.speak(this.lastLine);
      if (show) this.view.countdown(Math.max(0, remaining) / 1000, sec, opts.label);
    }
    if (show) this.view.countdown(null);
  }

  /**
   * Discussion / speaking timer with voice warnings.
   * Returns { elapsed, remaining, reason: 'end' | 'skip' | <custom button id> }.
   */
  async timer(sec, opts = {}) {
    await this.gate();
    let total = sec;
    let remaining = sec * 1000;
    let custom = null;
    const warnings = (opts.warnings ?? [60, 30, 10]).filter((w) => sec > w * 1.5);
    const said = new Set();
    let lastTick = -1;

    const time = h('div', { class: 'timer-time' }, fmtTime(sec));
    const ring = ringSvg();
    const node = h('div', { class: 'timer' },
      opts.title ? h('div', { class: 'timer-title' }, L(opts.title)) : null,
      h('div', { class: 'timer-dial' }, ring.svg, time),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onclick: () => { remaining += 30000; total += 30; said.clear(); } }, t('addTime')),
        (opts.buttons || []).map((b) => h('button', {
          class: 'btn primary',
          onclick: () => { custom = b.id; this.kick('custom'); },
        }, L(b.label))),
        opts.hideEnd ? null : h('button', { class: 'btn', onclick: () => this.skip() }, L(opts.endLabel) || t('endTimer')),
      ),
    );
    this.view.stage(node);
    const paint = () => {
      time.textContent = fmtTime(remaining / 1000);
      ring.set(remaining / 1000 / total);
      node.classList.toggle('low', remaining <= 10000);
    };
    paint();

    let reason = 'end';
    while (remaining > 0) {
      await this.gate();
      if (custom) { reason = custom; break; } // tapped while paused
      const start = performance.now();
      const r = await this.raceKick(sleep(Math.min(250, remaining)));
      if (this.aborted) throw ABORT;
      remaining -= this.elapsedSince(start);
      if (r === 'skip') { reason = 'skip'; break; }
      if (r === 'custom') { reason = custom; break; }
      if (r === 'repeat' && this.lastLine) this.speak(this.lastLine);
      const secLeft = Math.ceil(remaining / 1000);
      for (const w of warnings) {
        if (secLeft <= w && secLeft > w - 3 && !said.has(w)) {
          said.add(w);
          sfx('warn');
          this.speak(N(warnLine(w)));
        }
      }
      if (secLeft <= 5 && secLeft > 0 && secLeft !== lastTick) { lastTick = secLeft; sfx('tick'); }
      paint();
    }
    const elapsed = total - Math.max(0, remaining) / 1000;
    const left = Math.max(0, remaining) / 1000;
    this.view.stage(null);
    if (reason === 'end') {
      sfx('end');
      try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported */ }
      if (!opts.silentEnd) await this.say(opts.endText || tx('時間到！', "Time's up!"));
    }
    return { elapsed, remaining: left, reason };
  }

  /** Show a set of buttons and resolve with the id of the one tapped. */
  async buttons({ title, text, buttons, board }) {
    await this.gate();
    let done;
    const p = new Promise((r) => { done = r; });
    const node = h('div', { class: 'panel' },
      title ? h('div', { class: 'panel-title' }, L(title)) : null,
      text ? h('div', { class: 'panel-text' }, L(text)) : null,
      board || null,
      h('div', { class: 'btn-col' }, buttons.map((b) => h('button', {
        class: `btn big ${b.style || ''}`,
        onclick: () => done(b.id),
      }, L(b.label)))),
    );
    this.view.stage(node);
    try {
      return await Promise.race([p, this.abortPromise]);
    } finally {
      this.view.stage(null);
    }
  }

  /**
   * Custom interactive widget. build(done, runner) returns a node; the promise
   * resolves with whatever is passed to done(). Used for boards like Codenames.
   */
  async widget(build) {
    await this.gate();
    let done;
    const p = new Promise((r) => { done = r; });
    this.view.stage(build(done, this));
    try {
      return await Promise.race([p, this.abortPromise]);
    } finally {
      this.view.stage(null);
    }
  }

  /** Simple "Ready, continue" gate. */
  async ready(label) {
    return this.buttons({ buttons: [{ id: 'ok', label: label || t('ready'), style: 'primary' }] });
  }

  /**
   * Pick from a grid (e.g. player seats). items: [{id, label, sub?, disabled?}]
   * extra: buttons under the grid such as "No one". Returns the chosen id.
   */
  async choose({ title, text, items, extra = [], confirm = true, columns }) {
    await this.gate();
    let done;
    const p = new Promise((r) => { done = r; });
    let selected = null;
    const ok = h('button', { class: 'btn big primary', disabled: true, onclick: () => done(selected) }, t('confirm'));
    const cells = items.map((it) => {
      const b = h('button', {
        class: 'cell',
        disabled: !!it.disabled,
        onclick: () => {
          if (!confirm) return done(it.id);
          selected = it.id;
          cells.forEach((c) => c.classList.remove('sel'));
          b.classList.add('sel');
          ok.disabled = false;
        },
      }, h('span', { class: 'cell-main' }, L(it.label)),
      it.sub ? h('span', { class: 'cell-sub' }, L(it.sub)) : null,
      typeof it.id === 'number' && playerName(it.id) ? h('span', { class: 'cell-name' }, playerName(it.id)) : null);
      return b;
    });
    const node = h('div', { class: 'panel' },
      title ? h('div', { class: 'panel-title' }, L(title)) : null,
      text ? h('div', { class: 'panel-text' }, L(text)) : null,
      h('div', { class: 'grid', style: columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : null }, cells),
      extra.length ? h('div', { class: 'btn-row' }, extra.map((x) => h('button', {
        class: 'btn', onclick: () => done(x.id),
      }, L(x.label)))) : null,
      confirm ? ok : null,
    );
    this.view.stage(node);
    try {
      return await Promise.race([p, this.abortPromise]);
    } finally {
      this.view.stage(null);
    }
  }

  /**
   * Pass-and-play role reveal.
   * cards: [{ seat, title, team: 'good'|'evil'|'neutral', body, emoji }]
   */
  async deal(cards) {
    await this.gate();
    // Remembered so players can look at their role again later (🪪 button).
    this.dealtCards = cards;
    for (const card of cards) {
      const who = seatLabel(card.seat);
      // Step 1: hand over (card face down).
      await new Promise((resolve, reject) => {
        this.abortPromise.catch(reject);
        this.view.stage(h('div', { class: 'deal' },
          h('div', { class: 'deal-pass' }, t('passTo')),
          h('div', { class: 'deal-seat' }, who),
          h('div', { class: 'flip-card' }, h('div', { class: 'flip-back' }, h('span', {}, '?'))),
          h('div', { class: 'muted' }, t('dealHint')),
          h('button', { class: 'btn big primary', onclick: resolve }, t('tapToReveal', { n: who })),
        ));
      });
      // Step 2: flip and show the card.
      await new Promise((resolve, reject) => {
        this.abortPromise.catch(reject);
        this.view.stage(h('div', { class: 'deal' },
          h('div', { class: 'muted' }, `${who} · ${t('yourRole')}`),
          renderRoleCard(card),
          h('button', { class: 'btn big', onclick: resolve }, '🙈 ', t('hideAndPass')),
        ));
      });
    }
    this.view.stage(null);
    this.view.onDealt?.(cards);
    await this.say(tx('全部玩家已查看身份。忘記身份的話，可以按畫面上方的身份卡按鈕再看一次。',
      'Everyone has seen their role. If you forget yours, tap the ID card button at the top to look again.'), { after: 0.3 });
  }

  /** Persistent info panel (e.g. quest board). Pass null to clear. */
  board(node) { this.view.board(node); }

  phase(text, { night = false } = {}) {
    this.view.phase(L(text), night && settings.nightDim);
    sfx(night ? 'night' : 'day');
  }

  makeCtx(setup) {
    const self = this;
    return {
      setup,
      n: setup.n,
      settings,
      h, tx, L, N, t, shuffle, pick, randInt, range, fmtTime, spokenDuration, joinNames,
      say: (text, o) => self.say(text, o),
      /** Action window for night steps, scaled by the "action time" setting. */
      act: (sec, o = {}) => {
        if (o.widget) self.view.stage(o.widget);
        return self.wait(sec * (settings.pace || 1), { label: t('actionTime'), ...o })
          .finally(() => { if (o.widget) self.view.stage(null); });
      },
      wait: (sec, o) => self.wait(sec, o),
      timer: (sec, o) => self.timer(sec, o),
      buttons: (o) => self.buttons(o),
      ready: (label) => self.ready(label),
      choose: (o) => self.choose(o),
      widget: (build) => self.widget(build),
      deal: (cards) => self.deal(cards),
      board: (node) => self.board(node),
      stage: (node) => self.view.stage(node),
      phase: (text, o) => self.phase(text, o),
      sfx,
      seat: seatText,
      seats: (list) => joinNames(list.map(seatText)),
      name: playerName,
      /** Record who won ('good' | 'evil' | 'neutral' | a team id) for the stats screen. */
      result: (team) => { self.result = team; },
      vibrate: (p) => { try { navigator.vibrate?.(p); } catch { /* ignore */ } },
    };
  }
}

/** Custom name for a seat, if the players typed one in. */
export function playerName(n) {
  const name = (settings.names || [])[n - 1];
  return name && name.trim() ? name.trim() : null;
}

/** Bilingual way to say a seat: "阿明" / "3號" / "player 3". */
export function seatText(n) {
  const name = playerName(n);
  return name ? tx(name, name) : tx(`${n}號`, `player ${n}`);
}

/** The face of a role card (used when dealing and when looking again). */
export function renderRoleCard(card) {
  return h('div', { class: `role-card flip-in team-${card.team || 'neutral'}` },
    card.emoji ? h('div', { class: 'card-emoji' }, card.emoji) : null,
    h('div', { class: 'card-title' }, L(card.title)),
    card.teamLabel ? h('div', { class: 'card-team' }, L(card.teamLabel)) : null,
    card.body ? h('div', { class: 'card-body' }, [].concat(card.body).map((b) => h('p', {}, L(b)))) : null);
}

export function seatLabel(n) {
  const name = playerName(n);
  return name ? `${name} (${n})` : t('seatPlayer', { n });
}

function ringSvg() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('class', 'ring');
  const mk = (cls) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '60'); c.setAttribute('cy', '60'); c.setAttribute('r', '52');
    c.setAttribute('class', cls);
    svg.append(c);
    return c;
  };
  mk('ring-track');
  const bar = mk('ring-bar');
  const len = 2 * Math.PI * 52;
  bar.style.strokeDasharray = `${len}`;
  return {
    svg,
    set(p) { bar.style.strokeDashoffset = `${len * (1 - Math.max(0, Math.min(1, p)))}`; },
  };
}

function warnLine(sec) {
  if (sec === 60) return tx('剩餘一分鐘。', 'One minute left.');
  if (sec === 30) return tx('剩餘三十秒。', 'Thirty seconds left.');
  if (sec === 10) return tx('剩餘十秒。', 'Ten seconds left.');
  return spokenDuration(sec);
}
