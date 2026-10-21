import { tx, shuffle, randInt } from '../util.js';

const DICE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const R = {
  thief: { name: tx('芝士大盜', 'Cheese Thief'), team: 'evil', emoji: '🧀', desc: tx('醒來時一定要偷走芝士。唔好被大家投中。', 'When you wake you must steal the cheese. Avoid getting the most votes.') },
  sleepy: { name: tx('貪睡鼠', 'Sleepyhead'), team: 'good', emoji: '😴', desc: tx('如果獨自醒來，可以偷看另一位玩家的骰子。投中芝士大盜就贏。', 'If you wake alone you may peek at one other die. Vote out the Cheese Thief to win.') },
  fall: { name: tx('背鍋鼠', 'Fall Mouse'), team: 'neutral', emoji: '🙈', desc: tx('同貪睡鼠一樣行動，但你要令自己得最高票先贏（獨贏）。', 'Acts like a Sleepyhead, but you win alone if you get the most votes.') },
};

export function followerRule(n) {
  if (n <= 4) return tx('4 人：冇共犯；每人擲兩粒骰，獨自醒來都唔可以偷看。', '4 players: no Followers; everyone rolls two dice and nobody may peek.');
  if (n === 5) return tx('5 人：芝士大盜偷芝士時，一齊醒來的貪睡鼠會變成共犯（多過一個就由大盜指一個）。', '5 players: a Sleepyhead awake when the thief steals becomes a Follower (if several, the thief points at one).');
  if (n === 6) return tx('6 人：天亮前，芝士大盜揀 1 個共犯，兩人互相認識。', '6 players: before dawn the thief picks 1 Follower; they see each other.');
  if (n === 7) return tx('7 人：天亮前，芝士大盜揀 2 個共犯；兩個共犯互相認識，但唔知誰是大盜。', '7 players: the thief picks 2 Followers who see each other but not the thief.');
  return tx('8 人：天亮前，芝士大盜揀 2 個共犯，三人互相認識。', '8 players: the thief picks 2 Followers, and all three see each other.');
}

