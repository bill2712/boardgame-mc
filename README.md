# 🎲 桌遊主持人 · Board Game MC

**語音自動主持＋計時，唔使再有人做 MC，大家一齊玩！**
A voice narrator and timer for social deduction board games, so nobody has to sit out as the moderator.

純前端 web app，手機瀏覽器打開就用得，可以「加入主畫面」離線使用。
Runs entirely in the browser. Works offline once added to your home screen.

---

## 遊戲 Games

| 遊戲 Game | 人數 Players | App 幫你做咩 What the app does |
|---|---|---|
| 🧀 **芝士大盜** Cheese Thief | 4–8 | 讀出 1–6 點醒來流程、按人數揀共犯（5/6/7/8 人規則唔同）、討論計時；可選電子派牌＋電子骰 · Calls hours 1–6, runs the Follower step for each player count, discussion timer; optional digital roles and dice |
| 🏰 **阿瓦隆** Avalon | 5–10 | 夜晚流程（梅林、派西維爾、莫甘娜、莫德雷德、奧伯倫）、任務記錄板、否決次數、湖中仙女、刺殺梅林 · Night script, quest tracker, rejection counter, Lady of the Lake, assassination |
| 🐺 **狼人殺** Werewolf | 6–16 | **全自動法官**：手機派身份；守衛、狼人、女巫、預言家喺手機上操作；自動公佈死訊、獵人開槍、白痴翻牌、勝負判定 · **Fully automatic moderator**: deals roles, roles act on the phone at night, announces deaths, handles Hunter / Idiot, detects the winner |
| 🌕 **一夜終極狼人** One Night Ultimate Werewolf | 3–10 | 按官方次序讀出所有角色（包括化身幽靈）、討論計時 · Official wake order for every role (including Doppelgänger), discussion timer |
| 🕵️ **誰是臥底** Who's the Undercover | 4–12 | 手機派詞（中／英／中英對照）、輪流描述計時、投票、勝負判定 · Deals words (Chinese / English / both), speaking timer, votes, win check |
| 🗳️ **秘密希特勒** Secret Hitler | 5–10 | 夜晚流程（5–6 人 / 7–10 人唔同）、法案記錄、選舉失敗、總統權力、洗牌提示 · Night script per player count, policy board, election tracker, presidential powers, reshuffle reminder |
| 🤫 **內鬼** Insider | 4–8 | 派身份＋秘密詞語、猜詞計時、自動計算討論時間 · Roles and secret word, guessing timer, discussion time worked out for you |
| ⏱️ **通用計時器** Table Timer | 任何 any | 自由討論或者輪流發言 · Free discussion or turn by turn |

## 功能 Features

- 🔊 **語音旁白**：粵語、普通話、English（用瀏覽器內建語音，唔使上網）
  **Voice narration** in Cantonese, Mandarin or English, using the browser's built-in speech
- 🌐 **中英雙語介面**，介面語言同語音語言可以分開揀
  **Chinese / English interface**, chosen separately from the narration language
- 👥 **自訂人數同角色**，App 會檢查配置有冇問題，並建議標準配置
  **Choose player count and roles**, with validation and recommended setups
- 🃏 **電子派牌**：冇實體卡都玩得（輪流傳手機睇身份）
  **Digital role dealing**: pass the phone around, no cards needed
- ⏯️ 暫停、跳過、重複上一句；夜晚螢幕變暗；遊戲中保持螢幕開啟
  Pause, skip and repeat; dark screen at night; keeps the screen awake
- ⏱️ 計時器有語音提醒（剩一分鐘、三十秒、十秒）
  Timers with voice reminders at one minute, thirty seconds and ten seconds

## 使用 Usage

直接打開 GitHub Pages 網址，揀遊戲 → 設定人數同角色 → 開始遊戲。
Open the GitHub Pages URL, pick a game, set players and roles, then start.

> 💡 第一次用請喺「⚙️ 設定」按「試聽」。iPhone 請關閉靜音模式。如果冇粵語聲音，可以喺系統設定下載（iOS：設定 › 輔助使用 › 朗讀內容 › 聲音 › 中文（香港））。
> First time? Tap "Test" in ⚙️ Settings. On iPhone, turn off silent mode.

### 本地運行 Run locally

```bash
npm start          # python3 -m http.server 8000 → http://localhost:8000
npm test           # 測試所有遊戲流程 / run game script tests (Node 18+)
```

冇 build step，冇 dependency。No build step, no dependencies.

### 部署到 GitHub Pages Deploy

Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**，儲存後約一分鐘就會有網址：
`https://<username>.github.io/boardgame-mc/`

## 加新遊戲 Adding a game

每個遊戲係 `js/games/` 入面一個檔案，export 一個物件：
Each game is one file in `js/games/` exporting an object:

```js
export default {
  id: 'my-game',
  emoji: '🎯',
  name: tx('中文名', 'English name'),
  tagline: tx('…', '…'),
  players: { min: 4, max: 8, default: 6 },
  rules: { zh: ['…'], en: ['…'] },
  roles: [{ id: 'spy', name: tx('間諜', 'Spy'), team: 'evil', max: 2 }],
  options: [{ id: 'talk', type: 'number', label: tx('討論時間', 'Discussion'), min: 1, max: 10, unit: 'min', default: 3 }],
  defaults(n) { return { roles: { spy: 1 } }; },
  deck(setup) { /* full role list */ },
  check(setup) { return { errors: [], warnings: [], summary: tx('…', '…') }; },
  async run(ctx, setup) {
    await ctx.say(tx('天黑請閉眼。', 'Everyone, close your eyes.'));
    await ctx.act(5);                       // action window
    await ctx.timer(setup.opts.talk * 60);  // discussion timer
  },
};
```

然後喺 `js/games/index.js` 加入 `GAMES`。`ctx` 仲有 `buttons()`、`choose()`、`deal()`、`board()`、`phase()` 等，詳見 `js/runner.js`。
Then add it to `GAMES` in `js/games/index.js`. See `js/runner.js` for the rest of `ctx`.

## 免責聲明 Disclaimer

非官方粉絲工具，與各遊戲出版商無關。遊戲名稱屬各自擁有者。請支持正版桌遊！
An unofficial fan-made helper, not affiliated with any publisher. Game names belong to their owners. Please buy the games!

## License

MIT
