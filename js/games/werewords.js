import { tx, shuffle, pick, ucfirst } from '../util.js';
import { INSIDER_WORDS } from './words.js';

export default {
  id: 'werewords',
  emoji: '🗝️',
  name: tx('狼人真言', 'Werewords'),
  tagline: tx('二十個問題 × 狼人殺：猜出神秘詞語，再找出狼人', 'Twenty Questions meets Werewolf'),
  players: { min: 4, max: 10, default: 6 },
  time: '10',
  rules: {
    zh: [
      '村長（公開身份）知道神秘詞語，只可以用「是／不是／也許／很接近」回答大家的是非題。',
      '狼人和預言家也知道詞語。狼人想阻止大家猜中；預言家想幫忙，但不能被狼人發現。',
      '限時內猜中詞語：狼人可以商量並指出一位玩家，指中預言家狼人勝，否則村民勝。',
      '限時內猜不中：所有人投票找狼人，投中狼人村民勝，否則狼人勝。',
    ],
    en: [
      'The Mayor (public) knows the magic word and answers yes/no questions with Yes, No, Maybe or So Close.',
      'The Werewolf and the Seer also know the word. The Werewolf wants nobody to guess it; the Seer wants to help without being found.',
      'If the word is guessed in time, the werewolves may name one player: if it is the Seer, the werewolves win; otherwise the village wins.',
      'If nobody guesses it, everyone votes for a werewolf. Catch one and the village wins; otherwise the werewolves win.',
    ],
  },
  roles: [
    { id: 'mayor', name: tx('村長', 'Mayor'), team: 'good', emoji: '🎩', fixed: true, desc: tx('公開身份，知道詞語，只可以回答是非題。', 'Public; knows the word and answers yes/no questions.') },
    { id: 'wolf', name: tx('狼人', 'Werewolf'), team: 'evil', emoji: '🐺', min: 1, max: 2, desc: tx('知道詞語，想令大家猜不中。', 'Knows the word and wants nobody to guess it.') },
    { id: 'seer', name: tx('預言家', 'Seer'), team: 'good', emoji: '🔮', max: 1, desc: tx('知道詞語，要暗中幫忙。', 'Knows the word and helps in secret.') },
    { id: 'villager', name: tx('村民', 'Villager'), team: 'good', emoji: '🙂', auto: true, desc: tx('提問猜詞，再找出狼人。', 'Asks questions, then hunts the werewolf.') },
  ],
  options: [
    { id: 'minutes', type: 'number', label: tx('猜詞時間', 'Guessing time'), min: 2, max: 10, step: 1, unit: 'min', default: 4 },
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'both', choices: [
      { value: 'both', label: tx('中英對照', 'Both') }, { value: 'zh', label: tx('中文', 'Chinese') }, { value: 'en', label: tx('English', 'English') },
    ] },
  ],
  defaults(n) { return { roles: { mayor: 1, wolf: n >= 7 ? 2 : 1, seer: 1 } }; },
  deck(s) {
    const w = s.roles.wolf || 1;
    const seer = s.roles.seer ? 1 : 0;
    return ['mayor', ...Array(w).fill('wolf'), ...Array(seer).fill('seer'), ...Array(Math.max(0, s.n - 1 - w - seer)).fill('villager')];
  },
  check(s) {
    const errors = [];
    const w = s.roles.wolf || 1;
    if (1 + w + (s.roles.seer ? 1 : 0) > s.n) errors.push(tx('角色多過玩家人數。', 'More roles than players.'));
    return { errors, warnings: [], summary: tx(`村長 1 · 狼人 ${w} · 預言家 ${s.roles.seer ? 1 : 0}`, `1 Mayor · ${w} werewolf · ${s.roles.seer ? 1 : 0} seer`) };
  },

  async run(ctx, s) {
    const roles = shuffle(this.deck(s));
    const w = pick(INSIDER_WORDS);
    const word = s.opts.wordLang === 'both' ? `${w[0]} / ${w[1]}` : s.opts.wordLang === 'en' ? w[1] : w[0];
    const seatOf = (r) => roles.map((x, i) => (x === r ? i + 1 : null)).filter(Boolean);
    const mayor = seatOf('mayor')[0];
    const wolves = seatOf('wolf');
    const seer = seatOf('seer');
    const R = Object.fromEntries(this.roles.map((r) => [r.id, r]));

    await ctx.say(tx('請大家順時針由 1 號開始記住座位號碼，然後輪流查看身份。', 'Number yourselves clockwise from 1, then take turns viewing your role.'));
    await ctx.ready();
    await ctx.deal(roles.map((r, i) => ({
      seat: i + 1,
      emoji: R[r].emoji,
      team: R[r].team,
      title: R[r].name,
      body: [R[r].desc, r === 'villager' ? null : tx(`神秘詞語：${word}`, `Magic word: ${word}`),
        r === 'wolf' && wolves.length > 1 ? tx(`狼隊友：${ctx.seats(wolves.filter((x) => x !== i + 1)).zh}`, `Fellow werewolf: ${ctx.seats(wolves.filter((x) => x !== i + 1)).en}`) : null].filter(Boolean),
    })));

    ctx.phase(tx('猜詞', 'Questions'));
    await ctx.say(tx(`${ctx.seat(mayor).zh}是村長。大家向村長提出是非題，村長只可以回答是、不是、也許或者很接近。準備，開始！`,
      `${ucfirst(ctx.seat(mayor).en)} is the Mayor. Ask yes or no questions. The Mayor may answer yes, no, maybe, or so close. Ready, go!`));
    const r = await ctx.timer(s.opts.minutes * 60, {
      title: tx('猜詞時間', 'Guessing time'),
      buttons: [{ id: 'got', label: tx('🎉 猜中了！', '🎉 Guessed it!') }],
      hideEnd: true,
      silentEnd: true,
    });

    if (r.reason === 'got') {
      ctx.phase(tx('狼人反擊', 'Werewolves strike back'));
      await ctx.say(tx(`猜中了！詞語是${w[0]}。狼人請公開身份，你們有三十秒商量，指出誰是預言家。`, `Correct! The word was ${w[1]}. Werewolves, reveal yourselves. You have thirty seconds to find the Seer.`));
      await ctx.timer(30, { title: tx('狼人找預言家', 'Find the Seer'), warnings: [10] });
      await ctx.ready(tx('揭曉預言家', 'Reveal the Seer'));
      await ctx.say(seer.length
        ? tx(`預言家是${ctx.seat(seer[0]).zh}！指中的話狼人勝利，否則村民勝利。`, `The Seer was ${ctx.seat(seer[0]).en}! If the werewolves named them, the werewolves win. Otherwise the village wins.`)
        : tx('今局沒有預言家，村民勝利！', 'There was no Seer this game. The village wins!'));
    } else {
      ctx.phase(tx('找出狼人', 'Find the werewolf'));
      await ctx.say(tx(`時間到，沒有人猜中！詞語是${w[0]}。大家有一分鐘討論，然後投票找出狼人。`, `Time's up and nobody guessed it! The word was ${w[1]}. Discuss for one minute, then vote for a werewolf.`));
      await ctx.timer(60, { title: tx('討論時間', 'Discussion') });
      await ctx.say(tx('三、二、一，同時指向你認為是狼人的玩家！', 'Three, two, one: point at a werewolf!'), { after: 1 });
      await ctx.ready(tx('揭曉狼人', 'Reveal the werewolves'));
      await ctx.say(tx(`狼人是${ctx.seats(wolves).zh}！投中的話村民勝利，否則狼人勝利。`, `The werewolves were ${ctx.seats(wolves).en}! If you caught one, the village wins. Otherwise the werewolves win.`));
    }
  },
};
