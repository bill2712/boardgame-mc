// Long-form guide articles. Built into static pages by scripts/build.mjs and linked from the home page.
// Chinese is standard written Chinese (Traditional); Simplified is converted automatically.

const tx = (zh, en) => ({ zh, en });

/**
 * Each section: { h: heading, p?: paragraphs, list?: bullet points }.
 * `games` lists game ids to link at the end of the article.
 */
export const GUIDES = [
  {
    id: 'how-to-host',
    emoji: '🎙️',
    title: tx('新手主持指南：用手機輕鬆帶一場桌遊夜', 'How to host a great game night with a phone moderator'),
    short: tx('新手主持指南', 'Hosting guide'),
    desc: tx(
      '第一次帶朋友玩狼人殺、阿瓦隆或芝士大盜？這份指南教你開局前準備、遊戲中如何用語音主持、派牌和計時，以及遊戲結束後的小技巧。',
      'First time running Werewolf, Avalon or Cheese Thief for friends? How to prepare, how to use voice narration, digital role cards and timers, and what to do after the game.'),
    sections: [
      {
        h: tx('開局前：五分鐘準備', 'Before you start: five minutes of prep'),
        list: [
          tx('按人數選遊戲：首頁可以篩選人數，每款遊戲都有建議人數。新手第一局建議選規則簡單、時間短的遊戲，例如芝士大盜或一夜終極狼人。', 'Pick a game for your group size. The home page filters by player count, and every game lists its best count. For a first game, choose something short and simple such as Cheese Thief or One Night Ultimate Werewolf.'),
          tx('圍成一圈，由手機旁邊的玩家開始順時針編號。遊戲中所有「幾號玩家」都是指這個座位號碼。', 'Sit in a circle and number yourselves clockwise, starting next to the phone. Every "player 3" in the narration means this seat number.'),
          tx('在設定頁輸入玩家名字，語音就會直接叫名，新手更容易跟上。', 'Type player names on the setup page so the narration calls people by name. Beginners follow much more easily.'),
          tx('先按「⚙ 設定 › 測試語音」確認聽到聲音。iPhone 請關掉側邊的靜音開關，音量調大。', 'Tap ⚙ Settings › Test voice to make sure you can hear it. On iPhone, switch off the silent switch and turn the volume up.'),
          tx('把手機放在桌子中間，或者接上藍牙喇叭，讓每個人都聽得清楚。', 'Put the phone in the middle of the table, or connect a Bluetooth speaker, so everyone can hear.'),
        ],
      },
      {
        h: tx('派身份：沒有卡牌也可以玩', 'Dealing roles without cards'),
        p: [
          tx('選擇「電子派牌」後，手機會逐一傳給每位玩家。輪到你時按「查看身份」，記住後按「隱藏」，再傳給下一位。其他人請轉身或者閉上眼睛。', 'With digital dealing on, the phone is passed around. When it is your turn, tap to view your role, memorise it, tap Hide and pass it on. Everyone else turns away or closes their eyes.'),
          tx('有人忘記自己的身份？遊戲中按右上角的 🪪，選擇自己的座位，按住按鈕就可以再看一次，放手就會收起。旁白會自動暫停。', 'Someone forgot their role? Tap 🪪 at the top right during the game, pick the seat and hold the button to see the card again; it hides when you let go. The narration pauses automatically.'),
        ],
      },
      {
        h: tx('遊戲中：讓手機做主持', 'During the game: let the phone moderate'),
        list: [
          tx('夜晚流程全自動：語音會叫各角色睜眼、行動、閉眼，並留出足夠的操作時間。覺得太快或太慢，可以在設定調整「夜晚節奏」。', 'Night phases are automatic: the voice calls each role to wake, act and sleep, with enough time to act. If it feels too fast or slow, change the night pace in Settings.'),
          tx('下方有三個按鈕：↺ 重複上一句、⏸ 暫停、⏭ 跳過等待。有人去洗手間時按暫停就可以。', 'Three buttons at the bottom: ↺ repeat the last line, ⏸ pause, ⏭ skip a wait. Pause when someone steps away.'),
          tx('有人問規則？按右上角的 📖，即時查看玩法和每個角色的攻略，不用離開遊戲。', 'Rules question? Tap 📖 at the top right to read the rules and role tips without leaving the game.'),
          tx('討論計時剩一分鐘和十秒時會提醒，時間到會響鐘，避免一局拖得太長。', 'The discussion timer warns at one minute and ten seconds left and chimes at zero, so rounds do not drag on.'),
        ],
      },
      {
        h: tx('遊戲結束後：記錄戰績、再來一局', 'After the game: stats and another round'),
        list: [
          tx('遊戲結束時會自動記錄勝方；如果手機不知道誰贏，會請你按一下。每款遊戲的設定頁會顯示戰績。', 'The winner is recorded automatically at the end; if the phone cannot tell, it asks you to tap who won. Each game\'s stats appear on its setup page.'),
          tx('按「再玩一局」會重新洗牌，人數和設定不變。', 'Play again reshuffles the roles and keeps the same players and settings.'),
          tx('遊戲結束後請大家公開身份、分享心路歷程，這往往是最好玩的部分。', 'Afterwards, reveal everyone\'s roles and talk through what happened. This is often the best part.'),
        ],
      },
      {
        h: tx('帶新手的小貼士', 'Tips for playing with beginners'),
        list: [
          tx('第一局用最少的特殊角色，熟悉後才慢慢加入。', 'Use as few special roles as possible in the first game, then add more once people are comfortable.'),
          tx('開局前用一分鐘解釋勝利條件就夠，細節可以邊玩邊學。', 'Explain only the win conditions before you start; details can be learned while playing.'),
          tx('提醒大家：說謊是遊戲的一部分，遊戲結束後不要記仇！', 'Remind everyone that lying is part of the game. No hard feelings afterwards!'),
        ],
      },
    ],
    games: ['cheese-thief', 'one-night', 'werewolf', 'avalon'],
  },
  {
    id: 'by-players',
    emoji: '👥',
    title: tx('按人數選桌遊：3 至 20 人玩什麼最好？', 'Best board games by player count: what to play with 3 to 20 people'),
    short: tx('按人數選遊戲', 'Games by player count'),
    desc: tx(
      '三個人、六個人還是十幾人？按人數推薦最適合的推理、猜詞和派對桌遊，並列出每款遊戲的建議人數和遊戲時間，幫你快速決定今晚玩什麼。',
      'Three, six or a dozen people? Our picks of the best deduction, word and party games for each group size, with recommended counts and play times.'),
    // The tables in this article are generated from the game data.
    intro: tx(
      '同一款遊戲，人數不同，體驗可以差很遠。以下按人數分組，列出在桌遊主持人裡最適合的遊戲。「最佳」代表最多人推薦的人數。',
      'The same game can feel completely different with a different number of players. Here are the best games in Board Game MC for each group size. "Best" is the count most players recommend.'),
    buckets: [
      { min: 3, max: 4, note: tx('人少適合節奏快、每個人都要動腦的遊戲。合作猜詞和一夜類遊戲效果最好。', 'Small groups suit quick games where everyone is busy. Co-op word games and one-night games shine.') },
      { min: 5, max: 6, note: tx('最多遊戲適用的人數。可以開始玩有隱藏身份的推理遊戲。', 'The sweet spot for most games. Hidden-role deduction games start to work well.') },
      { min: 7, max: 8, note: tx('陣營推理遊戲的黃金人數，好人和壞人的比例最平衡。', 'The golden range for team deduction games, with the best balance of good and evil.') },
      { min: 9, max: 12, note: tx('大型聚會可以玩狼人殺、殺手遊戲，或者分隊對戰的派對遊戲。', 'Big parties can play Werewolf or Mafia, or split into teams for party games.') },
      { min: 13, max: 20, note: tx('人數很多時，分隊遊戲最容易讓所有人一起參與。', 'With a crowd, team games keep everyone involved.') },
    ],
    sections: [
      {
        h: tx('怎樣選擇？', 'How to choose'),
        list: [
          tx('新手多：選規則簡單的猜詞或派對遊戲，例如誰是臥底、Just One、比手畫腳。', 'Lots of beginners: pick simple word or party games such as Undercover, Just One or Charades.'),
          tx('喜歡鬥智：選陣營推理，例如阿瓦隆、抵抗組織、秘密希特勒。', 'Love mind games: pick team deduction such as Avalon, The Resistance or Secret Hitler.'),
          tx('時間不多：一夜終極狼人、芝士大盜、變色龍都可以在十五分鐘內完成。', 'Short on time: One Night Ultimate Werewolf, Cheese Thief and Chameleon finish in about fifteen minutes.'),
          tx('不想有人出局：選合作或分隊遊戲，例如心靈同步、沙律碗。', 'Nobody wants to sit out: pick co-op or team games such as Wavelength or Fishbowl.'),
        ],
      },
    ],
    games: [],
  },
  {
    id: 'deduction-tips',
    emoji: '🧠',
    title: tx('推理遊戲必勝心法：狼人殺、阿瓦隆通用技巧', 'How to win social deduction games: tips for Werewolf, Avalon and more'),
    short: tx('推理遊戲必勝心法', 'Deduction tips'),
    desc: tx(
      '不論是狼人殺、阿瓦隆、殺手遊戲還是芝士大盜，都離不開觀察、發言和投票。這篇整理好人和壞人陣營都適用的實用技巧。',
      'Werewolf, Avalon, Mafia or Cheese Thief: they all come down to watching, talking and voting. Practical tips for both the good and the evil side.'),
    sections: [
      {
        h: tx('好人陣營：用邏輯找出真相', 'Good side: find the truth with logic'),
        list: [
          tx('記錄每個人的發言和投票。前後矛盾、投票立場突然改變，都是重要線索。', 'Track what everyone says and how they vote. Contradictions and sudden vote changes are key clues.'),
          tx('留意「太安靜」和「太積極」的人：壞人往往會避免表態，或者急於帶領大家。', 'Watch the very quiet and the very eager: evil players often avoid taking a side, or rush to lead.'),
          tx('不要只看一個人，要看一組人的關係。誰總是互相維護？誰從來不懷疑對方？', 'Look at relationships, not just individuals. Who keeps defending each other? Who never suspects each other?'),
          tx('有資訊的角色（預言家、梅林、警察）要選好時機公開，太早會被針對，太遲會浪費資訊。', 'Information roles (Seer, Merlin, Detective) must time their reveal: too early and they are targeted, too late and the information is wasted.'),
        ],
      },
      {
        h: tx('壞人陣營：融入好人', 'Evil side: blend in'),
        list: [
          tx('像好人一樣思考：好人此刻會懷疑誰？會怎樣投票？照著做。', 'Think like a good player: who would they suspect right now, and how would they vote? Do the same.'),
          tx('不要和隊友太親近，必要時可以「賣隊友」換取信任。', 'Do not stay too close to your teammates. If needed, throw one under the bus to earn trust.'),
          tx('說謊要簡單、前後一致。故事越複雜，越容易露出破綻。', 'Keep your lies simple and consistent. The more complex the story, the easier it breaks.'),
          tx('在阿瓦隆、抵抗組織這類任務遊戲，不一定每次都要破壞，偶爾讓任務成功可以保護身份。', 'In mission games like Avalon or The Resistance, you do not have to fail every mission. Letting one pass can protect your cover.'),
        ],
      },
      {
        h: tx('發言技巧', 'How to speak'),
        list: [
          tx('先說結論，再說原因。「我懷疑 3 號，因為……」比長篇分析更有說服力。', 'Start with your conclusion, then the reason. "I suspect player 3 because…" beats a long analysis.'),
          tx('給出可以驗證的資訊，例如「如果我是壞人，昨晚就不會這樣投票」。', 'Offer things others can check, like "If I were evil, I would not have voted that way last night."'),
          tx('被懷疑時保持冷靜，指出對方推理的漏洞，而不是情緒化地否認。', 'When suspected, stay calm and point out the gaps in the reasoning instead of simply denying it.'),
        ],
      },
      {
        h: tx('投票技巧', 'How to vote'),
        list: [
          tx('投票前先想清楚：如果我錯了，損失有多大？', 'Before voting, ask yourself: how bad is it if I am wrong?'),
          tx('同時指人或同時投票可以避免跟風，桌遊主持人會倒數「三、二、一」。', 'Pointing or voting at the same time avoids bandwagons. Board Game MC counts down "three, two, one".'),
          tx('投票結果本身就是線索：誰救了誰？誰投了和自己發言相反的票？', 'The vote itself is a clue: who saved whom, and who voted against what they said?'),
        ],
      },
      {
        h: tx('常見錯誤', 'Common mistakes'),
        list: [
          tx('第一天就亂投：沒有資訊時，可以先聽多幾輪發言。', 'Random voting on day one. With no information, listen to another round first.'),
          tx('只相信「感覺」：感覺可以作參考，但要配合邏輯和投票記錄。', 'Trusting only your gut. Gut feelings help, but back them with logic and the vote record.'),
          tx('把遊戲帶到現實：遊戲中說謊是規則的一部分，遊戲結束後要友好相處。', 'Taking it personally. Lying is part of the rules; stay friends after the game.'),
        ],
      },
    ],
    games: ['werewolf', 'avalon', 'mafia', 'resistance', 'secret-hitler', 'cheese-thief'],
  },
];