export default {
  id: 'cheese-thief',
  emoji: '🧀',
  name: tx('芝士大盜', 'Cheese Thief'),
  tagline: tx('擲骰決定幾點醒，捉出偷芝士的老鼠', 'Roll to see when you wake. Who stole the cheese?'),
  players: { min: 4, max: 8, default: 6 },
  time: '10',
  rules: {
    zh: [
      '每人擲骰（4 人時擲兩粒），偷偷睇點數：點數就是你夜晚醒來的時間（1 至 6 點）。',
      '如果某個時間只有你一個人醒來，可以偷看另一位玩家的骰子（4 人遊戲不可以）。',
      '芝士大盜醒來時，無論有冇其他人，都一定要偷走芝士。',
      '天亮後討論，然後所有人同時指向一位玩家。最高票（包括平手）有芝士大盜，貪睡鼠勝；否則芝士大盜同共犯勝。',
      '背鍋鼠（6–8 人可選）：只要自己得最高票就獨贏。',
    ],
    en: [
      'Everyone rolls a die (two dice with 4 players) and peeks: that number is the hour you wake up (1 to 6).',
      'If you are the only one awake at your hour, you may peek at one other player\'s die (not in 4-player games).',
      'The Cheese Thief must steal the cheese when they wake, even if others are watching.',
      'At dawn, discuss and then everyone points at one player at once. If the thief is among the most-voted, the Sleepyheads win; otherwise the thief and Followers win.',
      'Fall Mouse (optional, 6–8 players): wins alone by getting the most votes.',
    ],
  },
  roles: [
    { id: 'thief', ...R.thief, fixed: true },
    { id: 'sleepy', ...R.sleepy, auto: true },
    { id: 'fall', ...R.fall, max: 1 },
  ],
  options: [
    { id: 'hourSec', type: 'number', label: tx('每個時間醒來多久', 'Time awake at each hour'), min: 5, max: 20, step: 1, unit: 'sec', default: 10 },
    { id: 'talk', type: 'number', label: tx('白天討論時間', 'Discussion time'), min: 1, max: 10, step: 1, unit: 'min', default: 3 },
    { id: 'digital', type: 'toggle', label: tx('電子派牌＋電子骰（唔使實體卡同骰）', 'Digital roles and dice (no cards or dice needed)'), default: false },
  ],
  defaults(n) {
    return { roles: { thief: 1, fall: 0 } };
  },
  deck(s) {
    const fall = s.n >= 6 && s.roles.fall ? 1 : 0;
    return ['thief', ...Array(fall).fill('fall'), ...Array(s.n - 1 - fall).fill('sleepy')];
  },
  check(s) {
    const errors = [];
    if (s.roles.fall && s.n < 6) errors.push(tx('背鍋鼠只可以喺 6–8 人使用。', 'The Fall Mouse is only for 6–8 players.'));
    return { errors, warnings: [], summary: followerRule(s.n) };
  },

  async run(ctx, s) {
    const { n } = s;
    const sec = s.opts.hourSec;
    const four = n === 4;
    let dice = null;
    let roles = null;

    if (s.opts.digital) {
      roles = shuffle(this.deck(s));
      dice = roles.map(() => (four ? [randInt(1, 6), randInt(1, 6)] : [randInt(1, 6)]));
      await ctx.say(tx('請在桌子中間放一件細物品當作芝士。然後輪流查看自己的身份同骰子。', 'Put a small object in the middle of the table as the cheese. Then take turns viewing your role and dice.'));
      await ctx.deal(roles.map((id, i) => {
        const d = dice[i];
        const diceLine = four
          ? (id === 'thief'
            ? tx(`你的骰子：${DICE[d[0]]} ${d[0]} 同 ${DICE[d[1]]} ${d[1]}。兩個時間你都會醒來，揀其中一個偷芝士。`, `Your dice: ${DICE[d[0]]} ${d[0]} and ${DICE[d[1]]} ${d[1]}. You wake at both hours; steal at one of them.`)
            : tx(`你的骰子：${DICE[d[0]]} ${d[0]} 同 ${DICE[d[1]]} ${d[1]}。請揀其中一個作為醒來時間。`, `Your dice: ${DICE[d[0]]} ${d[0]} and ${DICE[d[1]]} ${d[1]}. Pick one of them as your wake-up hour.`))
          : tx(`你的骰子：${DICE[d[0]]} ${d[0]}，你會喺 ${d[0]} 點醒來。`, `Your die: ${DICE[d[0]]} ${d[0]}. You wake at ${d[0]} o'clock.`);
        return { seat: i + 1, title: R[id].name, emoji: R[id].emoji, team: R[id].team, body: [diceLine, R[id].desc] };
      }));
    } else {
      await ctx.say(four
        ? tx('每人抽一張角色卡，擲兩粒骰子，偷偷查看，然後蓋好骰盅。貪睡鼠請揀其中一個點數作為醒來時間。芝士放在桌子中間。',
          'Everyone take a role card, roll two dice, peek, and cover them. Sleepyheads, pick one of your numbers as your wake-up hour. Put the cheese in the middle.')
        : tx('每人抽一張角色卡，擲骰子，偷偷查看點數，然後蓋好骰盅。芝士放在桌子中間。',
          'Everyone take a role card, roll your die, peek at it, and cover it. Put the cheese in the middle.'));
      await ctx.ready();
    }

    await ctx.say(four
      ? tx('提示：4 人遊戲獨自醒來都不可以偷看骰子。芝士大盜醒來時必須偷走芝士。', 'Reminder: in a 4-player game nobody may peek. The Cheese Thief must steal the cheese when awake.')
      : tx('提示：如果只有你一個人醒來，可以偷看另一位玩家的骰子。芝士大盜醒來時必須偷走芝士。', 'Reminder: if you are the only one awake, you may peek at one other die. The Cheese Thief must steal the cheese when awake.'));
    if (n === 5) await ctx.say(followerRule(5));

    ctx.phase(tx('夜晚', 'Night'), { night: true });
    await ctx.say(tx('天黑了，所有人請閉上眼睛。', 'Night falls. Everyone, close your eyes.'));
    await ctx.act(2);

    for (let hour = 1; hour <= 6; hour++) {
      ctx.phase(tx(`夜晚 · ${hour} 點`, `Night · ${hour} o'clock`), { night: true });
      await ctx.say(tx(`${hour} 點。擲出 ${hour} 點的玩家請睜開眼睛。`, `${hour} o'clock. Players who rolled ${hour}, open your eyes.`));
      const widget = s.opts.digital && !four ? peekPanel(ctx, dice) : null;
      await ctx.act(sec, { widget });
      await ctx.say(tx(`${hour} 點的玩家請閉上眼睛。`, `${hour} o'clock players, close your eyes.`));
    }

    if (n >= 6) {
      ctx.phase(tx('夜晚 · 揀共犯', 'Night · Followers'), { night: true });
      await ctx.say(tx('所有人請閉著眼，把一隻手伸向桌子中間。', 'Everyone, keep your eyes closed and stretch one hand toward the middle of the table.'));
      await ctx.act(2);
      if (n === 6) {
        await ctx.say(tx('芝士大盜請睜開眼睛，輕輕觸碰一位玩家的手，他會成為你的共犯。', 'Cheese Thief, open your eyes and gently touch one player\'s hand. They become your Follower.'));
        await ctx.act(5);
        await ctx.say(tx('被觸碰的玩家請睜開眼睛，和芝士大盜互相確認。', 'The touched player, open your eyes and look at the Cheese Thief.'));
        await ctx.act(5);
      } else if (n === 7) {
        await ctx.say(tx('芝士大盜請睜開眼睛，輕輕觸碰兩位玩家的手，他們會成為你的共犯。', 'Cheese Thief, open your eyes and gently touch two players\' hands. They become your Followers.'));
        await ctx.act(5);
        await ctx.say(tx('芝士大盜請閉上眼睛。被觸碰的兩位共犯請睜開眼睛，互相確認。', 'Cheese Thief, close your eyes. The two touched players, open your eyes and look at each other.'));
        await ctx.act(5);
      } else {
        await ctx.say(tx('芝士大盜請睜開眼睛，輕輕觸碰兩位玩家的手，他們會成為你的共犯。', 'Cheese Thief, open your eyes and gently touch two players\' hands. They become your Followers.'));
        await ctx.act(5);
        await ctx.say(tx('被觸碰的兩位共犯請睜開眼睛，三人互相確認。', 'The two touched players, open your eyes. All three of you, look at each other.'));
        await ctx.act(5);
      }
      await ctx.say(tx('所有人請閉上眼睛，收回你的手。', 'Everyone, close your eyes and take your hand back.'));
      await ctx.act(2);
    }

    ctx.phase(tx('白天', 'Day'));
    await ctx.say(tx('天亮了！所有人請睜開眼睛。芝士不見了！開始討論誰是芝士大盜。', 'Dawn! Everyone open your eyes. The cheese is gone! Discuss who the Cheese Thief is.'));
    await ctx.timer(s.opts.talk * 60, { title: tx('討論時間', 'Discussion') });
    await ctx.say(tx('準備投票。三、二、一，所有人同時指向你認為是芝士大盜的玩家！', 'Get ready to vote. Three, two, one: everyone point at the Cheese Thief!'), { after: 1 });
    ctx.phase(tx('結算', 'Result'));
    await ctx.say(tx('得票最多的玩家請翻開身份。最高票有芝士大盜，貪睡鼠勝利；否則芝士大盜同共犯勝利。',
      'The most-voted player or players, reveal your cards. If the thief is among them, the Sleepyheads win. Otherwise the thief and Followers win.'));
    if (roles) {
      await ctx.buttons({ buttons: [{ id: 'r', label: tx('公開所有身份同骰子', 'Reveal all roles and dice'), style: 'primary' }] });
      ctx.board(ctx.h('div', { class: 'reveal-list' }, roles.map((id, i) => ctx.h('div', { class: `reveal team-${R[id].team}` },
        ctx.h('b', {}, ctx.L(ctx.seat(i + 1))), ' ', R[id].emoji, ' ', ctx.L(R[id].name), ' · ',
        dice[i].map((d) => `${DICE[d]} ${d}`).join('  ')))));
    }
  },
};

// Digital-dice peek panel shown while players are awake.
function peekPanel(ctx, dice) {
  const { h, L } = ctx;
  const out = h('div', { class: 'peek-out' }, L(tx('只限獨自醒來的貪睡鼠使用，只可以睇一次。', 'Only for a Sleepyhead awake alone. One peek only.')));
  let used = false;
  return h('div', { class: 'panel' },
    h('div', { class: 'panel-title' }, L(tx('🎲 偷看骰子', '🎲 Peek at a die'))),
    out,
    h('div', { class: 'grid' }, dice.map((d, i) => h('button', {
      class: 'cell',
      onclick: (e) => {
        if (used) return;
        used = true;
        out.textContent = L(tx(`${i + 1} 號的骰子：${DICE[d[0]]} ${d[0]}`, `Player ${i + 1}'s die: ${DICE[d[0]]} ${d[0]}`));
        out.classList.add('big');
        setTimeout(() => { out.textContent = L(tx('已睇過。', 'Peek used.')); out.classList.remove('big'); }, 4000);
      },
    }, h('span', { class: 'cell-main' }, String(i + 1))))),
  );
}
