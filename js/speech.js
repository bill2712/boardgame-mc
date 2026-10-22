// Text-to-speech using the browser's Web Speech API.
//
// Things that make phones go silent, and what this file does about them:
// - The chosen language has no installed voice (common for Cantonese on Android
//   and some PCs): the engine fails quietly. We try the next option
//   (other voice → Mandarin → browser default) and remember what worked.
// - iOS only allows speech after a tap: unlockWith() speaks a real line
//   synchronously inside the tap handler.
// - Some engines never fire "end": every speak() settles on a safety timer.
// - Some Chrome builds drop an utterance queued right after cancel().
// Failures are reported through onStatus() so the screen can explain them.

import { settings } from './settings.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

// Language tags to look for, best first.
export const VOICE_LANGS = {
  yue: { tags: ['zh-hk', 'yue', 'zh-yue', 'zh-mo'], fallback: 'zh-HK' },
  cmn: { tags: ['zh-tw', 'zh-cn', 'cmn', 'zh'], fallback: 'zh-TW' },
  en: { tags: ['en-us', 'en-gb', 'en-au', 'en-ca', 'en'], fallback: 'en-US' },
};

let voices = [];
const listeners = new Set();

function refresh() {
  if (!synth) return;
  voices = synth.getVoices() || [];
  working = {}; // voice list changed: re-learn what works
  listeners.forEach((fn) => fn(voices));
}

export const supported = () => !!synth;
export const onVoices = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

const norm = (l) => (l || '').toLowerCase().replace(/_/g, '-');

/** Voices usable for a voice language, best first. */
export function voicesFor(vl) {
  const { tags } = VOICE_LANGS[vl];
  const scored = [];
  for (const v of voices) {
    const lang = norm(v.lang);
    // Keep Cantonese voices out of the Mandarin list.
    if (vl === 'cmn' && VOICE_LANGS.yue.tags.some((t) => lang.startsWith(t))) continue;
    const idx = tags.findIndex((t) => lang === t || lang.startsWith(`${t}-`) || lang.startsWith(t));
    if (idx >= 0) scored.push({ v, score: idx * 10 + (v.localService ? 0 : 1) });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.v);
}

export function currentVoice(vl = settings.voiceLang) {
  const list = voicesFor(vl);
  const chosen = settings.voices[vl];
  return list.find((v) => v.voiceURI === chosen) || list[0] || null;
}

/** Ways to speak a voice language, best first. Each is { voice, lang }. */
export function attempts(vl = settings.voiceLang) {
  const out = [];
  const add = (voice, lang) => {
    const key = `${voice ? voice.voiceURI : ''}|${lang}`;
    if (!out.some((a) => a.key === key)) out.push({ voice, lang, key });
  };
  const chosen = currentVoice(vl);
  if (chosen) add(chosen, chosen.lang);
  for (const v of voicesFor(vl).slice(0, 3)) add(v, v.lang);
  add(null, VOICE_LANGS[vl].fallback);
  if (vl === 'yue') { // Cantonese text reads fine in Mandarin
    const m = currentVoice('cmn');
    if (m) add(m, m.lang);
    add(null, VOICE_LANGS.cmn.fallback);
  }
  add(null, ''); // whatever the browser's default voice is
  return out;
}

// ---- status reporting ----
const statusListeners = new Set();
export const status = { state: 'idle', error: '', lang: '', voice: '' };
export const onStatus = (fn) => { statusListeners.add(fn); return () => statusListeners.delete(fn); };
function setStatus(patch) {
  Object.assign(status, patch);
  statusListeners.forEach((fn) => fn(status));
}

function estimateSeconds(text) {
  const cjk = (text.match(/[㐀-鿿]/g) || []).length;
  const words = text.replace(/[㐀-鿿]/g, ' ').split(/\s+/).filter(Boolean).length;
  return (cjk * 0.27 + words * 0.38 + 0.6) / (settings.rate || 1);
}

