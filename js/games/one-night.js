import { tx } from '../util.js';

const ROLES = [
  { id: 'doppelganger', name: tx('化身幽靈', 'Doppelgänger'), team: 'neutral', max: 1, desc: tx('查看一位玩家的卡並變成該角色。', 'Looks at another card and becomes that role.') },
  { id: 'werewolf', name: tx('狼人', 'Werewolf'), team: 'evil', max: 2, desc: tx('互相確認；只有一隻狼人時可以看中間一張卡。', 'See each other; a lone wolf may view one center card.') },
  { id: 'minion', name: tx('爪牙', 'Minion'), team: 'evil', max: 1, desc: tx('知道誰是狼人，幫狼人獲勝。', 'Knows the werewolves and helps them win.') },
  { id: 'mason', name: tx('守夜人', 'Mason'), team: 'good', max: 2, desc: tx('兩位守夜人互相確認。', 'The two Masons see each other.') },
  { id: 'seer', name: tx('預言家', 'Seer'), team: 'good', max: 1, desc: tx('查看一位玩家的卡，或中間兩張卡。', "Views one player's card or two center cards.") },
  { id: 'robber', name: tx('強盜', 'Robber'), team: 'good', max: 1, desc: tx('同一位玩家交換卡，然後查看新卡。', 'Swaps with another player and views the new card.') },
  { id: 'troublemaker', name: tx('搗蛋鬼', 'Troublemaker'), team: 'good', max: 1, desc: tx('交換另外兩位玩家的卡（不可查看）。', "Swaps two other players' cards without looking.") },
  { id: 'drunk', name: tx('酒鬼', 'Drunk'), team: 'good', max: 1, desc: tx('同中間一張卡交換，不可查看。', 'Swaps with a center card without looking.') },
  { id: 'insomniac', name: tx('失眠者', 'Insomniac'), team: 'good', max: 1, desc: tx('最後查看自己的卡。', 'Looks at their own card at the end of the night.') },
  { id: 'villager', name: tx('村民', 'Villager'), team: 'good', max: 3, desc: tx('冇特殊能力。', 'No special ability.') },
  { id: 'hunter', name: tx('獵人', 'Hunter'), team: 'good', max: 1, desc: tx('如果被投死，你指著的玩家都會死。', 'If you die, the player you voted for dies too.') },
  { id: 'tanner', name: tx('皮匠', 'Tanner'), team: 'neutral', max: 1, desc: tx('想死：被投死就獨贏。', 'Hates his job: wins only if he dies.') },
];

// Order in which extra cards are added for bigger groups.
const ADD_ORDER = ['villager', 'insomniac', 'drunk', 'minion', 'mason', 'mason', 'tanner', 'hunter', 'villager', 'villager', 'doppelganger'];

export function defaultRoles(n) {
  const roles = Object.fromEntries(ROLES.map((r) => [r.id, 0]));
  roles.werewolf = 2; roles.seer = 1; roles.robber = 1; roles.troublemaker = 1;
  let total = 5;
  for (const id of ADD_ORDER) {
    if (total >= n + 3) break;
    roles[id]++;
    total++;
  }
  return roles;
}

