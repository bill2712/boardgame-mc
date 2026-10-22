import avalon from './avalon.js';
import cheeseThief from './cheese-thief.js';
import werewolf from './werewolf.js';
import oneNight from './one-night.js';
import undercover from './undercover.js';
import secretHitler from './secret-hitler.js';
import insider from './insider.js';
import spyfall from './spyfall.js';
import werewords from './werewords.js';
import chameleon from './chameleon.js';
import deception from './deception.js';
import codenames from './codenames.js';
import fakeArtist from './fake-artist.js';
import charades from './charades.js';
import timer from './timer.js';
import { CONTENT } from '../content.js';

const LIST = [
  cheeseThief, avalon, werewolf, oneNight, undercover, spyfall, codenames, werewords,
  chameleon, deception, secretHitler, insider, fakeArtist, charades, timer,
];

// Merge display content (category, colours, tips, FAQ) into each game.
export const GAMES = LIST.map((g) => Object.assign(g, CONTENT[g.id] || {}, { category: g.category || CONTENT[g.id]?.category }));
export const gameById = (id) => GAMES.find((g) => g.id === id);

/** Build a fresh setup for a game and player count, keeping option values when given. */
export function makeSetup(game, n, prevOpts) {
  const opts = {};
  for (const o of game.options) opts[o.id] = validOption(o, prevOpts?.[o.id]) ? prevOpts[o.id] : o.default;
  return { n, roles: { ...game.defaults(n).roles }, opts };
}

/** A saved option value is reused only if it still fits the option (old saves can be stale). */
function validOption(o, v) {
  if (v === undefined || v === null) return false;
  if (o.type === 'toggle') return typeof v === 'boolean';
  if (o.type === 'number') return typeof v === 'number' && Number.isFinite(v) && v >= o.min && v <= o.max;
  if (o.type === 'select') return o.choices.some((c) => c.value === v);
  return false;
}

/** Restore a saved setup, dropping anything that no longer fits the game. */
export function restoreSetup(game, saved) {
  if (!saved || typeof saved.n !== 'number' || saved.n < game.players.min || saved.n > game.players.max) {
    return makeSetup(game, game.players.default);
  }
  const setup = makeSetup(game, saved.n, saved.opts);
  for (const r of game.roles) {
    const v = saved.roles?.[r.id];
    if (r.fixed || r.auto || typeof v !== 'number') continue;
    if (v >= (r.min || 0) && v <= (r.max || 1)) setup.roles[r.id] = v;
  }
  // A mix that no longer adds up falls back to the recommended roles.
  if (game.check(setup).errors.length) setup.roles = { ...game.defaults(setup.n).roles };
  return setup;
}
