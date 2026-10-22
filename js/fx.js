// Visual effects: confetti burst and the night sky.

export function confetti({ count = 160, duration = 3200 } = {}) {
  if (typeof document === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.append(c);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const colors = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#a78bfa', '#ff9f1c'];
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  const frame = (now) => {
    const t = now - t0;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save();
      g.globalAlpha = Math.max(0, 1 - t / duration);
      g.translate(p.x, p.y); g.rotate(p.r);
      g.fillStyle = p.color;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}

/** A field of twinkling stars plus a moon and sun, used behind the play screen. */
export function sky(h) {
  const stars = Array.from({ length: 70 }, () => h('i', {
    class: 'star',
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 70}%`,
      animationDelay: `${(Math.random() * 4).toFixed(2)}s`,
      transform: `scale(${(0.4 + Math.random() * 0.9).toFixed(2)})`,
    },
  }));
  return h('div', { class: 'sky', 'aria-hidden': 'true' },
    h('div', { class: 'stars' }, stars),
    h('div', { class: 'moon' }),
    h('div', { class: 'sun' }));
}
