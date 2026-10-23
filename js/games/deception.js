import { tx, ucfirst } from '../util.js';

export default {
  id: 'deception',
  emoji: '🔍',
  name: tx('詭影危機', 'Deception: Murder in Hong Kong'),
  tagline: tx('香港兇案！法醫只能用線索卡暗示，調查員要找出兇手', 'A Hong Kong murder: the Forensic Scientist can only hint'),
  players: { min: 4, max: 12, default: 6 },
  time: '20',
  rules: {
    zh: [
      '法醫（公開身份）知道真相但不能說話，只能用場景卡放子彈標記暗示。',
      '每位調查員面前有 4 張兇器卡和 4 張關鍵證據卡。兇手也是其中一位調查員，他選出真正的兇器和證據。',
      '共三輪：每輪法醫放置或更換場景卡，然後每人輪流發表推理。',
      '每人有一個徽章，可以猜一次「兇手的兇器 + 證據」。猜中即調查員勝；三輪後仍未破案則兇手勝。',
      '6 人或以上可加入幫兇和目擊者：破案後，兇手和幫兇猜中目擊者仍然可以反勝。',
    ],
    en: [
      'The Forensic Scientist (public) knows the truth but cannot speak, only hint with bullet markers on scene tiles.',
      'Each investigator has 4 Means cards and 4 Clue cards. The murderer is one of them and picks the real means and key evidence.',
      'Three rounds: each round the Forensic Scientist places or swaps a scene tile, then everyone presents their theory.',
      'Each player has one badge to guess "means + key evidence". A correct guess wins for the investigators; after three rounds the murderer wins.',
      'With 6+ players add the Accomplice and Witness: after a correct solve, the murderer team still wins if they identify the Witness.',
    ],
  },
  roles: [
    { id: 'fs', name: tx('法醫', 'Forensic Scientist'), team: 'good', emoji: '🧑‍🔬', fixed: true, desc: tx('知道真相，只能用場景卡暗示。', 'Knows the truth, hints only with scene tiles.') },
    { id: 'murderer', name: tx('兇手', 'Murderer'), team: 'evil', emoji: '🔪', fixed: true, desc: tx('選擇兇器和關鍵證據，誤導大家。', 'Chooses the means and key evidence, then misleads.') },
    { id: 'accomplice', name: tx('幫兇', 'Accomplice'), team: 'evil', emoji: '🦹', max: 1, desc: tx('知道兇手是誰，幫兇手脫罪（6 人以上）。', 'Knows the murderer and helps them escape (6+).') },
    { id: 'witness', name: tx('目擊者', 'Witness'), team: 'good', emoji: '👀', max: 1, desc: tx('知道兇手和幫兇，但要小心不被發現（需要幫兇）。', 'Knows the murderer and accomplice but must stay hidden (needs the Accomplice).') },
    { id: 'investigator', name: tx('調查員', 'Investigator'), team: 'good', emoji: '🕵️', auto: true, desc: tx('根據法醫的線索破案。', 'Solves the case from the hints.') },
  ],
  options: [
    { id: 'presentSec', type: 'number', label: tx('每人推理時間', 'Presentation time per player'), min: 15, max: 120, step: 15, unit: 'sec', default: 30 },
    { id: 'nightSec', type: 'number', label: tx('兇手選卡時間', 'Time for the murderer to choose'), min: 5, max: 20, step: 1, unit: 'sec', default: 10 },
  ],
  defaults(n) { return { roles: { fs: 1, murderer: 1, accomplice: n >= 6 ? 1 : 0, witness: n >= 6 ? 1 : 0 } }; },
  deck(s) {
    const extra = ['accomplice', 'witness'].filter((r) => s.roles[r]);
    return ['fs', 'murderer', ...extra, ...Array(Math.max(0, s.n - 2 - extra.length)).fill('investigator')];
  },
  check(s) {
    const errors = [];
    if ((s.roles.accomplice || s.roles.witness) && s.n < 6) errors.push(tx('幫兇和目擊者需要 6 人或以上。', 'The Accomplice and Witness need 6+ players.'));
    if (s.roles.witness && !s.roles.accomplice) errors.push(tx('目擊者需要配合幫兇使用。', 'The Witness needs the Accomplice.'));
    return { errors, warnings: [], summary: tx(`法醫 1 · 兇手 1 · 調查員 ${s.n - 2}${s.roles.accomplice ? '（含幫兇／目擊者）' : ''}`, `1 Forensic Scientist · 1 Murderer · ${s.n - 2} investigators${s.roles.accomplice ? ' (incl. Accomplice/Witness)' : ''}`) };
  },

  async run(ctx, s) {
    const acc = !!s.roles.accomplice;
    const wit = !!s.roles.witness;
    const evil = acc ? tx('兇手和幫兇', 'Murderer and Accomplice') : tx('兇手', 'Murderer');

    await ctx.say(tx('請派發身份卡。每位調查員面前放 4 張兇器卡和 4 張關鍵證據卡，法醫拿取場景卡。準備好就按繼續。',
      'Deal the role cards. Give each investigator 4 Means and 4 Clue cards face up, and the Forensic Scientist the scene tiles. Tap continue when ready.'));
    await ctx.ready();
    const fs = await ctx.choose({ title: tx('法醫是幾號？（法醫公開身份）', 'Which seat is the Forensic Scientist? (public role)'), items: ctx.range(1, s.n).map((i) => ({ id: i, label: String(i) })) });

    ctx.phase(tx('夜晚', 'Night'), { night: true });
    await ctx.say(tx('除了法醫，所有人請閉上眼睛。', 'Everyone except the Forensic Scientist, close your eyes.'));
    await ctx.act(2);
    await ctx.say(tx(`${evil.zh}請睜開眼睛。`, `${evil.en}, open your eyes.`));
    await ctx.say(tx('兇手請用手指指出你選擇的一張兇器卡和一張關鍵證據卡。法醫請記住。', 'Murderer, point at one Means card and one Clue card in front of you. Forensic Scientist, remember them.'));
    await ctx.act(s.opts.nightSec);
    await ctx.say(tx(`${evil.zh}請閉上眼睛。`, `${evil.en}, close your eyes.`));
    if (wit) {
      await ctx.say(tx('兇手和幫兇請豎起大拇指。目擊者請睜開眼睛，記住他們。', 'Murderer and Accomplice, raise your thumbs. Witness, open your eyes and see them.'));
      await ctx.act(5);
      await ctx.say(tx('目擊者請閉上眼睛。兇手和幫兇請收起大拇指。', 'Witness, close your eyes. Murderer and Accomplice, thumbs down.'));
    }
    await ctx.act(1.5);
    ctx.phase(tx('調查', 'Investigation'));
    await ctx.say(tx('所有人請睜開眼睛。調查開始！', 'Everyone, open your eyes. The investigation begins!'));

    let solved = false;
    for (let round = 1; round <= 3 && !solved; round++) {
      ctx.phase(tx(`第 ${round} 輪調查`, `Round ${round}`));
      await ctx.say(round === 1
        ? tx('法醫請放置死因卡和案發地點卡，再放置四張線索卡，並在每張卡上放子彈標記。', 'Forensic Scientist, place the Cause of Death and Location tiles plus four scene tiles, and put a bullet marker on each.')
        : tx('法醫請更換一張場景卡，並放上新的子彈標記。', 'Forensic Scientist, replace one scene tile and place a new bullet marker.'));
      await ctx.ready(ctx.t('done'));
      const order = ctx.range(1, s.n).filter((x) => x !== fs);
      const start = order[ctx.randInt(0, order.length - 1)];
      const seq = [...order.filter((x) => x >= start), ...order.filter((x) => x < start)];
      await ctx.say(tx(`每人輪流發表推理，由${ctx.seat(start).zh}開始。`, `Each investigator presents their theory, starting with ${ctx.seat(start).en}.`));
      for (const seat of seq) {
        await ctx.say(tx(`${ctx.seat(seat).zh}。`, `${ucfirst(ctx.seat(seat).en)}.`), { after: 0.1 });
        await ctx.timer(s.opts.presentSec, { title: tx(`${ctx.seat(seat).zh}推理`, `${ucfirst(ctx.seat(seat).en)} presents`), endLabel: tx('說完', 'Done'), silentEnd: true, warnings: [10] });
      }
      for (;;) {
        const r = await ctx.buttons({
          title: tx('有人用徽章破案嗎？', 'Did anyone use their badge?'),
          text: tx('說出一張兇器卡和一張證據卡，法醫點頭或搖頭。', 'Name one Means card and one Clue card; the Forensic Scientist nods or shakes.'),
          buttons: [
            { id: 'ok', label: tx('✅ 破案成功', '✅ Solved'), style: 'good' },
            { id: 'fail', label: tx('❌ 猜錯（失去徽章）', '❌ Wrong (badge lost)'), style: 'evil' },
            { id: 'next', label: round < 3 ? tx('➡️ 進入下一輪', '➡️ Next round') : tx('➡️ 結束調查', '➡️ End investigation') },
          ],
        });
        if (r === 'ok') { solved = true; break; }
        if (r === 'fail') { await ctx.say(tx('猜錯了！這位玩家失去徽章，但仍然可以繼續發言。', 'Wrong! That player loses their badge but can still talk.')); continue; }
        break;
      }
    }

    ctx.phase(tx('結算', 'Result'));
    if (!solved) {
      ctx.result('evil');
      await ctx.say(tx('三輪調查結束，仍未破案，兇手勝利！', 'Three rounds are over and the case is unsolved. The murderer wins!'));
      return;
    }
    if (wit) {
      await ctx.say(tx('破案了！不過兇手和幫兇還有一次機會：一起指出誰是目擊者。', 'Case solved! But the murderer and accomplice get one last chance: name the Witness.'));
      const r = await ctx.buttons({
        title: tx('兇手找到目擊者了嗎？', 'Did they find the Witness?'),
        buttons: [{ id: 'hit', label: tx('👀 找到了', '👀 Found'), style: 'evil' }, { id: 'miss', label: tx('🛡️ 找錯了', '🛡️ Missed'), style: 'good' }],
      });
      ctx.result(r === 'hit' ? 'evil' : 'good');
      await ctx.say(r === 'hit' ? tx('目擊者被滅口，兇手反敗為勝！', 'The Witness is silenced. The murderer wins!') : tx('目擊者安全，調查員勝利！', 'The Witness is safe. The investigators win!'));
    } else {
      ctx.result('good');
      await ctx.say(tx('真相大白，調查員勝利！', 'The truth is out. The investigators win!'));
    }
  },
};
