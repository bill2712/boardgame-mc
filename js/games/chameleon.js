import { tx, shuffle, pick, ucfirst } from '../util.js';
import { TOPICS } from './words.js';

export function topicLabel(w, lang) {
  return lang === 'both' ? `${w[0]} / ${w[1]}` : lang === 'en' ? w[1] : w[0];
}

/** Shows the 4×4 topic grid for everyone. */
export function topicBoard(ctx, topic, lang, highlight) {
  const { h, L } = ctx;
  return h('div', { class: 'topic-board' },
    h('div', { class: 'topic-name' }, L(tx(`主題：${topic.name[0]}`, `Topic: ${topic.name[1]}`))),
    h('div', { class: 'topic-grid' }, topic.words.map((w) => h('span', { class: `topic-word ${highlight === w ? 'hit' : ''}` }, topicLabel(w, lang === 'both' ? (ctx.settings.uiLang === 'en' ? 'en' : 'zh') : lang)))));
}

export default {
  id: 'chameleon',
  emoji: '🦎',
  name: tx('變色龍', 'The Chameleon'),
  tagline: tx('每人說一個詞證明自己知道答案，變色龍要混進去', 'Give one clue word. The Chameleon must blend in'),
  players: { min: 3, max: 8, default: 6 },
  time: '15',
  rules: {
    zh: [
      '桌上公開一張有 16 個詞的主題卡。手機秘密告訴大家其中一個是答案，只有變色龍不知道。',
      '由一位玩家開始，每人輪流說一個和答案有關的詞：太明顯會被變色龍猜到，太含糊會被懷疑。',
      '討論後所有人同時指向一位玩家。',
      '如果指中變色龍，他還有一次機會猜答案：猜中就逃脫成功！指錯人則變色龍勝。',
    ],
    en: [
      'A topic card with 16 words is shown to everyone. The phone secretly tells everyone which word is the answer, except the Chameleon.',
      'Starting with one player, each person says one word related to the answer: too obvious and the Chameleon will guess it, too vague and you look suspicious.',
      'After a short discussion, everyone points at one player.',
      'If the Chameleon is caught, they get one guess at the answer. A correct guess means they escape! If the wrong player is caught, the Chameleon wins.',
    ],
  },
  roles: [
    { id: 'chameleon', name: tx('變色龍', 'Chameleon'), team: 'evil', emoji: '🦎', fixed: true, desc: tx('不知道答案，要假裝知道。', 'Does not know the answer and must bluff.') },
    { id: 'player', name: tx('玩家', 'Player'), team: 'good', emoji: '🙂', auto: true, desc: tx('知道答案，要找出變色龍。', 'Knows the answer and hunts the Chameleon.') },
  ],
  options: [
    { id: 'clueSec', type: 'number', label: tx('每人說詞時間（0 = 不計時）', 'Time per clue (0 = off)'), min: 0, max: 60, step: 5, unit: 'sec', default: 15 },
    { id: 'talk', type: 'number', label: tx('討論時間', 'Discussion time'), min: 1, max: 5, step: 1, unit: 'min', default: 2 },
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'both', choices: [
      { value: 'both', label: tx('跟介面語言', 'Same as interface') }, { value: 'zh', label: tx('中文', 'Chinese') }, { value: 'en', label: tx('English', 'English') },
    ] },
  ],
  defaults() { return { roles: { chameleon: 1 } }; },
  deck(s) { return ['chameleon', ...Array(s.n - 1).fill('player')]; },
  check(s) { return { errors: [], warnings: [], summary: tx(`變色龍 1 · 玩家 ${s.n - 1}`, `1 Chameleon · ${s.n - 1} players`) }; },

  async run(ctx, s) {
    const roles = shuffle(this.deck(s));
    const topic = pick(TOPICS);
    const secret = pick(topic.words);
    const lang = s.opts.wordLang === 'both' ? (ctx.settings.uiLang === 'en' ? 'en' : 'zh') : s.opts.wordLang;
    const cham = roles.indexOf('chameleon') + 1;

    await ctx.say(tx('請大家順時針由 1 號開始記住座位號碼，然後輪流查看身份。', 'Number yourselves clockwise from 1, then take turns viewing your role.'));
    await ctx.ready();
    await ctx.deal(roles.map((r, i) => ({
      seat: i + 1,
      emoji: r === 'chameleon' ? '🦎' : '🔑',
      team: r === 'chameleon' ? 'evil' : 'good',
      title: r === 'chameleon' ? tx('你是變色龍！', 'You are the Chameleon!') : tx(`答案：${topicLabel(secret, lang)}`, `Secret word: ${topicLabel(secret, lang)}`),
      body: r === 'chameleon'
        ? tx(`主題是「${topic.name[0]}」。聽清楚大家的提示，混進去！`, `The topic is "${topic.name[1]}". Listen to the clues and blend in!`)
        : tx(`主題是「${topic.name[0]}」。說一個詞證明你知道答案。`, `The topic is "${topic.name[1]}". Give one word that proves you know it.`),
    })));
    ctx.board(topicBoard(ctx, topic, lang));

    const start = ctx.randInt(1, s.n);
    ctx.phase(tx('提示', 'Clues'));
    await ctx.say(tx(`由${ctx.seat(start).zh}開始，順時針每人說一個詞。`, `Starting with ${ctx.seat(start).en} and going clockwise, everyone says one word.`));
    if (s.opts.clueSec > 0) {
      for (let k = 0; k < s.n; k++) {
        const seat = ((start - 1 + k) % s.n) + 1;
        await ctx.say(tx(`${ctx.seat(seat).zh}。`, `${ucfirst(ctx.seat(seat).en)}.`), { after: 0.1 });
        await ctx.timer(s.opts.clueSec, { title: tx(`${ctx.seat(seat).zh}說詞`, `${ucfirst(ctx.seat(seat).en)}'s clue`), endLabel: tx('說完', 'Done'), silentEnd: true, warnings: [] });
      }
    } else {
      await ctx.ready(tx('全部說完', 'All clues given'));
    }
    ctx.phase(tx('討論', 'Discussion'));
    await ctx.say(tx('討論時間開始，誰是變色龍？', 'Discussion time. Who is the Chameleon?'));
    await ctx.timer(s.opts.talk * 60, { title: tx('討論時間', 'Discussion') });
    await ctx.say(tx('三、二、一，同時指向變色龍！', 'Three, two, one: point at the Chameleon!'), { after: 1 });
    const caught = await ctx.buttons({
      title: tx('最高票的是變色龍嗎？', 'Did the most votes land on the Chameleon?'),
      text: tx('（請最高票的玩家公開身份）', '(Ask the most-voted player to reveal their role.)'),
      buttons: [
        { id: 'yes', label: tx('🦎 指中了', '🦎 Caught'), style: 'good' },
        { id: 'no', label: tx('🙈 指錯了', '🙈 Wrong player'), style: 'evil' },
      ],
    });
    ctx.phase(tx('結算', 'Result'));
    if (caught === 'no') {
      ctx.result('evil');
      await ctx.say(tx(`變色龍是${ctx.seat(cham).zh}，答案是${secret[0]}。變色龍勝利！`, `The Chameleon was ${ctx.seat(cham).en} and the word was ${secret[1]}. The Chameleon wins!`));
    } else {
      await ctx.say(tx('變色龍被抓到了！你還有一次機會，猜猜答案是什麼？', 'The Chameleon is caught! One last chance: guess the secret word.'));
      const g = await ctx.buttons({
        title: tx('變色龍猜中了嗎？', 'Did the Chameleon guess right?'),
        buttons: [
          { id: 'yes', label: tx('猜中了，逃脫！', 'Correct, escaped!'), style: 'evil' },
          { id: 'no', label: tx('猜錯了', 'Wrong'), style: 'good' },
        ],
      });
      ctx.board(topicBoard(ctx, topic, lang, secret));
      ctx.result(g === 'yes' ? 'evil' : 'good');
      await ctx.say(g === 'yes'
        ? tx(`答案就是${secret[0]}，變色龍逃脫成功！`, `The word was indeed ${secret[1]}. The Chameleon escapes!`)
        : tx(`答案是${secret[0]}，大家成功抓住變色龍！`, `The word was ${secret[1]}. You caught the Chameleon!`));
    }
  },
};