let current = null;    // { cancel } for the utterance in flight
let lastCancel = 0;
let working = {};      // voiceLang -> index into attempts() that last worked

// Errors that mean "this voice / language can't be used here, try another".
const RETRYABLE = new Set(['language-unavailable', 'voice-unavailable', 'synthesis-unavailable', 'synthesis-failed', 'audio-hardware']);

function makeUtterance(text, attempt) {
  const u = new SpeechSynthesisUtterance(text);
  if (attempt.voice) u.voice = attempt.voice;
  if (attempt.lang) u.lang = attempt.lang;
  u.rate = settings.rate || 1;
  u.volume = settings.volume ?? 1;
  return u;
}

/**
 * Speak text; the promise settles when it finishes, fails for good, or is cancelled.
 * opts.sync: call speechSynthesis.speak() right now (needed inside a tap on iOS).
 */
export function speak(text, opts = {}) {
  return new Promise((resolve) => {
    if (!text) return resolve();
    const est = estimateSeconds(text);
    if (!synth) {
      setStatus({ state: 'unsupported', error: 'no-speech-api' });
      setTimeout(resolve, est * 1000); // still give people time to read the caption
      return;
    }
    const vl = settings.voiceLang;
    const list = attempts(vl);
    let i = Math.min(working[vl] ?? 0, list.length - 1);
    let done = false;
    let started = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      if (current === handle) current = null;
      resolve();
    };
    // Settles even if the engine never fires end/error.
    const safety = setTimeout(() => {
      if (!started) setStatus({ state: 'silent', error: 'timeout' });
      finish();
    }, (est * 2 + 4) * 1000);
    const handle = { cancel: finish };
    current = handle;
    // Blocked engines (e.g. iOS before an unlock) neither start nor fail: say so early.
    setTimeout(() => {
      if (!started && !done && !synth.speaking) setStatus({ state: 'silent', error: 'not-started' });
    }, 2500);

    const tryNext = () => {
      if (done) return;
      const attempt = list[i];
      const u = makeUtterance(text, attempt);
      handle.u = u; // keep a reference: Chrome may garbage-collect it otherwise
      u.onstart = () => {
        started = true;
        working[vl] = i;
        setStatus({ state: 'ok', error: '', lang: u.lang, voice: attempt.voice ? attempt.voice.name : '' });
      };
      u.onend = finish;
      u.onerror = (e) => {
        const err = e && e.error ? e.error : 'error';
        if (done || err === 'interrupted' || err === 'canceled') return finish();
        if (RETRYABLE.has(err) && i < list.length - 1) { i += 1; return tryNext(); }
        setStatus({ state: err === 'not-allowed' ? 'blocked' : 'failed', error: err });
        finish();
      };
      try { synth.resume(); } catch { /* ignore */ }
      synth.speak(u);
    };

    // Some Chrome builds drop an utterance queued right after cancel(); wait a moment,
    // except when we must speak inside the current tap (iOS).
    const delay = !opts.sync && Date.now() - lastCancel < 150 ? 150 : 0;
    if (delay) setTimeout(tryNext, delay); else tryNext();
  });
}

export function cancel() {
  if (!synth) return;
  lastCancel = Date.now();
  try { synth.cancel(); } catch { /* ignore */ }
  if (current) {
    const c = current;
    current = null;
    c.cancel();
  }
}

/**
 * Call inside a tap handler: speaks a short real line right away so iOS and
 * Chrome allow speech for the rest of the session. Returns its promise.
 */
export function unlockWith(text) {
  if (!synth) return Promise.resolve();
  return speak(text || ' ', { sync: true });
}

/** Older name kept for callers that only need the unlock. */
export function unlock() {
  if (!synth) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  } catch { /* ignore */ }
}

/** Forget which voice worked (call after the user changes voice settings). */
export function resetVoiceMemory() {
  working = {};
  setStatus({ state: 'idle', error: '' });
}

if (synth) {
  refresh();
  synth.addEventListener?.('voiceschanged', refresh);
}
