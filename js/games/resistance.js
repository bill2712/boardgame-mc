import { tx, shuffle } from '../util.js';
import { EVIL_BY_N, QUESTS, questTracker } from './avalon.js';

const R = {
  resistance: { name: tx('抵抗組織成員', 'Resistance member'), team: 'good', emoji: '✊', desc: tx('完成任務推翻政府。不知道誰是間諜。', 'Complete missions to topple the government. You do not know who the spies are.') },
  spy: { name: tx('間諜', 'Spy'), team: 'evil', emoji: '🕶️', desc: tx('互相認識，暗中令任務失敗。', 'Know each other and secretly sabotage missions.') },
};

export default {
  id: 'resistance',
  emoji: '✊',
  name: tx('抵抗組織', 'The Resistance'),
  tagline: tx('阿瓦隆的原版：沒有特殊角色，純粹推理誰是間諜', 'The original of Avalon: no special roles, pure deduction'),
  players: { min: 5, max: 10, default: 6 },
  time: '30',
  rules: {
    zh: [
      '抵抗組織要完成 3 個任務；間諜要令 3 個任務失敗，或者令組隊連續 5 次被否決。',
      '每輪由隊長挑選隊員，所有人公開投票；通過後隊員秘密打出「成功」或「失敗」。',
      '7 人或以上時，第 4 個任務需要 2 張失敗卡才算失敗。',
      '夜晚只有間諜睜眼互相確認，沒有梅林等特殊角色，適合新手入門。',
    ],
    en: [
      'The Resistance wins with 3 successful missions. Spies win with 3 failed missions, or when 5 team proposals in a row are rejected.',
      'Each round the leader picks a team and everyone votes openly; the team then secretly plays Success or Fail.',
      'With 7+ players, mission 4 needs two Fail cards to fail.',
      'At night only the spies open their eyes to see each other. No special roles, so it is great for beginners.',
    ],
  },
  roles: [
    { id: 'resistance', ...R.resistance, auto: true },
    { id: 'spy', ...R.spy, auto: true },
  ],
  options: [
    { id: 'tracker', type: 'toggle', label: tx('任務記錄板（隊長、投票、任務結果）', 'Mission tracker (votes and results)'), default: true },
    { id: 'talk', type: 'number', label: tx('每輪組隊討論時間（0 = 不計時）', 'Discussion timer per round (0 = off)'), min: 0, max: 10, step: 1, unit: 'min', default: 0 },
    { id: 'nightSec', type: 'number', label: tx('間諜確認時間', 'Time for spies to see each other'), min: 3, max: 15, step: 1, unit: 'sec', default: 6 },
    { id: 'deal', type: 'toggle', label: tx('電子派牌（沒有實體卡也能玩）', 'Deal roles on this phone (no cards needed)'), default: false },
  ],
  defaults() { return { roles: {} }; },
  deck(s) {
    const spies = EVIL_BY_N[s.n];
    return [...Array(s.n - spies).fill('resistance'), ...Array(spies).fill('spy')];
  },
  check(s) {
    const spies = EVIL_BY_N[s.n];
    const q = QUESTS[s.n].map((x, i) => (s.n >= 7 && i === 3 ? `${x}*` : x)).join(' – ');
    return {
      errors: [], warnings: [],
      summary: tx(`抵抗組織 ${s.n - spies} 人 · 間諜 ${spies} 人 · 任務人數 ${q}`, `${s.n - spies} resistance · ${spies} spies · Mission sizes ${q}`),
    };
  },

  async run(ctx, s) {
    if (s.opts.deal) {
      const roles = shuffle(this.deck(s));
      const spySeats = roles.map((r, i) => (r === 'spy' ? i + 1 : null)).filter(Boolean);
      await ctx.deal(roles.map((id, i) => ({
        seat: i + 1, title: R[id].name, emoji: R[id].emoji, team: R[id].team,
        teamLabel: id === 'spy' ? tx('間諜陣營', 'Spies') : tx('抵抗組織', 'Resistance'),
        body: [R[id].desc, id === 'spy' ? tx(`間諜同伴：${ctx.seats(spySeats.filter((x) => x !== i + 1)).zh}`, `Fellow spies: ${ctx.seats(spySeats.filter((x) => x !== i + 1)).en}`) : null].filter(Boolean),
      })));
    } else {
      await ctx.say(tx('請每位玩家抽一張身份卡，秘密查看。準備好就按繼續。', 'Each player, take a role card and look at it secretly. Tap continue when ready.'));
      await ctx.ready();
    }
    ctx.phase(tx('夜晚', 'Night'), { night: true });
    await ctx.say(tx('所有人請閉上眼睛，雙手握拳放在面前。', 'Everyone, close your eyes and put your fists on the table.'));
    await ctx.act(2);
    await ctx.say(tx('間諜請睜開眼睛，互相確認身份。', 'Spies, open your eyes and look at each other.'));
    await ctx.act(s.opts.nightSec);
    await ctx.say(tx('間諜請閉上眼睛。', 'Spies, close your eyes.'));
    await ctx.act(1.5);
    ctx.phase(tx('白天', 'Day'));
    await ctx.say(tx('所有人請睜開眼睛。', 'Everyone, open your eyes.'));
    if (!s.opts.tracker) {
      await ctx.say(tx('夜晚結束，祝大家遊戲愉快！', 'The night is over. Have a good game!'));
      return;
    }
    await questTracker(ctx, s);
  },
};
