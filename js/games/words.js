import { settings } from '../settings.js';

// Word lists for word games. Each entry is [中文, English].

// Pairs for Who's the Undercover: [civilian/undercover] in zh and en.
export const UNDERCOVER_PAIRS = [
  [['蘋果', '梨'], ['Apple', 'Pear']],
  [['咖啡', '奶茶'], ['Coffee', 'Milk tea']],
  [['貓', '老虎'], ['Cat', 'Tiger']],
  [['結他', '小提琴'], ['Guitar', 'Violin']],
  [['餃子', '雲吞'], ['Dumpling', 'Wonton']],
  [['飛機', '直升機'], ['Airplane', 'Helicopter']],
  [['醫生', '護士'], ['Doctor', 'Nurse']],
  [['海灘', '泳池'], ['Beach', 'Swimming pool']],
  [['足球', '籃球'], ['Soccer', 'Basketball']],
  [['手機', '平板電腦'], ['Phone', 'Tablet']],
  [['薯條', '薯片'], ['French fries', 'Potato chips']],
  [['雪糕', '雪條'], ['Ice cream', 'Popsicle']],
  [['巴士', '電車'], ['Bus', 'Tram']],
  [['婚禮', '生日派對'], ['Wedding', 'Birthday party']],
  [['眼鏡', '太陽眼鏡'], ['Glasses', 'Sunglasses']],
  [['牙刷', '梳'], ['Toothbrush', 'Comb']],
  [['蝴蝶', '蜜蜂'], ['Butterfly', 'Bee']],
  [['火鍋', '燒烤'], ['Hot pot', 'Barbecue']],
  [['老師', '教授'], ['Teacher', 'Professor']],
  [['雨傘', '雨褸'], ['Umbrella', 'Raincoat']],
  [['戲院', '劇場'], ['Cinema', 'Theatre']],
  [['鋼琴', '電子琴'], ['Piano', 'Keyboard']],
  [['麵包', '蛋糕'], ['Bread', 'Cake']],
  [['獅子', '豹'], ['Lion', 'Leopard']],
  [['枕頭', '被'], ['Pillow', 'Blanket']],
  [['超級市場', '便利店'], ['Supermarket', 'Convenience store']],
  [['可樂', '雪碧'], ['Cola', 'Lemonade']],
  [['魔術師', '小丑'], ['Magician', 'Clown']],
  [['月餅', '湯圓'], ['Mooncake', 'Rice ball']],
  [['筆記簿', '日記'], ['Notebook', 'Diary']],
  [['消防員', '警察'], ['Firefighter', 'Police officer']],
  [['壽司', '刺身'], ['Sushi', 'Sashimi']],
  [['聖誕節', '新年'], ['Christmas', 'New Year']],
  [['海豚', '鯨魚'], ['Dolphin', 'Whale']],
  [['單車', '電單車'], ['Bicycle', 'Motorbike']],
  [['朱古力', '糖果'], ['Chocolate', 'Candy']],
  [['圖書館', '書店'], ['Library', 'Bookstore']],
  [['拖鞋', '涼鞋'], ['Slippers', 'Sandals']],
  [['熊貓', '北極熊'], ['Panda', 'Polar bear']],
  [['紅酒', '啤酒'], ['Wine', 'Beer']],
  [['魚蛋', '燒賣'], ['Fish ball', 'Siu mai']],
  [['港鐵', '巴士'], ['MTR', 'Bus']],
  [['奶茶', '鴛鴦'], ['Milk tea', 'Yuenyeung']],
  [['迪士尼', '海洋公園'], ['Disneyland', 'Ocean Park']],
  [['八達通', '信用卡'], ['Octopus card', 'Credit card']],
  [['蛋撻', '菠蘿包'], ['Egg tart', 'Pineapple bun']],
  [['麻雀', '撲克'], ['Mahjong', 'Poker']],
  [['颱風', '暴雨'], ['Typhoon', 'Rainstorm']],
  [['維港', '太平山'], ['Victoria Harbour', 'The Peak']],
  [['叉燒', '燒鵝'], ['Char siu', 'Roast goose']],
  [['WhatsApp', 'Instagram'], ['WhatsApp', 'Instagram']],
  [['近視', '老花'], ['Short-sighted', 'Long-sighted']],
  [['牙膏', '洗面奶'], ['Toothpaste', 'Face wash']],
  [['冷氣', '風扇'], ['Air conditioner', 'Fan']],
  [['考試', '測驗'], ['Exam', 'Quiz']],
  [['男朋友', '前度'], ['Boyfriend', 'Ex']],
  [['自助餐', '放題'], ['Buffet', 'All-you-can-eat']],
  [['外賣', '堂食'], ['Takeaway', 'Dine-in']],
  [['筷子', '叉'], ['Chopsticks', 'Fork']],
  [['日本', '韓國'], ['Japan', 'Korea']],
  [['貓', '狗'], ['Cat', 'Dog']],
  [['西瓜', '哈密瓜'], ['Watermelon', 'Cantaloupe']],
  [['跑步機', '單車機'], ['Treadmill', 'Exercise bike']],
  [['雪櫃', '冰格'], ['Fridge', 'Freezer']],
  [['唱K', '卡拉OK'], ['Karaoke room', 'Karaoke bar']],
  [['醫生', '牙醫'], ['Doctor', 'Dentist']],
  [['結婚', '訂婚'], ['Wedding', 'Engagement']],
  [['雨傘', '太陽傘'], ['Umbrella', 'Parasol']],
  [['口罩', '眼罩'], ['Face mask', 'Eye mask']],
];

