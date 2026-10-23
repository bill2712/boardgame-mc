import { tx, shuffle, fmtTime } from '../util.js';
import { TOPICS, ACTIONS, customWords, withCustom } from './words.js';

const ROUNDS = [
  { name: tx('形容', 'Describe'), how: tx('用說話形容，不可以說出詞語本身', 'describe it in words, without saying the word') },
  { name: tx('一個詞', 'One word'), how: tx('只可以說一個詞作提示', 'say just one word as a clue') },
  { name: tx('做動作', 'Act it out'), how: tx('只可以做動作，不可以說話', 'act it out without speaking') },
];

export default {
  id: 'fishbowl',
  emoji: '🥗',
  name: tx('沙律碗', 'Fishbowl'),
  tagline: tx('同一批詞玩三輪：形容 → 一個詞 → 做動作', 'Same words, three rounds: describe → one word → act'),
  players: { min: 4, max: 30, default: 8 },
  time: '30',
  category: 'party',
  rules: {
    zh: [
      '分成兩隊。手機準備一碗詞語（也可以加入你們自己的詞）。',
      '第一輪用說話形容；第二輪只可以說一個詞；第三輪只可以做動作。三輪用同一批詞語。',
      '每個回合一位表演者拿手機，估中按 ✅，跳過的詞會放回碗裡。時間到換另一隊。',
      '碗裡的詞全部估完就進入下一輪。三輪後總分最高的隊伍勝利。',
    ],
    en: [
      'Split into two teams. The phone fills a bowl with words (you can add your own too).',
      'Round 1: describe in words. Round 2: one word only. Round 3: act it out. All rounds use the same words.',
      'Each turn one performer holds the phone. Tap ✅ for a correct guess; skipped words go back in the bowl. When time is up, the other team plays.',
      'When the bowl is empty, the next round starts. After three rounds, the team with the most points wins.',
    ],
  },
  roles: [],
  options: [
    { id: 'count', type: 'number', label: tx('碗裡詞語數量', 'Words in the bowl'), min: 10, max: 60, step: 5, default: 25 },
    { id: 'turnSec', type: 'number', label: tx('每回合時間', 'Time per turn'), min: 30, max: 120, step: 15, unit: 'sec', default: 45 },
    { id: 'words', type: 'select', label: tx('詞庫', 'Word list'), default: 'builtin', choices: [
      { value: 'builtin', label: tx('內置詞庫', 'Built-in') }, { value: 'mix', label: tx('內置＋自訂詞語', 'Built-in + custom') }, { value: 'custom', label: tx('只用自訂詞語', 'Custom only') },
    ] },
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'both', choices: [
      { value: 'both', label: tx('中英對照', 'Both') }, { value: 'zh', label: tx('中文', 'Chinese') }, { value: 'en', label: tx('English', 'English') },
    ] },
  ],
  defaults() { return { roles: {} }; },
  deck() { return []; },
  check(s) {
    const warnings = [];
    if (s.opts.words !== 'builtin' && !customWords().length) warnings.push(tx('未有自訂詞語，會用內置詞庫。', 'No custom words yet, so the built-in list is used.'));
    return { errors: [], warnings, summary: tx(`兩隊 · ${s.opts.count} 個詞 × 3 輪 · 每回合 ${s.opts.turnSec} 秒`, `Two teams · ${s.opts.count} words × 3 rounds · ${s.opts.turnSec}s turns`) };
  },

  async run(ctx, s) {
    const pool = withCustom([...ACTIONS, ...TOPICS.flatMap((t) => t.words)], customWords(), s.opts.words);
    const bowl = shuffle(pool).slice(0, Math.min(s.opts.count, pool.length));
    const fmt = (w) => (w[0] === w[1] ? [w[0]] : s.opts.wordLang === 'both' ? [w[0], w[1]] : s.opts.wordLang === 'en' ? [w[1]] : [w[0]]);
    const scores = [0, 0];
    let team = 0;
    const paint = (active) => ctx.board(ctx.h('div', { class: 'scoreboard' }, scores.map((sc, i) =>
      ctx.h('div', { class: `score team-${i} ${i === active ? 'active' : ''}` }, ctx.h('span', {}, ctx.L(tx(`第 ${i + 1} 隊`, `Team ${i + 1}`))), ctx.h('b', {}, String(sc))))));

    await ctx.say(tx(`分成兩隊。碗裡有 ${bowl.length} 個詞，要玩三輪。`, `Split into two teams. There are ${bowl.length} words in the bowl, for three rounds.`));
    paint(-1);
    for (let r = 0; r < 3; r++) {
      let remaining = shuffle(bowl);
      await ctx.say(tx(`第 ${r + 1} 輪：${ROUNDS[r].name.zh}。表演者要${ROUNDS[r].how.zh}。`, `Round ${r + 1}: ${ROUNDS[r].name.en}. Performers must ${ROUNDS[r].how.en}.`));
      while (remaining.length) {
        ctx.phase(tx(`第 ${r + 1} 輪 · 第 ${team + 1} 隊`, `Round ${r + 1} · Team ${team + 1}`));
        paint(team);
        await ctx.say(tx(`第 ${team + 1} 隊，派一位表演者拿手機。`, `Team ${team + 1}, send a performer to hold the phone.`));
        await ctx.ready(tx('▶ 開始', '▶ Start'));
        const res = await ctx.widget((done, runner) => {
          const { h } = ctx;
          let left = s.opts.turnSec;
          let got = 0;
          const wordEl = h('div', { class: 'ch-word' });
          const timeEl = h('div', { class: 'ch-time' }, fmtTime(left));
          const countEl = h('div', { class: 'ch-count' }, `🥗 ${remaining.length}`);
          const showWord = () => { wordEl.replaceChildren(...fmt(remaining[0]).map((x, i) => h(i ? 'small' : 'span', {}, x))); countEl.textContent = `🥗 ${remaining.length}`; };
          const stop = () => { clearInterval(tick); done({ got, left: remaining }); };
          const tick = setInterval(() => {
            if (runner.paused) return;
            left -= 1;
            timeEl.textContent = fmtTime(left);
            if (left <= 5 && left > 0) ctx.sfx('tick');
            if (left <= 0) { ctx.sfx('end'); ctx.vibrate([200, 100, 200]); stop(); }
          }, 1000);
          runner.abortPromise.catch(() => clearInterval(tick));
          showWord();
          return h('div', { class: 'panel charades' },
            h('div', { class: 'ch-top' }, timeEl, countEl),
            wordEl,
            h('div', { class: 'ch-actions' },
              h('button', { class: 'btn big', onclick: () => { if (remaining.length > 1) remaining.push(remaining.shift()); showWord(); } }, ctx.L(tx('⏭ 跳過', '⏭ Skip'))),
              h('button', { class: 'btn big good', onclick: () => {
                got++; ctx.sfx('chime'); ctx.vibrate(40);
                remaining.shift();
                if (!remaining.length) return stop();
                showWord();
              } }, ctx.L(tx('✅ 估中', '✅ Got it')))),
          );
        });
        // The widget hands back what is left in the bowl (a plain count is treated as words taken from the front).
        const got = typeof res === 'number' ? res : res.got;
        remaining = typeof res === 'number' ? remaining.slice(res) : res.left;
        scores[team] += got;
        paint(team);
        await ctx.say(remaining.length
          ? tx(`第 ${team + 1} 隊估中 ${got} 個。碗裡還有 ${remaining.length} 個詞。`, `Team ${team + 1} got ${got}. ${remaining.length} words left in the bowl.`)
          : tx(`第 ${team + 1} 隊估中 ${got} 個，碗已經清空！`, `Team ${team + 1} got ${got}, and the bowl is empty!`));
        team = 1 - team;
      }
    }
    ctx.phase(tx('結算', 'Result'));
    paint(-1);
    if (scores[0] === scores[1]) {
      await ctx.say(tx(`平手！兩隊都是 ${scores[0]} 分。`, `It's a tie at ${scores[0]} points each!`));
    } else {
      const w = scores[0] > scores[1] ? 0 : 1;
      ctx.result(`team${w + 1}`);
      await ctx.say(tx(`第 ${w + 1} 隊以 ${scores[w]} 比 ${scores[1 - w]} 勝出！`, `Team ${w + 1} wins ${scores[w]} to ${scores[1 - w]}!`));
    }
  },
};
