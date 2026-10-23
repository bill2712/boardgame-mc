import { tx, shuffle, randInt, ucfirst } from '../util.js';

export default {
  id: 'picker',
  emoji: '🎲',
  name: tx('抽籤分組', 'Picker'),
  tagline: tx('隨機抽出第一位玩家、分隊或者排次序', 'Pick a first player, split teams or shuffle the order'),
  players: { min: 2, max: 30, default: 6 },
  time: '—',
  rules: {
    zh: ['抽第一位：隨機抽出一位玩家先開始。', '分隊：把所有玩家隨機分成 2 至 4 隊。', '排次序：隨機排出所有玩家的次序。', '在設定輸入玩家名字，結果會直接顯示和讀出名字。'],
    en: ['First player: randomly picks who starts.', 'Teams: splits everyone into 2 to 4 random teams.', 'Order: shuffles everyone into a random order.', 'Type player names on the setup page and the result shows and reads out their names.'],
  },
  roles: [],
  options: [
    { id: 'mode', type: 'select', label: tx('模式', 'Mode'), default: 'first', choices: [
      { value: 'first', label: tx('抽第一位', 'First player') },
      { value: 'teams', label: tx('分隊', 'Teams') },
      { value: 'order', label: tx('排次序', 'Order') },
    ] },
    { id: 'teams', type: 'number', label: tx('隊伍數目', 'Teams'), min: 2, max: 4, step: 1, default: 2, showIf: (s) => s.opts.mode === 'teams' },
  ],
  defaults() { return { roles: {} }; },
  deck() { return []; },
  check(s) {
    const errors = [];
    if (s.opts.mode === 'teams' && s.opts.teams > s.n) errors.push(tx('隊伍比玩家還多。', 'More teams than players.'));
    return { errors, warnings: [], summary: s.opts.mode === 'teams' ? tx(`${s.n} 人分成 ${s.opts.teams} 隊`, `${s.n} players into ${s.opts.teams} teams`) : s.opts.mode === 'order' ? tx(`${s.n} 人隨機排次序`, `Random order for ${s.n} players`) : tx(`${s.n} 人抽一位先開始`, `Pick one of ${s.n} players to start`) };
  },

  async run(ctx, s) {
    const { h, L } = ctx;
    const seats = ctx.range(1, s.n);
    for (;;) {
      ctx.phase(tx('抽籤中…', 'Drawing…'));
      // A short drum roll that flashes random seats.
      const big = h('div', { class: 'picker-roll' }, '?');
      ctx.board(h('div', { class: 'topic-board picker' }, big));
      for (let i = 0; i < 12; i++) {
        big.textContent = L(ctx.seat(randInt(1, s.n)));
        ctx.sfx('tick');
        await ctx.wait(0.08 + i * 0.015, { silent: true });
      }
      ctx.phase(tx('結果', 'Result'));
      if (s.opts.mode === 'first') {
        const p = randInt(1, s.n);
        big.textContent = L(ctx.seat(p));
        ctx.sfx('chime');
        await ctx.say(tx(`由${ctx.seat(p).zh}開始！`, `${ucfirst(ctx.seat(p).en)} goes first!`));
      } else if (s.opts.mode === 'order') {
        const order = shuffle(seats);
        ctx.board(h('div', { class: 'topic-board picker' }, h('ol', { class: 'picker-list' }, order.map((p) => h('li', {}, L(ctx.seat(p)))))));
        ctx.sfx('chime');
        await ctx.say(tx(`次序是：${order.map((p) => ctx.seat(p).zh).join('、')}。`, `The order is: ${order.map((p) => ctx.seat(p).en).join(', ')}.`));
      } else {
        const order = shuffle(seats);
        const teams = Array.from({ length: s.opts.teams }, () => []);
        order.forEach((p, i) => teams[i % s.opts.teams].push(p));
        ctx.board(h('div', { class: 'scoreboard' }, teams.map((tm, i) => h('div', { class: `score team-${i}` },
          h('b', {}, L(tx(`第 ${i + 1} 隊`, `Team ${i + 1}`))), h('span', {}, tm.map((p) => L(ctx.seat(p))).join('、'))))));
        ctx.sfx('chime');
        await ctx.say(tx(teams.map((tm, i) => `第${i + 1}隊：${tm.map((p) => ctx.seat(p).zh).join('、')}`).join('。') + '。',
          teams.map((tm, i) => `Team ${i + 1}: ${tm.map((p) => ctx.seat(p).en).join(', ')}`).join('. ') + '.'));
      }
      const again = await ctx.buttons({ buttons: [{ id: 'again', label: tx('🔄 再抽一次', '🔄 Draw again'), style: 'primary' }, { id: 'done', label: ctx.t('done') }] });
      if (again === 'done') return;
    }
  },
};