// Spectrum cards for Wavelength: [left end, right end] in zh and en.
export const SPECTRA = [
  [['冷', '熱'], ['Cold', 'Hot']],
  [['難吃', '好吃'], ['Tastes bad', 'Tastes good']],
  [['沒用', '有用'], ['Useless', 'Useful']],
  [['便宜', '昂貴'], ['Cheap', 'Expensive']],
  [['悶', '刺激'], ['Boring', 'Exciting']],
  [['軟', '硬'], ['Soft', 'Hard']],
  [['安全', '危險'], ['Safe', 'Dangerous']],
  [['過時', '潮流'], ['Out of fashion', 'Trendy']],
  [['容易', '困難'], ['Easy', 'Hard to do']],
  [['小眾', '大眾'], ['Niche', 'Mainstream']],
  [['健康', '不健康'], ['Healthy', 'Unhealthy']],
  [['醜', '靚'], ['Ugly', 'Beautiful']],
  [['安靜', '嘈吵'], ['Quiet', 'Loud']],
  [['慢', '快'], ['Slow', 'Fast']],
  [['恐怖', '可愛'], ['Scary', 'Cute']],
  [['被高估', '被低估'], ['Overrated', 'Underrated']],
  [['小朋友喜歡', '大人喜歡'], ['Kids like it', 'Adults like it']],
  [['香港', '外國'], ['Feels Hong Kong', 'Feels foreign']],
  [['真實', '虛構'], ['Real', 'Fictional']],
  [['必需品', '奢侈品'], ['Necessity', 'Luxury']],
  [['臭', '香'], ['Smells bad', 'Smells good']],
  [['短命', '長壽'], ['Short-lived', 'Long-lasting']],
  [['低科技', '高科技'], ['Low-tech', 'High-tech']],
  [['正常', '古怪'], ['Normal', 'Weird']],
  [['淡', '濃味'], ['Bland', 'Strong flavour']],
  [['輕', '重'], ['Light', 'Heavy']],
  [['普通', '傳奇'], ['Ordinary', 'Legendary']],
  [['室內', '戶外'], ['Indoor', 'Outdoor']],
  [['好人', '壞人'], ['Hero', 'Villain']],
  [['休閒', '正式'], ['Casual', 'Formal']],
];

// Single words for Insider.
export const INSIDER_WORDS = [
  ['長頸鹿', 'Giraffe'], ['企鵝', 'Penguin'], ['火山', 'Volcano'], ['彩虹', 'Rainbow'], ['金字塔', 'Pyramid'],
  ['潛水艇', 'Submarine'], ['機械人', 'Robot'], ['恐龍', 'Dinosaur'], ['太空人', 'Astronaut'], ['雪人', 'Snowman'],
  ['燈塔', 'Lighthouse'], ['海盜', 'Pirate'], ['外星人', 'Alien'], ['過山車', 'Roller coaster'], ['沙漠', 'Desert'],
  ['熱氣球', 'Hot-air balloon'], ['吸塵機', 'Vacuum cleaner'], ['降落傘', 'Parachute'], ['萬里長城', 'Great Wall'], ['鉛筆', 'Pencil'],
  ['西瓜', 'Watermelon'], ['牙醫', 'Dentist'], ['摩天輪', 'Ferris wheel'], ['蜘蛛', 'Spider'], ['冰箱', 'Refrigerator'],
  ['地球儀', 'Globe'], ['望遠鏡', 'Telescope'], ['鱷魚', 'Crocodile'], ['煙花', 'Fireworks'], ['吸管', 'Drinking straw'],
  ['馬拉松', 'Marathon'], ['廚師', 'Chef'], ['相機', 'Camera'], ['城堡', 'Castle'], ['八爪魚', 'Octopus'],
  ['風車', 'Windmill'], ['仙人掌', 'Cactus'], ['鬧鐘', 'Alarm clock'], ['帳篷', 'Tent'], ['魔法棒', 'Magic wand'],
  ['奧運', 'Olympics'], ['郵差', 'Mail carrier'], ['迷宮', 'Maze'], ['蠟燭', 'Candle'], ['鑽石', 'Diamond'],
  ['袋鼠', 'Kangaroo'], ['颱風', 'Typhoon'], ['滑板', 'Skateboard'], ['耳機', 'Headphones'], ['蜂蜜', 'Honey'],
  ['警車', 'Police car'], ['芝士', 'Cheese'], ['獨角獸', 'Unicorn'], ['醫院', 'Hospital'], ['書包', 'School bag'],
  ['貓頭鷹', 'Owl'], ['樂高', 'LEGO'], ['游泳', 'Swimming'], ['紅綠燈', 'Traffic light'], ['飛碟', 'UFO'],
];

