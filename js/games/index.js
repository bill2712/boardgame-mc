import avalon from './avalon.js';
import cheeseThief from './cheese-thief.js';
import werewolf from './werewolf.js';
import oneNight from './one-night.js';
import undercover from './undercover.js';
import secretHitler from './secret-hitler.js';
import insider from './insider.js';
import timer from './timer.js';

export const GAMES = [cheeseThief, avalon, werewolf, oneNight, undercover, secretHitler, insider, timer];
export const gameById = (id) => GAMES.find((g) => g.id === id);

/** Build a fresh setup for a game and player count, keeping option values when given. */
export function makeSetup(game, n, prevOpts) {
  const opts = {};
  for (const o of game.options) opts[o.id] = prevOpts && o.id in prevOpts ? prevOpts[o.id] : o.default;
  return { n, roles: { ...game.defaults(n).roles }, opts };
}
