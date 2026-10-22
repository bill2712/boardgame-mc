import { tx, shuffle, pick, ucfirst } from '../util.js';
import { TOPICS } from './words.js';
import { topicLabel } from './chameleon.js';

export default {
  id: 'fake-artist',
  emoji: '🎨',
  name: tx('假藝術家', 'A Fake Artist Goes to New York'),
  tagline: tx('大家輪流畫一筆，假藝術家不知道要畫什麼', 'Everyone adds one stroke; the fake has no idea what it is'),
  players: { min: 5, max: 10, default: 6 },
  time: '10',
  rules: {
    zh: [
      '手機秘密派發題目：所有人知道主題和答案，只有假藝術家只知道主題。',
      '大家共用一張紙，每人輪流畫一筆（筆不離紙），共畫兩輪。',
      '畫完後同時指向假藝術家。',
      '如果假藝術家被指中，還可以猜答案：猜中仍然勝利。指錯人則假藝術家勝。',
    ],
    en: [
      'The phone secretly deals the prompt: everyone sees the topic and the word, the fake artist only sees the topic.',
      'On one shared sheet, each player adds one continuous stroke, for two rounds.',
      'Then everyone points at the fake artist at once.',
      'If the fake is caught, they may still guess the word and win. If the wrong player is caught, the fake wins.',
    ],
  },
  roles: [
    { id: 'fake', name: tx('假藝術家', 'Fake artist'), team: 'evil', emoji: '🎭', fixed: true, desc: tx('只知道主題，要畫得像知道答案。', 'Only knows the topic and must draw convincingly.') },
    { id: 'artist', name: tx('藝術家', 'Artist'), team: 'good', emoji: '🖌️', auto: true, desc: tx('知道答案，畫一筆證明自己但不要太明顯。', 'Knows the word; prove it without making it obvious.') },
  ],
  options: [
    { id: 'rounds', type: 'number', label: tx('畫圖輪數', 'Drawing rounds'), min: 1, max: 3, step: 1, default: 2 },
    { id: 'strokeSec', type: 'number', label: tx('每筆時間（0 = 不計時）', 'Time per stroke (0 = off)'), min: 0, max: 30, step: 5, unit: 'sec', default: 10 },
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'both', choices: [
      { value: 'both', label: tx('中英對照', 'Both') }, { value: 'zh', label: tx('中文', 'Chinese') }, { value: 'en', label: tx('English', 'English') },
    ] },
  ],
  defaults() { return { roles: { fake: 1 } }; },
  deck(s) { return ['fake', ...Array(s.n - 1).fill('artist')]; },
  check(s) { return { errors: [], warnings: [], summary: tx(`假藝術家 1 · 藝術家 ${s.n - 1} · ${s.opts.rounds} 輪`, `1 fake · ${s.n - 1} artists · ${s.opts.rounds} rounds`) }; },

  async run(ctx, s) {
    const roles = shuffle(this.deck(s));
    const topic = pick(TOPICS);
    const secret = pick(topic.words);
    const word = topicLabel(secret, s.opts.wordLang);
    const topicName = topicLabel(topic.name, s.opts.wordLang);
    const fake = roles.indexOf('fake') + 1;

    await ctx.say(tx('請準備一張紙和每人一支不同顏色的筆。大家順時針由 1 號開始記住座位號碼，然後輪流查看題目。', 'Get one sheet of paper and a different colour pen for each player. Number yourselves clockwise from 1, then take turns viewing the prompt.'));
    await ctx.ready();
    await ctx.deal(roles.map((r, i) => ({
      seat: i + 1,
      emoji: r === 'fake' ? '🎭' : '🖌️',
      team: r === 'fake' ? 'evil' : 'good',
      title: r === 'fake' ? tx('你是假藝術家！', 'You are the FAKE!') : tx(`題目：${word}`, `Word: ${word}`),
      body: tx(`主題：${topicName}`, `Topic: ${topicName}`),
    })));
    ctx.board(ctx.h('div', { class: 'topic-board' }, ctx.h('div', { class: 'topic-name' }, ctx.L(tx(`主題：${topicName}`, `Topic: ${topicName}`)))));

    const start = ctx.randInt(1, s.n);
    for (let r = 1; r <= s.opts.rounds; r++) {
      ctx.phase(tx(`第 ${r} 輪`, `Round ${r}`));
      await ctx.say(tx(`第 ${r} 輪，由${ctx.seat(start).zh}開始，每人畫一筆。`, `Round ${r}. Starting with ${ctx.seat(start).en}, everyone draws one stroke.`));
      if (s.opts.strokeSec > 0) {
        for (let k = 0; k < s.n; k++) {
          const seat = ((start - 1 + k) % s.n) + 1;
          await ctx.say(tx(`${ctx.seat(seat).zh}。`, `${ucfirst(ctx.seat(seat).en)}.`), { after: 0.1 });
          await ctx.timer(s.opts.strokeSec, { title: tx(`${ctx.seat(seat).zh}畫一筆`, `${ucfirst(ctx.seat(seat).en)} draws`), endLabel: tx('畫好了', 'Done'), silentEnd: true, warnings: [] });
        }
      } else {
        await ctx.ready(tx('這一輪畫完了', 'Round finished'));
      }
    }
    ctx.phase(tx('投票', 'Vote'));
    await ctx.say(tx('畫完了！大家可以討論一下，然後三、二、一，同時指向假藝術家！', 'Finished! Talk it over, then on three, two, one, point at the fake artist!'));
    await ctx.timer(60, { title: tx('討論時間', 'Discussion'), silentEnd: true });
    await ctx.say(tx('三、二、一，指！', 'Three, two, one, point!'), { after: 1 });
    const caught = await ctx.buttons({
      title: tx('指中假藝術家了嗎？', 'Was the fake caught?'),
      buttons: [
        { id: 'yes', label: tx('🎭 指中了', '🎭 Caught'), style: 'good' },
        { id: 'no', label: tx('🙈 指錯了', '🙈 Wrong player'), style: 'evil' },
      ],
    });
    ctx.phase(tx('結算', 'Result'));
    if (caught === 'yes') {
      await ctx.say(tx('假藝術家，請猜猜大家在畫什麼？', 'Fake artist, what were they drawing?'));
      const g = await ctx.buttons({
        title: tx('假藝術家猜中了嗎？', 'Did the fake guess the word?'),
        buttons: [{ id: 'yes', label: tx('猜中了', 'Correct'), style: 'evil' }, { id: 'no', label: tx('猜錯了', 'Wrong'), style: 'good' }],
      });
      await ctx.say(g === 'yes'
        ? tx(`答案是${secret[0]}，假藝術家猜中了，假藝術家勝利！`, `The word was ${secret[1]}. The fake guessed it and wins!`)
        : tx(`答案是${secret[0]}，藝術家們勝利！`, `The word was ${secret[1]}. The artists win!`));
    } else {
      await ctx.say(tx(`假藝術家是${ctx.seat(fake).zh}，答案是${secret[0]}。假藝術家勝利！`, `The fake was ${ctx.seat(fake).en} and the word was ${secret[1]}. The fake wins!`));
    }
  },
};
