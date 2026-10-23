import { tx, shuffle, randInt, ucfirst } from '../util.js';

const R = {
  killer: { name: tx('殺手', 'Mafia'), team: 'evil', emoji: '🔪', desc: tx('每晚和同伴一起殺一位玩家。', 'Each night, choose a victim with your partners.') },
  police: { name: tx('警察', 'Detective'), team: 'good', emoji: '👮', desc: tx('每晚查驗一位玩家是不是殺手。', 'Each night, check whether a player is Mafia.') },
  doctor: { name: tx('醫生', 'Doctor'), team: 'good', emoji: '🩺', desc: tx('每晚救一位玩家，被殺手選中也不會死。', 'Each night, protect one player from the Mafia.') },
  civilian: { name: tx('平民', 'Civilian'), team: 'good', emoji: '🙂', desc: tx('靠討論和投票找出殺手。', 'Find the Mafia by talking and voting.') },
};

/** 'good' | 'evil' | null. Mafia win once they are at least half of the living players. */
export function mafiaWinner(players) {
  const alive = players.filter((p) => p.alive);
  const killers = alive.filter((p) => p.role === 'killer').length;
  if (killers === 0) return 'good';
  if (killers >= alive.length - killers) return 'evil';
  return null;
}

export default {
  id: 'mafia',
  emoji: '🔪',
  name: tx('殺手遊戲', 'Mafia'),
  tagline: tx('經典「天黑請閉眼」：全自動法官，殺手、警察、醫生', 'The classic "close your eyes" game with an automatic moderator'),
  players: { min: 5, max: 16, default: 8 },
  time: '20–40',
  rules: {
    zh: [
      '不需要法官！手機派身份，夜晚殺手、醫生、警察輪流在手機上操作（請將手機放在桌子中間）。',
      '夜晚次序：殺手 → 醫生 → 警察。天亮後手機會公佈死訊。',
      '白天大家討論，然後投票處決一位玩家。',
      '殺手全部出局，好人勝；殺手人數等於或多於其他存活玩家，殺手勝。',
    ],
    en: [
      'No moderator needed. The phone deals roles, and at night the Mafia, Doctor and Detective take turns on the phone (keep it in the middle).',
      'Night order: Mafia → Doctor → Detective. At dawn the phone announces who died.',
      'During the day everyone discusses, then votes to eliminate one player.',
      'The town wins when every Mafia member is gone. The Mafia win once they equal or outnumber everyone else alive.',
    ],
  },
  roles: [
    { id: 'killer', ...R.killer, min: 1, max: 4 },
    { id: 'police', ...R.police, max: 1 },
    { id: 'doctor', ...R.doctor, max: 1 },
    { id: 'civilian', ...R.civilian, auto: true },
  ],
  options: [
    { id: 'talk', type: 'number', label: tx('白天討論時間（0 = 不計時）', 'Day discussion (0 = off)'), min: 0, max: 10, step: 1, unit: 'min', default: 3 },
    { id: 'selfSave', type: 'toggle', label: tx('醫生可以救自己', 'Doctor may protect themselves'), default: true },
    { id: 'reveal', type: 'toggle', label: tx('死亡時公開身份', 'Reveal role on death'), default: true },
  ],
  defaults(n) { return { roles: { killer: n <= 6 ? 1 : n <= 10 ? 2 : n <= 13 ? 3 : 4, police: 1, doctor: n >= 6 ? 1 : 0 } }; },
  deck(s) {
    const r = s.roles;
    const special = [...Array(r.killer || 1).fill('killer'), ...(r.police ? ['police'] : []), ...(r.doctor ? ['doctor'] : [])];
    return [...special, ...Array(Math.max(0, s.n - special.length)).fill('civilian')];
  },
  check(s) {
    const k = s.roles.killer || 1;
    const errors = [];
    if (k * 2 >= s.n) errors.push(tx('殺手太多。', 'Too many Mafia.'));
    const civ = s.n - k - (s.roles.police ? 1 : 0) - (s.roles.doctor ? 1 : 0);
    if (civ < 0) errors.push(tx('角色多過玩家人數。', 'More roles than players.'));
    return { errors, warnings: [], summary: tx(`殺手 ${k} · 警察 ${s.roles.police ? 1 : 0} · 醫生 ${s.roles.doctor ? 1 : 0} · 平民 ${Math.max(0, civ)}`, `${k} Mafia · ${s.roles.police ? 1 : 0} Detective · ${s.roles.doctor ? 1 : 0} Doctor · ${Math.max(0, civ)} civilians`) };
  },

  async run(ctx, s) {
    const roles = shuffle(this.deck(s));
    const P = roles.map((role, i) => ({ seat: i + 1, role, alive: true }));
    const killers = P.filter((p) => p.role === 'killer').map((p) => p.seat);
    const find = (role) => P.find((p) => p.role === role);
    const grid = (filter = () => true) => P.map((p) => ({ id: p.seat, label: String(p.seat), sub: p.alive ? null : '💀', disabled: !p.alive || !filter(p) }));
    const strip = () => ctx.board(ctx.h('div', { class: 'seat-strip' }, P.map((p) => ctx.h('span', { class: `seat ${p.alive ? '' : 'dead'}` }, String(p.seat)))));
    const dummy = () => ctx.wait(randInt(6, 10), { label: ctx.t('actionTime') });

    await ctx.say(tx('請大家圍成一圈，順時針由 1 號開始記住座位號碼，然後輪流查看身份。', 'Sit in a circle and number yourselves clockwise from 1, then take turns viewing your role.'));
    await ctx.ready();
    await ctx.deal(P.map((p) => ({
      seat: p.seat, title: R[p.role].name, emoji: R[p.role].emoji, team: R[p.role].team,
      teamLabel: p.role === 'killer' ? tx('殺手陣營', 'Mafia') : tx('好人陣營', 'Town'),
      body: [R[p.role].desc, p.role === 'killer' && killers.length > 1 ? tx(`殺手同伴：${ctx.seats(killers.filter((x) => x !== p.seat)).zh}`, `Fellow Mafia: ${ctx.seats(killers.filter((x) => x !== p.seat)).en}`) : null].filter(Boolean),
    })));
    strip();

    const finish = async () => {
      const w = mafiaWinner(P);
      if (!w) return false;
      ctx.result(w);
      ctx.phase(ctx.t('gameOver'));
      await ctx.say(w === 'good' ? tx('所有殺手已經出局，好人勝利！', 'Every Mafia member is gone. The town wins!') : tx('殺手控制了小鎮，殺手勝利！', 'The Mafia have taken over. The Mafia win!'));
      ctx.board(ctx.h('div', { class: 'reveal-list' }, P.map((p) => ctx.h('div', { class: `reveal team-${R[p.role].team} ${p.alive ? '' : 'dead'}` },
        ctx.h('b', {}, ctx.L(ctx.seat(p.seat))), ' ', R[p.role].emoji, ' ', ctx.L(R[p.role].name)))));
      return true;
    };
    const die = async (seat) => {
      const p = P[seat - 1];
      p.alive = false;
      strip();
      if (s.opts.reveal) await ctx.say(tx(`${ctx.seat(seat).zh}的身份是${R[p.role].name.zh}。`, `${ucfirst(ctx.seat(seat).en)} was ${p.role === 'killer' ? 'Mafia' : `the ${R[p.role].name.en}`}.`));
    };

    for (let night = 1; ; night++) {
      ctx.phase(tx(`第 ${night} 晚`, `Night ${night}`), { night: true });
      await ctx.say(tx('天黑請閉眼。請將手機放在桌子中間。', 'Night falls, close your eyes. Put the phone in the middle of the table.'));
      await ctx.act(2);

      await ctx.say(tx('殺手請睜眼，互相確認，然後選擇今晚要殺的玩家。', 'Mafia, open your eyes, find each other, and choose tonight\'s victim.'));
      const k = await ctx.choose({ title: tx('殺誰？', 'Kill whom?'), items: grid() });
      await ctx.say(tx('殺手請閉眼。', 'Mafia, close your eyes.'));

      let saved = null;
      const doc = find('doctor');
      if (doc) {
        await ctx.say(tx('醫生請睜眼，選擇今晚要救的玩家。', 'Doctor, open your eyes and choose someone to protect.'));
        if (doc.alive) saved = await ctx.choose({ title: tx('救誰？', 'Protect whom?'), items: grid((p) => s.opts.selfSave || p.seat !== doc.seat) });
        else await dummy();
        await ctx.say(tx('醫生請閉眼。', 'Doctor, close your eyes.'));
      }
      const cop = find('police');
      if (cop) {
        await ctx.say(tx('警察請睜眼，選擇要查驗的玩家。', 'Detective, open your eyes and choose someone to investigate.'));
        if (cop.alive) {
          const c = await ctx.choose({ title: tx('查驗誰？', 'Investigate whom?'), items: grid((p) => p.seat !== cop.seat) });
          const bad = P[c - 1].role === 'killer';
          await ctx.buttons({ title: bad ? tx(`${ctx.seat(c).zh}是 👎 殺手`, `${ucfirst(ctx.seat(c).en)} is 👎 MAFIA`) : tx(`${ctx.seat(c).zh}是 👍 好人`, `${ucfirst(ctx.seat(c).en)} is 👍 innocent`), buttons: [{ id: 'ok', label: ctx.t('next') }] });
        } else await dummy();
        await ctx.say(tx('警察請閉眼。', 'Detective, close your eyes.'));
      }

      ctx.phase(tx(`第 ${night} 天`, `Day ${night}`));
      await ctx.say(tx('天亮了，所有人請睜眼。', 'Morning comes. Everyone, open your eyes.'));
      if (k === saved) {
        await ctx.say(tx('昨晚醫生救活了被襲擊的人，沒有人死亡。', 'Last night the Doctor saved the victim. Nobody died.'));
      } else {
        await ctx.say(tx(`昨晚${ctx.seat(k).zh}被殺手殺死了。`, `Last night ${ctx.seat(k).en} was killed by the Mafia.`));
        await die(k);
      }
      if (await finish()) return;

      await ctx.say(tx('請開始討論，找出殺手。', 'Discuss and find the Mafia.'));
      if (s.opts.talk > 0) await ctx.timer(s.opts.talk * 60, { title: tx('白天討論', 'Day discussion') });
      else await ctx.ready(tx('討論完畢，開始投票', 'Done, start voting'));
      await ctx.say(tx('三、二、一，同時指向你要處決的玩家。', 'Three, two, one: point at the player to eliminate.'));
      const out = await ctx.choose({ title: tx('誰被處決？', 'Who was eliminated?'), items: grid(), extra: [{ id: 'none', label: tx('平票／沒有人出局', 'Tie / no one') }] });
      if (out === 'none') await ctx.say(tx('今天沒有人被處決。', 'Nobody is eliminated today.'));
      else {
        await ctx.say(tx(`${ctx.seat(out).zh}被處決。`, `${ucfirst(ctx.seat(out).en)} is eliminated.`));
        await die(out);
      }
      if (await finish()) return;
    }
  },
};
