import { tx } from '../util.js';

export default {
  id: 'timer',
  emoji: '⏱️',
  name: tx('通用計時器', 'Table Timer'),
  tagline: tx('任何桌遊都用得：自由討論或者輪流發言計時', 'For any game: free discussion or turn-by-turn speaking'),
  players: { min: 2, max: 20, default: 6 },
  time: '—',
  rules: {
    zh: ['自由討論：一個總計時，剩一分鐘、三十秒、十秒會提醒。', '輪流發言：按座位順序，每人有固定時間，語音會叫下一位。'],
    en: ['Free discussion: one countdown with reminders at one minute, thirty seconds and ten seconds.', 'Turns: each player gets a fixed time in seat order, and the voice calls the next player.'],
  },
  roles: [],
  options: [
    { id: 'mode', type: 'select', label: tx('模式', 'Mode'), default: 'free', choices: [
      { value: 'free', label: tx('自由討論', 'Free discussion') },
      { value: 'turns', label: tx('輪流發言', 'Turn by turn') },
    ] },
    { id: 'minutes', type: 'number', label: tx('總時間', 'Total time'), min: 1, max: 60, step: 1, unit: 'min', default: 5, showIf: (s) => s.opts.mode === 'free' },
    { id: 'turnSec', type: 'number', label: tx('每人時間', 'Time per player'), min: 10, max: 300, step: 10, unit: 'sec', default: 60, showIf: (s) => s.opts.mode === 'turns' },
    { id: 'rounds', type: 'number', label: tx('輪數', 'Rounds'), min: 1, max: 10, step: 1, default: 1, showIf: (s) => s.opts.mode === 'turns' },
  ],
  defaults() { return { roles: {} }; },
  deck() { return []; },
  check(s) {
    return {
      errors: [], warnings: [],
      summary: s.opts.mode === 'turns'
        ? tx(`${s.n} 人 × ${s.opts.turnSec} 秒 × ${s.opts.rounds} 輪`, `${s.n} players × ${s.opts.turnSec}s × ${s.opts.rounds} round(s)`)
        : tx(`自由討論 ${s.opts.minutes} 分鐘`, `Free discussion, ${s.opts.minutes} min`),
    };
  },
  async run(ctx, s) {
    if (s.opts.mode === 'free') {
      await ctx.say(tx(`討論開始，時間 ${s.opts.minutes} 分鐘。`, `Discussion starts now. You have ${s.opts.minutes} minute${s.opts.minutes > 1 ? 's' : ''}.`));
      await ctx.timer(s.opts.minutes * 60, { title: tx('討論時間', 'Discussion') });
      return;
    }
    for (let r = 1; r <= s.opts.rounds; r++) {
      ctx.phase(tx(`第 ${r} 輪`, `Round ${r}`));
      for (let p = 1; p <= s.n; p++) {
        await ctx.say(tx(`${p} 號玩家發言。`, `Player ${p}, your turn.`), { after: 0.2 });
        await ctx.timer(s.opts.turnSec, { title: tx(`${p} 號發言`, `Player ${p}`), endLabel: tx('下一位', 'Next'), silentEnd: true, warnings: [10] });
      }
    }
    await ctx.say(tx('所有人發言完畢。', 'Everyone has spoken.'));
  },
};
