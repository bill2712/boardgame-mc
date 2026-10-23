import { tx, shuffle } from '../util.js';

export const LIBERALS = { 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6 };

/** Presidential power unlocked by the Nth fascist policy (index 0 = 1st policy). */
export function powers(n) {
  if (n <= 6) return [null, null, 'peek', 'kill', 'kill', null];
  if (n <= 8) return [null, 'investigate', 'special', 'kill', 'kill', null];
  return ['investigate', 'investigate', 'special', 'kill', 'kill', null];
}

const POWER_TEXT = {
  peek: tx('總統權力：秘密查看法案牌堆頂的三張法案。', 'Presidential power: secretly look at the top three policy cards.'),
  investigate: tx('總統權力：調查一位玩家的黨派。', "Presidential power: investigate one player's party membership."),
  special: tx('總統權力：指定下一任總統候選人。特別選舉之後，總統職位會回到原本順序的下一位。', 'Presidential power: choose the next presidential candidate. After that special election, the presidency returns to the normal order.'),
  kill: tx('總統權力：處決一位玩家。', 'Presidential power: execute a player.'),
};
const POWER_ICON = { peek: '👁️', investigate: '🔍', special: '🎖️', kill: '💀' };

const R = {
  liberal: { name: tx('自由黨', 'Liberal'), team: 'good', emoji: '🕊️', desc: tx('通過 5 張自由黨法案，或者處決希特勒。', 'Enact 5 Liberal policies or execute Hitler.') },
  fascist: { name: tx('法西斯黨', 'Fascist'), team: 'evil', emoji: '🦅', desc: tx('通過 6 張法西斯法案，或者在 3 張法西斯法案後令希特勒當選總理。', 'Enact 6 Fascist policies, or get Hitler elected Chancellor after 3 Fascist policies.') },
  hitler: { name: tx('希特勒', 'Hitler'), team: 'evil', emoji: '💀', desc: tx('屬於法西斯陣營。隱藏身份，爭取當選總理。', 'On the Fascist team. Stay hidden and get elected Chancellor.') },
};

