import { tx, shuffle, pick, spokenDuration } from '../util.js';
import { INSIDER_WORDS } from './words.js';

export default {
  id: 'insider',
  emoji: '🤫',
  name: tx('內鬼 Insider', 'Insider'),
  tagline: tx('五分鐘問是非題猜詞，再揪出暗中帶路的內鬼', 'Guess the word with yes/no questions, then catch the Insider'),
  players: { min: 4, max: 8, default: 6 },
  time: '15',
  rules: {
    zh: [
      '大師（公開）同內鬼（秘密）知道答案詞語，其他人是平民。',
      '大家向大師問是非題，大師只可以答「是」、「不是」或「不知道」，限時內猜中詞語。',
      '猜中後，用剛才花了的時間討論，找出內鬼。時間到大家同時投票。',
      '投中內鬼：大師同平民勝；投錯：內鬼勝。限時內猜唔中：全部人輸。',
    ],
    en: [
      'The Master (public) and the Insider (secret) know the word. Everyone else is a Common.',
      'Ask the Master yes/no questions. The Master may only answer "Yes", "No" or "I don\'t know". Guess the word before time runs out.',
      'Once guessed, discuss for as long as the guessing took to find the Insider, then vote together.',
      'Catch the Insider and the Master and Commons win; miss and the Insider wins. No correct guess in time means everyone loses.',
    ],
  },
  roles: [
    { id: 'master', name: tx('大師', 'Master'), team: 'good', fixed: true, desc: tx('知道詞語，公開身份，只可以答是非。', 'Knows the word, is public, answers yes/no only.') },
    { id: 'insider', name: tx('內鬼', 'Insider'), team: 'evil', fixed: true, desc: tx('知道詞語，暗中引導大家猜中，但唔好被發現。', 'Knows the word and secretly steers the group without being caught.') },
    { id: 'common', name: tx('平民', 'Common'), team: 'good', auto: true, desc: tx('問問題猜詞，然後揪出內鬼。', 'Asks questions, then finds the Insider.') },
  ],
  options: [
    { id: 'guess', type: 'number', label: tx('猜詞時間', 'Guessing time'), min: 2, max: 10, step: 1, unit: 'min', default: 5 },
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'both', choices: [
      { value: 'both', label: tx('中英對照', 'Both') },
      { value: 'zh', label: tx('中文', 'Chinese') },
      { value: 'en', label: tx('English', 'English') },
    ] },
  ],
  defaults() { return { roles: { master: 1, insider: 1 } }; },
  deck(s) { return ['master', 'insider', ...Array(s.n - 2).fill('common')]; },
  check(s) {
    return { errors: [], warnings: [], summary: tx(`大師 1 · 內鬼 1 · 平民 ${s.n - 2}`, `1 Master · 1 Insider · ${s.n - 2} Commons`) };
  },

  async run(ctx, s) {
    const roles = shuffle(this.deck(s));
    const w = pick(INSIDER_WORDS);
    const word = s.opts.wordLang === 'both' ? `${w[0]} / ${w[1]}` : s.opts.wordLang === 'en' ? w[1] : w[0];
    const masterSeat = roles.indexOf('master') + 1;
    const insiderSeat = roles.indexOf('insider') + 1;

    await ctx.say(tx('請大家順時針由 1 號開始記住座位號碼，然後輪流查看身份。', 'Number yourselves clockwise from 1, then take turns viewing your role.'));
    await ctx.ready();
    await ctx.deal(roles.map((id, i) => ({
      seat: i + 1,
      emoji: id === 'master' ? '🎩' : id === 'insider' ? '🤫' : '🙂',
      team: id === 'insider' ? 'evil' : 'good',
      title: id === 'master' ? tx('大師', 'Master') : id === 'insider' ? tx('內鬼', 'Insider') : tx('平民', 'Common'),
      body: id === 'common'
        ? tx('你唔知道詞語。問大師是非題去猜，之後揪出內鬼。', "You don't know the word. Ask the Master yes/no questions, then find the Insider.")
        : [tx(`秘密詞語：${word}`, `Secret word: ${word}`), id === 'master'
          ? tx('開始時公開你是大師。只可以答「是」、「不是」、「不知道」。', 'Reveal yourself as the Master. Answer only "Yes", "No" or "I don\'t know".')
          : tx('暗中引導大家猜中，但唔好太明顯！', "Steer everyone toward the word, but don't be obvious!")],
    })));

    ctx.phase(tx('猜詞', 'Guessing'));
    await ctx.say(tx(`${masterSeat}號是大師。大家輪流向大師提出是非題，大師只可以回答是、不是或者不知道。猜中就按「猜中了」。準備，開始！`,
      `Player ${masterSeat} is the Master. Ask the Master yes or no questions. The Master may only answer yes, no, or I don't know. Tap "Guessed it" when someone gets it. Ready, go!`));
    const r = await ctx.timer(s.opts.guess * 60, {
      title: tx('猜詞時間', 'Guessing time'),
      buttons: [{ id: 'got', label: tx('🎉 猜中了！', '🎉 Guessed it!') }],
      hideEnd: true,
      silentEnd: true,
    });
    if (r.reason !== 'got') {
      await ctx.say(tx(`時間到！冇人猜中，所有人都輸了。答案是${word}，內鬼是${insiderSeat}號。`, `Time's up! Nobody guessed it, so everyone loses. The word was ${word}, and the Insider was player ${insiderSeat}.`));
      return;
    }
    const talk = Math.max(15, Math.round(r.elapsed));
    const d = spokenDuration(talk);
    ctx.phase(tx('揪出內鬼', 'Find the Insider'));
    await ctx.say(tx(`猜中了！答案是${word}。你們有${d.zh}時間討論，邊個是內鬼？`, `Correct! The word was ${word}. You have ${d.en} to discuss who the Insider is.`));
    await ctx.timer(talk, { title: tx('討論時間', 'Discussion') });
    await ctx.say(tx('三、二、一，所有人同時指向你認為是內鬼的玩家！', 'Three, two, one: everyone point at the Insider!'), { after: 1 });
    await ctx.buttons({ buttons: [{ id: 'r', label: tx('公開內鬼', 'Reveal the Insider'), style: 'primary' }] });
    ctx.phase(tx('結算', 'Result'));
    await ctx.say(tx(`內鬼是${insiderSeat}號！投中的話大師同平民勝利，否則內鬼勝利。`, `The Insider is player ${insiderSeat}! If you voted them out, the Master and Commons win. Otherwise the Insider wins.`));
  },
};