export default {
  id: 'one-night',
  emoji: '🌕',
  name: tx('一夜終極狼人', 'One Night Ultimate Werewolf'),
  tagline: tx('只有一晚！夜晚換卡，十分鐘決勝負', 'One night, swapped cards, ten minutes to find the wolf'),
  players: { min: 3, max: 10, default: 6 },
  time: '10',
  rules: {
    zh: [
      '卡牌數量 = 玩家人數 + 3：每人一張，中間放三張。',
      '夜晚各角色按次序醒來行動，卡牌可能被交換，你最後的身份以面前的卡為準。',
      '天亮後討論，時間到所有人同時指向一位玩家，最高票（至少 2 票）的玩家死亡。',
      '死者之中有狼人，村民陣營勝；冇狼人死，狼人陣營勝；皮匠死就皮匠獨贏。',
    ],
    en: [
      'Use player count + 3 cards: one for each player and three in the center.',
      'At night roles wake in order. Cards may get swapped, and your final role is the card in front of you.',
      'At dawn, discuss. When time is up everyone points at once; the player with the most votes (at least 2) dies.',
      'If a Werewolf dies, the village wins. If no Werewolf dies, the werewolves win. If the Tanner dies, the Tanner wins.',
    ],
  },
  roles: ROLES,
  options: [
    { id: 'talk', type: 'number', label: tx('白天討論時間', 'Discussion time'), min: 1, max: 15, step: 1, unit: 'min', default: 5 },
    { id: 'nightSec', type: 'number', label: tx('每個角色行動時間', 'Time for each role'), min: 4, max: 20, step: 1, unit: 'sec', default: 8 },
  ],
  defaults(n) { return { roles: defaultRoles(n) }; },
  deck(s) {
    return ROLES.flatMap((r) => Array(s.roles[r.id] || 0).fill(r.id));
  },
  check(s) {
    const total = this.deck(s).length;
    const need = s.n + 3;
    const errors = [];
    const warnings = [];
    if (total !== need) errors.push(tx(`卡牌總數要等於玩家人數 + 3（而家 ${total} 張，需要 ${need} 張）。`, `Total cards must be players + 3 (now ${total}, need ${need}).`));
    if (s.roles.mason === 1) warnings.push(tx('守夜人通常一齊用兩張。', 'Masons are normally used as a pair.'));
    if (!s.roles.werewolf) warnings.push(tx('冇狼人卡。', 'No Werewolf cards.'));
    return { errors, warnings, summary: tx(`${s.n} 位玩家 · ${need} 張卡（中間 3 張）`, `${s.n} players · ${need} cards (3 in the center)`) };
  },

  async run(ctx, s) {
    const has = (id) => (s.roles[id] || 0) > 0;
    const sec = s.opts.nightSec;
    const step = async (open, close, mult = 1) => {
      await ctx.say(open);
      await ctx.act(sec * mult);
      await ctx.say(close);
    };

    await ctx.say(tx('洗勻卡牌，每人發一張，中間放三張。請秘密查看自己的卡，然後蓋好放在面前。準備好就按繼續。',
      'Shuffle the cards, deal one to each player and three to the center. Look at your card secretly, then put it face down in front of you. Tap continue when ready.'));
    await ctx.ready();

    ctx.phase(tx('夜晚', 'Night'), { night: true });
    await ctx.say(tx('所有人請閉上眼睛。', 'Everyone, close your eyes.'));
    await ctx.act(2);

    if (has('doppelganger')) {
      await ctx.say(tx('化身幽靈請睜開眼睛，查看另一位玩家的卡。你現在變成該角色。', "Doppelgänger, wake up and look at another player's card. You are now that role."));
      await ctx.act(sec);
      await ctx.say(tx('如果你看到的是預言家、強盜、搗蛋鬼或者酒鬼，請立即執行該角色的行動。', 'If you viewed the Seer, Robber, Troublemaker or Drunk card, do your action now.'));
      await ctx.act(sec);
      await ctx.say(tx('化身幽靈請閉上眼睛。', 'Doppelgänger, close your eyes.'));
      if (has('minion')) {
        await step(
          tx('如果化身幽靈變成了爪牙，請睜開眼睛。狼人請豎起大拇指。', 'If the Doppelgänger is now a Minion, open your eyes. Werewolves, stick out your thumb.'),
          tx('狼人請收起大拇指。化身幽靈請閉上眼睛。', 'Werewolves, put your thumbs away. Doppelgänger, close your eyes.'), 0.7);
      }
    }
    if (has('werewolf')) {
      await step(
        tx('狼人請睜開眼睛，互相確認。如果只有你一隻狼人，可以查看中間的一張卡。', 'Werewolves, wake up and look for other werewolves. If you are the only werewolf, you may look at one center card.'),
        tx('狼人請閉上眼睛。', 'Werewolves, close your eyes.'));
    }
    if (has('minion')) {
      await step(
        tx('爪牙請睜開眼睛。狼人請豎起大拇指，讓爪牙知道你們是誰。', 'Minion, wake up. Werewolves, stick out your thumb so the Minion can see who you are.'),
        tx('狼人請收起大拇指。爪牙請閉上眼睛。', 'Werewolves, put your thumbs away. Minion, close your eyes.'));
    }
    if (has('mason')) {
      await step(tx('守夜人請睜開眼睛，互相確認。', 'Masons, wake up and look for the other Mason.'), tx('守夜人請閉上眼睛。', 'Masons, close your eyes.'));
    }
    if (has('seer')) {
      await step(tx('預言家請睜開眼睛。你可以查看另一位玩家的卡，或者中間的兩張卡。', "Seer, wake up. You may look at another player's card or two of the center cards."), tx('預言家請閉上眼睛。', 'Seer, close your eyes.'));
    }
    if (has('robber')) {
      await step(tx('強盜請睜開眼睛。你可以將自己的卡同另一位玩家交換，然後查看你的新卡。', "Robber, wake up. You may exchange your card with another player's card, and then view your new card."), tx('強盜請閉上眼睛。', 'Robber, close your eyes.'));
    }
    if (has('troublemaker')) {
      await step(tx('搗蛋鬼請睜開眼睛。你可以交換另外兩位玩家的卡，但不可以查看。', 'Troublemaker, wake up. You may exchange cards between two other players without looking.'), tx('搗蛋鬼請閉上眼睛。', 'Troublemaker, close your eyes.'));
    }
    if (has('drunk')) {
      await step(tx('酒鬼請睜開眼睛，將你的卡同中間的一張卡交換，不可以查看。', 'Drunk, wake up and exchange your card with a card from the center without looking.'), tx('酒鬼請閉上眼睛。', 'Drunk, close your eyes.'));
    }
    if (has('insomniac')) {
      await step(tx('失眠者請睜開眼睛，查看你自己的卡。', 'Insomniac, wake up and look at your card.'), tx('失眠者請閉上眼睛。', 'Insomniac, close your eyes.'), 0.7);
      if (has('doppelganger')) {
        await step(tx('如果化身幽靈變成了失眠者，請睜開眼睛查看你自己的卡。', 'Doppelgänger, if you viewed the Insomniac card, wake up and look at your card.'), tx('化身幽靈請閉上眼睛。', 'Doppelgänger, close your eyes.'), 0.7);
      }
    }

    ctx.phase(tx('白天', 'Day'));
    await ctx.say(tx('天亮了！所有人請睜開眼睛，開始討論。', 'Wake up, everyone! Start discussing.'));
    await ctx.timer(s.opts.talk * 60, { title: tx('討論時間', 'Discussion') });
    await ctx.say(tx('三、二、一，所有人同時指向你要投票的玩家！', 'Three, two, one: everyone point at the player you vote for!'), { after: 1 });
    ctx.phase(tx('結算', 'Result'));
    await ctx.say(tx('最高票而且至少兩票的玩家死亡，請翻開所有卡牌。有狼人死，村民勝利；冇狼人死，狼人勝利；皮匠死，皮匠勝利。',
      'The player with the most votes, at least two, dies. Flip all cards. If a werewolf died, the village wins. If not, the werewolves win. If the Tanner died, the Tanner wins.'));
  },
};
