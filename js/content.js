// Extra content per game for the game list, guide pages and SEO.
// category: deduction | party | word | tool
// colors: card gradient. aka: other names people search for.
import { tx } from './util.js';

const q = (zhQ, enQ, zhA, enA) => ({ q: tx(zhQ, enQ), a: tx(zhA, enA) });
const tx2 = (zh, en) => ({ zh, en });

export const CONTENT = {
  'cheese-thief': {
    category: 'deduction', colors: ['#ffb347', '#ff6a3d'], best: '6–8',
    aka: ['奶酪大盜', '奶酪大盗', '乳酪大盜', 'Cheese Thief', 'Käsedieb'],
    tips: {
      zh: ['獨自醒來時，偷看你最懷疑的人的骰子，可以驗證他說的時間是否屬實。', '和你同時醒來的人是你最可靠的證人，白天可以互相作證。', '芝士大盜可以假裝自己是獨自醒來並偷看了某人的骰子，製造混亂。', '共犯不知道大盜的骰子點數，說謊前要先聽清楚大家的時間表。'],
      en: ['When you wake alone, peek at the die of the player you trust least to check their story.', 'Whoever woke with you is your best witness; vouch for each other in the morning.', 'As the thief, claim you woke alone and peeked at someone to cause confusion.', "Followers don't know the thief's number, so listen to everyone's timeline before you lie."],
    },
    faq: [
      q('沒有主持人可以玩芝士大盜嗎？', 'Can you play Cheese Thief without a moderator?', '可以。本 App 會用語音讀出 1 至 6 點的醒來流程，並按人數處理共犯環節，所有人都可以一起玩。', 'Yes. The app calls hours 1 to 6 with voice narration and runs the Follower step for your player count, so everyone can play.'),
      q('芝士大盜最少幾多人玩？', 'What is the minimum number of players?', '4 至 8 人。4 人時每人擲兩顆骰子，而且沒有共犯；最好玩是 6 至 8 人。', '4 to 8. With 4 players everyone rolls two dice and there are no Followers. It plays best with 6 to 8.'),
      q('沒有骰子和卡牌怎麼辦？', 'What if I have no dice or cards?', '開啟「電子派牌＋電子骰」，手機會派發身份和骰子點數，獨自醒來時也可以在手機上偷看。', 'Turn on "Digital roles and dice". The phone deals roles and dice, and lone wakers can peek on the phone.'),
    ],
  },
  avalon: {
    category: 'deduction', colors: ['#5b6cff', '#9b4dff'], best: '7–10',
    aka: ['阿瓦隆', '抵抗組織：阿瓦隆', '抵抗组织：阿瓦隆', 'The Resistance: Avalon', 'Avalon'],
    tips: {
      zh: ['梅林要「低調地」引導好人，太明顯會被刺客找出來。', '派西維爾的任務是保護梅林：故意吸引注意，讓刺客以為你是梅林。', '留意誰總是投票支持有失敗結果的隊伍。', '第一輪任務的資訊最少，好人可以大膽組隊，從結果收集線索。'],
      en: ['Merlin should guide the good team subtly; being obvious gets you assassinated.', 'As Percival, protect Merlin by drawing attention so the Assassin suspects you.', 'Watch who keeps approving teams that end up failing.', 'Quest 1 gives the least information, so good players can propose freely and learn from the result.'],
    },
    faq: [
      q('阿瓦隆幾多人玩最好？', 'What player count is best for Avalon?', '5 至 10 人都可以，7 至 10 人最好玩，可以加入莫甘娜、莫德雷德、奧伯倫等角色。', '5 to 10 players. It shines at 7 to 10, where you can add Morgana, Mordred and Oberon.'),
      q('阿瓦隆的夜晚流程怎樣讀？', "How does Avalon's night phase go?", '壞人睜眼互認 → 壞人豎拇指讓梅林看見（莫德雷德除外）→ 梅林和莫甘娜豎拇指讓派西維爾看見。本 App 會按你選的角色自動讀出。', 'Evil players see each other, evil thumbs up for Merlin (except Mordred), then Merlin and Morgana thumbs up for Percival. The app reads the right script for your roles.'),
      q('第四個任務為什麼要兩張失敗？', 'Why does quest 4 need two fails?', '7 人或以上時，第 4 個任務需要兩張失敗卡才算失敗，App 的任務記錄板會提示你。', 'With 7 or more players, quest 4 only fails with two Fail cards. The quest tracker reminds you.'),
    ],
  },
  werewolf: {
    category: 'deduction', colors: ['#3a1c71', '#d76d77'], best: '9–12',
    aka: ['狼人殺', '狼人杀', '天黑請閉眼', '殺人遊戲', 'Werewolf', 'Mafia', 'Werewolves of Millers Hollow'],
    tips: {
      zh: ['預言家可以選擇第一天就跳出來報查驗，也可以隱藏到關鍵時刻。', '女巫第一晚通常會救人，因為資訊最少。', '守衛不要每晚守同一人，規則也不容許連續兩晚守同一位。', '狼人發言要像好人一樣有推理，突然沉默反而可疑。'],
      en: ['The Seer can claim on day one or stay hidden until the key moment.', 'Witches usually heal on night one, when there is the least information.', 'The Guard cannot protect the same player two nights in a row anyway, so vary it.', 'Werewolves should reason like villagers; going quiet looks suspicious.'],
    },
    faq: [
      q('狼人殺沒有法官可以玩嗎？', 'Can you play Werewolf without a moderator?', '可以。本 App 是全自動法官：手機派身份，夜晚各角色在手機上操作，天亮自動公佈死訊和判定勝負。', 'Yes. The app is a fully automatic moderator: it deals roles, takes night actions on the phone, announces deaths and detects the winner.'),
      q('狼人殺的屠邊和屠城有什麼分別？', 'What is "side" vs "all" win condition?', '屠邊：狼人殺光所有神職或所有平民即勝。屠城：要殺光所有好人。屠邊節奏較快。', '"Side": werewolves win by killing all special roles or all villagers. "All": they must kill every good player. "Side" is faster.'),
      q('同守同救會怎樣？', 'What if the Guard and the Witch protect the same player?', '依照常見規則，同一晚被守衛守護又被女巫救的玩家仍然會死亡（同守同救）。', 'By common rules, a player who is both guarded and healed on the same night still dies.'),
    ],
  },
  'one-night': {
    category: 'deduction', colors: ['#1e3c72', '#2a5298'], best: '5–8',
    aka: ['一夜終極狼人', '一夜狼人', '一夜终极狼人', 'One Night Ultimate Werewolf', 'ONUW'],
    tips: {
      zh: ['強盜和搗蛋鬼會換卡，所以你最後的身份未必是開始時看到的那張。', '如果大家都說自己是村民，中間三張卡可能藏著狼人。', '狼人可以聲稱自己是搗蛋鬼或酒鬼，因為這些角色看不到自己的新卡。', '皮匠要扮得可疑但又不太明顯，才會被投出去。'],
      en: ['Robbers and Troublemakers swap cards, so your final role may not be the one you saw.', 'If everyone claims Villager, the werewolves may be in the center.', 'Werewolves like to claim Troublemaker or Drunk, since those roles never see their new card.', 'The Tanner should look suspicious, but not too obviously.'],
    },
    faq: [
      q('一夜終極狼人需要幾多張卡？', 'How many cards does ONUW need?', '玩家人數加三張：每人一張，中間放三張。App 會自動檢查卡數。', 'Players plus three: one each and three in the center. The app checks the total for you.'),
      q('夜晚的角色次序是什麼？', 'What is the night wake order?', '化身幽靈 → 狼人 → 爪牙 → 守夜人 → 預言家 → 強盜 → 搗蛋鬼 → 酒鬼 → 失眠者。', 'Doppelgänger → Werewolves → Minion → Masons → Seer → Robber → Troublemaker → Drunk → Insomniac.'),
    ],
  },
  undercover: {
    category: 'word', colors: ['#11998e', '#38ef7d'], best: '6–10',
    aka: ['誰是臥底', '谁是卧底', '臥底遊戲', "Who's the Undercover", 'Undercover word game'],
    tips: {
      zh: ['第一輪描述要含糊，先聽聽別人的說法，判斷自己是否拿到少數派的詞。', '如果你發現自己的詞和大家不同，要立即調整描述方向。', '白板要說一些廣泛但安全的描述，例如「日常生活會見到」。', '投票時留意誰的描述和大家「差一點點」。'],
      en: ['Keep round one vague and listen first; you might be the one with the odd word.', 'Once you realise your word differs, shift your descriptions to match the group.', 'A blank should give broad, safe clues like "you see it every day".', 'When voting, look for descriptions that are slightly off.'],
    },
    faq: [
      q('誰是臥底怎樣玩？', "How do you play Who's the Undercover?", '平民拿到同一個詞，臥底拿到相似的詞。每輪每人描述一句，然後投票淘汰，找出所有臥底即平民勝。', 'Civilians share a word and the undercover gets a similar one. Each round everyone describes theirs, then votes someone out. Find all undercovers to win.'),
      q('可以用英文詞語玩嗎？', 'Can we play with English words?', '可以，設定中選擇中文、English 或中英對照。', 'Yes. Choose Chinese, English or both in the options.'),
    ],
  },
  'secret-hitler': {
    category: 'deduction', colors: ['#b24592', '#f15f79'], best: '7–10',
    aka: ['秘密希特勒', '秘密希特拉', 'Secret Hitler', 'Secret Dictator'],
    tips: {
      zh: ['三張法西斯法案後，選總理要特別小心，選中希特勒就即時輸。', '總統和總理對法案的說法不一致時，至少一人在說謊。', '希特勒要表現得像一個可靠的自由黨員。', '調查權力可以用來確認你懷疑的人。'],
      en: ['After three Fascist policies, choose Chancellors carefully; electing Hitler loses instantly.', 'If the President and Chancellor disagree about the cards, at least one is lying.', 'Hitler should act like the most trustworthy Liberal at the table.', 'Use the Investigate power to confirm your strongest suspicion.'],
    },
    faq: [
      q('秘密希特勒的夜晚流程是什麼？', 'What is the night phase in Secret Hitler?', '5–6 人：法西斯和希特勒互相睜眼確認。7–10 人：法西斯睜眼，希特勒閉眼豎拇指。', '5–6 players: Fascists and Hitler see each other. 7–10 players: Fascists see each other while Hitler keeps eyes closed with a thumb up.'),
      q('App 會記錄總統權力嗎？', 'Does the app track presidential powers?', '會。法案記錄板會按人數顯示每張法西斯法案解鎖的權力，並在需要時讀出。', 'Yes. The policy board shows the power for each Fascist policy at your player count and reads it out.'),
    ],
  },
  insider: {
    category: 'word', colors: ['#f7971e', '#ffd200'], best: '5–7',
    aka: ['內鬼', 'Insider', '誰是內鬼', 'Insider 內鬼'],
    tips: {
      zh: ['內鬼不要太快猜中，否則討論時間很短但會很可疑。', '留意誰的問題「太準」，那個人很可能知道答案。', '大師要公平回答，不要偏幫任何人。'],
      en: ["The Insider shouldn't solve it too fast; it shortens discussion but looks suspicious.", 'Watch for questions that are suspiciously on target.', 'The Master should answer fairly and favour no one.'],
    },
    faq: [
      q('猜中後討論時間有多長？', 'How long is the discussion after guessing?', '和猜詞所用的時間一樣長，App 會自動計算。', 'As long as the guessing took. The app works it out for you.'),
    ],
  },
  spyfall: {
    category: 'party', colors: ['#283c86', '#45a247'], best: '5–8',
    aka: ['間諜危機', '间谍危机', '誰是間諜', 'Spyfall'],
    tips: {
      zh: ['問題要令知道地點的人容易回答，但間諜聽不出地點。', '間諜可以模仿別人的答案方向，或者回答得很含糊。', '如果你懷疑某人，問他一個只有知道地點才答得出的問題。'],
      en: ['Ask questions insiders can answer easily but that reveal little to the spy.', 'The spy can echo other answers or stay vague.', 'If you suspect someone, ask something only an insider could answer.'],
    },
    faq: [
      q('間諜危機需要卡牌嗎？', 'Do I need the Spyfall cards?', '不需要。手機會派發地點和身份，並顯示全部可能地點給間諜參考。', 'No. The phone deals the location and roles and shows the full location list for the spy.'),
      q('一局要幾耐？', 'How long is a round?', '預設 8 分鐘，可以在設定中調整。', '8 minutes by default; change it in the options.'),
    ],
  },
  werewords: {
    category: 'word', colors: ['#614385', '#516395'], best: '5–8',
    aka: ['狼人真言', 'Werewords', '狼人問答'],
    tips: {
      zh: ['預言家要提出能幫助大家的問題，但不要太明顯。', '狼人可以故意問一些誤導方向的問題浪費時間。', '村長回答「很接近」時，大家要抓緊那個方向。'],
      en: ['The Seer should ask helpful questions without being too obvious.', 'Werewolves can ask misleading questions to waste time.', 'When the Mayor says "So close", chase that direction fast.'],
    },
    faq: [
      q('狼人真言和狼人殺有什麼分別？', 'How is Werewords different from Werewolf?', '狼人真言是猜詞遊戲加上隱藏身份，只玩一局約十分鐘，沒有淘汰。', 'Werewords is a word guessing game with hidden roles. One round takes about ten minutes, with no elimination.'),
    ],
  },
  chameleon: {
    category: 'word', colors: ['#56ab2f', '#a8e063'], best: '5–7',
    aka: ['變色龍', '变色龙', 'The Chameleon', 'Chameleon'],
    tips: {
      zh: ['提示詞要令同伴明白，但變色龍猜不到確切答案。', '變色龍最好排後一點說話，可以參考其他人的提示。', '提示太含糊會被懷疑，太明顯會讓變色龍猜中。'],
      en: ['Give clues teammates understand but that do not pin down the word.', 'Going later helps the Chameleon borrow from earlier clues.', 'Too vague looks suspicious; too obvious gives it away.'],
    },
    faq: [
      q('變色龍可以幾多人玩？', 'How many players?', '3 至 8 人，5 至 7 人最好玩。', '3 to 8 players, best with 5 to 7.'),
    ],
  },
  deception: {
    category: 'deduction', colors: ['#c31432', '#240b36'], best: '6–10',
    aka: ['詭影危機', '诡影危机', 'Deception: Murder in Hong Kong', 'Deception Murder in Hong Kong', '香港謀殺案'],
    tips: {
      zh: ['法醫的子彈標記要從大範圍開始，再逐步收窄。', '兇手要在推理時支持一個看似合理但錯誤的組合。', '目擊者知道兇手，但太早指出會被反殺。'],
      en: ['As Forensic Scientist, start with broad markers and narrow down.', 'The murderer should champion a plausible but wrong combination.', 'The Witness knows the culprits, but accusing too early gets them killed.'],
    },
    faq: [
      q('法醫要怎樣玩？', 'How does the Forensic Scientist play?', '法醫知道兇器和證據，但不能說話，只能在場景卡上放子彈標記作提示。App 會讀出夜晚流程和三輪調查的計時。', 'The Forensic Scientist knows the answer but cannot speak, hinting only with bullet markers. The app narrates the night and times the three rounds.'),
    ],
  },
  codenames: {
    category: 'word', colors: ['#e53935', '#1e88e5'], best: '4–8',
    aka: ['機密代號', '机密代号', '行動代號', 'Codenames', '代號'],
    tips: {
      zh: ['一個好提示可以連結兩至三個詞，但要小心避開刺客。', '隊長不可以做表情或手勢暗示隊友。', '不確定時寧可結束回合，不要冒險點中刺客。'],
      en: ['A great clue links two or three words while steering clear of the assassin.', 'Spymasters must not hint with faces or gestures.', 'When unsure, end the turn rather than risk the assassin.'],
    },
    faq: [
      q('沒有機密代號的卡可以玩嗎？', 'Can we play without the Codenames box?', '可以。選「全電子詞語板」，手機會隨機出 25 個詞，隊長按住按鈕查看鑰匙卡。', 'Yes. Choose "Digital word board": the phone deals 25 words and spymasters hold a button to see the key.'),
    ],
  },
  'fake-artist': {
    category: 'party', colors: ['#ff512f', '#dd2476'], best: '6–8',
    aka: ['假藝術家', '假艺术家', '紐約假畫家', 'A Fake Artist Goes to New York', 'Fake Artist'],
    tips: {
      zh: ['第一筆畫得太清楚會讓假藝術家知道答案。', '假藝術家可以畫一些模稜兩可的線條，配合其他人。', '留意誰的筆畫「好像在跟隨」別人。'],
      en: ['A first stroke that is too clear gives the answer away.', 'The fake can draw ambiguous lines that fit anything.', 'Watch for strokes that only follow what others drew.'],
    },
    faq: [
      q('需要準備什麼？', 'What do I need?', '一張紙和每人一支不同顏色的筆，題目由手機派發，不需要出題者。', 'One sheet of paper and a different colour pen per player. The phone deals the prompt, so nobody has to be question master.'),
    ],
  },
  charades: {
    category: 'party', colors: ['#fc466b', '#3f5efb'], best: '6+',
    aka: ['比手畫腳', '比手划脚', '估字遊戲', '你演我猜', 'Charades', 'Heads Up', '做動作估'],
    tips: {
      zh: ['先用手勢表示類別，例如動物或動作。', '太難就快點跳過，數量比難度重要。', '用說話形容時，可以用「相反詞」或「相關事物」。'],
      en: ['Signal the category first, like animal or action.', 'Skip hard ones fast; quantity beats difficulty.', 'When describing, use opposites or related things.'],
    },
    faq: [
      q('有幾多種玩法？', 'What modes are there?', '三種：做動作、用說話形容、畫出來。可以選擇題目類別和語言。', 'Three: act it out, describe it, or draw it. Pick the category and word language too.'),
    ],
  },
  timer: {
    category: 'tool', colors: ['#606c88', '#3f4c6b'], best: '—',
    aka: ['桌遊計時器', '發言計時器', 'Board game timer', 'Speaking timer'],
    tips: {
      zh: ['輪流發言模式會按座位叫名，適合任何需要發言的推理遊戲。', '可以在設定加入玩家名字，語音會直接叫名。'],
      en: ['Turn mode calls players by seat, great for any deduction game with speeches.', 'Add player names and the voice will call people by name.'],
    },
    faq: [
      q('計時器可以用在其他桌遊嗎？', 'Can I use the timer for other games?', '可以，任何需要討論或輪流發言的遊戲都適用。', 'Yes, it works for any game with discussion or turn-based speaking.'),
    ],
  },
  resistance: {
    category: 'deduction', colors: ['#2c3e50', '#4ca1af'], best: '6–8',
    aka: ['抵抗組織', '抵抗组织', 'The Resistance', 'Resistance'],
    tips: {
      zh: ['第一個任務資訊最少，抵抗組織可以大膽組隊，從結果收集線索。', '記錄每次投票：一直支持失敗隊伍的人很可疑。', '間諜不一定每次都要出失敗卡，太早暴露反而容易被抓。'],
      en: ['Mission 1 gives the least information, so propose freely and learn from the result.', 'Track every vote: whoever keeps approving failed teams is suspicious.', 'Spies do not have to fail every mission; failing too early gives them away.'],
    },
    faq: [
      q('抵抗組織和阿瓦隆有什麼分別？', 'How is The Resistance different from Avalon?', '抵抗組織沒有梅林、刺客等特殊角色，規則更簡單，適合新手；阿瓦隆加入角色能力和刺殺環節。', 'The Resistance has no special roles like Merlin or the Assassin, so it is simpler and great for beginners. Avalon adds role powers and the assassination.'),
    ],
  },
  mafia: {
    category: 'deduction', colors: ['#232526', '#c0392b'], best: '8–12',
    aka: ['殺手遊戲', '杀手游戏', '天黑請閉眼', '天黑请闭眼', 'Mafia', '殺人遊戲'],
    tips: {
      zh: ['警察查到殺手後不一定要立刻公開，可以先暗示，避免當晚被殺。', '醫生可以猜殺手會殺誰：通常是最有影響力的發言者。', '殺手白天要積極參與討論，太安靜反而可疑。'],
      en: ['The Detective does not have to reveal a find at once; hint first to avoid being killed that night.', 'The Doctor should guess who the Mafia will target, usually the most influential speaker.', 'The Mafia should join the discussion; staying quiet looks suspicious.'],
    },
    faq: [
      q('殺手遊戲和狼人殺有什麼分別？', 'How is Mafia different from Werewolf?', '殺手遊戲是更經典簡單的版本：只有殺手、警察、醫生和平民；狼人殺加入女巫、獵人、守衛等更多角色。', 'Mafia is the classic, simpler version with just Mafia, Detective, Doctor and civilians. Werewolf adds roles like the Witch, Hunter and Guard.'),
      q('沒有法官可以玩嗎？', 'Can we play without a moderator?', '可以，手機會派身份、讀出夜晚流程、記錄死亡和判定勝負。', 'Yes. The phone deals roles, runs the night, tracks deaths and detects the winner.'),
    ],
  },
  wavelength: {
    category: 'party', colors: ['#00b4db', '#e84a5f'], best: '4–10',
    aka: ['心靈同步', '心灵同步', 'Wavelength', '同步率', '腦電波'],
    tips: {
      zh: ['靈媒的提示要考慮隊友的想法，而不是自己的。', '目標在中間時，用大家都有共識的普通例子。', '隊友討論時可以問「這個是極端還是一般？」去定位。'],
      en: ['As psychic, think about how your team sees it, not just you.', 'For a target near the middle, pick an example everyone agrees is "average".', 'Ask "is this extreme or just a bit?" to place the needle.'],
    },
    faq: [
      q('需要買實體遊戲嗎？', 'Do I need the physical game?', '不需要，手機會出光譜卡、顯示刻度盤並自動計分。', 'No. The phone deals spectrum cards, shows the dial and keeps score.'),
    ],
  },
  'just-one': {
    category: 'word', colors: ['#f7971e', '#59c173'], best: '5–7',
    aka: ['Just One', '超級犯規', '一詞提示', '只有一個'],
    tips: {
      zh: ['避免太明顯的提示，因為其他人很可能寫一樣的，會被一起刪走。', '可以從不同角度提示：顏色、地點、用途、聲音。', '主猜者不肯定時放棄比猜錯好，猜錯會多失去一張卡。'],
      en: ['Avoid the most obvious clue; someone else will probably write it too and both get removed.', 'Give clues from different angles: colour, place, use, sound.', 'If unsure, passing is better than a wrong guess, which loses an extra card.'],
    },
    faq: [
      q('Just One 幾多人玩最好？', 'What is the best player count?', '3 至 7 人最好玩，人越多提示越容易重複，挑戰越大。', '3 to 7 players. More players means more duplicate clues and a bigger challenge.'),
    ],
  },
  fishbowl: {
    category: 'party', colors: ['#56ab2f', '#f8b500'], best: '6+',
    aka: ['沙律碗', '沙拉碗', '魚缸遊戲', 'Fishbowl', 'Salad Bowl', 'Celebrity'],
    tips: {
      zh: ['第一輪記住隊友用過的提示，第二、三輪會更快估中。', '第二輪的一個詞，最好用第一輪大家都記得的關鍵字。', '太難的詞可以跳過，留給下一隊頭痛。'],
      en: ['Remember the clues from round 1; they make rounds 2 and 3 much faster.', 'In round 2, use the key word everyone remembers from round 1.', 'Skip hard words and leave them for the other team.'],
    },
    faq: [
      q('可以用自己的詞語嗎？', 'Can we use our own words?', '可以，在「設定 › 自訂詞庫」輸入詞語，然後在遊戲設定選擇「內置＋自訂」或「只用自訂」。', 'Yes. Add words in Settings › Custom words, then choose "Built-in + custom" or "Custom only" in the game options.'),
    ],
  },
  picker: {
    category: 'tool', colors: ['#8e2de2', '#4a00e0'], best: '—',
    aka: ['抽籤', '分組', '隨機分隊', 'Random team picker', 'First player picker'],
    tips: {
      zh: ['輸入玩家名字後，結果會直接叫名。', '分隊模式會盡量平均分配人數。'],
      en: ['With player names entered, the result calls people by name.', 'Team mode splits players as evenly as possible.'],
    },
    faq: [
      q('可以用來決定誰先開始嗎？', 'Can it pick who starts?', '可以，選擇「抽第一位」模式。', 'Yes, use the "First player" mode.'),
    ],
  },
};

