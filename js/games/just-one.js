import { tx, shuffle, ucfirst } from '../util.js';
import { wordPool, customWords, withCustom } from './words.js';

/** Official-style rating for a final score out of 13. */
export function justOneRating(score) {
  if (score >= 13) return tx('完美！再挑戰一次看看能否保持？', 'Perfect score! Can you do it again?');
  if (score >= 12) return tx('太厲害了，朋友們都會嘖嘖稱奇！', 'Incredible! Your friends will be amazed.');
  if (score >= 11) return tx('非常出色的團隊合作！', 'Awesome teamwork!');
  if (score >= 9) return tx('好成績，你們很有默契。', 'Great score, you are on the same wavelength.');
  if (score >= 7) return tx('不錯的開始，下次再進步！', 'A good start. Do better next time!');
  if (score >= 4) return tx('還可以，多練習幾局吧。', 'Not bad. Keep practising.');
  return tx('再試一次吧！', 'Try again!');
}

export default {
  id: 'just-one',
  emoji: '☝️',
  name: tx('Just One 一詞提示', 'Just One'),
  tagline: tx('合作猜詞：每人寫一個提示，重複的提示會被刪走', 'Co-op guessing: everyone writes one clue, duplicates get erased'),
  players: { min: 3, max: 12, default: 5 },
  time: '20',
  rules: {
    zh: [
      '大家合作。每回合一位玩家做主猜者，閉上眼睛；其他人看手機上的神秘詞語。',
      '每人在紙上秘密寫一個提示詞，不可以給對方看。',
      '寫好後大家比較：相同或太相似的提示全部刪走，只留下獨特的提示。',
      '主猜者睜眼看剩下的提示，猜一次：猜中得 1 分；放棄就跳過；猜錯會多失去一張卡。共 13 張卡。',
    ],
    en: [
      'Everyone plays together. Each round one player is the guesser and closes their eyes; everyone else sees the mystery word on the phone.',
      'Each player secretly writes one clue word on paper.',
      'Compare clues: identical or too-similar clues are all removed, leaving only unique ones.',
      'The guesser opens their eyes, reads the remaining clues and guesses once: correct scores 1; passing skips the card; a wrong guess loses an extra card. 13 cards in total.',
    ],
  },
  roles: [],
  options: [
    { id: 'cards', type: 'number', label: tx('卡牌數量', 'Number of cards'), min: 5, max: 13, step: 1, default: 13 },
    { id: 'clueSec', type: 'number', label: tx('寫提示時間', 'Time to write clues'), min: 15, max: 120, step: 15, unit: 'sec', default: 45 },
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'ui', choices: [
      { value: 'ui', label: tx('跟介面語言', 'Same as interface') }, { value: 'zh', label: tx('中文', 'Chinese') }, { value: 'en', label: tx('English', 'English') }, { value: 'both', label: tx('中英對照', 'Both') },
    ] },
    { id: 'words', type: 'select', label: tx('詞庫', 'Word list'), default: 'builtin', choices: [
      { value: 'builtin', label: tx('內置詞庫', 'Built-in') }, { value: 'mix', label: tx('內置＋自訂詞語', 'Built-in + custom') }, { value: 'custom', label: tx('只用自訂詞語', 'Custom only') },
    ] },
  ],
  defaults() { return { roles: {} }; },
  deck() { return []; },
  check(s) {
    const warnings = [];
    if (s.opts.words !== 'builtin' && !customWords().length) warnings.push(tx('未有自訂詞語，會用內置詞庫。可以在「設定 › 自訂詞庫」加入。', 'No custom words yet, so the built-in list is used. Add some in Settings › Custom words.'));
    return { errors: [], warnings, summary: tx(`合作遊戲 · ${s.opts.cards} 張卡`, `Co-op · ${s.opts.cards} cards`) };
  },

  async run(ctx, s) {
    const lang = s.opts.wordLang === 'ui' ? (ctx.settings.uiLang === 'en' ? 'en' : 'zh') : s.opts.wordLang;
    const show = (w) => (lang === 'both' && w[0] !== w[1] ? `${w[0]} / ${w[1]}` : lang === 'en' ? w[1] : w[0]);
    const words = shuffle(withCustom(wordPool(), customWords(), s.opts.words));
    let left = s.opts.cards;
    let score = 0;
    let i = 0;
    const paint = () => ctx.board(ctx.h('div', { class: 'scoreboard' },
      ctx.h('div', { class: 'score team-1' }, ctx.h('span', {}, ctx.L(tx('得分', 'Score'))), ctx.h('b', {}, String(score))),
      ctx.h('div', { class: 'score team-3' }, ctx.h('span', {}, ctx.L(tx('剩餘卡牌', 'Cards left'))), ctx.h('b', {}, String(Math.max(0, left))))));

    await ctx.say(tx('準備紙和筆，每人一張。大家合作，盡量猜中最多詞語。', 'Get paper and a pen for everyone. Work together to guess as many words as you can.'));
    paint();
    for (let round = 0; left > 0; round++) {
      const guesser = (round % s.n) + 1;
      const word = words[i++ % words.length];
      ctx.phase(tx(`第 ${round + 1} 回合`, `Round ${round + 1}`));
      await ctx.say(tx(`${ctx.seat(guesser).zh}是主猜者，請閉上眼睛或者轉身。`, `${ucfirst(ctx.seat(guesser).en)} is the guesser. Close your eyes or turn around.`));
      await ctx.ready(tx('主猜者已經轉身', 'The guesser is not looking'));
      ctx.board(ctx.h('div', { class: 'topic-board secret-word' },
        ctx.h('div', { class: 'muted small' }, ctx.L(tx('神秘詞語（主猜者不要看）', 'Mystery word (guesser, don\'t look)'))),
        ctx.h('div', { class: 'secret' }, show(word))));
      await ctx.say(tx('其他人看詞語，然後秘密寫下一個提示。', 'Everyone else, read the word and secretly write one clue.'));
      await ctx.timer(s.opts.clueSec, { title: tx('寫提示', 'Write your clue'), endLabel: tx('全部寫好', 'All written'), warnings: [10], silentEnd: true });
      await ctx.say(tx('請互相比較提示，相同或者太相似的全部刪走。', 'Compare your clues. Remove every clue that is identical or too similar.'));
      await ctx.ready(tx('比較完畢，收起詞語', 'Done, hide the word'));
      paint();
      await ctx.say(tx(`${ctx.seat(guesser).zh}請睜開眼睛，看剩下的提示，然後猜一次。`, `${ucfirst(ctx.seat(guesser).en)}, open your eyes, read the remaining clues and make one guess.`));
      const r = await ctx.buttons({
        title: tx('結果', 'Result'),
        buttons: [
          { id: 'ok', label: tx('✅ 猜中了', '✅ Correct'), style: 'good' },
          { id: 'pass', label: tx('⏭ 放棄（跳過這張）', '⏭ Pass (skip this card)') },
          { id: 'bad', label: tx('❌ 猜錯了（多失去一張）', '❌ Wrong (lose one more card)'), style: 'evil' },
        ],
      });
      if (r === 'ok') { score++; left--; }
      else if (r === 'pass') left--;
      else left -= 2;
      paint();
      await ctx.say(r === 'ok'
        ? tx(`猜中了！答案是${word[0]}。`, `Correct! The word was ${word[1]}.`)
        : tx(`答案是${word[0]}。`, `The word was ${word[1]}.`));
    }
    ctx.phase(tx('結算', 'Result'));
    ctx.result('good');
    const rating = justOneRating(score);
    await ctx.say(tx(`遊戲結束，你們得到 ${score} 分。${rating.zh}`, `Game over. You scored ${score}. ${rating.en}`));
  },
};
