import { tx, shuffle, joinNames } from '../util.js';

export const EVIL_BY_N = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
export const QUESTS = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

const R = {
  merlin: { name: tx('梅林', 'Merlin'), team: 'good', emoji: '🧙', desc: tx('知道壞人是誰（莫德雷德除外），但不能暴露自己。', 'Knows the evil players (except Mordred). Must stay hidden.') },
  percival: { name: tx('派西維爾', 'Percival'), team: 'good', emoji: '🛡️', desc: tx('看到梅林（和莫甘娜），要分辨誰是真梅林。', 'Sees Merlin (and Morgana) but not which is which.') },
  servant: { name: tx('亞瑟的忠臣', 'Loyal Servant of Arthur'), team: 'good', emoji: '⚔️', desc: tx('普通好人，冇特別資訊。', 'A loyal knight with no special knowledge.') },
  assassin: { name: tx('刺客', 'Assassin'), team: 'evil', emoji: '🗡️', desc: tx('好人完成三個任務後，可以刺殺梅林反敗為勝。', 'If good wins three quests, may assassinate Merlin to steal the win.') },
  morgana: { name: tx('莫甘娜', 'Morgana'), team: 'evil', emoji: '🔮', desc: tx('在派西維爾眼中扮成梅林。', 'Appears as Merlin to Percival.') },
  mordred: { name: tx('莫德雷德', 'Mordred'), team: 'evil', emoji: '👑', desc: tx('梅林看不到他。', 'Hidden from Merlin.') },
  oberon: { name: tx('奧伯倫', 'Oberon'), team: 'evil', emoji: '🌑', desc: tx('不認識其他壞人，其他壞人也不認識他（梅林看得到）。', 'Unknown to the other evil players and does not know them. Merlin sees him.') },
  minion: { name: tx('莫德雷德的爪牙', 'Minion of Mordred'), team: 'evil', emoji: '😈', desc: tx('普通壞人。', 'A plain evil player.') },
};

function deck(s) {
  const n = s.n;
  const evil = EVIL_BY_N[n];
  const good = n - evil;
  const r = s.roles;
  const goodSpecial = ['merlin', 'percival'].filter((id) => r[id]);
  const evilSpecial = ['assassin', 'morgana', 'mordred', 'oberon'].filter((id) => r[id]);
  return [
    ...goodSpecial,
    ...Array(Math.max(0, good - goodSpecial.length)).fill('servant'),
    ...evilSpecial,
    ...Array(Math.max(0, evil - evilSpecial.length)).fill('minion'),
  ];
}

