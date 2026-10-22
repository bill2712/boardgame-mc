import { tx, shuffle, fmtTime } from '../util.js';
import { wordPool } from './words.js';

const TEAM = {
  red: { name: tx('紅隊', 'Red team'), dot: '🔴' },
  blue: { name: tx('藍隊', 'Blue team'), dot: '🔵' },
};
const other = (t) => (t === 'red' ? 'blue' : 'red');

/** 25 colours: starting team 9, other 8, 7 neutral, 1 assassin. */
export function makeKey(start) {
  return shuffle([
    ...Array(9).fill(start), ...Array(8).fill(other(start)), ...Array(7).fill('neutral'), 'assassin',
  ]);
}

export default {
  id: 'codenames',
  emoji: '🟥',
  name: tx('機密代號', 'Codenames'),
  tagline: tx('兩隊隊長用一個詞提示，帶隊友找出自己的特工', 'Two spymasters, one-word clues, find your agents'),
  players: { min: 4, max: 20, default: 6 },
  time: '15',
  category: 'word',
  rules: {
    zh: [
      '分成紅藍兩隊，每隊選一位隊長。桌上有 25 個詞，只有隊長看得到鑰匙卡，知道哪些詞屬於自己的特工。',
      '輪到你隊時，隊長只可以說「一個詞 + 一個數字」作提示，例如「水果，2」。',
      '隊友討論後點選詞語：自己顏色就繼續猜（最多數字 + 1 次），中立或對方顏色就換隊。',
      '先找齊自己全部特工的一隊勝利；點中刺客的一隊即時落敗。',
      '本 App 可以全電子進行（詞語板 + 按住看鑰匙卡），或者只用作鑰匙卡和計時器配合實體卡。',
    ],
    en: [
      'Split into Red and Blue, each with a spymaster. There are 25 words; only the spymasters see the key card showing which words are their agents.',
      'On your turn the spymaster gives one word and one number, such as "Fruit, 2".',
      'Teammates then tap words: their own colour lets them keep guessing (up to the number + 1); neutral or the other colour ends the turn.',
      'The first team to find all its agents wins. Touching the assassin loses instantly.',
      'Play fully on the phone (word board plus hold-to-view key card), or use it only as a key card and timer with the physical cards.',
    ],
  },
  roles: [],
  options: [
    { id: 'mode', type: 'select', label: tx('玩法', 'Mode'), default: 'digital', choices: [
      { value: 'digital', label: tx('全電子詞語板', 'Digital word board') },
      { value: 'key', label: tx('只用鑰匙卡（配合實體詞卡）', 'Key card only (physical word cards)') },
    ] },
    { id: 'wordLang', type: 'select', label: tx('詞語語言', 'Word language'), default: 'ui', choices: [
      { value: 'ui', label: tx('跟介面語言', 'Same as interface') }, { value: 'zh', label: tx('中文', 'Chinese') }, { value: 'en', label: tx('English', 'English') },
    ], showIf: (s) => s.opts.mode === 'digital' },
    { id: 'turnSec', type: 'number', label: tx('每回合時間（0 = 不計時）', 'Turn timer (0 = off)'), min: 0, max: 300, step: 30, unit: 'sec', default: 0 },
  ],
  defaults() { return { roles: {} }; },
  deck() { return []; },
  check(s) {
    return { errors: [], warnings: [], summary: tx(`${s.n} 人分成紅藍兩隊，每隊一位隊長`, `${s.n} players in two teams, one spymaster each`) };
  },

  async run(ctx, s) {
    const start = Math.random() < 0.5 ? 'red' : 'blue';
    const key = makeKey(start);
    const lang = s.opts.wordLang === 'ui' ? (ctx.settings.uiLang === 'en' ? 'en' : 'zh') : s.opts.wordLang;
    const words = shuffle(wordPool()).slice(0, 25).map((w) => (lang === 'en' ? w[1] : w[0]));
    const digital = s.opts.mode === 'digital';

    await ctx.say(tx('請分成紅藍兩隊，每隊選出一位隊長。兩位隊長坐在同一邊。', 'Split into a red team and a blue team, and choose a spymaster for each. Spymasters sit on the same side.'));
    await ctx.ready();
    await ctx.say(tx(`${TEAM[start].name.zh}先開始，${TEAM[start].name.zh}要找九個特工，另一隊找八個。`, `The ${TEAM[start].name.en.toLowerCase()} goes first and has nine agents to find; the other team has eight.`));
    ctx.phase(tx(`${TEAM[start].name.zh}回合`, `${TEAM[start].name.en}'s turn`));

    const result = await ctx.widget((done, runner) => {
      const { h, L } = ctx;
      const revealed = new Set();
      let turn = start;
      let selected = -1;
      let peek = !digital; // key-only mode always shows colours
      let left = s.opts.turnSec;
      let over = false;

      const remaining = (team) => key.filter((c, i) => c === team && !revealed.has(i)).length;
      const say = (text) => ctx.say(text, { after: 0.2 }).catch(() => {});
      const head = h('div', { class: 'cn-head' });
      const grid = h('div', { class: 'cn-grid' });
      const timerEl = h('span', { class: 'cn-timer' });

      const endTurn = (why) => {
        if (over) return;
        turn = other(turn);
        selected = -1;
        left = s.opts.turnSec;
        ctx.phase(tx(`${TEAM[turn].name.zh}回合`, `${TEAM[turn].name.en}'s turn`));
        say(why === 'time'
          ? tx(`時間到！輪到${TEAM[turn].name.zh}，隊長請給提示。`, `Time's up! ${TEAM[turn].name.en}, spymaster, give your clue.`)
          : tx(`輪到${TEAM[turn].name.zh}，隊長請給提示。`, `${TEAM[turn].name.en}, spymaster, give your clue.`));
        paint();
      };
      const finish = (winner, why) => {
        over = true;
        clearInterval(tick);
        peek = true;
        paint();
        setTimeout(() => done({ winner, why }), 1800);
      };
      const reveal = (i) => {
        revealed.add(i);
        const c = key[i];
        ctx.vibrate(30);
        if (c === 'assassin') return finish(other(turn), 'assassin');
        if (remaining('red') === 0) return finish('red', 'agents');
        if (remaining('blue') === 0) return finish('blue', 'agents');
        if (c !== turn) return endTurn('miss');
        paint();
      };

      const paint = () => {
        head.replaceChildren(...[
          h('div', { class: `cn-turn ${turn}` }, `${TEAM[turn].dot} ${L(TEAM[turn].name)}`),
          h('div', { class: 'cn-score' }, `🔴 ${remaining('red')}  ·  🔵 ${remaining('blue')}`),
          s.opts.turnSec ? timerEl : null,
        ].filter(Boolean));
        timerEl.textContent = `⏱ ${fmtTime(left)}`;
        grid.replaceChildren(...key.map((c, i) => {
          const isRev = revealed.has(i);
          const cls = ['cn-card'];
          if (isRev || peek) cls.push(`c-${c}`);
          if (isRev) cls.push('revealed');
          if (peek && !isRev && digital) cls.push('peek');
          if (i === selected) cls.push('sel');
          return h('button', {
            class: cls.join(' '),
            disabled: over || (isRev && digital),
            onclick: () => {
              if (over) return;
              if (!digital) { revealed.has(i) ? revealed.delete(i) : revealed.add(i); paint(); return; }
              if (selected !== i) { selected = i; paint(); return; }
              selected = -1;
              reveal(i);
            },
          }, digital ? words[i] : (isRev ? '✓' : ''));
        }));
      };

      const tick = setInterval(() => {
        if (over || !s.opts.turnSec || runner.paused) return;
        left -= 1;
        if (left === 10) ctx.sfx('warn');
        if (left <= 0) { ctx.sfx('end'); endTurn('time'); return; }
        timerEl.textContent = `⏱ ${fmtTime(left)}`;
      }, 1000);
      runner.abortPromise.catch(() => clearInterval(tick));

      const holdKey = h('button', {
        class: 'btn cn-hold',
        oncontextmenu: (e) => e.preventDefault(),
        onpointerdown: () => { peek = true; paint(); },
        onpointerup: () => { peek = false; paint(); },
        onpointercancel: () => { peek = false; paint(); },
        onpointerleave: () => { if (peek && digital) { peek = false; paint(); } },
      }, ctx.L(tx('🔑 隊長按住看鑰匙卡', '🔑 Spymasters: hold to view key')));

      paint();
      return h('div', { class: 'panel cn' },
        head,
        digital ? h('div', { class: 'muted small' }, L(tx('點一下選擇，再點一下確認翻開。', 'Tap once to select, tap again to reveal.'))) : h('div', { class: 'muted small' }, L(tx('這是鑰匙卡，只給隊長看。點格子可以標記已翻開。', 'This is the key card for spymasters only. Tap a square to mark it revealed.'))),
        grid,
        h('div', { class: 'btn-row' },
          digital ? holdKey : null,
          h('button', { class: 'btn', onclick: () => endTurn('pass') }, L(tx('⏭ 結束回合', '⏭ End turn'))),
          digital ? null : h('button', { class: 'btn cn-red', onclick: () => finish('red', 'manual') }, L(tx('🔴 紅隊勝', '🔴 Red wins'))),
          digital ? null : h('button', { class: 'btn cn-blue', onclick: () => finish('blue', 'manual') }, L(tx('🔵 藍隊勝', '🔵 Blue wins'))),
        ),
      );
    });

    ctx.phase(tx('結算', 'Result'));
    if (result.why === 'assassin') {
      await ctx.say(tx(`點中刺客！${TEAM[result.winner].name.zh}勝利！`, `The assassin was found! The ${TEAM[result.winner].name.en.toLowerCase()} wins!`));
    } else {
      await ctx.say(tx(`${TEAM[result.winner].name.zh}找齊所有特工，勝利！`, `The ${TEAM[result.winner].name.en.toLowerCase()} found all its agents and wins!`));
    }
  },
};
