// Tiny synthesized sound effects (no audio files needed).

import { settings } from './settings.js';

let ac = null;
function audio() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ac) ac = new AC();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(freq, dur = 0.15, type = 'sine', vol = 0.2, delay = 0) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol * (settings.volume ?? 1), t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const effects = {
  tick: () => tone(1100, 0.06, 'square', 0.05),
  chime: () => { tone(660, 0.18, 'sine', 0.2); tone(880, 0.3, 'sine', 0.2, 0.16); },
  end: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.22, i * 0.17)),
  night: () => { tone(392, 0.5, 'sine', 0.15); tone(294, 0.8, 'sine', 0.15, 0.35); },
  day: () => { tone(523, 0.25, 'sine', 0.18); tone(659, 0.25, 'sine', 0.18, 0.2); tone(784, 0.45, 'sine', 0.18, 0.4); },
  warn: () => { tone(880, 0.12, 'square', 0.08); tone(880, 0.12, 'square', 0.08, 0.2); },
};

export function sfx(name) {
  if (!settings.sfx) return;
  try { effects[name]?.(); } catch { /* audio unavailable */ }
}

/** Call from a tap so iOS lets us play sound later. */
export function unlockAudio() {
  try { audio(); } catch { /* ignore */ }
}