export default {
  id: 'avalon',
  emoji: '🏰',
  name: tx('阿瓦隆', 'The Resistance: Avalon'),
  tagline: tx('亞瑟王傳說：好人完成任務，壞人暗中破壞', "Arthurian loyalty vs. Mordred's hidden minions"),
  players: { min: 5, max: 10, default: 7 },
  time: '30',
  rules: {
    zh: [
      '好人要完成 3 個任務；壞人要令 3 個任務失敗，或者連續 5 次組隊被否決。',
      '每輪由隊長揀隊員，所有人公開投票是否同意；通過後隊員秘密出「成功／失敗」卡。',
      '7 人或以上，第 4 個任務需要 2 張失敗卡先算失敗。',
      '好人完成 3 個任務後，刺客有一次機會刺殺梅林：刺中即壞人勝。',
      '本 App 會讀出夜晚流程，並幫你記錄任務、投票同刺殺。',
    ],
    en: [
      'Good wins by completing 3 quests. Evil wins by failing 3 quests, or when 5 team proposals in a row are rejected.',
      'Each round the leader proposes a team, everyone votes openly, and the team then secretly plays Success / Fail cards.',
      'With 7+ players, quest 4 needs two Fail cards to fail.',
      'If good completes 3 quests, the Assassin gets one guess at Merlin. A hit means evil wins.',
      'The app narrates the night and tracks quests, votes and the assassination.',
    ],
  },
  roles: [
    { id: 'merlin', ...R.merlin, max: 1 },
    { id: 'percival', ...R.percival, max: 1 },
    { id: 'servant', ...R.servant, auto: true },
    { id: 'assassin', ...R.assassin, max: 1 },
    { id: 'morgana', ...R.morgana, max: 1 },
    { id: 'mordred', ...R.mordred, max: 1 },
    { id: 'oberon', ...R.oberon, max: 1 },
    { id: 'minion', ...R.minion, auto: true },
  ],
  options: [
    { id: 'tracker', type: 'toggle', label: tx('任務記錄板（隊長、投票、任務結果）', 'Quest tracker (votes, results, assassination)'), default: true },
    { id: 'lady', type: 'toggle', label: tx('湖中仙女（建議 7 人或以上）', 'Lady of the Lake (7+ players recommended)'), default: false },
    { id: 'talk', type: 'number', label: tx('每輪組隊討論時間（0 = 不計時）', 'Discussion timer per round (0 = off)'), min: 0, max: 10, step: 1, unit: 'min', default: 0 },
    { id: 'nightSec', type: 'number', label: tx('夜晚每一步的時間', 'Time for each night step'), min: 3, max: 15, step: 1, unit: 'sec', default: 5 },
    { id: 'deal', type: 'toggle', label: tx('電子派牌（冇實體卡都玩得）', 'Deal roles on this phone (no cards needed)'), default: false },
  ],
  defaults(n) {
    const roles = { merlin: 1, percival: 1, assassin: 1, morgana: 1, mordred: 0, oberon: 0 };
    if (n === 7) roles.oberon = 1;
    if (n === 9) roles.mordred = 1;
    if (n === 10) { roles.mordred = 1; roles.oberon = 1; }
    return { roles };
  },
  deck,
  check(s) {
    const { n, roles: r } = s;
    const evil = EVIL_BY_N[n];
    const errors = [];
    const warnings = [];
    const evilSpecial = ['assassin', 'morgana', 'mordred', 'oberon'].filter((id) => r[id]).length;
    const goodSpecial = ['merlin', 'percival'].filter((id) => r[id]).length;
    if (evilSpecial > evil) errors.push(tx(`${n} 人只有 ${evil} 個壞人，特殊壞人角色太多。`, `${n} players means only ${evil} evil players. Too many evil special roles.`));
    if (goodSpecial > n - evil) errors.push(tx('特殊好人角色太多。', 'Too many good special roles.'));
    if (r.assassin && !r.merlin) errors.push(tx('有刺客就一定要有梅林。', 'The Assassin needs Merlin in the game.'));
    if (r.merlin && !r.assassin) warnings.push(tx('有梅林但冇刺客：冇刺殺階段。', 'Merlin without the Assassin: no assassination phase.'));
    if (r.percival && !r.merlin) warnings.push(tx('派西維爾要配合梅林先有意思。', 'Percival is only useful with Merlin.'));
    if (r.morgana && !r.percival) warnings.push(tx('莫甘娜要有派西維爾先有作用。', 'Morgana only matters when Percival is in the game.'));
    const q = QUESTS[n].map((x, i) => (n >= 7 && i === 3 ? `${x}*` : x)).join(' – ');
    const summary = tx(
      `好人 ${n - evil} 人 · 壞人 ${evil} 人 · 任務人數 ${q}${n >= 7 ? '（* 要兩張失敗）' : ''}`,
      `${n - evil} good · ${evil} evil · Quest sizes ${q}${n >= 7 ? ' (* needs 2 fails)' : ''}`,
    );
    return { errors, warnings, summary };
  },

  async run(ctx, s) {
    const { n } = s;
    const has = (id) => !!s.roles[id];
    const sec = s.opts.nightSec;

    if (s.opts.deal) {
      const roles = shuffle(deck(s));
      await ctx.deal(roles.map((id, i) => ({
        seat: i + 1,
        title: R[id].name,
        emoji: R[id].emoji,
        team: R[id].team,
        teamLabel: R[id].team === 'good' ? tx('好人陣營', 'Good') : tx('壞人陣營', 'Evil'),
        body: R[id].desc,
      })));
    } else {
      await ctx.say(tx('請每位玩家抽一張角色卡，秘密查看自己的身份。準備好就按繼續。',
        'Each player, take a role card and look at it secretly. Tap continue when ready.'));
      await ctx.ready();
    }

    ctx.phase(tx('夜晚', 'Night'), { night: true });
    await ctx.say(tx('天黑請閉眼。所有人請閉上眼睛，雙手握拳放在面前。', 'Night falls. Everyone close your eyes and put your fists on the table in front of you.'));
    await ctx.act(2);

    // Evil players see each other (not Oberon).
    await ctx.say(has('oberon')
      ? tx('壞人陣營請睜開眼睛，互相確認身份。奧伯倫請保持閉眼。', 'Minions of Mordred, except Oberon, open your eyes and look around to see each other.')
      : tx('壞人陣營請睜開眼睛，互相確認身份。', 'Minions of Mordred, open your eyes and look around to see each other.'));
    await ctx.act(sec);
    await ctx.say(tx('壞人請閉上眼睛。', 'Minions of Mordred, close your eyes.'));

    if (has('merlin')) {
      await ctx.say(has('mordred')
        ? tx('除了莫德雷德，所有壞人請豎起大拇指。', 'Minions of Mordred, except Mordred himself, extend your thumb so Merlin can see you.')
        : tx('所有壞人請豎起大拇指。', 'Minions of Mordred, extend your thumb so Merlin can see you.'));
      await ctx.say(tx('梅林請睜開眼睛，記住豎起大拇指的玩家。', 'Merlin, open your eyes and see the agents of evil.'));
      await ctx.act(sec);
      await ctx.say(tx('梅林請閉上眼睛。壞人請收起大拇指，雙手握拳。', 'Merlin, close your eyes. Minions of Mordred, put your thumbs down and form your hands into fists.'));
    }

    if (has('percival')) {
      const shown = [has('merlin') && R.merlin.name, has('morgana') && R.morgana.name].filter(Boolean);
      if (shown.length) {
        const who = joinNames(shown);
        await ctx.say(tx(`${who.zh}請豎起大拇指。`, `${who.en}, extend your thumb so Percival may know of you.`));
        await ctx.say(tx('派西維爾請睜開眼睛，記住豎起大拇指的玩家。', 'Percival, open your eyes so you may know Merlin.'));
        await ctx.act(sec);
        await ctx.say(tx(`派西維爾請閉上眼睛。${who.zh}請收起大拇指。`, `Percival, close your eyes. ${who.en}, put your thumbs down.`));
      }
    }

    await ctx.say(tx('請確認所有人雙手握拳。', 'Make sure everyone has their hands in fists.'));
    await ctx.act(1.5);
    ctx.phase(tx('白天', 'Day'));
    await ctx.say(tx('天亮了，所有人請睜開眼睛。', 'Everyone, open your eyes.'));

    if (!s.opts.tracker) {
      await ctx.say(tx('夜晚結束，祝大家遊戲愉快！', 'The night is over. Have a good game!'));
      return;
    }
    await questTracker(ctx, s);
  },
};

