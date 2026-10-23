import { tx, shuffle, randInt } from '../util.js';
import { SPECTRA } from './words.js';

/** Points for a guess: 4 bullseye, 3 close, 2 near, 0 otherwise (positions are 0–100). */
export function wavelengthScore(target, guess) {
  const d = Math.abs(target - guess);
  if (d <= 3) return 4;
  if (d <= 8) return 3;
  if (d <= 13) return 2;
  return 0;
}

/** CSS conic gradient for the dial; shows the scoring zones when `target` is given. */
function dialBackground(target) {
  const base = 'rgba(255,255,255,.08)';
  if (target == null) return `conic-gradient(from 270deg at 50% 100%, ${base} 0deg 180deg, transparent 180deg)`;
  const deg = (v) => `${Math.max(0, Math.min(100, v)) * 1.8}deg`;
  const z2 = '#f6c453'; const z3 = '#f08a5d'; const z4 = '#e84a5f';
  return `conic-gradient(from 270deg at 50% 100%, ${base} 0deg ${deg(target - 13)}, ${z2} ${deg(target - 13)} ${deg(target - 8)}, ${z3} ${deg(target - 8)} ${deg(target - 3)}, ${z4} ${deg(target - 3)} ${deg(target + 3)}, ${z3} ${deg(target + 3)} ${deg(target + 8)}, ${z2} ${deg(target + 8)} ${deg(target + 13)}, ${base} ${deg(target + 13)} 180deg, transparent 180deg)`;
}

