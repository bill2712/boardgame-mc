import { tx, shuffle, pick, ucfirst } from '../util.js';
import { SPYFALL_LOCATIONS } from './words.js';

export default {
  id: 'spyfall',
  emoji: '🕵️‍♂️',
  name: tx('間諜危機', 'Spyfall'),
  tagline: tx('大家都在同一個地方，只有間諜不知道是哪裡', 'Everyone shares a location, except the spy'),
  players: { min: 3, max: 12, default: 6 },
  time: '10',
  rules: {
    zh: [
      '手機輪流派發身份：平民看到同一個地點，間諜只知道自己是間諜。',
      '玩家輪流向任何一位玩家提問，被問的人回答後再問下一個人。問題不要太明顯，以免間諜猜到地點。',
      '任何時候都可以按「指控」暫停計時：除了被指控者，所有人一致同意就揭曉身份。',
      '間諜隨時可以公開身份並猜地點，猜中即間諜勝。',
      '時間到仍未找出間諜，每人輪流指控一次；全部失敗則間諜勝。',
    ],
    en: [
      'The phone deals roles: civilians see the same location, the spy only learns they are the spy.',
      'Players take turns asking anyone a question; the answerer asks the next one. Keep questions vague so the spy cannot work out the location.',
      'Anyone can tap "Accuse" to stop the clock. If everyone except the accused agrees, reveal their role.',
      'The spy may reveal themselves at any time and guess the location. A correct guess wins.',
      'If time runs out, each player gets one accusation. If none succeeds, the spy wins.',
    ],
  },
  roles: [
    { id: 'spy', name: tx('間諜', 'Spy'), team: 'evil', emoji: '🕶️', min: 1, max: 2, desc: tx('不知道地點，要靠問答猜出來。', 'Does not know the location and must deduce it.') },
    { id: 'civ', name: tx('平民', 'Civilian'), team: 'good', emoji: '🙂', auto: true, desc: tx('知道地點，要找出間諜。', 'Knows the location and must find the spy.') },
  ],
  options: [
    { id: 'minutes', type: 'number', label: tx('遊戲時間', 'Round length'), min: 3, max: 15, step: 1, unit: 'min', default: 8 },
    { id: 'wordLang', type: 'select', label: tx('地點語言', 'Location language'), default: 'both', choices: [
      { value: 'both', label: tx('中英對照', 'Both') }, { value: 'zh', label: tx('中文', 'Chinese') }, { value: 'en', label: tx('English', 'English') },
    ] },
  ],
  defaults(n) { return { roles: { spy: n >= 9 ? 2 : 1 } }; },
  deck(s) { return [...Array(s.roles.spy || 1).fill('spy'), ...Array(Math.max(0, s.n - (s.roles.spy || 1))).fill('civ')]; },
  check(s) {
    const errors = [];
    if ((s.roles.spy || 0) * 2 >= s.n) errors.push(tx('間諜太多。', 'Too many spies.'));
    return { errors, warnings: [], summary: tx(`平民 ${s.n - s.roles.spy} · 間諜 ${s.roles.spy} · ${s.opts.minutes} 分鐘`, `${s.n - s.roles.spy} civilians · ${s.roles.spy} spy · ${s.opts.minutes} min`) };
  },

  async run(ctx, s) {
    const roles = shuffle(this.deck(s));
    const loc = pick(SPYFALL_LOCATIONS);
    const fmt = (l) => (s.opts.wordLang === 'both' ? `${l[0]} / ${l[1]}` : s.opts.wordLang === 'en' ? l[1] : l[0]);
    const spies = roles.map((r, i) => (r === 'spy' ? i + 1 : null)).filter(Boolean);

    await ctx.say(tx('請大家順時針由 1 號開始記住座位號碼，然後輪流查看身份。', 'Number yourselves clockwise from 1, then take turns viewing your role.'));
    await ctx.ready();
    await ctx.deal(roles.map((r, i) => ({
      seat: i + 1,
      emoji: r === 'spy' ? '🕶️' : '📍',
      team: r === 'spy' ? 'evil' : 'good',
      title: r === 'spy' ? tx('你是間諜！', 'You are the SPY!') : tx(`地點：${fmt(loc)}`, `Location: ${fmt(loc)}`),
      body: r === 'spy'
        ? tx('留心聽大家的問答，猜出地點。隨時可以公開身份猜地點。', 'Listen carefully and work out the location. You may reveal yourself and guess at any time.')
        : tx('回答時要證明你知道地點，但不要讓間諜猜到。', 'Prove you know the location without giving it away to the spy.'),
    })));

    // Public list of all locations so the spy can reason.
    ctx.board(ctx.h('details', { class: 'loc-list' },
      ctx.h('summary', {}, ctx.L(tx(`📍 所有可能地點（${SPYFALL_LOCATIONS.length}）`, `📍 All possible locations (${SPYFALL_LOCATIONS.length})`))),
      ctx.h('div', { class: 'chips' }, SPYFALL_LOCATIONS.map((l) => ctx.h('span', { class: 'chip' }, fmt(l))))));

    const first = ctx.randInt(1, s.n);
    ctx.phase(tx('問答', 'Questions'));
    await ctx.say(tx(`由${ctx.seat(first).zh}開始，向任何一位玩家提出第一個問題。計時開始！`, `${ucfirst(ctx.seat(first).en)} asks the first question to anyone. The clock starts now!`));

    let remaining = s.opts.minutes * 60;
    let outcome = null;
    while (remaining > 0 && !outcome) {
      const r = await ctx.timer(remaining, {
        title: tx('問答時間', 'Question time'),
        buttons: [
          { id: 'accuse', label: tx('🛑 指控', '🛑 Accuse') },
          { id: 'guess', label: tx('🕶️ 間諜猜地點', '🕶️ Spy guesses') },
        ],
        hideEnd: true,
      });
      remaining = r.remaining;
      if (r.reason === 'accuse') {
        await ctx.say(tx('有人提出指控！除了被指控的人，其他人要一致同意。', 'An accusation! Everyone except the accused must agree.'));
        const v = await ctx.buttons({
          title: tx('投票結果', 'Vote result'),
          buttons: [
            { id: 'yes', label: tx('✅ 一致同意，揭曉身份', '✅ Unanimous, reveal'), style: 'primary' },
            { id: 'no', label: tx('❌ 未能一致，繼續', '❌ Not unanimous, continue') },
          ],
        });
        if (v === 'yes') outcome = 'accused';
        else await ctx.say(tx('繼續問答。', 'Back to the questions.'));
      } else if (r.reason === 'guess') {
        outcome = 'spyguess';
      }
    }

    ctx.phase(tx('結算', 'Result'));
    if (!outcome) {
      await ctx.say(tx('時間到！每人輪流指控一位玩家，所有人一致同意就揭曉身份。', "Time's up! Each player in turn may accuse someone. If everyone agrees, reveal that player."));
      await ctx.ready(tx('揭曉答案', 'Reveal the answer'));
    } else if (outcome === 'spyguess') {
      await ctx.say(tx('間諜公開身份，請說出你猜的地點。', 'The spy reveals themselves. Name your guess.'));
      await ctx.ready(tx('揭曉答案', 'Reveal the answer'));
    } else {
      await ctx.say(tx('被指控的玩家請翻開身份。', 'The accused player, reveal your role.'));
      await ctx.ready(tx('揭曉答案', 'Reveal the answer'));
    }
    await ctx.say(tx(`地點是${loc[0]}。間諜是${ctx.seats(spies).zh}！`, `The location was ${loc[1]}. The spy was ${ctx.seats(spies).en}!`));
  },
};
