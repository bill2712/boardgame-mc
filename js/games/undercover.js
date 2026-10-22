import { tx, shuffle, pick, ucfirst } from '../util.js';
import { UNDERCOVER_PAIRS } from './words.js';

const R = {
  civilian: { name: tx('平民', 'Civilian'), team: 'good', desc: tx('大部分人拿到同一個詞語。', 'Most players share the same word.') },
  undercover: { name: tx('臥底', 'Undercover'), team: 'evil', desc: tx('詞語和平民相似但不同；自己未必知道自己是臥底。', 'Gets a similar but different word, and may not realise it.') },
  blank: { name: tx('白板', 'Blank'), team: 'neutral', desc: tx('沒有詞語，要假裝知道。', 'Gets no word and has to bluff.') },
};

/** 'civilian' | 'undercover' | null */
export function undercoverWinner(players) {
  const alive = players.filter((p) => p.alive);
  const bad = alive.filter((p) => p.role !== 'civilian').length;
  const good = alive.length - bad;
  if (bad === 0) return 'civilian';
  if (good <= bad || alive.length <= 2) return 'undercover';
  return null;
}

export default {
  id: 'undercover',
  emoji: '🙊',
  name: tx('誰是臥底', "Who's the Undercover"),
  tagline: tx('每人一個詞，描述得太準會被臥底知道', 'Everyone gets a word, but one is slightly different'),
  players: { min: 4, max: 12, default: 6 },
  time: '15',
  rules: {
    zh: [
      '手機輪流派詞：平民拿到同一個詞，臥底拿到相似但不同的詞，白板沒有詞。',
      '每輪每人用一句話描述自己的詞，不可以直接說出那個詞。',
      '每輪描述完畢後投票，最高票的玩家出局。',
      '臥底（和白板）全部出局，平民勝；臥底人數 ≥ 平民人數，或者只剩兩人，臥底勝。',
    ],
    en: [
      'The phone deals words: civilians share one word, the undercover gets a similar one, and a blank gets none.',
      'Each round, everyone describes their word in one sentence without saying it.',
      'After each round, vote. The player with the most votes is out.',
      'Civilians win when every undercover (and blank) is out. Undercovers win when they equal or outnumber the civilians, or only two players remain.',
    ],
  },
  roles: [
    { id: 'civilian', ...R.civilian, auto: true },
    { id: 'undercover', ...R.undercover, min: 1, max: 3 },
    { id: 'blank', ...R.blank, max: 1 },
  ],
  options: [
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'ui', choices: [
      { value: 'ui', label: tx('跟介面語言', 'Same as interface') },
      { value: 'zh', label: tx('中文', 'Chinese') },
      { value: 'en', label: tx('English', 'English') },
      { value: 'both', label: tx('中英對照', 'Both') },
    ] },
    { id: 'speak', type: 'number', label: tx('每人描述時間（0 = 不計時）', 'Time per description (0 = off)'), min: 0, max: 90, step: 5, unit: 'sec', default: 20 },
    { id: 'reveal', type: 'toggle', label: tx('出局時公開身份', 'Reveal role when out'), default: false },
  ],
  defaults(n) { return { roles: { undercover: n >= 8 ? 2 : 1, blank: 0 } }; },
  deck(s) {
    const u = s.roles.undercover || 0;
    const b = s.roles.blank || 0;
    return [...Array(u).fill('undercover'), ...Array(b).fill('blank'), ...Array(Math.max(0, s.n - u - b)).fill('civilian')];
  },
  check(s) {
    const bad = (s.roles.undercover || 0) + (s.roles.blank || 0);
    const errors = [];
    if (bad >= s.n - bad) errors.push(tx('臥底和白板太多，人數要少於平民。', 'Too many undercovers and blanks. They must be fewer than civilians.'));
    return { errors, warnings: [], summary: tx(`平民 ${s.n - bad} · 臥底 ${s.roles.undercover || 0} · 白板 ${s.roles.blank || 0}`, `${s.n - bad} civilians · ${s.roles.undercover || 0} undercover · ${s.roles.blank || 0} blank`) };
  },

  async run(ctx, s) {
    const roles = shuffle(this.deck(s));
    const pair = pick(UNDERCOVER_PAIRS);
    const flip = Math.random() < 0.5;
    const civ = flip ? 1 : 0;
    const und = flip ? 0 : 1;
    const lang = s.opts.wordLang === 'ui' ? ctx.settings.uiLang : s.opts.wordLang;
    const word = (i) => (lang === 'both' ? `${pair[0][i]} / ${pair[1][i]}` : pair[lang === 'en' ? 1 : 0][i]);
    const P = roles.map((role, i) => ({ seat: i + 1, role, alive: true }));

    await ctx.say(tx('請大家圍成一圈，順時針由 1 號開始記住座位號碼，然後輪流查看自己的詞語。', 'Sit in a circle and number yourselves clockwise from 1. Then take turns viewing your word.'));
    await ctx.ready();
    await ctx.deal(P.map((p) => ({
      seat: p.seat,
      emoji: p.role === 'blank' ? '⬜' : '📝',
      team: 'neutral',
      title: p.role === 'blank' ? tx('你是白板', 'You are a Blank') : tx(`你的詞語：${word(p.role === 'civilian' ? civ : und)}`, `Your word: ${word(p.role === 'civilian' ? civ : und)}`),
      body: p.role === 'blank'
        ? tx('你沒有詞語。仔細聽其他人怎樣描述，假裝知道混過去！', 'You have no word. Listen carefully and bluff!')
        : tx('記住你的詞語。描述時不可以直接說出來。', 'Remember your word. Never say it out loud.'),
    })));

    const strip = () => ctx.board(ctx.h('div', { class: 'seat-strip' }, P.map((p) => ctx.h('span', { class: `seat ${p.alive ? '' : 'dead'}` }, String(p.seat)))));
    strip();

    for (let round = 1; ; round++) {
      ctx.phase(tx(`第 ${round} 輪`, `Round ${round}`));
      const living = P.filter((p) => p.alive).map((p) => p.seat);
      const start = living[Math.floor(Math.random() * living.length)];
      const order = [...living.filter((x) => x >= start), ...living.filter((x) => x < start)];
      await ctx.say(tx(`第 ${round} 輪，由 ${ctx.seat(start).zh}開始，順時針每人用一句說話描述你的詞語。`, `Round ${round}. Starting with ${ctx.seat(start).en} and going clockwise, describe your word in one sentence.`));
      if (s.opts.speak > 0) {
        for (const seat of order) {
          await ctx.say(tx(`${ctx.seat(seat).zh}。`, `${ucfirst(ctx.seat(seat).en)}.`), { after: 0.1 });
          await ctx.timer(s.opts.speak, { title: tx(`${ctx.seat(seat).zh}描述`, `${ucfirst(ctx.seat(seat).en)} describing`), endLabel: tx('說完', 'Done'), silentEnd: true, warnings: [] });
        }
      } else {
        await ctx.ready(tx('描述完畢，開始投票', 'Done, start voting'));
      }
      await ctx.say(tx('請投票。三、二、一，同時指向你認為是臥底的玩家。', 'Time to vote. Three, two, one: point at the player you think is undercover.'));
      const out = await ctx.choose({
        title: tx('最高票的是？', 'Who got the most votes?'),
        items: P.map((p) => ({ id: p.seat, label: String(p.seat), sub: p.alive ? null : '💀', disabled: !p.alive })),
        extra: [{ id: 'tie', label: tx('平票，再描述一輪', 'Tie, play another round') }],
      });
      if (out === 'tie') {
        await ctx.say(tx('平票，沒有人出局。', 'A tie. Nobody is out.'));
        continue;
      }
      const p = P[out - 1];
      p.alive = false;
      strip();
      await ctx.say(s.opts.reveal
        ? tx(`${ctx.seat(out).zh}出局，他是${R[p.role].name.zh}。`, `${ucfirst(ctx.seat(out).en)} is out. They were ${R[p.role].name.en === 'Undercover' ? 'an Undercover' : 'a ' + R[p.role].name.en}.`)
        : tx(`${ctx.seat(out).zh}出局。`, `${ucfirst(ctx.seat(out).en)} is out.`));
      const w = undercoverWinner(P);
      if (w) {
        ctx.phase(ctx.t('gameOver'));
        await ctx.say(w === 'civilian' ? tx('臥底全部出局，平民勝利！', 'All undercovers are out. Civilians win!') : tx('臥底成功混到最後，臥底勝利！', 'The undercover survived to the end. Undercover wins!'));
        await ctx.say(tx(`平民的詞語是「${word(civ)}」，臥底的詞語是「${word(und)}」。`, `The civilian word was "${word(civ)}" and the undercover word was "${word(und)}".`));
        ctx.board(ctx.h('div', { class: 'reveal-list' }, P.map((q) => ctx.h('div', { class: `reveal team-${R[q.role].team} ${q.alive ? '' : 'dead'}` },
          ctx.h('b', {}, ctx.L(ctx.seat(q.seat))), ' ', ctx.L(R[q.role].name),
          q.role === 'blank' ? '' : ` · ${word(q.role === 'civilian' ? civ : und)}`))));
        return;
      }
      await ctx.say(tx('臥底仍然在場上，遊戲繼續。', 'The undercover is still among you. The game continues.'));
    }
  },
};
