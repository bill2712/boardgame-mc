// Speech fallback: when a language has no working voice, try the next option and report problems.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const spoken = [];
const fake = {
  failLangs: new Set(),
  block: false,
  speaking: false,
  voices: [],
  getVoices() { return this.voices; },
  handlers: [],
  addEventListener(type, fn) { if (type === 'voiceschanged') this.handlers.push(fn); },
  setVoices(v) { this.voices = v; this.handlers.forEach((fn) => fn()); },
  resume() {},
  cancel() {},
  speak(u) {
    spoken.push(u.lang || '(default)');
    setTimeout(() => {
      if (this.block) return u.onerror?.({ error: 'not-allowed' });
      if (this.failLangs.has(u.lang)) return u.onerror?.({ error: 'language-unavailable' });
      u.onstart?.();
      setTimeout(() => u.onend?.(), 1);
    }, 1);
  },
};
globalThis.window = { speechSynthesis: fake };
globalThis.SpeechSynthesisUtterance = function (text) { this.text = text; };

const { settings } = await import('../js/settings.js');
const speech = await import('../js/speech.js');
settings.voiceLang = 'yue';
settings.rate = 1;

test('Cantonese with no Cantonese voice falls back to Mandarin, then remembers it', async () => {
  fake.failLangs = new Set(['zh-HK']);
  spoken.length = 0;
  speech.resetVoiceMemory();
  await speech.speak('天黑請閉眼');
  assert.deepEqual(spoken, ['zh-HK', 'zh-TW']);
  assert.equal(speech.status.state, 'ok');
  spoken.length = 0;
  await speech.speak('天亮了');
  assert.deepEqual(spoken, ['zh-TW'], 'goes straight to what worked');
});

test('falls back to the browser default voice when every language fails', async () => {
  fake.failLangs = new Set(['zh-HK', 'zh-TW']);
  spoken.length = 0;
  speech.resetVoiceMemory();
  await speech.speak('測試');
  assert.deepEqual(spoken, ['zh-HK', 'zh-TW', '(default)']);
  assert.equal(speech.status.state, 'ok');
});

test('an installed Cantonese voice is used first', async () => {
  fake.failLangs = new Set();
  fake.setVoices([{ name: 'Sinji', lang: 'zh-HK', voiceURI: 'sinji', localService: true }]);
  spoken.length = 0;
  speech.resetVoiceMemory();
  await speech.speak('你好');
  assert.deepEqual(spoken, ['zh-HK']);
  assert.equal(speech.status.voice, 'Sinji');
  fake.setVoices([]);
});

test('blocked speech is reported so the screen can explain it', async () => {
  fake.block = true;
  speech.resetVoiceMemory();
  const states = [];
  const off = speech.onStatus((s) => states.push(s.state));
  await speech.speak('測試');
  off();
  fake.block = false;
  assert.ok(states.includes('blocked'));
});

test('cancel settles the promise right away', async () => {
  fake.speak = function (u) { spoken.push(u.lang); }; // never finishes on its own
  const p = speech.speak('一句很長的旁白');
  speech.cancel();
  await p;
});