// Spyfall locations: [中文, English]
export const SPYFALL_LOCATIONS = [
  ['機場', 'Airport'], ['銀行', 'Bank'], ['海灘', 'Beach'], ['賭場', 'Casino'], ['馬戲團', 'Circus tent'],
  ['學校', 'School'], ['醫院', 'Hospital'], ['酒店', 'Hotel'], ['軍事基地', 'Military base'], ['電影片場', 'Movie studio'],
  ['郵輪', 'Cruise ship'], ['客機', 'Passenger plane'], ['潛水艇', 'Submarine'], ['太空站', 'Space station'], ['警察局', 'Police station'],
  ['餐廳', 'Restaurant'], ['超級市場', 'Supermarket'], ['劇院', 'Theater'], ['大學', 'University'], ['教堂', 'Church'],
  ['海盜船', 'Pirate ship'], ['極地科研站', 'Polar station'], ['水療中心', 'Day spa'], ['大使館', 'Embassy'], ['火車', 'Passenger train'],
  ['公司派對', 'Office party'], ['遊樂園', 'Theme park'], ['茶餐廳', 'Hong Kong café'], ['夜市', 'Night market'], ['演唱會', 'Concert'],
  ['健身室', 'Gym'], ['圖書館', 'Library'], ['動物園', 'Zoo'], ['婚禮', 'Wedding'], ['滑雪場', 'Ski resort'],
  ['博物館', 'Museum'], ['消防局', 'Fire station'], ['卡拉OK', 'Karaoke'], ['露營地', 'Campsite'], ['麻雀館', 'Mahjong parlour'],
];

