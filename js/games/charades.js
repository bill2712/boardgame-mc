import { tx, shuffle, fmtTime } from '../util.js';
import { TOPICS, ACTIONS, customWords } from './words.js';

const MODES = {
  act: { label: tx('做動作（不可以說話）', 'Act it out (no talking)'), say: tx('只可以做動作，不可以說話', 'act it out without talking') },
  describe: { label: tx('用說話形容（不可以說出詞語）', 'Describe it (don\'t say the word)'), say: tx('用說話形容，但不可以說出詞語', 'describe it without saying the word') },
  draw: { label: tx('畫出來（不可以寫字）', 'Draw it (no letters)'), say: tx('只可以畫畫，不可以寫字', 'draw it without writing letters') },
};

export default {
  id: 'charades',
  emoji: '🎭',
  name: tx('比手畫腳', 'Charades'),
  tagline: tx('分隊鬥快估詞：做動作、形容或者畫畫', 'Team guessing race: act, describe or draw'),
  players: { min: 2, max: 30, default: 8 },
  time: '15',
  category: 'party',
  rules: {
    zh: [
      '分成兩隊或以上。每回合一隊派一位表演者拿手機，隊友負責估。',
      '表演者按模式提示隊友：做動作、用說話形容，或者畫出來。',
      '估中按 ✅，太難可以按 ⏭ 跳過。時間到換下一隊。',
      '全部回合完結，分數最高的隊伍勝利。',
    ],
    en: [
      'Split into two or more teams. Each turn, one performer from a team holds the phone while teammates guess.',
      'The performer gives hints in the chosen mode: act it out, describe it, or draw it.',
      'Tap ✅ for a correct guess or ⏭ to skip a hard one. When time runs out, the next team plays.',
      'After all rounds, the team with the most points wins.',
    ],
  },
  roles: [],
  options: [
    { id: 'mode', type: 'select', label: tx('模式', 'Mode'), default: 'act', choices: Object.entries(MODES).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'teams', type: 'number', label: tx('隊伍數目', 'Teams'), min: 2, max: 4, step: 1, default: 2 },
    { id: 'rounds', type: 'number', label: tx('每隊回合數', 'Rounds per team'), min: 1, max: 5, step: 1, default: 2 },
    { id: 'turnSec', type: 'number', label: tx('每回合時間', 'Time per turn'), min: 30, max: 180, step: 15, unit: 'sec', default: 60 },
    { id: 'topic', type: 'select', label: tx('題目類別', 'Category'), default: 'mix', choices: [
      { value: 'mix', label: tx('混合', 'Mixed') },
      { value: 'actions', label: tx('動作', 'Actions') },
      { value: 'custom', label: tx('自訂詞語', 'Custom words') },
      ...TOPICS.map((t, i) => ({ value: String(i), label: tx(t.name[0], t.name[1]) })),
    ] },
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'both', choices: [
      { value: 'both', label: tx('中英對照', 'Both') }, { value: 'zh', label: tx('中文', 'Chinese') }, { value: 'en', label: tx('English', 'English') },
    ] },
  ],
  defaults() { return { roles: {} }; },
  deck() { return []; },
  check(s) {
    const errors = [];
    if (s.opts.teams > s.n) errors.push(tx('隊伍比玩家還多。', 'More teams than players.'));
    return { errors, warnings: [], summary: tx(`${s.opts.teams} 隊 × ${s.opts.rounds} 回合 × ${s.opts.turnSec} 秒`, `${s.opts.teams} teams × ${s.opts.rounds} rounds × ${s.opts.turnSec}s`) };
  },

  async run(ctx, s) {
    const custom = customWords();
    const topic = s.opts.topic === 'custom' && !custom.length ? 'mix' : s.opts.topic; // no custom words yet: use the mix
    const pool = topic === 'custom' ? custom
      : topic === 'actions' ? ACTIONS
        : topic === 'mix' ? [...ACTIONS, ...TOPICS.flatMap((t) => t.words)]
          : TOPICS[+topic].words;
    let deck = shuffle(pool);
    const draw = () => { if (!deck.length) deck = shuffle(pool); return deck.pop(); };
    const fmt = (w) => (w[0] === w[1] ? [w[0]] : s.opts.wordLang === 'both' ? [w[0], w[1]] : s.opts.wordLang === 'en' ? [w[1]] : [w[0]]);
    const T = s.opts.teams;
    const scores = Array(T).fill(0);
    const teamName = (i) => tx(`第 ${i + 1} 隊`, `Team ${i + 1}`);
    const mode = MODES[s.opts.mode];

    const paintScores = (active) => ctx.board(ctx.h('div', { class: 'scoreboard' }, scores.map((sc, i) =>
      ctx.h('div', { class: `score team-${i} ${i === active ? 'active' : ''}` }, ctx.h('span', {}, ctx.L(teamName(i))), ctx.h('b', {}, String(sc))))));

    await ctx.say(tx(`分成 ${T} 隊。表演者要${mode.say.zh}。每回合 ${s.opts.turnSec} 秒。`, `Split into ${T} teams. Performers must ${mode.say.en}. Each turn lasts ${s.opts.turnSec} seconds.`));
    paintScores(-1);

    for (let r = 1; r <= s.opts.rounds; r++) {
      for (let t = 0; t < T; t++) {
        ctx.phase(tx(`第 ${r} 回合 · 第 ${t + 1} 隊`, `Round ${r} · Team ${t + 1}`));
        paintScores(t);
        await ctx.say(tx(`第 ${t + 1} 隊，請派一位表演者拿手機。準備好就按開始。`, `Team ${t + 1}, choose a performer to hold the phone. Tap start when ready.`));
        await ctx.ready(tx('▶ 開始', '▶ Start'));
        const got = await ctx.widget((done, runner) => {
          const { h } = ctx;
          let left = s.opts.turnSec;
          let ok = 0;
          let word = draw();
          const wordEl = h('div', { class: 'ch-word' });
          const timeEl = h('div', { class: 'ch-time' }, fmtTime(left));
          const countEl = h('div', { class: 'ch-count' }, '✅ 0');
          const show = () => {
            wordEl.replaceChildren(...fmt(word).map((x, i) => h(i ? 'small' : 'span', {}, x)));
            wordEl.classList.remove('pop'); void wordEl.offsetWidth; wordEl.classList.add('pop');
          };
          const stop = () => { clearInterval(tick); done(ok); };
          const tick = setInterval(() => {
            if (runner.paused) return;
            left -= 1;
            timeEl.textContent = fmtTime(left);
            if (left <= 5 && left > 0) ctx.sfx('tick');
            if (left <= 0) { ctx.sfx('end'); ctx.vibrate([200, 100, 200]); stop(); }
          }, 1000);
          runner.abortPromise.catch(() => clearInterval(tick));
          show();
          return h('div', { class: 'panel charades' },
            h('div', { class: 'ch-top' }, timeEl, countEl),
            wordEl,
            h('div', { class: 'ch-actions' },
              h('button', { class: 'btn big', onclick: () => { ctx.sfx('tick'); word = draw(); show(); } }, ctx.L(tx('⏭ 跳過', '⏭ Skip'))),
              h('button', { class: 'btn big good', onclick: () => { ok++; countEl.textContent = `✅ ${ok}`; ctx.sfx('chime'); ctx.vibrate(40); word = draw(); show(); } }, ctx.L(tx('✅ 估中', '✅ Got it')))),
          );
        });
        scores[t] += got;
        paintScores(t);
        await ctx.say(tx(`時間到！第 ${t + 1} 隊估中 ${got} 個，總分 ${scores[t]} 分。`, `Time's up! Team ${t + 1} got ${got}, for ${scores[t]} points in total.`));
      }
    }
    const best = Math.max(...scores);
    const winners = scores.map((sc, i) => (sc === best ? i + 1 : null)).filter(Boolean);
    ctx.phase(tx('結算', 'Result'));
    paintScores(-1);
    if (winners.length === 1) ctx.result(`team${winners[0]}`);
    await ctx.say(winners.length > 1
      ? tx(`平手！第 ${winners.join('、')} 隊同樣有 ${best} 分。`, `It's a tie! Teams ${winners.join(' and ')} each have ${best} points.`)
      : tx(`第 ${winners[0]} 隊以 ${best} 分勝出！`, `Team ${winners[0]} wins with ${best} points!`));
  },
};
