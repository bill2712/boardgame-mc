// Text-to-speech using the browser's Web Speech API.
// Every speak() returns a promise that always settles, even when the engine
// never fires "end" (a known bug on some Android / Chrome builds).

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
  listeners.forEach((fn) => fn(voices));
}
if (synth) {
  refresh();
  synth.addEventListener?.('voiceschanged', refresh);
}

export const supported = () => !!synth;
export const onVoices = (fn) => listeners.add(fn);

const norm = (l) => (l || '').toLowerCase().replace(/_/g, '-');

/** Voices usable for a voice language, best first. */
export function voicesFor(vl) {
  const { tags } = VOICE_LANGS[vl];
  const scored = [];
  for (const v of voices) {
    const lang = norm(v.lang);
    // Keep Cantonese voices out of the Mandarin list.
    if (vl === 'cmn' && VOICE_LANGS.yue.tags.some((t) => lang.startsWith(t))) continue;
    const idx = tags.findIndex((t) => lang === t || lang.startsWith(t + '-') || lang.startsWith(t));
    if (idx >= 0) scored.push({ v, score: idx * 10 + (v.localService ? 0 : 1) });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.v);
}

export function currentVoice(vl = settings.voiceLang) {
  const list = voicesFor(vl);
  const chosen = settings.voices[vl];
  return list.find((v) => v.voiceURI === chosen) || list[0] || null;
}

function estimateSeconds(text) {
  const cjk = (text.match(/[㐀-鿿]/g) || []).length;
  const words = text.replace(/[㐀-鿿]/g, ' ').split(/\s+/).filter(Boolean).length;
  return (cjk * 0.27 + words * 0.38 + 0.6) / (settings.rate || 1);
}

let current = null;

export function speak(text) {
  return new Promise((resolve) => {
    if (!text) return resolve();
    const est = estimateSeconds(text);
    if (!synth) {
      // No speech engine: still give people time to read the caption.
      setTimeout(resolve, est * 1000);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      if (current === u) current = null;
      resolve();
    };
    const u = new SpeechSynthesisUtterance(text);
    const vl = settings.voiceLang;
    const voice = currentVoice(vl);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : VOICE_LANGS[vl].fallback;
    u.rate = settings.rate || 1;
    u.volume = settings.volume ?? 1;
    u.onend = finish;
    u.onerror = finish;
    const safety = setTimeout(finish, (est * 2 + 4) * 1000);
    current = u;
    // Chrome sometimes stays paused after a cancel; resume first.
    try { synth.resume(); } catch { /* ignore */ }
    synth.speak(u);
  });
}

export function cancel() {
  if (!synth) return;
  try { synth.cancel(); } catch { /* ignore */ }
  if (current) {
    const u = current;
    current = null;
    u.onend?.();
  }
}

/** iOS only allows speech after a user gesture: call this from a tap handler. */
export function unlock() {
  if (!synth) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  } catch { /* ignore */ }
}
