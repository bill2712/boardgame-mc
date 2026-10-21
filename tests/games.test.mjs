// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAMES, makeSetup } from '../js/games/index.js';
import { resolveNight, checkWin, defaultRoles as wwDefaults } from '../js/games/werewolf.js';
import { defaultRoles as onuwDefaults } from '../js/games/one-night.js';
import { EVIL_BY_N, QUESTS } from '../js/games/avalon.js';
import { undercoverWinner } from '../js/games/undercover.js';
import { tx, shuffle, pick, randInt, range, fmtTime, spokenDuration, joinNames } from '../js/util.js';

const isText = (o) => o && typeof o === 'object' && typeof o.zh === 'string' && typeof o.en === 'string' && o.zh && o.en;

/** A fake ctx that answers every prompt randomly and records narration. */
function mockCtx(setup, { maxSteps = 4000 } = {}) {
  const lines = [];
  let steps = 0;
  const tick = () => { if (++steps > maxSteps) throw new Error('script did not finish'); };
  const node = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => node()), set: (t, k, v) => { t[k] = v; return true; } });
  const checkText = (text) => {
    if (typeof text === 'string') return;
    assert.ok(isText(text), `bad text: ${JSON.stringify(text)}`);
    assert.ok(!/undefined|NaN|\[object/.test(text.zh + text.en), `broken text: ${JSON.stringify(text)}`);
  };
  return {
    lines,
    setup, n: setup.n, settings: { uiLang: 'zh' },
    h: () => node(), tx, L: (o) => (typeof o === 'string' ? o : o?.zh ?? ''), N: (o) => o?.zh ?? '', t: (k) => k,
    shuffle, pick, randInt, range, fmtTime, spokenDuration, joinNames,
    async say(text) { tick(); checkText(text); lines.push(text.zh ?? text); },
    async act() { tick(); },
    async wait() { tick(); },
    async timer(sec, o = {}) {
      tick();
      assert.ok(sec > 0, 'timer needs positive seconds');
      if (o.title) checkText(o.title);
      const b = o.buttons?.length && Math.random() < 0.8 ? o.buttons[0].id : 'end';
      return { elapsed: sec * Math.random(), remaining: 0, reason: b };
    },
    async buttons(o) { tick(); o.buttons.forEach((b) => checkText(b.label)); return pick(o.buttons).id; },
    async ready() { tick(); return 'ok'; },
    async choose(o) {
      tick();
      const ok = o.items.filter((i) => !i.disabled).map((i) => i.id);
      // Mostly pick real targets so games end.
      if (ok.length && (Math.random() < 0.85 || !o.extra?.length)) return pick(ok);
      return pick(o.extra).id;
    },
    async deal(cards) {
      tick();
      assert.equal(cards.length, setup.n, 'one card per player');
      cards.forEach((c, i) => { assert.equal(c.seat, i + 1); checkText(c.title); });
    },
    board() {}, stage() {}, phase(text) { checkText(text); }, sfx() {},
    seat: (n) => tx(`${n}號`, `player ${n}`),
    seats: (list) => joinNames(list.map((n) => tx(`${n}號`, `${n}`))),
  };
}

for (const game of GAMES) {
  test(`${game.id}: metadata is bilingual`, () => {
    assert.ok(isText(game.name) && isText(game.tagline));
    assert.ok(game.rules.zh.length && game.rules.en.length);
    game.roles.forEach((r) => assert.ok(isText(r.name), r.id));
    game.options.forEach((o) => assert.ok(isText(o.label), o.id));
  });

  test(`${game.id}: default setup is valid for every player count`, () => {
    for (let n = game.players.min; n <= game.players.max; n++) {
      const s = makeSetup(game, n);
      const res = game.check(s);
      assert.deepEqual(res.errors, [], `${n} players: ${JSON.stringify(res.errors)}`);
      assert.ok(isText(res.summary));
      if (game.roles.length) assert.equal(game.deck(s).length, game.id === 'one-night' ? n + 3 : n, `${n} players deck size`);
    }
  });

  test(`${game.id}: script runs to the end for every player count and option mix`, async () => {
    for (let n = game.players.min; n <= game.players.max; n++) {
      for (let rep = 0; rep < 6; rep++) {
        const s = makeSetup(game, n);
        // Randomise options.
        for (const o of game.options) {
          if (o.type === 'toggle') s.opts[o.id] = Math.random() < 0.5;
          if (o.type === 'select') s.opts[o.id] = pick(o.choices).value;
        }
        if (game.check(s).errors.length) continue;
        const ctx = mockCtx(s);
        await game.run(ctx, s);
        assert.ok(ctx.lines.length > 0, 'said something');
      }
    }
  });
}

