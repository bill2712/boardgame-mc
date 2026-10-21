import { tx, shuffle, randInt } from '../util.js';

const R = {
  wolf: { name: tx('狼人', 'Werewolf'), team: 'evil', emoji: '🐺', desc: tx('每晚同其他狼人一齊殺一位玩家。', 'Each night, choose a victim with the other werewolves.') },
  seer: { name: tx('預言家', 'Seer'), team: 'good', god: true, emoji: '🔮', desc: tx('每晚查驗一位玩家是好人還是狼人。', 'Each night, check whether a player is a werewolf.') },
  witch: { name: tx('女巫', 'Witch'), team: 'good', god: true, emoji: '🧪', desc: tx('有一瓶解藥同一瓶毒藥，各用一次；同一晚只可以用一瓶。', 'One healing potion and one poison, each usable once; at most one per night.') },
  hunter: { name: tx('獵人', 'Hunter'), team: 'good', god: true, emoji: '🏹', desc: tx('死亡時可以開槍帶走一位玩家（被毒死除外）。', 'When you die you may shoot a player (not if poisoned).') },
  guard: { name: tx('守衛', 'Guard'), team: 'good', god: true, emoji: '🛡️', desc: tx('每晚守護一位玩家免受狼刀，不可以連續兩晚守同一人。', 'Each night protect a player from the wolves; not the same player two nights in a row.') },
  idiot: { name: tx('白痴', 'Idiot'), team: 'good', god: true, emoji: '🤪', desc: tx('被投票出局時翻牌免死，但之後失去投票權。', 'If voted out, reveal and survive, but lose your vote.') },
  villager: { name: tx('平民', 'Villager'), team: 'good', emoji: '👨‍🌾', desc: tx('冇特殊能力，靠推理找出狼人。', 'No special ability. Find the werewolves by reasoning.') },
};
export const WW_ROLES = R;

/**
 * Work out who dies at dawn.
 * Same-guard-and-save (同守同救) kills the target. Poison ignores the guard.
 */
export function resolveNight({ wolfTarget, guardTarget, saved, poisonTarget }) {
  const deaths = new Set();
  if (wolfTarget != null) {
    const guarded = guardTarget === wolfTarget;
    if (guarded === saved) deaths.add(wolfTarget); // neither, or both
  }
  if (poisonTarget != null) deaths.add(poisonTarget);
  return [...deaths].sort((a, b) => a - b);
}

/** Returns 'good' | 'evil' | null. mode: 'side' (屠邊) or 'all' (屠城). */
export function checkWin(players, mode) {
  const alive = players.filter((p) => p.alive);
  const wolves = alive.filter((p) => p.role === 'wolf').length;
  if (wolves === 0) return 'good';
  const gods = alive.filter((p) => R[p.role].god).length;
  const villagers = alive.filter((p) => p.role === 'villager').length;
  const hadGods = players.some((p) => R[p.role].god);
  const hadVillagers = players.some((p) => p.role === 'villager');
  if (mode === 'side') {
    if ((hadVillagers && villagers === 0) || (hadGods && gods === 0)) return 'evil';
  }
  if (gods + villagers === 0) return 'evil';
  return null;
}

export function defaultRoles(n) {
  const wolf = n <= 8 ? 2 : n <= 11 ? 3 : n <= 14 ? 4 : 5;
  return {
    wolf,
    seer: 1,
    witch: 1,
    hunter: n >= 7 ? 1 : 0,
    guard: n >= 10 ? 1 : 0,
    idiot: n >= 12 ? 1 : 0,
  };
}

