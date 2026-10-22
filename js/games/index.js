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
  for (const o of game.options) opts[o.id] = prevOpts && o.id in prevOpts ? prevOpts[o.id] : o.default;
  return { n, roles: { ...game.defaults(n).roles }, opts };
}
