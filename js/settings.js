// User preferences, kept in localStorage when it is available.

const KEY = 'bgmc.settings.v1';
const hasStorage = (() => {
  try { return typeof localStorage !== 'undefined' && localStorage !== null; } catch { return false; }
})();

function guess() {
  const lang = (typeof navigator !== 'undefined' && navigator.language || 'en').toLowerCase();
  if (lang.startsWith('zh')) {
    const yue = /zh-(hk|mo)|yue/.test(lang);
    const hans = /zh-(cn|sg|hans)/.test(lang);
    return { uiLang: hans ? 'zhs' : 'zh', voiceLang: yue ? 'yue' : 'cmn' };
  }
  return { uiLang: 'en', voiceLang: 'en' };
}

const DEFAULTS = {
  ...guess(),
  voices: {},        // voiceLang -> voiceURI
  rate: 1,           // speech rate
  volume: 1,
  pace: 1,           // multiplier for action windows (night steps)
  sfx: true,         // beeps and chimes
  wakeLock: true,    // keep screen on while playing
  nightDim: true,    // dark screen during night phases
  theme: 'auto',     // auto | dark | light
  names: [],         // player names by seat (optional)
  favorites: [],     // game ids
  recent: [],        // game ids, most recent first
  customPairs: '',   // one undercover pair per line, e.g. "可樂, 雪碧"
  customWords: '',   // one word per line for guessing games
};

function load() {
  if (!hasStorage) return {};
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export const settings = { ...DEFAULTS, ...load() };

export function saveSettings() {
  if (!hasStorage) return;
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode */ }
}

/** Language of the narration text: 'zh' for Cantonese/Mandarin, 'en' for English. */
export function narrLang() {
  return settings.voiceLang === 'en' ? 'en' : 'zh';
}

// Per-game setup memory.
export function loadSetup(gameId) {
  if (!hasStorage) return null;
  try { return JSON.parse(localStorage.getItem(`bgmc.setup.${gameId}`) || 'null'); } catch { return null; }
}
export function saveSetup(gameId, setup) {
  if (!hasStorage) return;
  try { localStorage.setItem(`bgmc.setup.${gameId}`, JSON.stringify(setup)); } catch { /* ignore */ }
}

export function markPlayed(gameId) {
  settings.recent = [gameId, ...(settings.recent || []).filter((id) => id !== gameId)].slice(0, 4);
  saveSettings();
}

export function toggleFavorite(gameId) {
  const fav = new Set(settings.favorites || []);
  fav.has(gameId) ? fav.delete(gameId) : fav.add(gameId);
  settings.favorites = [...fav];
  saveSettings();
  return fav.has(gameId);
}

// Win stats per game: { plays, wins: { good: 3, evil: 1, team1: 2, … }, last }.
const statsKey = (id) => `bgmc.stats.${id}`;

export function loadStats(gameId) {
  const blank = { plays: 0, wins: {}, last: 0 };
  if (!hasStorage) return blank;
  try { return { ...blank, ...JSON.parse(localStorage.getItem(statsKey(gameId)) || '{}') }; } catch { return blank; }
}

function writeStats(gameId, st) {
  if (!hasStorage) return;
  try { localStorage.setItem(statsKey(gameId), JSON.stringify(st)); } catch { /* ignore */ }
}

/** Count a finished game, and the winner when it is known. */
export function recordPlay(gameId, winner) {
  const st = loadStats(gameId);
  st.plays += 1;
  st.last = Date.now();
  if (winner) st.wins[winner] = (st.wins[winner] || 0) + 1;
  writeStats(gameId, st);
  return st;
}

/** Add a winner to the game that was just counted (picked by hand on the end screen). */
export function recordWinner(gameId, winner) {
  const st = loadStats(gameId);
  st.wins[winner] = (st.wins[winner] || 0) + 1;
  writeStats(gameId, st);
  return st;
}

export function clearStats(gameId) {
  if (!hasStorage) return;
  try { localStorage.removeItem(statsKey(gameId)); } catch { /* ignore */ }
}