// Strategy tips per role, shown in the guide pages ("Role strategy").
export const ROLE_TIPS = {
  werewolf: {
    wolf: tx2(['和狼隊友分工：有人帶節奏，有人低調。', '可以考慮悍跳預言家，搶走真預言家的信任。'], ['Split roles with your fellow wolves: one leads, one stays quiet.', 'Consider fake-claiming Seer to steal the real Seer\'s credibility.']),
    seer: tx2(['查驗發言最有影響力或最安靜的人。', '跳出來時要清楚報出每晚查驗結果，方便好人跟隨。'], ['Check the most influential or the quietest players.', 'When you claim, list every night\'s result clearly so the village can follow.']),
    witch: tx2(['解藥通常第一晚用，毒藥留到有把握時才用。', '不要太早暴露身份，否則容易被狼人針對。'], ['Use the heal on night one; save the poison until you are sure.', 'Do not reveal yourself too early or the wolves will target you.']),
    hunter: tx2(['被投出時，帶走你最懷疑的狼人。', '可以適時暗示自己是獵人，令狼人不敢刀你。'], ['When voted out, take the player you suspect most.', 'Hinting that you are the Hunter can scare the wolves off.']),
    guard: tx2(['第一晚可以空守或守自己，避免同守同救。', '跟著場上局勢守護預言家等重要神職。'], ['On night one, protect no one or yourself to avoid guard-and-heal both landing.', 'Protect key roles like the Seer once they are revealed.']),
    idiot: tx2(['可以大膽發言帶節奏，被投出也能翻牌留下。', '翻牌後雖然不能投票，仍然可以分析局勢。'], ['Speak boldly; if voted out you can reveal and stay.', 'After revealing you cannot vote, but you can still analyse.']),
    villager: tx2(['仔細記錄每人發言，找出前後矛盾。', '支持你相信的預言家，但要獨立思考。'], ['Track what everyone says and look for contradictions.', 'Back the Seer you trust, but think for yourself.']),
  },
  avalon: {
    merlin: tx2(['用投票和含蓄的發言引導好人，避免直接點名壞人。', '偶爾故意犯小錯，迷惑刺客。'], ['Guide with votes and subtle hints; avoid naming evil players outright.', 'Make the odd small mistake on purpose to confuse the Assassin.']),
    percival: tx2(['觀察兩個豎拇指的人誰更像梅林，保護真梅林。', '可以扮演梅林吸引刺客注意。'], ['Work out which of the two thumbs is the real Merlin and protect them.', 'Act like Merlin to draw the Assassin\'s attention.']),
    servant: tx2(['留意任務結果和投票紀錄，找出壞人。', '不要隨便相信聲稱是梅林的人。'], ['Use quest results and voting records to find evil.', 'Do not blindly trust anyone claiming to be Merlin.']),
    assassin: tx2(['整局觀察誰的判斷「太準」，那個人很可能是梅林。', '和隊友交換意見，最後一次刺殺要謹慎。'], ['Watch who is "too accurate" all game; that is probably Merlin.', 'Compare notes with your team before the final strike.']),
    morgana: tx2(['在派西維爾面前表現得像梅林。', '適時支持好人隊伍，增加可信度。'], ['Act like Merlin in front of Percival.', 'Support good teams at times to build trust.']),
    mordred: tx2(['梅林看不到你，可以大膽扮好人。', '你是好人最難發現的壞人，盡量進入任務隊伍。'], ['Merlin cannot see you, so play the good guy boldly.', 'You are the hardest evil to spot; get onto teams.']),
    oberon: tx2(['你不認識隊友，要從任務結果猜出誰是壞人。', '適時出失敗卡，但小心和隊友重複暴露。'], ['You do not know your team; deduce them from results.', 'Fail when useful, but beware of exposing yourself alongside a teammate.']),
    minion: tx2(['和隊友配合投票，不要每次都一起反對。', '盡量進入任務隊伍出失敗卡。'], ['Coordinate votes, but do not always reject together.', 'Get onto teams so you can play Fail.']),
  },
  'cheese-thief': {
    thief: tx2(['可以聲稱自己在另一個時間獨自醒來並偷看了骰子。', '偷芝士時如果有人看見，白天要先發制人質疑他。'], ['Claim you woke alone at another hour and peeked at a die.', 'If someone saw you steal, accuse them first in the morning.']),
    sleepy: tx2(['獨自醒來時偷看最可疑的人的骰子。', '和同時醒來的人互相作證。'], ['When alone, peek at the most suspicious player\'s die.', 'Vouch for whoever woke with you.']),
    fall: tx2(['故意說一些前後矛盾的話，吸引大家投你。', '但不要太明顯，否則大家會猜到你是背鍋鼠。'], ['Say slightly contradictory things to attract votes.', 'Do not overdo it, or everyone will guess you are the Fall Mouse.']),
  },
  'one-night': {
    werewolf: tx2(['聲稱自己是搗蛋鬼或酒鬼，因為他們看不到新卡。', '如果中間有狼人，可以聲稱自己是預言家看過中間。'], ['Claim Troublemaker or Drunk; they never see their new card.', 'If you saw a wolf in the middle, claim Seer.']),
    seer: tx2(['看中間兩張卡可以排除很多可能性。', '盡快分享資訊，幫大家定位狼人。'], ['Viewing two center cards rules out a lot.', 'Share early to help locate the wolves.']),
    robber: tx2(['偷到狼人卡你就變成狼人，要轉換陣營思考。', '如果偷到好人，大方說出交換過程。'], ['If you rob a werewolf, you are now a werewolf; switch sides.', 'If you took a good card, explain the swap openly.']),
    troublemaker: tx2(['交換兩個說法矛盾的人，製造資訊。', '記住你交換了誰，對推理很重要。'], ['Swap two players whose stories clash to create information.', 'Remember who you swapped; it matters later.']),
    tanner: tx2(['表現得可疑但不要太誇張。', '可以假裝是狼人，引導大家投你。'], ['Act suspicious, but not too obviously.', 'Pretend to be a werewolf to draw votes.']),
  },
  'secret-hitler': {
    liberal: tx2(['留意總統和總理對法案的說法是否一致。', '三張法西斯法案後，選總理要非常小心。'], ['Check whether the President\'s and Chancellor\'s stories match.', 'After three Fascist policies, choose Chancellors very carefully.']),
    fascist: tx2(['幫希特勒建立可信度，令他被選為總理。', '可以故意頒布一兩張自由黨法案博取信任。'], ['Build trust for Hitler so he can be elected Chancellor.', 'Enacting a Liberal policy or two buys trust.']),
    hitler: tx2(['表現得像最可靠的自由黨員，不要主動出擊。', '7 人以上你不知道隊友是誰，要觀察誰在幫你。'], ['Act like the most reliable Liberal; do not go on the attack.', 'With 7+ players you do not know your team; watch who helps you.']),
  },
  undercover: {
    civilian: tx2(['描述要準確但不要太明顯，以免臥底猜到詞語。', '留意誰的描述「差一點點」。'], ['Be accurate but not too obvious, or the undercover will guess the word.', 'Watch for descriptions that are slightly off.']),
    undercover: tx2(['先聽別人描述，判斷自己是不是少數派。', '描述要含糊到可以套用在兩個詞語上。'], ['Listen first to see if you are the odd one out.', 'Keep descriptions vague enough to fit both words.']),
    blank: tx2(['用最廣泛的描述，例如「日常生活常見」。', '仔細聽其他人，盡快猜出詞語。'], ['Use the broadest description, like "you see it every day".', 'Listen carefully and work out the word fast.']),
  },
  spyfall: {
    spy: tx2(['回答要含糊，同時留意大家問什麼來推斷地點。', '有把握時主動公開身份猜地點。'], ['Answer vaguely while working out the location from the questions.', 'Reveal and guess as soon as you are confident.']),
    civ: tx2(['問題要讓知道地點的人容易答，間諜卻難以猜到。', '懷疑某人時問一個只有知道地點才答得出的問題。'], ['Ask questions insiders find easy but the spy cannot use.', 'If you suspect someone, ask something only an insider could answer.']),
  },
  mafia: {
    killer: tx2(['晚上優先殺警察或醫生。', '白天附和大眾意見，避免成為焦點。'], ['Target the Detective or Doctor first.', 'Go along with the crowd during the day to stay out of focus.']),
    police: tx2(['查到殺手時可以先暗示，等時機成熟才公開。', '公開身份前要有足夠資訊說服大家。'], ['When you find the Mafia, hint first and reveal when the time is right.', 'Have enough evidence before you claim.']),
    doctor: tx2(['保護白天最有影響力的好人。', '不要公開自己是醫生。'], ['Protect the most influential town player.', 'Never reveal that you are the Doctor.']),
    civilian: tx2(['留意投票時誰總是跟風或突然改變。', '大膽說出懷疑，沉默只會幫殺手。'], ['Watch who always follows or suddenly switches votes.', 'Voice your suspicions; silence only helps the Mafia.']),
  },
  resistance: {
    resistance: tx2(['記錄每個任務的隊員和結果，交叉比對找出間諜。', '不要讓同一批可疑的人一直出任務。'], ['Record who went on each mission and the result, then cross-check.', 'Do not keep sending the same suspicious group.']),
    spy: tx2(['不要每次都出失敗卡，偶爾讓任務成功建立信任。', '和間諜同伴分散投票，避免一起被懷疑。'], ['Do not fail every mission; let one pass to build trust.', 'Split your votes from your fellow spies to avoid suspicion.']),
  },
  werewords: {
    mayor: tx2(['回答要公平準確，「很接近」很有幫助。', '如果你也是狼人（擴充規則），可以拖延時間。'], ['Answer fairly; "So close" is very helpful.', 'If you are also a werewolf (expansion rules), you can stall.']),
    wolf: tx2(['問一些誤導方向的問題浪費時間。', '被發現前不要太明顯地阻止大家。'], ['Ask misleading questions to waste time.', 'Do not block the group too obviously.']),
    seer: tx2(['用問題暗中引導，但不要猜得太快。', '猜中後狼人會找你，要表現得像普通村民。'], ['Steer with your questions, but do not solve it too fast.', 'Once it is guessed, the wolves hunt you; act like a villager.']),
    villager: tx2(['先問大範圍的問題，例如「是生物嗎？」', '留意誰的問題太準確或太離題。'], ['Start broad: "Is it alive?"', 'Watch for questions that are too accurate or way off.']),
  },
  deception: {
    fs: tx2(['子彈標記先選較寬的提示，再逐步收窄。', '留意調查員的推理方向，用更換場景卡糾正。'], ['Start with broad markers, then narrow down.', 'Use tile swaps to correct the investigators\' direction.']),
    murderer: tx2(['推理時支持一個合理但錯誤的組合。', '不要太積極否定正確答案。'], ['Champion a plausible but wrong combination.', 'Do not push back too hard on the right answer.']),
    accomplice: tx2(['幫兇手轉移視線，但不要和他站同一陣線太明顯。', '留意誰可能是目擊者。'], ['Divert attention without siding with the murderer too obviously.', 'Watch for the Witness.']),
    witness: tx2(['暗示調查員但不要太明顯，否則破案後會被找出。', '可以假裝不肯定，引導大家自己推理。'], ['Hint without being obvious, or you will be found after the solve.', 'Pretend to be unsure and let others reason it out.']),
    investigator: tx2(['用徽章前先和大家討論，避免浪費。', '留意法醫的子彈標記組合。'], ['Discuss before using your badge so it is not wasted.', 'Read the Forensic Scientist\'s markers as a set.']),
  },
};

export const CATEGORIES = {
  all: tx('全部', 'All'),
  deduction: tx('陣營推理', 'Social deduction'),
  word: tx('文字猜詞', 'Word games'),
  party: tx('派對遊戲', 'Party games'),
  tool: tx('工具', 'Tools'),
};