export default {
  id: 'werewolf',
  emoji: '🐺',
  name: tx('狼人殺', 'Werewolf'),
  tagline: tx('全自動法官：手機派身份、夜晚操作、公佈死訊', 'Fully automatic moderator: deals roles, runs the night, announces deaths'),
  players: { min: 6, max: 16, default: 9 },
  time: '30–60',
  rules: {
    zh: [
      '唔使法官！手機會輪流派身份，夜晚有角色的玩家輪流喺手機上揀目標（請將手機放喺枱中間）。',
      '夜晚次序：守衛 → 狼人 → 女巫 → 預言家。天亮後手機會公佈死訊。',
      '白天按座位順序發言，然後投票放逐一位玩家。',
      '好人：放逐所有狼人就贏。狼人：屠邊（殺光所有神職或所有平民）或屠城（殺光所有好人）就贏。',
      '同守同救都會死；毒藥唔受守衛影響；獵人被毒死唔可以開槍。',
    ],
    en: [
      'No moderator needed. The phone deals roles, and at night each role takes a turn choosing on the phone (keep it in the middle of the table).',
      'Night order: Guard → Werewolves → Witch → Seer. At dawn the phone announces who died.',
      'During the day players speak in seat order, then vote to exile one player.',
      'Good wins when every werewolf is gone. Werewolves win by killing all special roles or all villagers ("side"), or every good player ("all").',
      'Guarded and healed on the same night still dies. Poison ignores the Guard. A poisoned Hunter cannot shoot.',
    ],
  },
  roles: [
    { id: 'wolf', ...R.wolf, min: 1, max: 5 },
    { id: 'seer', ...R.seer, max: 1 },
    { id: 'witch', ...R.witch, max: 1 },
    { id: 'hunter', ...R.hunter, max: 1 },
    { id: 'guard', ...R.guard, max: 1 },
    { id: 'idiot', ...R.idiot, max: 1 },
    { id: 'villager', ...R.villager, auto: true },
  ],
  options: [
    { id: 'win', type: 'select', label: tx('狼人勝利條件', 'Werewolf win condition'), default: 'side', choices: [
      { value: 'side', label: tx('屠邊（殺光神職或平民）', 'Side: all specials or all villagers') },
      { value: 'all', label: tx('屠城（殺光所有好人）', 'All: every good player') },
    ] },
    { id: 'selfSave', type: 'select', label: tx('女巫自救', 'Witch saving herself'), default: 'first', choices: [
      { value: 'first', label: tx('只限第一晚', 'First night only') },
      { value: 'never', label: tx('不可以', 'Never') },
      { value: 'always', label: tx('可以', 'Always') },
    ] },
    { id: 'speak', type: 'number', label: tx('每人發言時間（0 = 不計時）', 'Speaking time per player (0 = off)'), min: 0, max: 180, step: 15, unit: 'sec', default: 60 },
    { id: 'reveal', type: 'toggle', label: tx('死亡時公開身份', 'Reveal role on death'), default: false },
  ],
  defaults(n) { return { roles: defaultRoles(n) }; },
  deck(s) {
    const r = s.roles;
    const specials = ['wolf', 'seer', 'witch', 'hunter', 'guard', 'idiot'].flatMap((id) => Array(r[id] || 0).fill(id));
    return [...specials, ...Array(Math.max(0, s.n - specials.length)).fill('villager')];
  },
  check(s) {
    const r = s.roles;
    const special = ['wolf', 'seer', 'witch', 'hunter', 'guard', 'idiot'].reduce((a, id) => a + (r[id] || 0), 0);
    const villagers = s.n - special;
    const errors = [];
    const warnings = [];
    if (villagers < 0) errors.push(tx('角色多過玩家人數。', 'More roles than players.'));
    if ((r.wolf || 0) >= s.n / 2) errors.push(tx('狼人太多。', 'Too many werewolves.'));
    if (s.opts.win === 'side' && villagers === 0) warnings.push(tx('冇平民，屠邊只計神職。', 'No villagers: "side" only counts special roles.'));
    const gods = special - (r.wolf || 0);
    return { errors, warnings, summary: tx(`狼人 ${r.wolf} · 神職 ${gods} · 平民 ${Math.max(0, villagers)}`, `${r.wolf} werewolves · ${gods} specials · ${Math.max(0, villagers)} villagers`) };
  },

  async run(ctx, s) {
    const { n } = s;
    const roles = shuffle(this.deck(s));
    const P = roles.map((role, i) => ({ seat: i + 1, role, alive: true, canVote: true }));
    const wolvesSeats = P.filter((p) => p.role === 'wolf').map((p) => p.seat);
    const find = (role) => P.find((p) => p.role === role);
    const alive = () => P.filter((p) => p.alive);
    const seatGrid = (filter = () => true) => P.map((p) => ({
      id: p.seat,
      label: String(p.seat),
      sub: p.alive ? null : '💀',
      disabled: !p.alive || !filter(p),
    }));
    const S = ctx.seat;
    const witch = { heal: true, poison: true };
    let lastGuard = null;

    await ctx.say(tx('請大家圍成一圈，順時針由 1 號開始記住自己的座位號碼。然後輪流查看身份。', 'Sit in a circle and number yourselves clockwise starting from 1. Then take turns viewing your role.'));
    await ctx.ready();
    await ctx.deal(P.map((p) => ({
      seat: p.seat,
      title: R[p.role].name,
      emoji: R[p.role].emoji,
      team: R[p.role].team,
      teamLabel: p.role === 'wolf' ? tx('狼人陣營', 'Werewolf team') : tx('好人陣營', 'Village team'),
      body: [R[p.role].desc, p.role === 'wolf' && wolvesSeats.length > 1
        ? tx(`你的狼隊友：${wolvesSeats.filter((x) => x !== p.seat).join('、')} 號`, `Your fellow werewolves: ${wolvesSeats.filter((x) => x !== p.seat).join(', ')}`)
        : null].filter(Boolean),
    })));

    const roleStatus = () => ctx.h('div', { class: 'seat-strip' }, P.map((p) =>
      ctx.h('span', { class: `seat ${p.alive ? '' : 'dead'}` }, String(p.seat))));

    // Fake step for dead roles so nobody can tell from timing.
    const dummy = async () => ctx.wait(randInt(6, 10), { label: ctx.t('actionTime') });

    const kill = async (seat, cause) => {
      const p = P[seat - 1];
      if (!p.alive) return;
      p.alive = false;
      ctx.board(roleStatus());
      if (s.opts.reveal) await ctx.say(tx(`${seat}號的身份是${R[p.role].name.zh}。`, `Player ${seat} was the ${R[p.role].name.en}.`));
      if (p.role === 'hunter' && cause !== 'poison') {
        await ctx.say(tx(`${seat}號是獵人，可以選擇開槍帶走一位玩家。`, `Player ${seat} is the Hunter and may shoot one player.`));
        const target = await ctx.choose({ title: tx('獵人開槍', 'Hunter shoots'), items: seatGrid((q) => q.seat !== seat), extra: [{ id: 'none', label: tx('不開槍', "Don't shoot") }] });
        if (target !== 'none') {
          await ctx.say(tx(`獵人開槍帶走了${target}號。`, `The Hunter shot player ${target}.`));
          await kill(target, 'shot');
        }
      }
    };

    const over = async () => {
      const w = checkWin(P, s.opts.win);
      if (!w) return false;
      ctx.phase(ctx.t('gameOver'));
      await ctx.say(w === 'good' ? tx('所有狼人已經出局，好人勝利！', 'All werewolves are gone. The village wins!') : tx('狼人勝利！', 'The werewolves win!'));
      ctx.board(ctx.h('div', { class: 'reveal-list' }, P.map((p) => ctx.h('div', { class: `reveal team-${R[p.role].team} ${p.alive ? '' : 'dead'}` },
        ctx.h('b', {}, ctx.L(S(p.seat))), ' ', R[p.role].emoji, ' ', ctx.L(R[p.role].name), p.alive ? '' : ' 💀'))));
      return true;
    };

    ctx.board(roleStatus());
    for (let night = 1; ; night++) {
      // ---------- night ----------
      ctx.phase(tx(`第 ${night} 晚`, `Night ${night}`), { night: true });
      await ctx.say(tx('天黑請閉眼。請將手機放在桌子中間。', 'Night falls, everyone close your eyes. Put the phone in the middle of the table.'));
      await ctx.act(2);

      let guardTarget = null;
      const guard = find('guard');
      if (guard) {
        await ctx.say(tx('守衛請睜眼。請選擇今晚要守護的玩家。', 'Guard, open your eyes. Choose a player to protect tonight.'));
        if (guard.alive) {
          const g = await ctx.choose({
            title: tx('守護誰？', 'Protect whom?'),
            text: lastGuard ? tx(`不可以連續兩晚守 ${lastGuard} 號。`, `You can't protect player ${lastGuard} two nights in a row.`) : null,
            items: seatGrid((p) => p.seat !== lastGuard),
            extra: [{ id: 'none', label: tx('空守', 'Protect no one') }],
          });
          guardTarget = g === 'none' ? null : g;
        } else await dummy();
        lastGuard = guardTarget;
        await ctx.say(tx('守衛請閉眼。', 'Guard, close your eyes.'));
      }

      await ctx.say(tx('狼人請睜眼，互相確認同伴，然後選擇今晚要殺的玩家。', 'Werewolves, open your eyes, find each other, and choose tonight\'s victim.'));
      const wk = await ctx.choose({
        title: tx('狼人殺誰？', 'Werewolves kill whom?'),
        items: seatGrid(),
        extra: [{ id: 'none', label: tx('空刀', 'Kill no one') }],
      });
      const wolfTarget = wk === 'none' ? null : wk;
      await ctx.say(tx('狼人請閉眼。', 'Werewolves, close your eyes.'));

      let saved = false;
      let poisonTarget = null;
      const w = find('witch');
      if (w) {
        await ctx.say(tx('女巫請睜眼。今晚被殺的玩家會顯示在手機上。你要用解藥嗎？', 'Witch, open your eyes. Tonight\'s victim is shown on the phone. Will you use your healing potion?'));
        if (w.alive) {
          const canSelf = s.opts.selfSave === 'always' || (s.opts.selfSave === 'first' && night === 1);
          if (witch.heal && wolfTarget != null && (wolfTarget !== w.seat || canSelf)) {
            const r = await ctx.buttons({
              title: tx(`今晚被殺的是 ${wolfTarget} 號`, `Tonight's victim: player ${wolfTarget}`),
              buttons: [
                { id: 'heal', label: tx('🧪 用解藥救他', '🧪 Heal them'), style: 'good' },
                { id: 'no', label: tx('唔救', "Don't heal") },
              ],
            });
            if (r === 'heal') { saved = true; witch.heal = false; }
          } else {
            const why = !witch.heal ? tx('解藥已經用咗。', 'Healing potion already used.')
              : wolfTarget == null ? tx('今晚冇人被殺。', 'Nobody was attacked tonight.')
                : tx(`今晚被殺的是 ${wolfTarget} 號（你自己），規則不可以自救。`, `Tonight's victim is player ${wolfTarget} (you). You may not heal yourself.`);
            await ctx.buttons({ title: why, buttons: [{ id: 'ok', label: ctx.t('next') }] });
          }
          await ctx.say(tx('你要用毒藥嗎？', 'Will you use your poison?'));
          if (witch.poison && !saved) {
            const pz = await ctx.choose({
              title: tx('毒邊個？', 'Poison whom?'),
              items: seatGrid((p) => p.seat !== w.seat),
              extra: [{ id: 'none', label: tx('唔用毒藥', "Don't poison") }],
            });
            if (pz !== 'none') { poisonTarget = pz; witch.poison = false; }
          } else {
            await ctx.buttons({
              title: !witch.poison ? tx('毒藥已經用咗。', 'Poison already used.') : tx('同一晚只可以用一瓶藥。', 'Only one potion per night.'),
              buttons: [{ id: 'ok', label: ctx.t('next') }],
            });
          }
        } else {
          await dummy();
          await ctx.say(tx('你要用毒藥嗎？', 'Will you use your poison?'));
          await dummy();
        }
        await ctx.say(tx('女巫請閉眼。', 'Witch, close your eyes.'));
      }

      const seer = find('seer');
      if (seer) {
        await ctx.say(tx('預言家請睜眼。請選擇你要查驗的玩家。', 'Seer, open your eyes. Choose a player to check.'));
        if (seer.alive) {
          const c = await ctx.choose({ title: tx('查驗誰？', 'Check whom?'), items: seatGrid((p) => p.seat !== seer.seat) });
          const bad = P[c - 1].role === 'wolf';
          await ctx.buttons({
            title: bad ? tx(`${c} 號是 👎 狼人`, `Player ${c} is 👎 a WEREWOLF`) : tx(`${c} 號是 👍 好人`, `Player ${c} is 👍 GOOD`),
            buttons: [{ id: 'ok', label: ctx.t('next') }],
          });
        } else await dummy();
        await ctx.say(tx('預言家請閉眼。', 'Seer, close your eyes.'));
      }

      // ---------- dawn ----------
      ctx.phase(tx(`第 ${night} 天`, `Day ${night}`));
      const deaths = resolveNight({ wolfTarget, guardTarget, saved, poisonTarget });
      await ctx.say(tx('天亮了，所有人請睜眼。', 'Dawn breaks. Everyone, open your eyes.'));
      if (!deaths.length) {
        await ctx.say(tx('昨晚是平安夜。', 'Nobody died last night.'));
      } else {
        const names = ctx.seats(deaths);
        await ctx.say(tx(`昨晚死亡的是 ${names.zh}。`, `Last night, ${deaths.length > 1 ? 'players' : 'player'} ${names.en} died.`));
        for (const d of deaths) await kill(d, d === poisonTarget ? 'poison' : 'wolf');
      }
      if (await over()) return;
      if (night === 1 && deaths.length) {
        await ctx.say(tx('第一晚死亡的玩家可以發表遺言。', 'Players who died on the first night may say their last words.'));
        if (s.opts.speak > 0) await ctx.timer(s.opts.speak, { title: tx('遺言', 'Last words'), silentEnd: true });
        else await ctx.ready(ctx.t('next'));
      }

      // ---------- speeches ----------
      const living = alive().map((p) => p.seat);
      const start = living[Math.floor(Math.random() * living.length)];
      const order = [...living.filter((x) => x >= start), ...living.filter((x) => x < start)];
      await ctx.say(tx(`由 ${start} 號開始，順時針發言。`, `Speeches start with player ${start} and go clockwise.`));
      if (s.opts.speak > 0) {
        for (const seat of order) {
          await ctx.say(tx(`${seat} 號發言。`, `Player ${seat}, your turn.`), { after: 0.2 });
          await ctx.timer(s.opts.speak, { title: tx(`${seat} 號發言`, `Player ${seat} speaking`), endLabel: tx('發言完畢', 'Done'), silentEnd: true, warnings: [10] });
        }
      } else {
        await ctx.ready(tx('發言完畢，開始投票', 'Speeches done, start voting'));
      }

      // ---------- vote ----------
      await ctx.say(tx('請投票。三、二、一，同時指向你要放逐的玩家。', 'Time to vote. Three, two, one: point at the player you want to exile.'));
      const out = await ctx.choose({
        title: tx('邊個被放逐？', 'Who was exiled?'),
        items: seatGrid(),
        extra: [{ id: 'none', label: tx('平票／冇人出局', 'Tie / no one') }],
      });
      if (out === 'none') {
        await ctx.say(tx('今日冇人被放逐。', 'Nobody is exiled today.'));
      } else {
        const p = P[out - 1];
        if (p.role === 'idiot' && p.canVote) {
          p.canVote = false;
          await ctx.say(tx(`${out}號翻牌：他是白痴！可以留在場上，但之後失去投票權。`, `Player ${out} reveals: the Idiot! They stay in the game but can no longer vote.`));
        } else {
          await ctx.say(tx(`${out}號被放逐，請發表遺言。`, `Player ${out} is exiled. Last words, please.`));
          if (s.opts.speak > 0) await ctx.timer(s.opts.speak, { title: tx('遺言', 'Last words'), silentEnd: true, warnings: [10] });
          await kill(out, 'vote');
        }
      }
      if (await over()) return;
    }
  },
};