// Topic cards with 16 words each (The Chameleon, Fake Artist, Charades, Codenames).
export const TOPICS = [
  { name: ['動物', 'Animals'], words: [
    ['獅子', 'Lion'], ['大象', 'Elephant'], ['企鵝', 'Penguin'], ['長頸鹿', 'Giraffe'], ['熊貓', 'Panda'], ['袋鼠', 'Kangaroo'],
    ['海豚', 'Dolphin'], ['猴子', 'Monkey'], ['兔子', 'Rabbit'], ['蛇', 'Snake'], ['鱷魚', 'Crocodile'], ['貓頭鷹', 'Owl'],
    ['斑馬', 'Zebra'], ['烏龜', 'Turtle'], ['老虎', 'Tiger'], ['八爪魚', 'Octopus']] },
  { name: ['食物', 'Food'], words: [
    ['薄餅', 'Pizza'], ['漢堡包', 'Burger'], ['壽司', 'Sushi'], ['拉麵', 'Ramen'], ['餃子', 'Dumplings'], ['炒飯', 'Fried rice'],
    ['蛋撻', 'Egg tart'], ['菠蘿包', 'Pineapple bun'], ['熱狗', 'Hot dog'], ['沙律', 'Salad'], ['牛扒', 'Steak'], ['咖喱', 'Curry'],
    ['雪糕', 'Ice cream'], ['朱古力', 'Chocolate'], ['意大利粉', 'Spaghetti'], ['點心', 'Dim sum']] },
  { name: ['運動', 'Sports'], words: [
    ['足球', 'Soccer'], ['籃球', 'Basketball'], ['網球', 'Tennis'], ['游泳', 'Swimming'], ['乒乓球', 'Table tennis'], ['羽毛球', 'Badminton'],
    ['高爾夫球', 'Golf'], ['拳擊', 'Boxing'], ['滑雪', 'Skiing'], ['衝浪', 'Surfing'], ['排球', 'Volleyball'], ['棒球', 'Baseball'],
    ['馬拉松', 'Marathon'], ['攀石', 'Rock climbing'], ['單車', 'Cycling'], ['柔道', 'Judo']] },
  { name: ['職業', 'Jobs'], words: [
    ['醫生', 'Doctor'], ['老師', 'Teacher'], ['廚師', 'Chef'], ['警察', 'Police officer'], ['消防員', 'Firefighter'], ['機師', 'Pilot'],
    ['律師', 'Lawyer'], ['記者', 'Reporter'], ['歌手', 'Singer'], ['魔術師', 'Magician'], ['牙醫', 'Dentist'], ['太空人', 'Astronaut'],
    ['農夫', 'Farmer'], ['理髮師', 'Barber'], ['偵探', 'Detective'], ['程式員', 'Programmer']] },
  { name: ['地方', 'Places'], words: [
    ['醫院', 'Hospital'], ['學校', 'School'], ['機場', 'Airport'], ['海灘', 'Beach'], ['戲院', 'Cinema'], ['動物園', 'Zoo'],
    ['圖書館', 'Library'], ['超級市場', 'Supermarket'], ['博物館', 'Museum'], ['遊樂園', 'Theme park'], ['健身室', 'Gym'], ['教堂', 'Church'],
    ['監獄', 'Prison'], ['農場', 'Farm'], ['火車站', 'Train station'], ['銀行', 'Bank']] },
  { name: ['交通工具', 'Transport'], words: [
    ['巴士', 'Bus'], ['的士', 'Taxi'], ['地鐵', 'Subway'], ['飛機', 'Airplane'], ['直升機', 'Helicopter'], ['單車', 'Bicycle'],
    ['電單車', 'Motorbike'], ['帆船', 'Sailboat'], ['潛水艇', 'Submarine'], ['火箭', 'Rocket'], ['熱氣球', 'Hot-air balloon'], ['電車', 'Tram'],
    ['救護車', 'Ambulance'], ['消防車', 'Fire truck'], ['纜車', 'Cable car'], ['滑板', 'Skateboard']] },
  { name: ['電器用品', 'Gadgets'], words: [
    ['手機', 'Phone'], ['電視', 'TV'], ['雪櫃', 'Fridge'], ['洗衣機', 'Washing machine'], ['微波爐', 'Microwave'], ['風筒', 'Hair dryer'],
    ['吸塵機', 'Vacuum cleaner'], ['相機', 'Camera'], ['耳機', 'Headphones'], ['手提電腦', 'Laptop'], ['冷氣機', 'Air conditioner'], ['電飯煲', 'Rice cooker'],
    ['遊戲機', 'Game console'], ['電風扇', 'Electric fan'], ['鬧鐘', 'Alarm clock'], ['打印機', 'Printer']] },
  { name: ['節日', 'Festivals'], words: [
    ['農曆新年', 'Lunar New Year'], ['聖誕節', 'Christmas'], ['中秋節', 'Mid-Autumn Festival'], ['端午節', 'Dragon Boat Festival'], ['萬聖節', 'Halloween'], ['情人節', "Valentine's Day"],
    ['復活節', 'Easter'], ['生日', 'Birthday'], ['婚禮', 'Wedding'], ['畢業禮', 'Graduation'], ['除夕', "New Year's Eve"], ['感恩節', 'Thanksgiving'],
    ['母親節', "Mother's Day"], ['元宵節', 'Lantern Festival'], ['清明節', 'Qingming Festival'], ['愚人節', "April Fools' Day"]] },
  { name: ['衣物', 'Clothing'], words: [
    ['帽', 'Hat'], ['眼鏡', 'Glasses'], ['頸巾', 'Scarf'], ['手套', 'Gloves'], ['波鞋', 'Sneakers'], ['拖鞋', 'Slippers'],
    ['西裝', 'Suit'], ['裙', 'Dress'], ['牛仔褲', 'Jeans'], ['T恤', 'T-shirt'], ['外套', 'Jacket'], ['泳衣', 'Swimsuit'],
    ['睡衣', 'Pyjamas'], ['領帶', 'Tie'], ['皮帶', 'Belt'], ['襪', 'Socks']] },
  { name: ['樂器', 'Instruments'], words: [
    ['鋼琴', 'Piano'], ['結他', 'Guitar'], ['小提琴', 'Violin'], ['鼓', 'Drums'], ['長笛', 'Flute'], ['色士風', 'Saxophone'],
    ['小號', 'Trumpet'], ['大提琴', 'Cello'], ['口琴', 'Harmonica'], ['豎琴', 'Harp'], ['二胡', 'Erhu'], ['琵琶', 'Pipa'],
    ['木琴', 'Xylophone'], ['手風琴', 'Accordion'], ['烏克麗麗', 'Ukulele'], ['三角鐵', 'Triangle']] },
  { name: ['童話人物', 'Fairy tales'], words: [
    ['白雪公主', 'Snow White'], ['灰姑娘', 'Cinderella'], ['小紅帽', 'Little Red Riding Hood'], ['彼得潘', 'Peter Pan'], ['美人魚', 'Little Mermaid'], ['睡公主', 'Sleeping Beauty'],
    ['木偶奇遇記', 'Pinocchio'], ['三隻小豬', 'Three Little Pigs'], ['孫悟空', 'Monkey King'], ['阿拉丁', 'Aladdin'], ['愛麗絲', 'Alice'], ['長髮公主', 'Rapunzel'],
    ['醜小鴨', 'Ugly Duckling'], ['小飛象', 'Dumbo'], ['龜兔賽跑', 'Tortoise and Hare'], ['美女與野獸', 'Beauty and the Beast']] },
  { name: ['天氣自然', 'Nature'], words: [
    ['彩虹', 'Rainbow'], ['颱風', 'Typhoon'], ['雪', 'Snow'], ['閃電', 'Lightning'], ['火山', 'Volcano'], ['瀑布', 'Waterfall'],
    ['沙漠', 'Desert'], ['森林', 'Forest'], ['月亮', 'Moon'], ['太陽', 'Sun'], ['星星', 'Star'], ['地震', 'Earthquake'],
    ['海浪', 'Wave'], ['冰川', 'Glacier'], ['霧', 'Fog'], ['島', 'Island']] },
];