export default {
  id: 'secret-hitler',
  emoji: '🗳️',
  name: tx('秘密希特勒', 'Secret Hitler'),
  tagline: tx('1930 年代德國議會：自由黨 vs 隱藏的法西斯', '1930s Germany: Liberals vs. hidden Fascists'),
  players: { min: 5, max: 10, default: 7 },
  time: '45',
  rules: {
    zh: [
      '自由黨：通過 5 張自由黨法案，或者處決希特勒即獲勝。',
      '法西斯：通過 6 張法西斯法案，或者在 3 張法西斯法案之後選出希特勒當總理即獲勝。',
      '每輪總統提名總理，全員投票；通過後總統抽 3 張法案棄 1 張，總理再棄 1 張並頒布 1 張。',
      '連續 3 次選舉失敗，直接頒布牌堆頂的法案。',
      '本 App 會讀出夜晚流程，並記錄法案、選舉失敗次數和總統權力。',
    ],
    en: [
      'Liberals win by enacting 5 Liberal policies or executing Hitler.',
      'Fascists win by enacting 6 Fascist policies, or electing Hitler Chancellor after 3 Fascist policies.',
      'Each round the President nominates a Chancellor and everyone votes. If it passes, the President draws 3 and discards 1, and the Chancellor discards 1 and enacts 1.',
      'Three failed elections in a row enact the top policy of the deck.',
      'The app narrates the night and tracks policies, the election tracker and presidential powers.',
    ],
  },
  roles: [
    { id: 'liberal', ...R.liberal, auto: true },
    { id: 'fascist', ...R.fascist, auto: true },
    { id: 'hitler', ...R.hitler, fixed: true },
  ],
  options: [
    { id: 'tracker', type: 'toggle', label: tx('法案記錄板（選舉、法案、權力）', 'Policy tracker (elections, policies, powers)'), default: true },
    { id: 'talk', type: 'number', label: tx('每輪討論時間（0 = 不計時）', 'Discussion timer per round (0 = off)'), min: 0, max: 10, step: 1, unit: 'min', default: 0 },
    { id: 'nightSec', type: 'number', label: tx('夜晚確認時間', 'Night reveal time'), min: 3, max: 15, step: 1, unit: 'sec', default: 6 },
    { id: 'deal', type: 'toggle', label: tx('電子派牌（沒有實體卡也能玩）', 'Deal roles on this phone (no cards needed)'), default: false },
  ],
  defaults() { return { roles: { hitler: 1 } }; },
  deck(s) {
    const lib = LIBERALS[s.n];
    return [...Array(lib).fill('liberal'), ...Array(s.n - lib - 1).fill('fascist'), 'hitler'];
  },
  check(s) {
    const lib = LIBERALS[s.n];
    return {
      errors: [],
      warnings: [],
      summary: tx(`自由黨 ${lib} 人 · 法西斯 ${s.n - lib - 1} 人 + 希特勒`, `${lib} Liberals · ${s.n - lib - 1} Fascist${s.n - lib - 1 > 1 ? 's' : ''} + Hitler`),
    };
  },

  async run(ctx, s) {
    const { n } = s;
    if (s.opts.deal) {
      const roles = shuffle(this.deck(s));
      await ctx.deal(roles.map((id, i) => ({
        seat: i + 1, title: R[id].name, emoji: R[id].emoji, team: R[id].team,
        teamLabel: id === 'liberal' ? tx('自由黨陣營', 'Liberal team') : tx('法西斯陣營', 'Fascist team'),
        body: R[id].desc,
      })));
    } else {
      await ctx.say(tx('請每位玩家拿取身份信封，秘密查看自己的黨派同身份。準備好就按繼續。', 'Each player, take a secret role envelope and look at your party and role. Tap continue when ready.'));
      await ctx.ready();
    }

    ctx.phase(tx('夜晚', 'Night'), { night: true });
    await ctx.say(tx('所有人請閉上眼睛，伸出拳頭放在面前。', 'Everyone close your eyes and extend your hand into a fist in front of you.'));
    await ctx.act(2);
    if (n <= 6) {
      await ctx.say(tx('法西斯黨員和希特勒請睜開眼睛，互相確認。', 'Fascist and Hitler, open your eyes and acknowledge each other.'));
      await ctx.act(s.opts.nightSec);
      await ctx.say(tx('法西斯黨員和希特勒請閉上眼睛。', 'Fascist and Hitler, close your eyes.'));
    } else {
      await ctx.say(tx('法西斯黨員請睜開眼睛，互相確認。希特勒請保持閉眼，並豎起大拇指。', 'Fascists, but not Hitler, open your eyes and acknowledge all fascists. Hitler, keep your eyes closed but put your thumb up.'));
      await ctx.act(s.opts.nightSec);
      await ctx.say(tx('法西斯黨員請記住希特勒，然後閉上眼睛。希特勒請收起大拇指。', 'Fascists, note who Hitler is, then close your eyes. Hitler, put your thumb down.'));
    }
    await ctx.act(1.5);
    ctx.phase(tx('白天', 'Day'));
    await ctx.say(tx('所有人請睜開眼睛。', 'Everyone, open your eyes.'));

    if (!s.opts.tracker) {
      await ctx.say(tx('夜晚結束，請隨機選一位玩家擔任第一任總統候選人。祝大家遊戲愉快！', 'The night is over. Choose a random first presidential candidate. Have a good game!'));
      return;
    }
    await tracker(ctx, s);
  },
};