test('avalon tables', () => {
  for (let n = 5; n <= 10; n++) {
    assert.equal(QUESTS[n].length, 5);
    assert.ok(EVIL_BY_N[n] < n / 2);
  }
});

test('one night: default decks are players + 3', () => {
  for (let n = 3; n <= 10; n++) {
    const total = Object.values(onuwDefaults(n)).reduce((a, b) => a + b, 0);
    assert.equal(total, n + 3);
  }
});

test('werewolf: night resolution', () => {
  assert.deepEqual(resolveNight({ wolfTarget: 3, guardTarget: null, saved: false, poisonTarget: null }), [3]);
  assert.deepEqual(resolveNight({ wolfTarget: 3, guardTarget: 3, saved: false, poisonTarget: null }), []);
  assert.deepEqual(resolveNight({ wolfTarget: 3, guardTarget: null, saved: true, poisonTarget: null }), []);
  assert.deepEqual(resolveNight({ wolfTarget: 3, guardTarget: 3, saved: true, poisonTarget: null }), [3], 'guarded and healed dies');
  assert.deepEqual(resolveNight({ wolfTarget: 3, guardTarget: 5, saved: false, poisonTarget: 5 }), [3, 5], 'poison ignores guard');
  assert.deepEqual(resolveNight({ wolfTarget: null, guardTarget: null, saved: false, poisonTarget: null }), []);
});

test('werewolf: win conditions', () => {
  const P = (list) => list.map(([role, alive], i) => ({ seat: i + 1, role, alive }));
  assert.equal(checkWin(P([['wolf', false], ['seer', true], ['villager', true]]), 'side'), 'good');
  assert.equal(checkWin(P([['wolf', true], ['seer', false], ['villager', true]]), 'side'), 'evil');
  assert.equal(checkWin(P([['wolf', true], ['seer', false], ['villager', true]]), 'all'), null);
  assert.equal(checkWin(P([['wolf', true], ['seer', false], ['villager', false]]), 'all'), 'evil');
  for (let n = 6; n <= 16; n++) {
    const r = wwDefaults(n);
    assert.ok(Object.values(r).reduce((a, b) => a + b, 0) <= n);
  }
});

test('undercover: win conditions', () => {
  const P = (list) => list.map(([role, alive], i) => ({ seat: i + 1, role, alive }));
  assert.equal(undercoverWinner(P([['civilian', true], ['civilian', true], ['undercover', false]])), 'civilian');
  assert.equal(undercoverWinner(P([['civilian', true], ['civilian', false], ['undercover', true]])), 'undercover');
  assert.equal(undercoverWinner(P([['civilian', true], ['civilian', true], ['civilian', true], ['undercover', true]])), null);
});

test('util helpers', () => {
  assert.equal(fmtTime(65), '1:05');
  assert.deepEqual(spokenDuration(75), { zh: '1分鐘15秒', en: '1 minute 15 seconds' });
  assert.deepEqual(joinNames([tx('梅林', 'Merlin'), tx('莫甘娜', 'Morgana')]), { zh: '梅林和莫甘娜', en: 'Merlin and Morgana' });
  assert.equal(shuffle(range(1, 10)).length, 10);
});