export default {
  id: 'wavelength',
  emoji: '📡',
  name: tx('心靈同步', 'Wavelength'),
  tagline: tx('靈媒用一個提示，讓隊友把指針轉到同一個位置', 'One clue from the psychic; can your team find the exact spot?'),
  players: { min: 2, max: 20, default: 6 },
  time: '30',
  category: 'party',
  rules: {
    zh: [
      '分成兩隊輪流進行。每回合一隊派一位靈媒拿手機。',
      '手機會出一張「光譜卡」，例如「冷 ↔ 熱」。只有靈媒按住按鈕才看到目標位置。',
      '靈媒說一個提示（例如「火鍋」），隊友討論後把指針轉到他們認為的位置。',
      '揭曉：正中 4 分，接近 3 分，附近 2 分。先到目標分數的隊伍勝利。',
    ],
    en: [
      'Two teams take turns. Each turn, one psychic from the team holds the phone.',
      'A spectrum card appears, such as "Cold ↔ Hot". Only the psychic sees the target, by holding a button.',
      'The psychic gives one clue (e.g. "hot pot") and the team turns the needle to where they think it goes.',
      'Reveal: bullseye 4 points, close 3, near 2. The first team to the target score wins.',
    ],
  },
  roles: [],
  options: [
    { id: 'goal', type: 'number', label: tx('目標分數', 'Points to win'), min: 5, max: 20, step: 1, default: 10 },
  ],
  defaults() { return { roles: {} }; },
  deck() { return []; },
  check(s) { return { errors: [], warnings: [], summary: tx(`兩隊對戰，先到 ${s.opts.goal} 分勝`, `Two teams, first to ${s.opts.goal} points`) }; },

  async run(ctx, s) {
    const { h, L } = ctx;
    const cards = shuffle(SPECTRA);
    let ci = 0;
    const scores = [0, 0];
    const name = (i) => tx(`第 ${i + 1} 隊`, `Team ${i + 1}`);
    const paint = (active) => ctx.board(h('div', { class: 'scoreboard' }, scores.map((sc, i) =>
      h('div', { class: `score team-${i} ${i === active ? 'active' : ''}` }, h('span', {}, L(name(i))), h('b', {}, String(sc))))));

    await ctx.say(tx(`分成兩隊，先到 ${s.opts.goal} 分的隊伍勝利。`, `Split into two teams. The first to ${s.opts.goal} points wins.`));
    paint(-1);
    for (let turn = 0; ; turn++) {
      const team = turn % 2;
      const card = cards[ci++ % cards.length];
      const target = randInt(8, 92);
      ctx.phase(tx(`第 ${team + 1} 隊回合`, `Team ${team + 1}'s turn`));
      paint(team);
      await ctx.say(tx(`第 ${team + 1} 隊，請選出一位靈媒拿手機，其他人轉身不要看。`, `Team ${team + 1}, choose a psychic to hold the phone. Everyone else, look away.`));
      await ctx.ready();

      const result = await ctx.widget((done) => {
        let value = 50;
        let stage = 'psychic';
        const dial = h('div', { class: 'wl-dial', style: { background: dialBackground(null) } });
        const needle = h('div', { class: 'wl-needle' });
        const holder = h('div', { class: 'wl-wrap' }, dial, needle,
          h('span', { class: 'wl-end left' }, L(tx(card[0][0], card[1][0]))),
          h('span', { class: 'wl-end right' }, L(tx(card[0][1], card[1][1]))));
        const setNeedle = () => { needle.style.transform = `rotate(${value * 1.8 - 90}deg)`; };
        setNeedle();
        const slider = h('input', { type: 'range', min: 0, max: 100, value, class: 'wl-slider', 'aria-label': L(tx('指針位置', 'Needle position')),
          oninput: (e) => { value = +e.target.value; setNeedle(); } });
        const info = h('div', { class: 'panel-text' });
        const actions = h('div', { class: 'btn-col' });
        const show = (on) => { dial.style.background = dialBackground(on ? target : null); };

        const toPsychic = () => {
          info.textContent = L(tx('靈媒：按住下面按鈕查看目標，然後想一個提示。', 'Psychic: hold the button to see the target, then think of a clue.'));
          slider.disabled = true;
          actions.replaceChildren(
            h('button', { class: 'btn big primary hold', oncontextmenu: (e) => e.preventDefault(),
              onpointerdown: (e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ } show(true); },
              onpointerup: () => show(false), onpointercancel: () => show(false), onlostpointercapture: () => show(false) },
            '👆 ', L(tx('按住查看目標', 'Hold to see the target'))),
            h('button', { class: 'btn big', onclick: toTeam }, L(tx('想好提示了，交給隊友', 'Clue ready, hand to the team'))));
        };
        const toTeam = () => {
          stage = 'team';
          show(false);
          slider.disabled = false;
          info.textContent = L(tx('靈媒說出提示，隊友拖動指針，決定好就揭曉。', 'Psychic, say your clue. Team, move the needle, then reveal.'));
          actions.replaceChildren(h('button', { class: 'btn big primary', onclick: reveal }, '🎯 ', L(tx('揭曉', 'Reveal'))));
        };
        const reveal = () => {
          if (stage !== 'team') return;
          stage = 'done';
          show(true);
          slider.disabled = true;
          const pts = wavelengthScore(target, value);
          ctx.sfx(pts ? 'chime' : 'warn');
          info.textContent = L(tx(`得 ${pts} 分！`, `${pts} point${pts === 1 ? '' : 's'}!`));
          actions.replaceChildren(h('button', { class: 'btn big primary', onclick: () => done(pts) }, ctx.t('next')));
        };
        toPsychic();
        return h('div', { class: 'panel wl' }, holder, slider, info, actions);
      });

      scores[team] += result;
      paint(team);
      await ctx.say(tx(`第 ${team + 1} 隊得 ${result} 分，總分 ${scores[team]} 分。`, `Team ${team + 1} scores ${result}, for ${scores[team]} in total.`));
      if (scores[team] >= s.opts.goal) {
        ctx.result(`team${team + 1}`);
        ctx.phase(tx('結算', 'Result'));
        await ctx.say(tx(`第 ${team + 1} 隊以 ${scores[team]} 分勝出！`, `Team ${team + 1} wins with ${scores[team]} points!`));
        return;
      }
    }
  },
};

