// User preferences, kept in localStorage when it is available.

const KEY = 'bgmc.settings.v1';
const hasStorage = (() => {
  try { return typeof localStorage !== 'undefined' && localStorage !== null; } catch { return false; }
})();

function guess() {
  const lang = (typeof navigator !== 'undefined' && navigator.language || 'en').toLowerCase();
  if (lang.startsWith('zh')) {
    const yue = /zh-(hk|mo)|yue/.test(lang);
    return { uiLang: 'zh', voiceLang: yue ? 'yue' : 'cmn' };
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