async function tracker(ctx, s) {
  const { h, L } = ctx;
  const pw = powers(s.n);
  let lib = 0;
  let fas = 0;
  let fails = 0;
  let deckLeft = 17;
  let round = 0;

  const paint = () => ctx.board(h('div', { class: 'sh-board' },
    h('div', { class: 'sh-row lib' }, h('span', { class: 'sh-label' }, '🕊️'),
      [0, 1, 2, 3, 4].map((i) => h('span', { class: `slot ${i < lib ? 'on' : ''}` }))),
    h('div', { class: 'sh-row fas' }, h('span', { class: 'sh-label' }, '🦅'),
      [0, 1, 2, 3, 4, 5].map((i) => h('span', { class: `slot ${i < fas ? 'on' : ''}` }, pw[i] ? POWER_ICON[pw[i]] : (i === 5 ? '🏆' : '')))),
    h('div', { class: 'rejects' }, L(tx('選舉失敗', 'Election tracker')), ' ',
      [1, 2, 3].map((i) => h('span', { class: `dot ${i <= fails ? 'on' : ''}` }))),
  ));

  const drew = async (count) => {
    deckLeft -= count;
    if (deckLeft < 3) {
      deckLeft = 17 - lib - fas;
      await ctx.say(tx('牌堆少於三張，請將棄牌堆和牌堆一起洗勻。', 'Fewer than three cards left. Shuffle the discard pile into the deck.'));
    }
  };

  const enact = async (policy, chaos) => {
    if (policy === 'L') lib++; else fas++;
    paint();
    await ctx.say(policy === 'L'
      ? tx(`頒布自由黨法案。自由黨 ${lib} 張，法西斯 ${fas} 張。`, `A Liberal policy is enacted. Liberal ${lib}, Fascist ${fas}.`)
      : tx(`頒布法西斯法案。自由黨 ${lib} 張，法西斯 ${fas} 張。`, `A Fascist policy is enacted. Liberal ${lib}, Fascist ${fas}.`));
    if (lib >= 5) { ctx.result('good'); await ctx.say(tx('五張自由黨法案，自由黨勝利！', 'Five Liberal policies. The Liberals win!')); return 'over'; }
    if (fas >= 6) { ctx.result('evil'); await ctx.say(tx('六張法西斯法案，法西斯勝利！', 'Six Fascist policies. The Fascists win!')); return 'over'; }
    if (policy === 'F' && fas === 3) await ctx.say(tx('注意：從現在開始，如果希特勒當選總理，法西斯即時勝利。', 'Warning: from now on, if Hitler is elected Chancellor, the Fascists win.'));
    if (policy === 'F' && fas === 5) await ctx.say(tx('否決權已解鎖：總理和總統都同意的話，可以棄掉兩張法案。', 'Veto power unlocked: if the Chancellor and President agree, both policies can be discarded.'));
    const power = policy === 'F' && !chaos ? pw[fas - 1] : null;
    if (power) {
      await ctx.say(POWER_TEXT[power]);
      if (power === 'kill') {
        const r = await ctx.buttons({
          title: tx('被處決的是希特勒嗎？', 'Was Hitler executed?'),
          buttons: [
            { id: 'no', label: tx('不是希特勒，繼續', 'Not Hitler, continue') },
            { id: 'yes', label: tx('💀 是希特勒！', '💀 It was Hitler!'), style: 'good' },
          ],
        });
        if (r === 'yes') { ctx.result('good'); await ctx.say(tx('希特勒被處決，自由黨勝利！', 'Hitler has been executed. The Liberals win!')); return 'over'; }
        await ctx.say(tx('被處決的玩家不可以再發言或投票。', 'The executed player may no longer speak or vote.'));
      } else {
        await ctx.ready(ctx.t('done'));
      }
    }
    return null;
  };

  const chaos = async () => {
    await ctx.say(tx('連續三次選舉失敗，國家陷入混亂！請直接翻開並頒布牌堆頂的法案，不會觸發總統權力。', 'Three failed elections. The country is thrown into chaos! Reveal and enact the top policy. No presidential power is used.'));
    const p = await ctx.buttons({
      title: tx('翻出的法案', 'Revealed policy'),
      buttons: [
        { id: 'L', label: tx('🕊️ 自由黨法案', '🕊️ Liberal policy'), style: 'good' },
        { id: 'F', label: tx('🦅 法西斯法案', '🦅 Fascist policy'), style: 'evil' },
      ],
    });
    fails = 0;
    await drew(1);
    return enact(p, true);
  };

  paint();
  await ctx.say(tx('請隨機選一位玩家擔任第一任總統候選人。', 'Pick a random player as the first presidential candidate.'));

  for (;;) {
    round++;
    ctx.phase(tx(`第 ${round} 輪`, `Round ${round}`));
    await ctx.say(fas >= 3
      ? tx('總統候選人請提名總理。記住：希特勒當選總理，法西斯即勝。', 'Presidential candidate, nominate a Chancellor. Remember: if Hitler is elected Chancellor, the Fascists win.')
      : tx('總統候選人請提名總理。', 'Presidential candidate, nominate a Chancellor.'));
    if (s.opts.talk > 0) await ctx.timer(s.opts.talk * 60, { title: tx('討論時間', 'Discussion') });
    await ctx.say(tx('三、二、一，所有人同時投票！', 'Three, two, one: everyone vote!'));
    const vote = await ctx.buttons({
      title: tx('選舉結果', 'Election result'),
      buttons: [
        { id: 'yes', label: tx('✅ 選舉通過（過半數 Ja!）', '✅ Elected (majority Ja!)'), style: 'good' },
        { id: 'no', label: tx('❌ 選舉失敗', '❌ Failed'), style: 'evil' },
      ],
    });
    if (vote === 'no') {
      fails++;
      paint();
      if (fails >= 3) { if (await chaos() === 'over') return; }
      else await ctx.say(tx(`選舉失敗，第 ${fails} 次。總統候選人傳給左手邊的玩家。`, `The election failed, ${fails} in a row. The presidency passes to the left.`));
      continue;
    }
    fails = 0;
    paint();
    if (fas >= 3) {
      const r = await ctx.buttons({
        title: tx('新總理是希特勒嗎？', 'Is the new Chancellor Hitler?'),
        buttons: [
          { id: 'no', label: tx('不是，繼續', 'No, continue') },
          { id: 'yes', label: tx('💀 是希特勒！', '💀 Yes, Hitler!'), style: 'evil' },
        ],
      });
      if (r === 'yes') { ctx.result('evil'); await ctx.say(tx('希特勒當選總理，法西斯勝利！', 'Hitler has been elected Chancellor. The Fascists win!')); return; }
    }
    await ctx.say(tx('立法：總統抽三張法案，秘密棄一張，交兩張給總理；總理棄一張，頒布一張。', 'Legislative session: the President draws three policies, discards one in secret, and passes two to the Chancellor, who discards one and enacts the other.'));
    const policy = await ctx.buttons({
      title: tx('頒布的法案', 'Enacted policy'),
      buttons: [
        { id: 'L', label: tx('🕊️ 自由黨法案', '🕊️ Liberal policy'), style: 'good' },
        { id: 'F', label: tx('🦅 法西斯法案', '🦅 Fascist policy'), style: 'evil' },
        fas >= 5 ? { id: 'veto', label: tx('✋ 否決（兩張都棄）', '✋ Veto (discard both)') } : null,
      ].filter(Boolean),
    });
    if (policy === 'veto') {
      fails++;
      paint();
      await drew(3);
      await ctx.say(tx('議程被否決，選舉失敗次數加一。', 'The agenda is vetoed. The election tracker advances.'));
      if (fails >= 3 && await chaos() === 'over') return;
    } else {
      const powerBefore = pw[fas];
      if (await enact(policy, false) === 'over') return;
      await drew(3);
      if (policy === 'F' && powerBefore === 'special') continue; // the President picks the next candidate
    }
    await ctx.say(tx('總統候選人傳給左手邊的玩家。', 'The presidency passes to the left.'));
  }
}