// Actions for charades.
export const ACTIONS = [
  ['刷牙', 'Brushing teeth'], ['游泳', 'Swimming'], ['打麻雀', 'Playing mahjong'], ['自拍', 'Taking a selfie'], ['煮麵', 'Cooking noodles'],
  ['放風箏', 'Flying a kite'], ['釣魚', 'Fishing'], ['跳舞', 'Dancing'], ['打噴嚏', 'Sneezing'], ['迫地鐵', 'Squeezing onto the subway'],
  ['唱K', 'Singing karaoke'], ['跑步', 'Running'], ['打保齡球', 'Bowling'], ['洗頭', 'Washing hair'], ['睡覺', 'Sleeping'],
  ['騎馬', 'Riding a horse'], ['彈結他', 'Playing guitar'], ['剪頭髮', 'Cutting hair'], ['換燈泡', 'Changing a light bulb'], ['開車', 'Driving'],
  ['搭過山車', 'Riding a roller coaster'], ['包餃子', 'Making dumplings'], ['做瑜伽', 'Doing yoga'], ['擦窗', 'Cleaning windows'], ['打字', 'Typing'],
  ['吹氣球', 'Blowing up a balloon'], ['爬山', 'Hiking'], ['影相', 'Taking a photo'], ['舞獅', 'Lion dancing'], ['飲珍珠奶茶', 'Drinking bubble tea'],
];

/** A big pool of single words for Codenames-style boards. */
export function wordPool() {
  const seen = new Set();
  const out = [];
  const add = (w) => {
    const k1 = w[0];
    const k2 = w[1].toLowerCase().replace(/s$/, '');
    if (seen.has(k1) || seen.has(k2)) return;
    seen.add(k1); seen.add(k2); out.push(w);
  };
  INSIDER_WORDS.forEach(add);
  TOPICS.forEach((t) => t.words.forEach(add));
  SPYFALL_LOCATIONS.forEach(add);
  UNDERCOVER_PAIRS.forEach(([zh, en]) => { add([zh[0], en[0]]); add([zh[1], en[1]]); });
  return out;
}

// ---- Custom words typed by the players (Settings › Custom words) ----

/** Pairs from "civilian word, undercover word" lines. Returned like UNDERCOVER_PAIRS. */
export function customPairs() {
  return (settings.customPairs || '').split('\n')
    .map((line) => line.split(/[,，、/|]/).map((x) => x.trim()).filter(Boolean))
    .filter((p) => p.length >= 2)
    .map(([a, b]) => [[a, b], [a, b]]);
}

/** Single words, one per line. Returned like INSIDER_WORDS ([zh, en], same text). */
export function customWords() {
  return (settings.customWords || '').split('\n')
    .map((x) => x.trim()).filter(Boolean)
    .map((w) => [w, w]);
}

/** Built-in list plus the players' own words when the option asks for them. */
export function withCustom(list, custom, mode) {
  if (mode === 'custom' && custom.length) return custom;
  if (mode === 'mix') return [...list, ...custom];
  return list;
}