async function questTracker(ctx, s) {
  const { n } = s;
  const { h, L } = ctx;
  const sizes = QUESTS[n];
  const results = [];
  let rejects = 0;
  const wins = () => results.filter((r) => r === 'S').length;
  const fails = () => results.filter((r) => r === 'F').length;

  const paint = () => ctx.board(h('div', { class: 'quest-board' },
    h('div', { class: 'quests' }, sizes.map((size, i) => h('div', {
      class: `quest ${results[i] === 'S' ? 'ok' : results[i] === 'F' ? 'bad' : ''} ${i === results.length ? 'now' : ''}`,
    }, h('b', {}, size), n >= 7 && i === 3 ? h('small', {}, '2✗') : null))),
    h('div', { class: 'rejects' }, L(tx('否決', 'Rejected')), ' ',
      [1, 2, 3, 4, 5].map((i) => h('span', { class: `dot ${i <= rejects ? 'on' : ''}` }))),
  ));
  paint();

  while (wins() < 3 && fails() < 3) {
    const q = results.length;
    const size = sizes[q];
    const twoFails = n >= 7 && q === 3;
    ctx.phase(tx(`任務 ${q + 1}`, `Quest ${q + 1}`));
    await ctx.say(tx(
      `第 ${q + 1} 個任務，需要 ${size} 位隊員${twoFails ? '，這個任務要有兩張失敗卡才會失敗' : ''}。隊長請挑選隊員。`,
      `Quest ${q + 1} needs ${size} players${twoFails ? ', and needs two Fail cards to fail' : ''}. Leader, choose your team.`,
    ));
    if (s.opts.talk > 0) await ctx.timer(s.opts.talk * 60, { title: tx('組隊討論', 'Team discussion') });

    await ctx.say(tx('請所有人同時投票：同意還是反對這個隊伍？', 'Everyone vote at the same time: approve or reject this team?'));
    const vote = await ctx.buttons({
      title: tx('投票結果', 'Vote result'),
      buttons: [
        { id: 'yes', label: tx('👍 通過', '👍 Approved'), style: 'good' },
        { id: 'no', label: tx('👎 否決', '👎 Rejected'), style: 'evil' },
      ],
    });
    if (vote === 'no') {
      rejects++;
      paint();
      if (rejects >= 5) {
        await ctx.say(tx('連續五次組隊被否決，壞人勝利！', 'Five rejected teams in a row. Evil wins!'));
        return;
      }
      await ctx.say(tx(`隊伍被否決，第 ${rejects} 次。隊長交給左手邊的下一位玩家。`, `Team rejected, ${rejects} in a row. Leadership passes to the left.`));
      continue;
    }
    rejects = 0;
    paint();
    await ctx.say(tx('組隊成功。請隊員秘密打出任務卡，好人只可以出成功。', 'Team approved. Team members, secretly play your quest cards. Good players must play Success.'));
    const res = await ctx.buttons({
      title: tx('任務結果', 'Quest result'),
      text: twoFails ? tx('提示：這個任務要兩張失敗卡才算失敗。', 'Reminder: this quest needs two Fail cards to fail.') : null,
      buttons: [
        { id: 'S', label: tx('✅ 任務成功', '✅ Success'), style: 'good' },
        { id: 'F', label: tx('❌ 任務失敗', '❌ Fail'), style: 'evil' },
      ],
    });
    results.push(res);
    paint();
    await ctx.say(res === 'S'
      ? tx(`任務成功！好人 ${wins()} 勝，壞人 ${fails()} 勝。`, `Quest succeeded! Good ${wins()}, evil ${fails()}.`)
      : tx(`任務失敗！好人 ${wins()} 勝，壞人 ${fails()} 勝。`, `Quest failed! Good ${wins()}, evil ${fails()}.`));

    if (wins() >= 3 || fails() >= 3) break;
    if (s.opts.lady && q >= 1 && q <= 3) {
      await ctx.say(tx('湖中仙女的持有者，請選擇一位玩家，秘密查看他的陣營，然後將湖中仙女交給他。', 'Holder of the Lady of the Lake, choose a player and secretly look at their loyalty. Then pass the Lady to them.'));
      await ctx.ready();
    }
    await ctx.say(tx('隊長交給左手邊的下一位玩家。', 'Leadership passes to the left.'));
  }

  if (fails() >= 3) {
    await ctx.say(tx('三個任務失敗，壞人勝利！', 'Three quests have failed. Evil wins!'));
    return;
  }
  if (s.roles.merlin && s.roles.assassin) {
    ctx.phase(tx('刺殺梅林', 'Assassination'));
    await ctx.say(tx('好人完成了三個任務！壞人請公開身份並討論，刺客請指出你認為是梅林的玩家。', 'Good has completed three quests! Evil players, reveal yourselves and discuss. Assassin, name the player you think is Merlin.'));
    const hit = await ctx.buttons({
      title: tx('刺殺結果', 'Assassination result'),
      buttons: [
        { id: 'hit', label: tx('🗡️ 刺中梅林', '🗡️ Merlin was killed'), style: 'evil' },
        { id: 'miss', label: tx('🛡️ 刺錯人', '🛡️ Missed'), style: 'good' },
      ],
    });
    await ctx.say(hit === 'hit'
      ? tx('刺客刺中梅林，壞人反敗為勝！', 'The Assassin found Merlin. Evil wins!')
      : tx('刺客刺錯人，好人勝利！', 'The Assassin missed. Good wins!'));
  } else {
    await ctx.say(tx('好人完成了三個任務，好人勝利！', 'Good has completed three quests. Good wins!'));
  }
}
