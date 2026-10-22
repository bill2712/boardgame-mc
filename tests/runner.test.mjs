// Runner behaviour: pause / resume / skip / repeat / abort, using a fake speech engine and a tiny fake DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';

// --- minimal DOM shim (only what runner.js and util.h use) ---
class El {
  constructor(tag) { this.nodeType = 1; this.tag = tag; this.children = []; this.attrs = {}; this.listeners = {}; this.textContent = ''; this.className = ''; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  append(...c) { this.children.push(...c); }
  replaceChildren(...c) { this.children = c; }
  get classList() { return { add() {}, remove() {}, toggle() {} }; }
  get style() { return (this._style ||= { setProperty() {} }); }
  click() { (this.listeners.click || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {} })); }
  find(pred) {
    if (pred(this)) return this;
    for (const c of this.children) if (c instanceof El) { const r = c.find(pred); if (r) return r; }
    return null;
  }
  text() { return [this.textContent, ...this.children.map((c) => (c instanceof El ? c.text() : String(c)))].join(''); }
}
globalThis.document = { createElement: (t) => new El(t), createElementNS: (_, t) => new El(t) };

const { Runner, ABORT } = await import('../js/runner.js');
const { tx } = await import('../js/util.js');
const { settings } = await import('../js/settings.js');
settings.voiceLang = 'yue';
settings.uiLang = 'en';

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** Fake speech: each speak() waits until end() is called or cancel() runs. */
function fakeSpeech() {
  const log = [];
  let current = null;
  return {
    log,
    speak(text) {
      log.push(text);
      return new Promise((resolve) => { current = resolve; });
    },
    cancel() { const c = current; current = null; c?.(); },
    end() { const c = current; current = null; c?.(); },
  };
}

function fakeView() {
  const v = { captions: [], stageNode: null, paused: false };
  return Object.assign(v, {
    caption: (t) => v.captions.push(t),
    countdown() {},
    stage: (n) => { v.stageNode = n; },
    board() {},
    phase() {},
    onPause: (p) => { v.paused = p; },
  });
}

test('pause in the middle of a line says the same line again after resume', async () => {
  const sp = fakeSpeech();
  const r = new Runner(fakeView(), sp);
  const done = r.say(tx('第一句', 'one'), { after: 0 });
  await tick();
  r.pause();
  await tick(20);
  assert.equal(sp.log.length, 1, 'nothing new is spoken while paused');
  r.resume();
  await tick();
  assert.deepEqual(sp.log, ['第一句', '第一句'], 'line is spoken again');
  sp.end();
  await done;
});

test('repeat during a line re-speaks it instead of skipping', async () => {
  const sp = fakeSpeech();
  const r = new Runner(fakeView(), sp);
  let finished = false;
  const done = r.say(tx('第一句', 'one'), { after: 0 }).then(() => { finished = true; });
  await tick();
  r.repeat();
  await tick();
  assert.equal(finished, false);
  assert.deepEqual(sp.log, ['第一句', '第一句']);
  sp.end();
  await done;
});

test('skip ends the current line', async () => {
  const sp = fakeSpeech();
  const r = new Runner(fakeView(), sp);
  const done = r.say(tx('第一句', 'one'), { after: 0 });
  await tick();
  r.skip();
  await done;
  assert.deepEqual(sp.log, ['第一句']);
});

test('repeat on a button screen speaks the last line again', async () => {
  const sp = fakeSpeech();
  const view = fakeView();
  const r = new Runner(view, sp);
  const s = r.say(tx('請準備', 'ready'), { after: 0 });
  await tick(); sp.end(); await s;
  const choice = r.buttons({ buttons: [{ id: 'ok', label: 'OK' }] });
  await tick();
  r.repeat();
  assert.deepEqual(sp.log, ['請準備', '請準備']);
  view.stageNode.find((n) => n.tag === 'button').click();
  assert.equal(await choice, 'ok');
});

test('abort rejects a waiting screen and stops the script', async () => {
  const sp = fakeSpeech();
  const r = new Runner(fakeView(), sp);
  const game = { async run(ctx) { await ctx.buttons({ buttons: [{ id: 'x', label: 'x' }] }); throw new Error('should not continue'); } };
  const running = r.run(game, { n: 3 });
  await tick();
  r.abort();
  assert.equal(await running, false);
});

test('wait is paused while paused and can be skipped', async () => {
  const r = new Runner(fakeView(), fakeSpeech());
  const t0 = Date.now();
  const w = r.wait(0.3, { silent: true });
  r.pause();
  await tick(400);
  r.resume();
  await w;
  assert.ok(Date.now() - t0 >= 600, 'paused time does not count');
  const w2 = r.wait(5, { silent: true });
  await tick(10);
  r.skip();
  await w2;
});

test('timer custom button tapped while paused is not lost', async () => {
  const view = fakeView();
  const r = new Runner(view, fakeSpeech());
  const p = r.timer(30, { buttons: [{ id: 'got', label: 'Got it' }], hideEnd: true, silentEnd: true });
  await tick();
  r.pause();
  await tick();
  view.stageNode.find((n) => n.tag === 'button' && n.text().includes('Got it')).click();
  await tick();
  r.resume();
  const res = await p;
  assert.equal(res.reason, 'got');
});

test('no listeners are left behind after many lines', async () => {
  const sp = fakeSpeech();
  const r = new Runner(fakeView(), sp);
  for (let i = 0; i < 20; i++) {
    const s = r.say(tx(`句${i}`, `line ${i}`), { after: 0 });
    await tick(); sp.end(); await s;
  }
  assert.equal(r.kickers.size, 0);
});

test('ABORT symbol is exported', () => { assert.equal(typeof ABORT, 'symbol'); });
