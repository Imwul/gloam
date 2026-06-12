export interface Weapon {
  name: string;
  nameKo: string;
  wounds: number;
  range: number;
  coins: string;
  swordsReq: number;
  tags: string[];
}

export interface ArmorItem {
  name: string;
  nameKo: string;
  ap: number;
  coins: string;
  swordsReq: number;
  bodyPart: string;
  bodyPartKo: string;
}

export interface TradeGood {
  name: string;
  nameKo: string;
  coins: string;
}

export interface Monster {
  id: number;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  stat: number;
  wounds: number;
  speed: number;
  attacks: string;
  attacksKo: string;
  armor: string;
  armorKo: string;
  weakness?: string;
  weaknessKo?: string;
  talents: string[];
  talentsKo: string[];
}

export interface RulePage {
  pageNumber: number;
  title: string;
  titleKo: string;
  content: string;
}

export const WEAPONS: Weapon[] = [
  { name: "Club", nameKo: "곤봉", wounds: 1, range: 1, coins: "+1", swordsReq: 1, tags: ["Melee", "Blunt"] },
  { name: "Dagger", nameKo: "단검", wounds: 1, range: 1, coins: "-", swordsReq: 1, tags: ["Melee", "Concealed"] },
  { name: "Staff", nameKo: "지팡이", wounds: 1, range: 2, coins: "-", swordsReq: 1, tags: ["Melee", "Blunt"] },
  { name: "Sling", nameKo: "투석구", wounds: 1, range: 3, coins: "-", swordsReq: 1, tags: ["Ranged", "Blunt"] },
  { name: "Axe", nameKo: "도끼", wounds: 1, range: 1, coins: "+2", swordsReq: 2, tags: ["Melee", "Slash"] },
  { name: "Bow", nameKo: "활", wounds: 1, range: 6, coins: "-1", swordsReq: 2, tags: ["Ranged", "Pierce"] },
  { name: "Spear", nameKo: "창", wounds: 2, range: 2, coins: "-1", swordsReq: 2, tags: ["Melee", "Pierce"] },
  { name: "Whip", nameKo: "채찍", wounds: 1, range: 2, coins: "-", swordsReq: 2, tags: ["Melee", "Grab", "Disarm"] },
  { name: "Sword", nameKo: "검", wounds: 2, range: 1, coins: "-2", swordsReq: 3, tags: ["Melee", "Slash"] },
  { name: "Mace", nameKo: "메이스", wounds: 2, range: 1, coins: "-2", swordsReq: 3, tags: ["Melee", "Blunt"] },
  { name: "Crossbow", nameKo: "석궁", wounds: 3, range: 6, coins: "-2", swordsReq: 3, tags: ["Ranged", "Pierce", "Reload"] },
  { name: "Warhammer", nameKo: "전투망치", wounds: 3, range: 1, coins: "-2", swordsReq: 3, tags: ["Melee", "Blunt", "Bulky"] },
  { name: "Greatsword", nameKo: "대검", wounds: 4, range: 2, coins: "-3", swordsReq: 4, tags: ["Melee", "Slash", "Bulky"] },
  { name: "Polearm", nameKo: "폴암", wounds: 3, range: 3, coins: "-3", swordsReq: 4, tags: ["Melee", "Pierce", "Brace"] },
  { name: "Lance", nameKo: "랜스", wounds: 3, range: 3, coins: "-3", swordsReq: 4, tags: ["Melee", "Pierce", "Charge"] }
];

export const ARMOR: ArmorItem[] = [
  { name: "Helmet", nameKo: "투구", ap: 2, coins: "-2", swordsReq: 1, bodyPart: "Head", bodyPartKo: "머리" },
  { name: "Cuirass", nameKo: "흉갑", ap: 3, coins: "-3", swordsReq: 3, bodyPart: "Torso", bodyPartKo: "몸통" },
  { name: "Gambeson", nameKo: "갬비슨", ap: 1, coins: "-1", swordsReq: 1, bodyPart: "Torso", bodyPartKo: "몸통" },
  { name: "Gauntlet L", nameKo: "왼손 건틀릿", ap: 1, coins: "-1", swordsReq: 2, bodyPart: "L. Arm", bodyPartKo: "왼팔" },
  { name: "Gauntlet R", nameKo: "오른손 건틀릿", ap: 1, coins: "-1", swordsReq: 2, bodyPart: "R. Arm", bodyPartKo: "오른팔" },
  { name: "Chainmail", nameKo: "사슬갑옷", ap: 3, coins: "-3", swordsReq: 3, bodyPart: "Torso", bodyPartKo: "몸통" },
  { name: "Greave L", nameKo: "왼발 정강이받이", ap: 2, coins: "-2", swordsReq: 2, bodyPart: "L. Leg", bodyPartKo: "왼다리" },
  { name: "Greave R", nameKo: "오른발 정강이받이", ap: 2, coins: "-2", swordsReq: 2, bodyPart: "R. Leg", bodyPartKo: "오른다리" },
  { name: "Shield", nameKo: "방패", ap: 3, coins: "-3", swordsReq: 1, bodyPart: "Shield", bodyPartKo: "방패" }
];

export const TRADE_GOODS: TradeGood[] = [
  { name: "Abrasive paper", nameKo: "사포", coins: "1" },
  { name: "Arrows (20)", nameKo: "화살 (20발)", coins: "-" },
  { name: "Bear trap", nameKo: "곰 덫", coins: "-3" },
  { name: "Bedroll", nameKo: "침낭", coins: "-1" },
  { name: "Bell", nameKo: "종", coins: "-" },
  { name: "Bellows", nameKo: "풀무", coins: "-1" },
  { name: "Blanket", nameKo: "담요", coins: "-1" },
  { name: "Bottle", nameKo: "병", coins: "-1" },
  { name: "Cage (small)", nameKo: "새장 (소형)", coins: "-3" },
  { name: "Caltrops (100)", nameKo: "마름쇠 (100개)", coins: "-3" },
  { name: "Candle", nameKo: "양초", coins: "-" },
  { name: "Cauldron", nameKo: "가마솥", coins: "-1" },
  { name: "Chain (10 sq)", nameKo: "사슬 (10칸 길이)", coins: "-3" },
  { name: "Chalk", nameKo: "분필", coins: "-" },
  { name: "Chisel", nameKo: "끌", coins: "-1" },
  { name: "Compass", nameKo: "나침반", coins: "-2" },
  { name: "Crowbar", nameKo: "쇠지레", coins: "-1" },
  { name: "Dice", nameKo: "주사위", coins: "-" },
  { name: "Dog", nameKo: "사냥개", coins: "-2" },
  { name: "File", nameKo: "줄 (도구)", coins: "-1" },
  { name: "Fire poker", nameKo: "불쏘시개", coins: "-1" },
  { name: "Flint & Steel", nameKo: "부싯돌과 부쇠", coins: "-1" },
  { name: "Flour", nameKo: "밀가루", coins: "-" },
  { name: "Glue", nameKo: "풀/접착제", coins: "-1" },
  { name: "Grappling Hook", nameKo: "갈고리 닻", coins: "-3" },
  { name: "Hammer", nameKo: "망치", coins: "-1" },
  { name: "Herbs", nameKo: "약초", coins: "-" },
  { name: "Hourglass", nameKo: "모래시계", coins: "-2" },
  { name: "Incense", nameKo: "향", coins: "-" },
  { name: "Iron Spikes (10)", nameKo: "쇠말뚝 (10개)", coins: "-1" },
  { name: "Knife", nameKo: "칼", coins: "-" },
  { name: "Lantern", nameKo: "랜턴", coins: "-1" },
  { name: "Liquor", nameKo: "독주", coins: "-" },
  { name: "Lockpicks", nameKo: "자물쇠따개", coins: "-1" },
  { name: "Manacles", nameKo: "수갑", coins: "-1" },
  { name: "Marbles (100)", nameKo: "구슬 (100개)", coins: "-2" },
  { name: "Mirror", nameKo: "거울", coins: "-3" },
  { name: "Net", nameKo: "그물", coins: "-1" },
  { name: "Oil", nameKo: "기름", coins: "-" },
  { name: "Paper", nameKo: "종이", coins: "-1" },
  { name: "Perfume", nameKo: "향수", coins: "-3" },
  { name: "Pole", nameKo: "장대", coins: "-" },
  { name: "Quill & ink", nameKo: "깃펜과 잉크", coins: "-2" },
  { name: "Rations (7)", nameKo: "휴대 식량 (7일분)", coins: "-" },
  { name: "Rope", nameKo: "밧줄", coins: "-" },
  { name: "Sack", nameKo: "자루", coins: "-" },
  { name: "Saw", nameKo: "톱", coins: "-1" },
  { name: "Snowshoes", nameKo: "설피 (눈신)", coins: "-1" },
  { name: "Soap", nameKo: "비누", coins: "-" },
  { name: "Sponge", nameKo: "스펀지", coins: "-" },
  { name: "Spyglass", nameKo: "망원경", coins: "-3" },
  { name: "Stakes (4)", nameKo: "말뚝 (4개)", coins: "-" },
  { name: "String", nameKo: "실", coins: "-" },
  { name: "Tarp", nameKo: "타르칠한 천 (방수천)", coins: "-1" },
  { name: "Tent", nameKo: "천막", coins: "-" },
  { name: "Torches (3)", nameKo: "횃불 (3개)", coins: "-" },
  { name: "Waterskin", nameKo: "물가죽", coins: "-1" },
  { name: "Wax tablets", nameKo: "밀판 (필기도구)", coins: "-" },
  { name: "Whistle", nameKo: "호루라기", coins: "-" },
  { name: "Wooden chest", nameKo: "나무 상자", coins: "-1" }
];

export const BESTIARY: Monster[] = [
  {
    id: 1, name: "Bandit", nameKo: "도적",
    description: "Highwaymen, robbers, thugs, thieves.",
    descriptionKo: "노상강도, 약탈자, 깡패, 도둑 무리.",
    stat: 2, wounds: 2, speed: 2,
    attacks: "Sword/Bow 1 (1/6 sq)", attacksKo: "검/활 1점 (사거리 1/6칸)",
    armor: "helmet, cuirass", armorKo: "투구, 흉갑 (AP 2)",
    talents: [], talentsKo: []
  },
  {
    id: 2, name: "Banshee", nameKo: "반시",
    description: "Misty undead spirits who roam graveyards and death-touched places. Greatly feared.",
    descriptionKo: "공동묘지나 죽음의 기운이 서린 곳을 배회하는 안개 형태의 언데드령. 큰 공포의 대상입니다.",
    stat: 3, wounds: 2, speed: 1,
    attacks: "None", attacksKo: "없음",
    armor: "N/A", armorKo: "없음",
    weakness: "fire", weaknessKo: "불",
    talents: ["Deadly shriek (2 sq)"], talentsKo: ["치명적인 비명 (범위 2칸)"]
  },
  {
    id: 3, name: "Barghest", nameKo: "바게스트",
    description: "Clever shapeshifting demons that live among goblins. They grow more powerful the more peasants they eat.",
    descriptionKo: "고블린 사이에 섞여 사는 영악한 형상변환 악마. 농민을 많이 잡아먹을수록 강해집니다.",
    stat: 2, wounds: 3, speed: 2, // 2 in goblin form, 4 in canine form
    attacks: "Bite 1 (1 sq)", attacksKo: "물기 1점 (사거리 1칸)",
    armor: "None", armorKo: "없음",
    talents: ["Shapechange", "Levitate", "Illusion", "Teleport", "Charm"],
    talentsKo: ["형상변환 (고블린/사냥개)", "공중부양", "환각", "순간이동", "매혹"]
  },
  {
    id: 4, name: "Basilisk", nameKo: "바실리스크",
    description: "Eight-legged magical lizards with a petrifying gaze.",
    descriptionKo: "석화의 시선을 지닌 여덟 다리의 마법 도마뱀.",
    stat: 3, wounds: 6, speed: 2,
    attacks: "Bite 2 (1 sq)", attacksKo: "물기 2점 (사거리 1칸)",
    armor: "scales (torso)", armorKo: "비늘 (몸통 AP 2)",
    talents: ["Petrify (8 sq)"], talentsKo: ["석화 시선 (범위 8칸)"]
  },
  {
    id: 5, name: "Blood Asp", nameKo: "블러드 애스프 (핏빛 독사)",
    description: "Giant vipers that like to play with their food.",
    descriptionKo: "먹잇감을 가지고 노는 것을 좋아하는 거대한 살무사.",
    stat: 8, wounds: 8, speed: 4,
    attacks: "Strike 3 (3 sq)", attacksKo: "덮치기 3점 (사거리 3칸)",
    armor: "scales (entire body)", armorKo: "비늘 (전신 AP 2)",
    talents: ["Deadly Venom", "Constrict", "Mock"],
    talentsKo: ["치명적인 독", "조이기", "조롱"]
  },
  {
    id: 6, name: "Clurichaun", nameKo: "클루라칸",
    description: "Diminutive, mean, wine-addled fairies who are the scourge of brewers and tavern-keepers everywhere.",
    descriptionKo: "술에 찌든 작고 심술궂은 요정으로, 양조업자와 선술집 주인들의 주적입니다.",
    stat: 3, wounds: 5, speed: 2,
    attacks: "Dagger 1 (1 sq)", attacksKo: "단검 1점 (사거리 1칸)",
    armor: "None", armorKo: "없음",
    talents: ["Invisibility", "Word of Opening Doors"],
    talentsKo: ["투명화", "문 열기 주문"]
  },
  {
    id: 7, name: "Dragon", nameKo: "드래곤",
    description: "Vain, greedy, terrifying creatures of myth.",
    descriptionKo: "허영심 많고 탐욕스러우며 무시무시한 신화 속의 괴수.",
    stat: 10, wounds: 12, speed: 6,
    attacks: "Claw 4 (1 sq), Bite 5 (1 sq)", attacksKo: "발톱 4점 (1칸), 물기 5점 (1칸)",
    armor: "iron scales (entire body)", armorKo: "무쇠 비늘 (전신 AP 2)",
    talents: ["Firebreath (6 sq)", "Overwhelming Roar"],
    talentsKo: ["화염 브레스 (범위 6칸)", "압도적인 포효"]
  },
  {
    id: 8, name: "Giant", nameKo: "거인",
    description: "Big, dumb, and strong.",
    descriptionKo: "몸집이 거대하고 멍청하며 힘이 셉니다.",
    stat: 4, wounds: 6, speed: 4,
    attacks: "Club 3 (2 sq)", attacksKo: "곤봉 3점 (사거리 2칸)",
    armor: "wooden greaves", armorKo: "나무 정강이받이 (다리 AP 2)",
    talents: ["Grab"], talentsKo: ["붙잡기"]
  },
  {
    id: 9, name: "Goblin", nameKo: "고블린",
    description: "Small chaotic troglodytes who hate humans and have a disturbing sense of humor.",
    descriptionKo: "인간을 증오하며 기괴한 유머 감각을 가진 무질서하고 작은 혈거인.",
    stat: 1, wounds: 1, speed: 3,
    attacks: "Cleaver 1 (1 sq)", attacksKo: "식칼 1점 (사거리 1칸)",
    armor: "helmet", armorKo: "투구",
    talents: ["Call Reinforcement"], talentsKo: ["지원군 호출"]
  },
  {
    id: 10, name: "Harpy", nameKo: "하피",
    description: "Birds of prey with twisted human faces.",
    descriptionKo: "뒤틀린 인간 얼굴을 지닌 맹금류.",
    stat: 1, wounds: 2, speed: 6,
    attacks: "Talons 1 (1 sq)", attacksKo: "발톱 1점 (사거리 1칸)",
    armor: "none", armorKo: "없음",
    talents: ["Mimic Voice"], talentsKo: ["목소리 흉내"]
  },
  {
    id: 11, name: "Hag", nameKo: "해그",
    description: "Scheming swamp-dwellers who practice black magick and eat children. They cannot pass up a good bargain.",
    descriptionKo: "검은 마법을 부리고 아이를 잡아먹는 음흉한 늪지 거주자. 좋은 거래를 그냥 지나치지 못합니다.",
    stat: 4, wounds: 6, speed: 3,
    attacks: "Claws 2 (1 sq)", attacksKo: "발톱 2점 (사거리 1칸)",
    armor: "none", armorKo: "없음",
    talents: ["Mimic Voice", "Invisibility", "Breathe Water", "Weaken"],
    talentsKo: ["목소리 흉내", "투명화", "수중 호흡", "약화"]
  },
  {
    id: 12, name: "Lycanthrope", nameKo: "라이칸스로프",
    description: "Men and women whose heinous actions manifested in a monstrous, bloodthirsty second form.",
    descriptionKo: "끔찍한 행위가 피에 굶주린 괴물의 두 번째 형상으로 드러난 사람들.",
    stat: 5, wounds: 4, speed: 5,
    attacks: "Bite 3 (1 sq), Slash 4 (1 sq)", attacksKo: "물기 3점 (1칸), 할퀴기 4점 (1칸)",
    armor: "none", armorKo: "없음",
    weakness: "silver", weaknessKo: "은",
    talents: ["Shapechange", "Great Leap", "Transmit Lycanthropy"],
    talentsKo: ["형상변환", "거대한 도약", "라이칸스로프 감염"]
  },
  {
    id: 13, name: "Oathbreaker", nameKo: "배역자 (기사 서약 파기자)",
    description: "Gave up on being chivalrous long ago.",
    descriptionKo: "오래전에 기사도를 저버리고 타락한 옛 기사들.",
    stat: 6, wounds: 6, speed: 6,
    attacks: "Sword 3 (1 sq)", attacksKo: "검 3점 (사거리 1칸)",
    armor: "full plate (fully armored)", armorKo: "전신 판금 갑옷 (완전 무장)",
    talents: ["Sally Forth", "Mock", "Martial Dominance"],
    talentsKo: ["과감한 돌격", "조롱", "전투 지배"]
  },
  {
    id: 14, name: "Pixy", nameKo: "픽시",
    description: "Tiny fey with insect wings and a knack for mischief.",
    descriptionKo: "곤충의 날개를 가졌고 장난에 특화된 초소형 요정.",
    stat: 3, wounds: 1, speed: 7,
    attacks: "Needle 1 (1 sq)", attacksKo: "바늘 1점 (사거리 1칸)",
    armor: "None", armorKo: "없음",
    talents: ["Induce Sleep", "Charm", "Evade", "Disappear"],
    talentsKo: ["수면 유도", "매혹", "회피", "사라지기"]
  },
  {
    id: 15, name: "Redcap", nameKo: "레드캡",
    description: "Gaunt, murderous fairies with blood-soaked caps.",
    descriptionKo: "희생자의 피로 모자를 붉게 물들이는 수척하고 살인적인 요정.",
    stat: 3, wounds: 3, speed: 3,
    attacks: "Axe 2 (1 sq)", attacksKo: "도끼 2점 (사거리 1칸)",
    armor: "helmet, cuirass, gauntlets", armorKo: "투구, 흉갑, 건틀릿 (AP 2)",
    talents: ["Leech", "Tackle"],
    talentsKo: ["생명력 흡수", "태클"]
  },
  {
    id: 16, name: "Restless Dead", nameKo: "떠도는 시체들",
    description: "Skeletons, zombies, bog-men, ghouls.",
    descriptionKo: "스켈레톤, 좀비, 늪지 미라, 구울 등 안식에 들지 못한 망자.",
    stat: 2, wounds: 2, speed: 2,
    attacks: "Claws/Bite 1 (1 sq)", attacksKo: "발톱/물기 1점 (사거리 1칸)",
    armor: "varies", armorKo: "상황에 따라 다름 (AP 2)",
    talents: ["Strangle"],
    talentsKo: ["목 조르기"]
  },
  {
    id: 17, name: "Scarecrow", nameKo: "허수아비",
    description: "Animated by the Gloaming. Having killed their farmers long ago, they wander the fields for prey.",
    descriptionKo: "황혼(Gloaming)의 기운으로 생명을 얻은 존재. 오래전 자신들의 주인을 살해하고 들판을 배회하며 사냥감을 찾습니다.",
    stat: 6, wounds: 6, speed: 2,
    attacks: "Whack 3 (1 sq)", attacksKo: "강타 3점 (사거리 1칸)",
    armor: "None", armorKo: "없음",
    weakness: "fire", weaknessKo: "불",
    talents: ["Summon Murder"],
    talentsKo: ["까마귀 떼 소환"]
  },
  {
    id: 18, name: "Shade", nameKo: "셰이드",
    description: "Evil incorporeal manifestations of the Gloaming.",
    descriptionKo: "황혼의 사악한 비물질 현현.",
    stat: 2, wounds: 3, speed: 4,
    attacks: "Tendrils 1 (2 sq)", attacksKo: "그림자 촉수 1점 (사거리 2칸)",
    armor: "none", armorKo: "없음",
    weakness: "light", weaknessKo: "빛",
    talents: ["Possess", "Teleport to Shadow", "Slow"],
    talentsKo: ["빙의", "그림자로 순간이동", "감속"]
  },
  {
    id: 19, name: "Troll", nameKo: "트롤",
    description: "Large guardians of the Otherworld that delight in asking riddles. They expect the correct answer.",
    descriptionKo: "수수께끼 내기를 매우 즐기는 저편 세계(Otherworld)의 거대한 수호자. 올바른 답을 듣기 전에는 길을 비켜주지 않습니다.",
    stat: 4, wounds: 4, speed: 4,
    attacks: "Club 4 (2 sq)", attacksKo: "곤봉 4점 (사거리 2칸)",
    armor: "helmet, cuirass, gauntlets", armorKo: "투구, 흉갑, 건틀릿 (AP 2)",
    talents: ["Regenerate Wound"],
    talentsKo: ["부상 재생"]
  },
  {
    id: 20, name: "Wicker Man", nameKo: "위커맨 (고리버들 거인)",
    description: "Mirthless giants woven of twigs and sticks. They collect peasants by placing them in their hollow chests.",
    descriptionKo: "가지와 막대를 엮어 만든 웃음기 없는 거인. 속이 빈 몸통 속에 희생자를 가두어 수집합니다.",
    stat: 4, wounds: 5, speed: 4,
    attacks: "Stomp 4 (2 sq)", attacksKo: "밟기 4점 (사거리 2칸)",
    armor: "wicker shell (full body)", armorKo: "버들 껍데기 (전신 AP 2)",
    weakness: "fire", weaknessKo: "불",
    talents: ["Collect", "Spontaneous Combustion"],
    talentsKo: ["잡아가두기", "자연 발화"]
  },
  {
    id: 21, name: "Woodwose", nameKo: "우드워즈 (숲의 야인)",
    description: "Tall, simple folk who live in secluded forests and mostly keep to themselves. Defend themselves if threatened.",
    descriptionKo: "외딴 숲속에 조용히 은둔해 사는 몸집이 크고 소박한 야인 무리. 위협받을 때만 자신을 방어합니다.",
    stat: 3, wounds: 6, speed: 3,
    attacks: "Club 2 (1 sq)", attacksKo: "곤봉 2점 (사거리 1칸)",
    armor: "moss (torso)", armorKo: "이끼 보호막 (몸통 AP 2)",
    talents: ["Meld into Foliage"],
    talentsKo: ["수풀 속 동화"]
  }
];

export const ARCANE_MINOR_WORDS: { [suit: string]: { [key: string]: { en: string; ko: string } } } = {
  Cups: {
    "A": { en: "Fill", ko: "채우다" },
    "2": { en: "Attract", ko: "끌어당기다" },
    "3": { en: "Delight", ko: "기쁘게 하다" },
    "4": { en: "Protect from", ko: "대비해 보호하다" },
    "5": { en: "Disintegrate", ko: "붕괴하다" },
    "6": { en: "Mend", ko: "치유/수리하다" },
    "7": { en: "Conjure", ko: "소환하다" },
    "8": { en: "Weaken", ko: "약화시키다" },
    "9": { en: "Solidify/liquefy", ko: "고체화/액체화" },
    "10": { en: "Calm", ko: "진정시키다" },
    "P": { en: "Speak with", ko: "대화하다" },
    "Kn": { en: "Charm", ko: "매혹하다" },
    "Q": { en: "Heal", ko: "치료하다" },
    "K": { en: "Become", ko: "~이 되다" }
  },
  Wands: {
    "A": { en: "Energize", ko: "활성화하다" },
    "2": { en: "Change", ko: "변화하다" },
    "3": { en: "Grow", ko: "성장하다" },
    "4": { en: "Gather", ko: "수집하다" },
    "5": { en: "Enrage", ko: "분노하게 하다" },
    "6": { en: "Conquer", ko: "정복하다" },
    "7": { en: "Control", ko: "통제하다" },
    "8": { en: "Quick", ko: "가속하다" },
    "9": { en: "Toughen", ko: "단단하게 하다" },
    "10": { en: "Command", ko: "명령하다" },
    "P": { en: "Release", ko: "해방하다" },
    "Kn": { en: "Incite", ko: "선동하다" },
    "Q": { en: "Heat", ko: "가열하다" },
    "K": { en: "Create", ko: "창조하다" }
  },
  Swords: {
    "A": { en: "Explode", ko: "폭발하다" },
    "2": { en: "Hide", ko: "숨기다" },
    "3": { en: "Afflict", ko: "괴롭히다" },
    "4": { en: "Silence", ko: "침묵하다" },
    "5": { en: "Intimidate", ko: "위협하다" },
    "6": { en: "Teleport", ko: "순간이동" },
    "7": { en: "Steal", ko: "훔치다" },
    "8": { en: "Ensnare", ko: "함정에 빠뜨리다" },
    "9": { en: "Discourage", ko: "좌절시키다" },
    "10": { en: "Defeat", ko: "패배시키다" },
    "P": { en: "Transmute", ko: "변형하다" },
    "Kn": { en: "Force", ko: "강제하다" },
    "Q": { en: "Detect", ko: "탐지하다" },
    "K": { en: "Comprehend", ko: "이해하다" }
  },
  Coins: {
    "A": { en: "Give", ko: "주다" },
    "2": { en: "Balance", ko: "균형을 맞추다" },
    "3": { en: "Combine", ko: "결합하다" },
    "4": { en: "Take", ko: "취하다" },
    "5": { en: "Isolate", ko: "고립시키다" },
    "6": { en: "Share", ko: "공유하다" },
    "7": { en: "Harvest", ko: "수확하다" },
    "8": { en: "Sculpt", ko: "조각하다" },
    "9": { en: "Summon", ko: "소환하다" },
    "10": { en: "Transcend", ko: "초월하다" },
    "P": { en: "Enthrall", ko: "매료시키다" },
    "Kn": { en: "Slow", ko: "감속하다" },
    "Q": { en: "Protect", ko: "보호하다" },
    "K": { en: "Multiply", ko: "증식시키다" }
  }
};

export const ARCANE_MAJOR_WORDS: { [key: string]: { en: string; ko: string; revEn: string; revKo: string } } = {
  "0": { en: "Self", ko: "자신", revEn: "Distraction", revKo: "주의 산만" },
  "I": { en: "Mind", ko: "정신", revEn: "Illusion", revKo: "환상" },
  "II": { en: "Consciousness", ko: "의식", revEn: "Voice", revKo: "목소리" },
  "III": { en: "Beauty", ko: "미", revEn: "Ugliness", revKo: "추함" },
  "IV": { en: "Authority", ko: "권위", revEn: "Ice", revKo: "얼음" },
  "V": { en: "Knowledge", ko: "지식", revEn: "Ignorance", revKo: "무지" },
  "VI": { en: "Temptation", ko: "유혹", revEn: "Conflict", revKo: "갈등" },
  "VII": { en: "Metal", ko: "금속", revEn: "Barrier", revKo: "장벽" },
  "VIII": { en: "Strength", ko: "힘", revEn: "Weakness", revKo: "약함" },
  "IX": { en: "Person", ko: "인물", revEn: "Isolation", revKo: "고독" },
  "X": { en: "Fate", ko: "운명", revEn: "Delay", revKo: "지체" },
  "XI": { en: "Truth", ko: "진실", revEn: "Blood", revKo: "피" },
  "XII": { en: "Flesh", ko: "육체", revEn: "Emptiness", revKo: "공허" },
  "XIII": { en: "Death", ko: "죽음", revEn: "Life", revKo: "생명" },
  "XIV": { en: "Water", ko: "물", revEn: "Imbalance", revKo: "불균형" },
  "XV": { en: "Pain", ko: "고통", revEn: "Control", revKo: "제어" },
  "XVI": { en: "Earth", ko: "대지", revEn: "Chaos", revKo: "혼돈" },
  "XVII": { en: "Faith", ko: "믿음", revEn: "Time", revKo: "시간" },
  "XVIII": { en: "Beast", ko: "야수", revEn: "Secret", revKo: "비밀" },
  "XIX": { en: "Light", ko: "빛", revEn: "Sorrow", revKo: "슬픔" },
  "XX": { en: "Undead", ko: "언데드", revEn: "Purpose", revKo: "목적" },
  "XXI": { en: "Fire", ko: "불", revEn: "Darkness", revKo: "어둠" }
};

export const WILDERNESS_EVENTS = [
  "강한 돌풍이 붑니다 (Strong gust of wind)",
  "미세한 진동이 새들을 놀라게 합니다 (Faint tremor startles birds)",
  "요정의 고리, 푸르른 초원을 발견합니다 (Fairy circle, verdant meadow)",
  "폭풍우 구름이 몰려오고 천둥이 칩니다 (Storm clouds roll in; thunder)",
  "구름이 물러가고 빛이 쏟아집니다 (Clouds recede/light breaks)",
  "숲 속으로 이어지는 발자국을 발견합니다 (Footprints leading into woods)",
  "싸움이 치열했던 흔적을 발견합니다 (Signs of a struggle)",
  "버려진 귀족의 말을 발견합니다 (Noble's horse, abandoned)",
  "아늑한 오두막이 있지만 아무도 없습니다 (Cozy cottage, nobody home)",
  "물건을 파는 이동식 상인을 만납니다 (Traveling merchant, selling)",
  "어느 한적한 야영지에서 겸손한 땜장이를 만납니다 (Humble tinker at their camp)",
  "말을 타고 가던 부상당한 기사를 만납니다 (Wounded knight riding horse)",
  "마차가 기습 공격을 받고 있습니다 (Caravan under an ambush)",
  "고대 선돌(Standing stones)을 발견합니다 (Ancient standing stones)",
  "길가의 활기찬 선술집을 발견합니다 (Lively roadside tavern)",
  "지도에 없는 작은 부락을 마주합니다 (Tiny hamlet not on maps)",
  "동전을 요구하는 강도 떼를 마주합니다 (Bandits demanding coin)",
  "유령이 출몰하는 무덤을 발견합니다 (Haunted graveyard)",
  "바실리스크 둥지 동굴에 갇힌 사람을 발견합니다 (NPC trapped in Basilisk cave)",
  "강도 떼로부터 기습 공격을 받습니다 (PCs are ambushed by bandits)",
  "퀘스트와 관련된 중대한 단서나 이정표를 발견합니다 (Milestone/clue for quest)"
];

export const DUNGEON_EVENTS = [
  "주변 영역에서 모든 색채가 빠져나갑니다 (Color drains from the area)",
  "압도적인 어둠이 내려앉습니다 (Overwhelming darkness)",
  "저 멀리서 의문의 발소리가 반사되어 울립니다 (Extra footsteps echo far off)",
  "급하게 흐르는 물소리가 들립니다 (Sound of rushing water)",
  "시체가 부패해 가는 방을 마주합니다 (Chamber of rotting corpses)",
  "고블린 정찰병이 몰래 아군을 지켜봅니다 (Goblin scouts watch PCs)",
  "거대한 틈새가 길을 막아섭니다 (Wide chasm blocks the path)",
  "지상으로 통하는 좁은 환기구를 발견합니다 (Narrow shaft to the surface)",
  "방금 꺼진 듯 연기가 피어오르는 모닥불 터를 발견합니다 (Smoldering fire pit, recent)",
  "우리 속에 갇혀 구출을 요청하는 드워프를 발견합니다 (Caged dwarf needs rescue)",
  "찰칵하는 소리와 함께 함정이 작동했음을 직감합니다 (A click alerts you of a trap)",
  "비술을 제조 중인 은둔자를 만납니다 (Hermit brewing potions)",
  "요정들이 모여 아편을 피우며 즐기고 있는 굴을 마주합니다 (Opium den, fairies partaking)",
  "어쩌다 보니 고대 지하 묘지로 굴러떨어집니다 (Stumble into catacombs)",
  "바게스트와 고블린 무리로부터 습격을 받습니다 (Barghest & goblins attack)",
  "사악하고 어두운 의식을 올리는 광신도들을 목격합니다 (Cultists, dark ritual sacrifice)",
  "뼈다귀를 가지고 놀고 있는 오우거를 마주합니다 (Ogre, playing with bones)",
  "사냥당하고 있는 다친 도둑을 조우합니다 (Injured thief being hunted)",
  "지하 던전 통로가 기괴하게 뒤바뀝니다 (Dungeon corridors shift)",
  "저편 세계(Otherworld)로 이어지는 문을 발견합니다 (Doorway to the Otherworld)",
  "저 멀리서 드래곤이 기어가며 접근해옵니다 (Dragon approaches)"
];

export const SETTLEMENT_EVENTS = [
  "마을에 방랑 비술사가 도착합니다 (Traveling Mystic arrives)",
  "마을에서 다둥이가 한 번에 태어납니다 (Multiple births at once)",
  "아군에 대한 소문과 가십이 마을에 퍼집니다 (Gossip about PCs spreads)",
  "마을 근처에 거인이 나타났다는 무시무시한 소문이 돕니다 (Rumor of a Giant nearby)",
  "마을 광장에서 성스러운 의식이 거행됩니다 (Sacred rite performed)",
  "7일 밤낮 동안 계속되는 호화로운 결혼식 잔치가 벌어집니다 (Seven-day wedding feast)",
  "전령관이 기쁜 소식을 전합니다 / 역전 시 불행한 소식 (Herald brings good news)",
  "블러드 애스프(핏빛 독사)가 마을을 습격합니다 (Blood Asp attacks town)",
  "현자가 다가올 불길한 징조에 대해 예언합니다 (Sage gives an omen)",
  "마을의 이장이 독살당합니다 (Mayor is poisoned)",
  "마을 주민 간의 격렬한 논쟁이 폭력 사태로 치닫습니다 (Heated argument escalates)",
  "통 제작자가 어떠한 죄목으로 교수형에 처해집니다 (Cooper hanged for a crime)",
  "마을의 오래된 종이 스스로 울리기 시작합니다 (Old bell tolls on its own)",
  "마을 주민 모두가 똑같은 꿈을 꾸는 이상 현상이 벌어집니다 (All have the same dream)",
  "여관 주인의 오래된 가업 가보가 도둑맞습니다 (Innkeeper's heirloom stolen)",
  "기사 서약을 저버린 배역자들이 마을을 점령합니다 (Oathbreakers occupy town)",
  "마을 바로 바깥에 하늘에서 별(유성)이 떨어집니다 (Star falls just outside town)",
  "마을 아이들이 늪지대를 향해 동시에 몽유병처럼 걷기 시작합니다 (Children sleepwalk to marsh)",
  "한낮인데도 태양이 서쪽으로 지지 않습니다 (The sun does not set)",
  "마을 종이 누군가의 이름들을 속삭이듯 울려 퍼집니다 (The bell chimes names)",
  "요정들이 선물을 잔뜩 지고 마을에 당도합니다 (Fairies arrive bringing gifts)"
];

export const MAP_WILDERNESS = [
  "경작지 (Farmland)", "목초지 (Pasture)", "풀숲 (Tall grasses)", "연못 (Pond)", 
  "요정의 샘 (Fairy spring)", "호수 (Lake)", "고분군 (Barrow-downs)", "완만한 구릉 (Rolling hills)", 
  "포도밭 (Vineyards)", "토탄 습지 (Peat bog)", "수렁 늪지대 (Forested swamp)", "강 범람원 (River floodplain)", 
  "버섯 숲 (Mushroom forest)", "참나무 숲 (Oak forest)", "요정이 깃든 숲 (Fairy-haunted forest)", 
  "개간된 벌목지 (Deforested forest)", "보라빛 평원 (Heather moor)", "고대 전장 (Ancient battleground)", 
  "마을 정착지 (Settlement - village)", "정착지 성채/보루 (Settlement - castle/fort)", "도시 정착지 (Settlement - city)"
];

export const MAP_DUNGEON = [
  "빈 방 (Empty room)", "레드캡의 둥지 (Redcap den)", "부엌 (Kitchen)", "감옥 구획 (Prison complex)", 
  "지하 회합실 (Meeting place)", "올라가는 계단 (Stairs up)", "내려가는 계단 (Stairs down)", "천연 동굴 (Natural cave)", 
  "철광산 (Iron mines)", "불타는 대장간 (Blazing forge)", "버섯 경작지 (Mushroom farm)", "지하 강 (Underground river)", 
  "고블린 벌집 (Goblin hive)", "드워프 정착지 (Dwarf settlement)", "괴물의 보금자리 (Monster lair)", "지하 호수 (Subterranean lake)", 
  "막사 (Barracks)", "지하 납골당 (Crypt)", "요정의 지하 선술집 (Fairy tavern)", "고문실 (Torture chamber)", "제단 (Altar)"
];

export const MAP_SETTLEMENT = [
  "약재상/약방 (Apothecary shop)", "도서관 (Library)", "텃밭/농장 (Garden/farm)", "수비대 막사 (Garrison)", 
  "사원 (Temple)", "여관/대폿집 (Inn/tavern)", "마구간 (Stables)", "연무장 (Training grounds)", 
  "망루 (Watchtower)", "분주한 저잣거리 (Bustling marketplace)", "감옥 (Jailhouse)", "교수대 (Gallows)", 
  "공동묘지 (Cemetery)", "치유의 요양원 (House of healing)", "오락실/환락가 (Pleasure den)", "폐허 - 지하 던전 입구 (Ruins - dungeon entrance)", 
  "성스러운 신전/우물 (Sacred shrine/spring)", "선착장 (Docks)", "축제 광장 (Festival grounds)", "종탑 (Bell tower)", "옛 영웅의 석상 (Statue of an old hero)"
];

export const CAROUSING_TABLE: { [key: string]: string } = {
  "Fool": "알몸으로 잠에서 깨어났습니다. 가지고 있던 모든 소지품이 사라졌습니다! (Woke up naked, all your stuff gone)",
  "A": "도랑가에서 의문의 교역품 하나를 품에 안은 채 숙취와 함께 잠에서 깼습니다. (Woke up in a ditch, clutching a random Trade Good)",
  "2": "선술집 집단 패싸움을 일으켜 전신에 2점의 부상을 입었습니다. (Started a tavern brawl, gain 2 Wounds)",
  "3": "자신의 애용 무기를 아무 의문의 교역품 하나와 충동적으로 교환해버렸습니다. (Traded your weapon for any Trade Good)",
  "4": "불장난을 하다가 선술집의 일부를 완전히 태워 먹었습니다. (Started a fire, part of tavern is gone)",
  "5": "술김에 시비가 붙어 새로운 '적(Foe)'을 한 명 만들었습니다. (Made a new Foe)",
  "6": "의기투합하여 평생을 함께할 새로운 '친구(Friend)'를 사귀었습니다. (Made a new Friend)",
  "7": "취한 와중에 기괴한 사이비 종단 또는 집단에 가입식을 올렸습니다. (Initiated into some weird group)",
  "8": "완전히 허무맹랑하고 무모한 꼼수/계획에 돈을 투자해 시작했습니다. (Started a harebrained scheme)",
  "9": "선술집 주인의 마음을 단숨에 사로잡아, 무상으로 묵을 수 있게 되었습니다. (Impressed the barkeep, can stay for free)",
  "10": "취객의 넋두리 속에서 매우 은밀한 비밀이나 소문을 전해 들었습니다. (Learned a secret or rumor)",
  "P": "자신을 든든하게 지켜줄 용병 보디가드 한 명을 고용했습니다. (Hired a mercenary bodyguard)",
  "Kn": "어떤 취객 무리가 장난이랍시고 당신에게 강력한 맹세 서약(Geas)을 씌워 버렸습니다. (Someone put a Geas on you as a prank)",
  "Q": "아침에 눈을 뜨니 귀여운 개 한 마리가 곁에 있으며, 당신을 계속 따라다닙니다. (A dog woke you up and won't leave your side)",
  "K": "밤새 저지른 흉포한 범죄들(본인이 지은 것이 확실함) 때문에 1d14일간 감옥에 투옥되었습니다. (Jailed for 1-14 days for a crime you definitely committed)"
};

export const FOLK_ROAD = {
  occupations: [
    "연금술사 (Alchemist)", "서기/기록관 (Record-Keeper)", "약초상 (Herbalist)", "경비대장 (Captain of the Guard)",
    "지역 사제 (Local Priest)", "맹세의 기사 (Oath-Sworn Knight)", "토너먼트 참가자 (Tournament Hopeful)", "야수 조련사 (Beast Handler)",
    "은둔하는 현자 (Reclusive Sage)", "방랑 상인 (Traveling Merchant)", "법관/법률대리인 (Lawspeaker)", "추방자 (Exile)",
    "암살자 (Assassin)", "치유사 (Healer)", "환락 중개업자 (Vice Vendor)", "치하 Ruins 탐험가 (Ruin Delver)",
    "점성술사 (Astrologer)", "늑대인간 (Lycanthrope)", "농민 (Farmer)", "마을 이장 (Mayor)", "전통 학자 (Loremaster)"
  ],
  femaleNames: [
    "알리스 (Alise)", "브리지드 (Brigid)", "카트리오나 (Catriona)", "드레다 (Dreda)",
    "에디 (Edie)", "엘레오노르 (Eleanor)", "그레텔 (Gretel)", "아이리스 (Iris)",
    "조안 (Joan)", "레이니 (Laney)", "메이벨 (Mabel)", "마드라 (Mardra)",
    "미라 (Mira)", "오다 (Odda)", "오를라 (Orla)", "로즈 (Rose)",
    "로완 (Rowan)", "셀레네 (Selene)", "위니프레드 (Winifred)", "윌로우 (Willow)",
    "윈 (Wynn)"
  ],
  maleNames: [
    "콜맨 (Coalman)", "코난 (Connan)", "에그버트 (Egbert)", "에드가 (Edgar)",
    "파리스 (Faris)", "가롤드 (Garold)", "홉 (Hob)", "잭 (Jack)",
    "잰킨 (Jankin)", "조리 (Jory)", "케건 (Kagan)", "루윈 (Lewin)",
    "로클란 (Lochlann)", "미하일 (Mikhail)", "나비르 (Navir)", "오스릭 (Osrick)",
    "랄프 (Ralph)", "스테폰 (Steffon)", "테마르 (Temar)", "왓 (Wat)",
    "요리스 (Yoris)"
  ],
  personalities: [
    "태양: 자신감 넘치는 (Sun: confident)", "태양: 자존심 강한 (Sun: proud)", "태양: 주도적인 (Sun: leader)",
    "달: 헌신적이고 보살피는 (Moon: nurturing)", "달: 감수성이 풍부한 (Moon: emotional)", "달: 예리한 직관을 가진 (Moon: perceptive)",
    "수성: 재치 있고 똑똑한 (Mercury: clever)", "수성: 호기심이 왕성한 (Mercury: curious)", "수성: 분석적이고 철저한 (Mercury: analytical)",
    "금성: 매력적인 (Venus: charming)", "금성: 외교적이고 화평을 구하는 (Venus: diplomatic)", "금성: 쾌락을 추구하는 (Venus: pleasure-seeking)",
    "화성: 용맹하고 담대한 (Mars: courageous)", "화성: 공격적이고 기가 센 (Mars: aggressive)", "화성: 경쟁적인 (Mars: competitive)",
    "목성: 관대하고 베푸는 (Jupiter: generous)", "목성: 현명하고 통찰력 있는 (Jupiter: wise)", "목성: 사색적이고 철학적인 (Jupiter: philosophical)",
    "토성: 훈련을 고수하는 (Saturn: disciplined)", "토성: 신중하고 조심성 많은 (Saturn: cautious)", "토성: 인내심이 강한 (Saturn: patient)"
  ]
};

export const ORACLE_SUITS = {
  Cups: {
    "A": "수용하다 (Accept)", "2": "결합하다 (Unite)", "3": "모으다 (Gather)", "4": "명상하다 (Contemplate)",
    "5": "절망하다 (Despair)", "6": "기억하다 (Remember)", "7": "선택하다 (Choose)", "8": "버리다 (Abandon)",
    "9": "놓아주다 (Release)", "10": "완수하다 (Fulfill)", "P": "감지하다 (Sense)", "Kn": "따르다 (Follow)",
    "Q": "치유하다 (Heal)", "K": "조화를 이루다 (Balance)"
  },
  Wands: {
    "A": "영감을 주다 (Inspire)", "2": "계획을 세우다 (Plan)", "3": "확장하다 (Expand)", "4": "대화하다 (Commune)",
    "5": "싸우다 (Fight)", "6": "벌하다 (Punish)", "7": "방어하다 (Defend)", "8": "움직이다 (Move)",
    "9": "저항하다 (Resist)", "10": "성취하다 (Accomplish)", "P": "탐험하다 (Explore)", "Kn": "대면하다 (Confront)",
    "Q": "인내하다 (Endure)", "K": "이끌다 (Lead)"
  },
  Swords: {
    "A": "날카롭게 하다 (Sharpen)", "2": "망설이다 (Hesitate)", "3": "고통받다 (Suffer)", "4": "보호하다 (Protect)",
    "5": "속이다 (Cheat)", "6": "도망치다 (Flee)", "7": "기만하다 (Deceive)", "8": "감금하다 (Imprison)",
    "9": "두려워하다 (Fear)", "10": "패배시키다 (Defeat)", "P": "소통하다 (Communicate)", "Kn": "주장하다 (Assert)",
    "Q": "인지하다 (Perceive)", "K": "명령하다 (Command)"
  },
  Coins: {
    "A": "시작하다 (Begin)", "2": "적응하다 (Adapt)", "3": "세우다 (Build)", "4": "보존하다 (Conserve)",
    "5": "고립시키다 (Isolate)", "6": "나누다 (Share)", "7": "수집하다 (Collect)", "8": "숙달하다 (Master)",
    "9": "보상하다 (Reward)", "10": "안정시키다 (Stabilize)", "P": "연구하다 (Study)", "Kn": "대기하다 (Await)",
    "Q": "환영하다 (Welcome)", "K": "제공하다 (Provide)"
  }
};

export const ORACLE_SUBJECTS: { [key: string]: { name: string; meaning: string; reversed: string } } = {
  "I": { name: "The Magician", meaning: "기술 / 숙련 (Skill)", reversed: "속임수 / 기만 (Trickery)" },
  "II": { name: "The High Priestess", meaning: "신비 / 미스터리 (Mystery)", reversed: "혼란 / 당혹 (Confusion)" },
  "III": { name: "The Empress", meaning: "자연 (Nature)", reversed: "공허 / 빈곤 (Emptiness)" },
  "IV": { name: "The Emperor", meaning: "구조 / 조직 (Structure)", reversed: "폭정 / 압제 (Tyranny)" },
  "V": { name: "The Hierophant", meaning: "전통 / 관습 (Tradition)", reversed: "반란 / 반역 (Rebellion)" },
  "VI": { name: "The Lovers", meaning: "협력 / 동반자 관계 (Partnership)", reversed: "갈등 / 충돌 (Conflict)" },
  "VII": { name: "The Chariot", meaning: "의지력 / 투지 (Willpower)", reversed: "장애물 / 난관 (Obstacle)" },
  "VIII": { name: "Strength", meaning: "용기 / 대담함 (Bravery)", reversed: "의심 / 회의감 (Doubt)" },
  "IX": { name: "The Hermit", meaning: "인도 / 지침 (Guidance)", reversed: "외로움 / 고독 (Loneliness)" },
  "X": { name: "Wheel of Fortune", meaning: "행운 / 운명 (Fortune)", reversed: "통제 / 지배 (Control)" },
  "XI": { name: "Justice", meaning: "진실 / 사실 (Truth)", reversed: "부정직 / 기만 (Dishonesty)" },
  "XII": { name: "The Hanged Man", meaning: "희생 (Sacrifice)", reversed: "무관심 / 냉담 (Apathy)" },
  "XIII": { name: "Death", meaning: "변화 (Change)", reversed: "부패 / 쇠퇴 (Decay)" },
  "XIV": { name: "Temperance", meaning: "인내 / 조절 (Patience)", reversed: "불화 / 불협화음 (Discord)" },
  "XV": { name: "The Devil", meaning: "억압 / 지배 (Oppression)", reversed: "독립 / 해방 (Independence)" },
  "XVI": { name: "The Tower", meaning: "재앙 / 파멸 (Disaster)", reversed: "축복 / 천우신조 (Blessing)" },
  "XVII": { name: "The Star", meaning: "희망 / 기대 (Hope)", reversed: "불안정 / 불안감 (Insecurity)" },
  "XVIII": { name: "The Moon", meaning: "본능 / 직관 (Instinct)", reversed: "오해 / 착각 (Misunderstanding)" },
  "XIX": { name: "The Sun", meaning: "기쁨 / 환희 (Joy)", reversed: "슬픔 / 우울 (Sadness)" },
  "XX": { name: "Judgement", meaning: "목적 / 사명 (Purpose)", reversed: "회의론 / 불신 (Skepticism)" },
  "XXI": { name: "The World", meaning: "온전함 / 완성 (Wholeness)", reversed: "부서짐 / 불완전 (Brokenness)" }
};

export const MAGICK_ITEMS = {
  Swords: [
    { key: "A", name: "Ascalon (아스칼론)", text: "아스칼론 (Ascalon) - 성 조지의 칼. 비술이나 요정의 능력에 의해 흠집 나거나 파괴될 수 없습니다." },
    { key: "2", name: "Balmung (발뭉)", text: "발뭉 (Balmung) - 시구르드의 검. 이 무기로 입힌 상처는 오직 초자연적 마법 치료로만 수복됩니다." },
    { key: "3", name: "Caladbolg (칼라드볼그)", text: "칼라드볼그 (Caladbolg) - 무지개 대검. 결의 1점을 소비 시, 내 주변 3칸 내 모든 존재에게 부상 1점씩 분사합니다." },
    { key: "4", name: "Curtana (쿠르타나)", text: "쿠르타나 (Curtana) - 자비의 검. 결의 1점을 사용하면, 칼등 치기로 죽이지 않고 상대를 즉시 기절시킵니다." },
    { key: "5", name: "Durendal (듀란달)", text: "듀란달 (Durendal) - 롤랑의 보검. 칼끝의 단단함이 무쇠에 달해, 적의 어떠한 갑옷 AP 방어력도 완전히 무시합니다." },
    { key: "6", name: "Excalibur (엑스칼리버)", text: "엑스칼리버 (Excalibur) - 눈부신 신검. 결의 1점을 소비해 칼날을 밝혀, 주변 3칸 내 눈이 있는 적의 명중률에 -3 페널티를 입힙니다." },
    { key: "7", name: "Gram (그람)", text: "그람 (Gram) - 용살검. 불결한 용이나 거대 괴수에게 두 배의 피해 부상을 입깁니다." },
    { key: "8", name: "Joyeuse (루아즈)", text: "루아즈 (Joyeuse) - 샤를마뉴의 30색 검. 하루에 딱 한 번 판정을 수행할 때 결의 소모 없이 즉석 +3 보너스 판정을 받습니다." },
    { key: "9", name: "Lobera (로베라)", text: "로베라 (Lobera) - 야수 사냥검. 야수와 격투 중 결의 1점을 지불하면 아군 턴에 보너스 공격을 즉각 행사합니다." },
    { key: "10", name: "Mistilteinn (미스틸테인)", text: "미스틸테인 (Mistilteinn) - 기생 겨우살이 검. 철제 갑옷을 입지 않는 요정 크리처에게 부상 가타 시 +2의 추가 피해를 줍니다." },
    { key: "P", name: "Orna (오르나)", text: "오르나 (Orna) - 수다쟁이 검. 주인이 기절하면 검이 알아서 허공에 부양해 주인 주변을 사수하고 칼부림을 칩니다." },
    { key: "Kn", name: "Tizona (티조나)", text: "티조나 (Tizona) - 겁쟁이 사냥검. 검을 꺼내 흔들면 적은 마크당 즉각 사기 판정을 치러야 합니다." },
    { key: "Q", name: "Tyrfing (티르핑)", text: "티르핑 (Tyrfing) - 피를 탐하는 저주검. 칼집에 넣을 때 반드시 결의 1점을 바쳐야만 들어갑니다." },
    { key: "K", name: "Zulfiqar (줄피카르)", text: "줄피카르 (Zulfiqar) - 두 갈래 끝의 검. 결의 1점을 지불하면 이번 칼질의 딜을 두 배로 증폭시킵니다." }
  ],
  Coins: [
    { key: "A", name: "Circlet of Agony", text: "고통의 원형관. 명령어를 외치면 지름이 좁아지며 조여옵니다. 착용한 채 조여지면 절대 벗을 수 없으며 고통사할 수 있습니다." },
    { key: "2", name: "Dubán", text: "자아를 지닌 방패. 매 전투 시작 시, 방패의 방어력(AP)이 현재 싸우는 적의 수와 같아집니다. (최소 3)" },
    { key: "3", name: "Gauntlets of Missing Missiles", text: "소멸의 건틀릿. 결의를 1점 소비하여 자신에게 날아오는 화살과 투척 무기들을 흔적도 없이 사라지게 만듭니다." },
    { key: "4", name: "Green Armor", text: "화려하게 장식된 녹색 흉갑. 요정(Fey) 크리처들은 이를 착용한 자를 동맹으로 간주하며 저편 세계(Otherworld)에 우호적으로 환대합니다." },
    { key: "5", name: "Heartwood Cuirass", text: "고대 나무의 심재로 만든 살아있는 갑옷. 전투가 끝날 때마다 스스로의 손상을 완전히 복원해 냅니다." },
    { key: "6", name: "Helm of Terror", text: "공포의 투구. 결의를 1점 소비하면 상대 크리처는 사기 판정을 해야 합니다. 만약 '티조나(Tizona)' 검과 함께 착용했다면 상대는 즉시 도망칩니다." },
    { key: "7", name: "Huliðshjálmr", text: "은신의 헬멧. 착용자를 인간의 시선으로부터 완벽히 투명하게 만듭니다. 단, 요정들의 시선은 피할 수 없습니다." },
    { key: "8", name: "Járnglófar", text: "철 건틀릿. 착용자에게 가공할 완력을 부여합니다. 결의 1점을 소비하여 쇠창살을 구부리거나 거대 바위를 번쩍 들어 올릴 수 있습니다. 무쇠 재질이라 요정에게 좋은 무기가 됩니다." },
    { key: "9", name: "Kynehelm", text: "망각된 왕의 투구. 무적의 보호력으로 적의 어떠한 공격으로도 착용자의 머리(Head) 부분에 부상을 입힐 수 없습니다." },
    { key: "10", name: "Mithril Shirt", nameKo: "미스릴 셔츠", text: "방어력(AP)이 10점에 이르는 매우 가벼운 사슬 셔츠. 부피와 무게를 차지하지 않아 소지품 슬롯(Slot)을 소모하지 않습니다." },
    { key: "P", name: "Palangina", text: "화염 면역의 가죽 흉갑. 착용자를 모든 물리적/마법적 불길로부터 완벽히 보호해 줍니다." },
    { key: "Kn", name: "Silence", text: "침묵의 방패. 모든 시선 기반(석화 등) 및 소리 기반(포효, 비명 등) 특수 공격으로부터 wielder를 완전하게 지켜줍니다." },
    { key: "Q", name: "Silken Mail", text: "기묘한 속성을 지닌 실크 갑옷. 착용자가 움직일 때 완전히 무소음 상태가 됩니다. 실크 올을 풀어 튼튼한 밧줄로 쓸 수 있으나 풀 때 플레이어 덱에서 카드를 뽑아 광대(Fool)가 나오면 완전히 올이 풀려 풀려버립니다." },
    { key: "K", name: "Tarnhelm", text: "착용자를 두꺼비로 변신시키는 변신 헬멧. 원할 때 언제든 두꺼비와 인간 폼을 오갈 수 있으며 착용한 장비도 함께 변합니다." }
  ],
  Cups: [
    { key: "A", name: "Bag of Wind", text: "바람 주머니. 열면 풍차를 돌리거나, 돛배를 전진시키거나, 민들레 홀씨 밭을 날려 버릴 만큼 강렬한 여름 바람이 폭포수처럼 쏟아집니다." },
    { key: "2", name: "Brân's Horn", text: "브란의 뿔잔. 잔 속에 원하는 모든 종류의 마실 것(물, 포도주 등)이 마르지 않고 가득 채워져 있습니다." },
    { key: "3", name: "Caladbolg's Scabbard", text: "칼라드볼그의 칼집. 착용자는 몸에 상처를 입어도 부상으로 인한 불이익(-3 등의 페널티)을 받지 않습니다. 다만 머리에 부상을 2점 받으면 사망하는 규칙은 그대로 유지됩니다." },
    { key: "4", name: "Corrbolg", text: "요술 가죽 자루. 새벽이 지나면 완전히 빈 것처럼 보이고 느껴지며, 해가 지면 콩으로 꽉 찬 것처럼 보이고 느껴집니다. 실제 내용물과 상관없이 그렇게 느껴지며, 가방 기능 자체는 정상 동작합니다." },
    { key: "5", name: "Curso", text: "천안의 물병. 한 달에 한 번 이 병에 담긴 맑은 우물물을 마시면 미래예지 능력을 얻습니다. 플레이어는 예/아니오 형태의 질문을 하나 할 수 있고 정직한 답을 얻습니다. 또한 노화가 한 달 멈춥니다." },
    { key: "6", name: "Dyrnwch's Cauldron", text: "더른우크의 솥. 비겁한 자를 위해서는 고기를 전혀 삶아주지 않으나, 용기 있는 자를 위해서는 단 10초(1라운드) 만에 고기를 완전히 삶아냅니다." },
    { key: "7", name: "Gwyddno's Basket", text: "귀드노의 바구니. 안에 담아둔 소량의 음식을 단숨에 백 배로 불려내 줍니다." },
    { key: "8", name: "Goblet of Truth", text: "진실의 성배. 이 잔에 담긴 물을 마신 자는 다음 1경점(Watch, 8시간) 동안 절대로 어떠한 거짓말도 할 수 없게 됩니다." },
    { key: "9", name: "Nightingale Cup", text: "나이팅게일 컵. 하루에 세 번, 이 잔에 물을 담아 마시는 것만으로 전신의 부상 1점을 즉시 치료해 줍니다." },
    { key: "10", name: "Nightwalker's Hourglass", text: "밤걸이의 모래시계. 이것을 들고 있으면 현재 장소의 과거 역사를 홀로그램처럼 목격할 수 있습니다. 10년 거슬러 올라갈 때마다 결의 1점을 소비해야 합니다." },
    { key: "P", name: "Oðrerir", text: "시가 영감의 술병. 시의 꿀술이 담겨 있어 한 모금 마시면 다음 1차례(Turn) 동안 신들의 영감을 받은 예술적인 시인이 됩니다. 설득, 기만, 설파 판정이 마법적 방어가 없는 한 모두 자동으로 성공합니다." },
    { key: "Kn", name: "Pot of Gold", text: "황금 단지. 이를 소유하고 있는 동안 무언가를 구매할 때 코인 판정에 결코 실패하지 않습니다. 단 요정 주인이 이를 되찾기 위해 끊임없이 추적할 것입니다." },
    { key: "Q", name: "Red Gourd", text: "붉은 조표 자루. 결의 1점을 소비하여 사용하면 대상 크리처 하나를 미니어처 크기로 축소시켜 자루 안에 가둡니다. 자루를 깨트리면 다시 원래 크기로 튀어나옵니다." },
    { key: "K", name: "Soul Stone", text: "영혼석. 결의를 소비하여 살아있는 인간의 영혼을 추출합니다. 대상은 완드 판정으로 저항할 수 있으며 실패 시 영혼이 분리되어 갇힙니다. 결의를 써서 영혼 없는 육체에 주입할 수 있습니다." }
  ],
  Wands: [
    { key: "A", name: "Aevarr's Tabor", text: "에바르의 작은 북. 결의를 1점 소비하면 주변의 모든 인간과 요정들을 강제적으로 멈출 수 없이 춤추게 만듭니다." },
    { key: "2", name: "Amdusias' Screamer", text: "암두시아스의 나팔. 결의 1점을 소비하여 불면 귀가 찢어질 듯한 불협화음이 울리며 소리 범위 내 대상에게 부상을 1점 가합니다. 하루에 한 번만 사용 가능합니다." },
    { key: "3", name: "Amphion's Lyre", text: "암피온의 하프. 결의를 1점 소비하여 염동력으로 최대 1000파운드(약 450kg) 무게의 무거운 물체를 공중으로 들어 올려 움직일 수 있습니다." },
    { key: "4", name: "Archdruid's Lyre", text: "대드루이드의 하프. 새, 물고기, 토끼 등의 자연 소동물들과 완전히 교감하고 명령을 내릴 수 있게 해줍니다." },
    { key: "5", name: "Atlas Conch", text: "아틀라스 소라 나팔. 결의를 소비하여 1라운드간 지속되는 거대 파도를 소환하거나, 1차례(Turn) 동안 쏟아지는 폭우를 불러일으킵니다." },
    { key: "6", name: "Endellion's Ocarina", text: "엔델리온의 오카리나. 악기 자체는 평범하지만, 결의 1점을 소비하면 주인의 손을 떠나 아주 먼 거리에서 혼자서 스스로 연주를 시작하게 만듭니다." },
    { key: "7", name: "Harridan's Hurdy-Gurdy", text: "마녀의 허디거디. 웅장한 환각 드론음을 냅니다. 결의를 소비하면 소비한 만큼의 적 크리처들을 연주가 지속되는 동안 완전히 트랜스(황홀경) 상태로 묶어둡니다." },
    { key: "8", name: "Liliwin's Rebec", text: "릴리윈의 레벡. 바이올린 모양 악기. 결의를 소비하고 연주하면 임의의 소아르카나 마법 단어 하나를 무작위로 생성하여 마법에 더하거나 독립적으로 사용합니다." },
    { key: "9", name: "Minnorie's Harp", text: "미노리의 하프. 뼈대와 금빛 머리카락 현으로 만들어졌습니다. 주변에 누군가 살인마가 숨어 있다면 악기 스스로 구슬프고 오싹한 멜로디를 알아서 연주하기 시작합니다." },
    { key: "10", name: "Rowland's Horn", text: "롤랑의 상아 뿔나팔. 웅장하게 불면 온 세상의 동료들과 사람들에게까지 나팔 소리가 닿습니다." },
    { key: "P", name: "Spirit Chime", text: "영혼의 풍경. 이 쇠 실린더를 청량하게 타격하면 영혼의 세계와 눈에 보이지 않게 투명화로 숨어 있던 존재들이 일시적으로 보이게 됩니다." },
    { key: "Kn", name: "Trouper's Lute", text: "극단원의 류트. 결의 1점을 소비하여 아름답고 매혹적인 선율을 연주하면 광장에 모인 모든 청중들을 완전히 넋이 나가게 만듭니다." },
    { key: "Q", name: "Trumpet of Shattering", text: "산개의 나팔. 결의 1점을 소비하여 나팔을 크게 불면 돌, 나무, 금속, 유리 등으로 된 튼튼한 무생물 물체 하나를 산산조각 냅니다." },
    { key: "K", name: "Vagabond's Concertina", text: "방랑자의 아코디언. 이 작은 아코디언을 연주하면 어떠한 낯선 마을이나 심지어 위험한 요정 정착지에서도 공짜 잠자리와 식사를 극진히 제공받습니다." }
  ]
};

export interface LifepathEvent {
  en: string;
  ko: string;
}

export const LIFEPATH_EVENTS: { [suit: string]: { [cardRange: string]: LifepathEvent } } = {
  Cups: {
    "A-2": { en: "Had a brief romantic relationship", ko: "짧고 강렬한 로맨스 관계를 맺음" },
    "3-4": { en: "Fell out of favor with a group", ko: "어떤 집단이나 군중으로부터 신뢰를 잃고 눈 밖에 남" },
    "5-6": { en: "Passed up an alluring opportunity", ko: "매우 매력적이고 유혹적인 일생일대의 기회를 스쳐 보냄" },
    "7-8": { en: "Disillusioned of a belief", ko: "오랫동안 굳게 믿어왔던 가치관이나 사상에 환멸을 느낌" },
    "9-10": { en: "Lived in a far-off land", ko: "고향과 완전히 단절된 아주 먼 타국 땅에서 거주함" },
    "P": { en: "Pursued an ambition", ko: "가슴 깊이 품은 거대한 야망을 향해 헌신적으로 매진함" },
    "Kn": { en: "Were in a long-term relationship", ko: "평생에 걸친 장기적이고 진지한 관계를 이어감" },
    "Q": { en: "Took care of someone", ko: "아프거나 불우한 누군가를 정성껏 보살피며 지냄" },
    "K": { en: "Mentored by a patron", ko: "예술이나 기술 분야의 든든한 후원자를 만나 사사받음" }
  },
  Swords: {
    "A-2": { en: "Realized a difficult truth", ko: "뼈아프고 받아들이기 힘든 잔혹한 진실을 목격하고 깨달음" },
    "3-4": { en: "Mourned the loss of someone close", ko: "곁에 있던 매우 소중하고 가까운 사람의 죽음을 애도함" },
    "5-6": { en: "Fled from a dangerous situation", ko: "끔찍한 위험이나 참화가 닥친 구역에서 목숨 걸고 탈출함" },
    "7-8": { en: "Imprisoned for a crime", ko: "억울하거나 실제 지은 범죄로 인해 감옥에 투옥됨" },
    "9-10": { en: "Betrayed by a friend", ko: "가장 믿었던 가까운 동료나 친구에게 배신당함" },
    "P": { en: "Made a terrible mistake that cost you", ko: "돌이킬 수 없는 뼈아픈 실수로 막대한 대가를 치름" },
    "Kn": { en: "Killed someone", ko: "싸움 끝에 누군가의 목숨을 빼앗아 손에 피를 묻힘" },
    "Q": { en: "Withdrew from life for a time", ko: "세상과 인연을 끊고 한동안 어두운 곳에 은둔하며 지냄" },
    "K": { en: "Embarked on an intense intellectual study", ko: "지독하게 몰입하는 치열한 학술적/지적 탐구를 완수함" }
  },
  Wands: {
    "A-2": { en: "Learned a new skill or language", ko: "생소한 외국어나 완전히 새로운 이색 기술을 습득함" },
    "3-4": { en: "Went on a journey to a distant land", ko: "머나먼 미지의 땅으로 모험 가득한 기나긴 여정을 다녀옴" },
    "5-6": { en: "Joined a group or guild", ko: "장인 길드나 비밀 결사 같은 조직에 정식 가입함" },
    "7-8": { en: "Overcame an obstacle", ko: "불가능해 보였던 거대한 난관이나 두려움을 극복해냄" },
    "9-10": { en: "Received an unexpected burden", ko: "원치 않는 뜻밖의 무거운 짐이나 임무를 떠맡게 됨" },
    "P": { en: "Went on an adventure or quest", ko: "신비로운 모험이나 숭고한 퀘스트를 수행하러 떠남" },
    "Kn": { en: "Saved a village from disaster", ko: "자연재해나 몬스터의 위협으로부터 마을 전체를 구해냄" },
    "Q": { en: "Started a new career", ko: "과거의 삶을 청산하고 완전히 새로운 커리어를 개척함" },
    "K": { en: "Achieved a position of authority", ko: "집단의 존경을 받아 강력한 권위와 권력의 자리에 오름" }
  },
  Coins: {
    "A-2": { en: "Worked hard days in a difficult job", ko: "척박하고 힘겨운 노동 환경에서 기나긴 하루를 묵묵히 버팀" },
    "3-4": { en: "Apprenticed a trade under a teacher", ko: "일류 기술자 밑에서 도제 계약을 맺고 기술을 사사받음" },
    "5-6": { en: "Lost everything and became a vagabond", ko: "전 재산을 유실하고 완전히 빈털터리 방랑자 신세로 전락함" },
    "7-8": { en: "Mastered a craft or skill", ko: "특정 공예 기술이나 수련 분야를 마스터해 독자 영역을 개척함" },
    "9-10": { en: "Achieved an affluent lifestyle", ko: "큰 재물을 모아 여유롭고 호화로운 삶을 잠시 누림" },
    "P": { en: "Studied at a prestigious academy", ko: "명성 높은 명문 아카데미나 학술 기관에 입학해 공부함" },
    "Kn": { en: "Oversaw operation of a business", ko: "상업 거래망이나 핵심 비즈니스를 직접 총괄하여 운영함" },
    "Q": { en: "Raised a child", ko: "아이를 품에 안고 헌신적으로 길러냄" },
    "K": { en: "Spent time in a noble court", ko: "화려하지만 암투가 가득한 귀족 궁정에서 오랜 세월을 지냄" }
  }
};

export const RULEBOOK_PAGES: RulePage[] = [
  {
    pageNumber: 1, title: "Title Page", titleKo: "표지",
    content: `GLOAM
Fantasy Tarot Tabletop Role-Playing Game
판타지 타로 테이블탑 롤플레잉 게임 (룰북 v1.02)`
  },
  {
    pageNumber: 2, title: "Credits", titleKo: "만든 이들",
    content: `Design, writing, & illustration by Sam Helms (샘 헬름스)
Proofreading by Sean F. Smith (숀 F. 스미스)
Tarot illustrations by Pamela Coleman Smith (파멜라 콜먼 스미스)`
  },
  {
    pageNumber: 3, title: "Table of Contents", titleKo: "차례",
    content: `차례 (Table of Contents)
• Welcome to Gloam (황혼의 세계로의 초대) ....................... 4
• How to Play (게임 방법) ........................................ 6
• The Cards (카드 구성) ........................................ 7
• Tests (행동 판정) ........................................... 8
• Create Your Character (캐릭터 생성) ........................... 9
• Lifepath (인생로) .......................................... 11
• Stats & Attributes (능력치와 속성) ............................ 14
• Vocations (천직) ........................................... 15
• Talents (재능) ............................................. 16
• Goals & Instincts (목표와 본능) ............................... 22
• Friend & Foe (친구와 적) ..................................... 24
• Equipment (장비 및 소지품) ................................... 25
• Combat (전투) ............................................. 30
• Wounds & Resolve (부상과 결의) .............................. 32, 34
• Resting & Advancement (휴식과 성장) ......................... 35
• Magick: Alchemy & Spells (마법: 연금술과 비술) ................. 36
• Dungeons & Wilderness (모험지 설계) .......................... 40
• Events Deck (이벤트 덱) ..................................... 42
• Bestiary (괴수 도감) ......................................... 45
• Time & Downtime (시간과 막간 활동) ........................... 50
• Carousing (선술집 축제) ..................................... 51
• Hirelings (추종자/용병) ...................................... 52
• Oracles (운명의 신탁 오라클) .................................. 54
• Magick Items (마법 보물 아카이브) ............................ 56`
  },
  {
    pageNumber: 4, title: "Welcome to Gloam", titleKo: "황혼의 세계로의 초대",
    content: `Welcome to Gloam (글롬에 오신 것을 환영합니다)
Gloam은 다음과 같은 특징을 가진 다크 판타지 방랑 모험 게임입니다:

1. 타로 카드 기반 시스템:
주사위 대신 78장의 표준 타로 카드 덱을 사용하여 운명을 결정합니다. 플레이어와 Referee(게임 마스터)가 각각 덱을 나누어 가집니다.

2. 목표 중심의 모험:
캐릭터는 단순한 몬스터 사냥꾼이 아닌 각자 가슴에 품은 구체적인 목표(Goals)와 뿌리 깊은 버릇인 본능(Instincts)에 의해 움직입니다.

3. 어둡고 스산한 세계관:
글롬은 흑백의 차가운 톤과 고딕풍 정취, 저편 세계(Otherworld)에서 흘러 들어오는 요정(Fey) 마법과 어스름한 어둠이 깔려 있는 중세 모험지입니다.`
  },
  {
    pageNumber: 5, title: "Illustration Page", titleKo: "삽화",
    content: `[스산한 황혼의 숲속과 그 너머로 어스름하게 보이는 둥근 성채의 실루엣]`
  },
  {
    pageNumber: 6, title: "How to Play", titleKo: "게임 진행 방법",
    content: `How to Play (플레이 방법)

• 플레이어(Players):
자신의 캐릭터의 입장이 되어 생각하고 행동하십시오. 캐릭터의 성품과 천직, 소지한 도구를 바탕으로 어떻게 이 고난을 헤쳐나갈지 묘사하십시오. 당신의 목표(Goals)를 추구하고 위험천만한 세상 속에서 창의적인 아이디어로 난관을 극복하십시오.

• 레프리(Referee/게임 마스터):
규칙의 공정한 판정자가 되어주십시오. 캐릭터들의 목표를 뒤흔들거나 위협할 흥미진진한 도전을 제공하고, 난관 극복에 정당한 보상을 부여하십시오. 인물들의 선택과 행동에 따라 세상이 생생하고 Tangible하게 반응하도록 묘사해 주십시오.

• 솔로 플레이어(Solo Player):
만약 혼자 즐기는 저널링 RPG로 즐길 경우, 스스로가 플레이어이자 레프리가 되어 일지에 상황을 기록하고, 타로 카드 신탁(Oracles)을 활용해 질문의 답을 내리며 서사를 써 나갑니다.`
  },
  {
    pageNumber: 7, title: "The Cards", titleKo: "카드와 수치",
    content: `The Cards (카드 활용법)
Gloam은 주사위 대신 78장의 표준 타로 카드 한 덱을 사용합니다. 덱을 다음과 같이 두 개의 더미로 나눕니다:

1. 플레이어 덱 (Player Deck):
56장의 마이너 아르카나 + 광대(The Fool) 카드 1장 = 총 57장.

2. 레프리 덱 (Referee Deck):
21장의 메이저 아르카나 (I번 마법사부터 XXI번 세계까지).

• 광대(The Fool) 카드:
플레이어 덱에 포함되며, 이 카드가 플레이 되는 순간 즉시 버려진 카드 더미를 덱과 합쳐 다시 섞어 둡니다(Reshuffle).

• 역방향 카드 (Reversed Cards):
카드를 뽑았을 때 거꾸로 나오는 '역방향'은 마법(p.38), 무작위 이벤트(p.42), 오라클 신탁(p.54)에서 특수한 부정적 변수나 반대의 뜻으로 해석됩니다.

[카드 숫자 값 환산 표]
- 광대(The Fool): 0점
- 에이스(A): 1점
- II ~ X: 2점 ~ 10점
- 페이지(Page): 11점
- 나이트(Knight): 12점
- 퀸(Queen): 13점
- 킹(King): 14점`
  },
  {
    pageNumber: 8, title: "Tests", titleKo: "판정 규칙",
    content: `Tests (판정)
어떤 행동을 시도할 때, 뛰어난 장비가 있거나, 시간이 충분하거나, 완벽한 계획이 있다면 판정 없이 성공합니다. 그러나 결과가 불확실할 때는 판정(Test)을 합니다.

1. 판정 방법:
해당 행동과 관련된 능력치(Cups, Wands, Swords, Coins 중 하나)를 결정합니다. 플레이어 덱에서 카드 1장을 뽑아 그 값에 관련 능력치 값(1~4점)을 더합니다.

2. 성공 기준:
최종 합계가 14 이상이면 성공(Success)입니다. 13 이하는 실패(Failure)입니다.

3. 끈기 있게 밀어붙이기 (Pushing):
첫 카드를 뽑고 실패했을 때, 원한다면 선택적으로 '푸시(Push)'를 할 수 있습니다. 덱에서 두 번째 카드를 뽑아 기존 합계에 더합니다.
- 푸시 후 14 이상이 되면 성공(Success).
- 푸시 후에도 13 이하라면 대실패(Great Failure)가 됩니다! 상황이 매우 꼬이지만 결의(Resolve)를 1점 얻습니다.

4. 대성공 (Great Success):
첫 번째 카드 뽑기에서 14 이상으로 성공했고, 심지어 그 카드의 문양(Suit)이 판정에 사용한 능력치 문양과 일치한다면 대성공입니다! 원하는 결과를 초과 달성합니다.

5. 도움 (Help):
누군가를 도우려면 카드를 뽑기 전에 선언하고 돕는 방법을 묘사합니다. 도우미의 관련 능력치를 판정 총합에 더해줍니다. 단 실패의 결과도 같이 나눕니다.`
  },
  {
    pageNumber: 9, title: "Create Your Character", titleKo: "캐릭터 생성 단계",
    content: `Create Your Character (모험가 만들기)
글롬에서 여러분은 각자의 강렬한 목표에 이끌려 행동하는 대담한 인간 모험가를 연기합니다. 다음 단계를 순서대로 거치며 생성합니다:

1. 인생로 (Lifepath, p.11) 결정: 태어난 소지환경과 어린 시절 기억, 인생의 사건들을 카드로 설계합니다.
2. 능력치 (Stats, p.14) 배분: 네 가지 능력치에 1, 2, 3, 4점을 하나씩 할당합니다.
3. 천직 (Vocation, p.15) 확정: 가장 높은 4점을 투자한 능력치에 따라 천직이 자동으로 결정됩니다.
4. 목표와 본능 (Goals & Instincts, p.22) 작성: 3개의 구체적 목표와 3개의 습관 본능을 적습니다.
5. 친구와 적 (Friend & Foe, p.24) 설정: 나를 돕는 아군과 방해하는 적을 1명씩 설정합니다.
6. 장비 (Equipment, p.25) 획득: 초기 장비 5개를 정하고 소지품 슬롯을 정리합니다.

준비가 되었다면 멋진 고딕 스타일의 이름을 짓고 모험을 출발하십시오!`
  },
  {
    pageNumber: 10, title: "Card Value Quick Ref", titleKo: "카드 값 요약",
    content: `[Card Value Quick Reference - 카드 수치 변환]
- 광대(The Fool): 0 (덱 셔플 트리거)
- 에이스(Ace): 1
- II ~ X: 2 ~ 10
- 페이지(Page): 11
- 나이트(Knight): 12
- 퀸(Queen): 13
- 킹(King): 14

* 마이너 아르카나 카드의 문양은 컵(Cups), 완드(Wands), 소드(Swords), 코인(Coins)의 네 가지로 구분됩니다.`
  },
  {
    pageNumber: 11, title: "Lifepath", titleKo: "인생로 (Lifepath)",
    content: `Lifepath (캐릭터 과거사 생성)
태어난 순간부터 모험가가 되기 직전까지의 역사를 결정하는 연대기입니다. 카드를 드로우하여 나온 결과를 해석하고 나이를 계산합니다.

1. 출생 배경 드로우:
플레이어 덱에서 카드 1장을 뽑습니다. 이 카드의 문양은 출생한 사회정치적 배경과 유년기의 핵심 기억을 나타냅니다. 뽑은 카드의 수치만큼 나이에 더합니다.
- 완드(Wands): 신비롭고, 영적이며, 기이한 초자연적 환경.
- 소드(Swords): 전쟁, 분쟁, 거친 여정, 혹은 몰락 중소 귀족 가문.
- 컵(Cups): 학구적, 상업적, 정치적 음모, 비교적 안전한 환경.
- 코인(Coins): 거리, 가난, 빈민가, 떠돌이, 근본 없는 삶.

2. 청년기 사건 드로우:
다음 카드를 드로우해 그 카드가 가리키는 사건(Next page)을 일지에 기록합니다. 마찬가지로 카드 수치만큼 나이를 더합니다.

3. 반복과 나이 측정:
원하는 만큼 2번 단계를 반복하여 과거사를 엮어냅니다. 단, 나이는 계속 먹게 됩니다. 모험가의 최소 시작 나이는 18세입니다. 18세 이상이 될 때까지 드로우합니다. 만약 너무 이른 나이에 어울리지 않는 성인 사건이 나오면 부모나 보호자에게 생긴 일로 해석할 수 있습니다.`
  },
  {
    pageNumber: 12, title: "Lifepath Events - Cups & Swords", titleKo: "과거 사건표: 컵 & 소드",
    content: `[컵 (Cups) 과거 사건 결과]
- A-2: 짧고 강렬한 로맨스 관계를 맺음 (Had a brief romantic relationship)
- 3-4: 어떤 집단이나 군중으로부터 신뢰를 잃고 눈 밖에 남 (Fell out of favor with a group)
- 5-6: 매우 매력적이고 유혹적인 일생일대의 기회를 스쳐 보냄 (Passed up an alluring opportunity)
- 7-8: 오랫동안 굳게 믿어왔던 가치관이나 사상에 환멸을 느낌 (Disillusioned of belief)
- 9-10: 고향과 완전히 단절된 아주 먼 타국 땅에서 거주함 (Lived in a far-off land)
- P: 가슴 깊이 품은 거대한 야망을 향해 헌신적으로 매진함 (Pursued an ambition)
- Kn: 평생에 걸친 장기적이고 진지한 관계를 이어감 (Were in a long-term relationship)
- Q: 아프거나 불우한 누군가를 정성껏 보살피며 지냄 (Took care of someone)
- K: 예술이나 기술 분야의 든든한 후원자를 만나 사사받음 (Mentored by a patron)

[소드 (Swords) 과거 사건 결과]
- A-2: 뼈아프고 받아들이기 힘든 잔혹한 진실을 목격하고 깨달음 (Realized a difficult truth)
- 3-4: 곁에 있던 매우 소중하고 가까운 사람의 죽음을 애도함 (Mourned the loss of someone close)
- 5-6: 끔찍한 위험이나 참화가 닥친 구역에서 목숨 걸고 탈출함 (Fled from a dangerous situation)
- 7-8: 억울하거나 실제 지은 범죄로 인해 감옥에 투옥됨 (Imprisoned for a crime)
- 9-10: 가장 믿었던 가까운 동료나 친구에게 배신당함 (Betrayed by a friend)
- P: 돌이킬 수 없는 뼈아픈 실수로 막대한 대가를 치름 (Made a terrible mistake that cost you)
- Kn: 싸움 끝에 누군가의 목숨을 빼앗아 손에 피를 묻힘 (Killed someone)
- Q: 세상과 인연을 끊고 한동안 어두운 곳에 은둔하며 지냄 (Withdrew from life for a time)
- K: 지독하게 몰입하는 치열한 학술적/지적 탐구를 완수함 (Embarked on an intense intellectual study)`
  },
  {
    pageNumber: 13, title: "Lifepath Events - Wands & Coins", titleKo: "과거 사건표: 완드 & 코인",
    content: `[완드 (Wands) 과거 사건 결과]
- A-2: 생소한 외국어나 완전히 새로운 이색 기술을 습득함 (Learned a new skill or language)
- 3-4: 머나먼 미지의 땅으로 모험 가득한 기나긴 여정을 다녀옴 (Went on a journey to a distant land)
- 5-6: 장인 길드나 비밀 결사 같은 조직에 정식 가입함 (Joined a group or guild)
- 7-8: 불가능해 보였던 거대한 난관이나 두려움을 극복해냄 (Overcame an obstacle)
- 9-10: 원치 않는 뜻밖의 무거운 짐이나 임무를 떠맡게 됨 (Received an unexpected burden)
- P: 신비로운 모험이나 숭고한 퀘스트를 수행하러 떠남 (Went on an adventure or quest)
- Kn: 자연재해나 몬스터의 위협으로부터 마을 전체를 구해냄 (Saved a village from disaster)
- Q: 과거의 삶을 청산하고 완전히 새로운 커리어를 개척함 (Started a new career)
- K: 집단의 존경을 받아 강력한 권위와 권력의 자리에 오름 (Achieved a position of authority)

[코인 (Coins) 과거 사건 결과]
- A-2: 척박하고 힘겨운 노동 환경에서 기나긴 하루를 묵묵히 버팀 (Worked hard days in a difficult job)
- 3-4: 일류 기술자 밑에서 도제 계약을 맺고 기술을 사사받음 (Apprenticed a trade under a teacher)
- 5-6: 전 재산을 유실하고 완전히 빈털터리 방랑자 신세로 전락함 (Lost everything and became a vagabond)
- 7-8: 특정 공예 기술이나 수련 분야를 마스터해 독자 영역을 개척함 (Mastered a craft or skill)
- 9-10: 큰 재물을 모아 여유롭고 호화로운 삶을 잠시 누림 (Achieved an affluent lifestyle)
- P: 명성 높은 명문 아카데미나 학술 기관에 입학해 공부함 (Studied at a prestigious academy)
- Kn: 상업 거래망이나 핵심 비즈니스를 직접 총괄하여 운영함 (Oversaw operation of a business)
- Q: 아이를 품에 안고 헌신적으로 길러냄 (Raised a child)
- K: 화려하지만 암투가 가득한 귀족 궁정에서 오랜 세월을 지냄 (Spent time in a noble court)`
  },
  {
    pageNumber: 14, title: "Stats & Attributes", titleKo: "능력치와 속성",
    content: `Stats & Attributes (캐릭터 스탯)
네 가지 타로 문양은 캐릭터의 핵심 능력치(Stats) 네 가지를 상징합니다.

- 컵 (Cups): 판단력, 지식, 의술, 돌봄, 인내, 그리고 도구 활용.
- 소드 (Swords): 근력, 용기, 지구력, 활력, 그리고 전투 기술.
- 완드 (Wands): 의지력, 신비주의, 영혼, 열망, 그리고 비술 및 오컬트 학식.
- 코인 (Coins): 민첩성, 은신, 교활함, 조작, 그리고 기만 및 기민한 손재주.

• 능력치 배분:
캐릭터 생성 시 1점, 2점, 3점, 4점의 스탯 값을 네 개 스탯에 원하는 대로 하나씩 배분합니다. 높은 스탯일수록 관련된 판정에 큰 보너스를 받습니다.

• 기타 속성 (Attributes):
- 이동력 (Speed): 자신의 코인(Coins) 스탯 값과 동일합니다. 전투 시 이동(Move) 액션을 취할 때 한 번에 이동할 수 있는 격자 칸수입니다.
- 결의 (Resolve): 소모성 자원입니다. 최대치 10점 (p.34).`
  },
  {
    pageNumber: 15, title: "Vocations", titleKo: "천직 (Vocations)",
    content: `Vocations (네 가지 천직)
가장 높은 점수인 **4점**을 투자한 능력치에 따라 모험가의 천직(Vocation)이 결정됩니다.

- 전령관 (Herald) [Cups = 4]:
영지 궁정, 타운, 도시들을 오가는 메신저이자 전령. 공적인 연설과 외교, 설득에 매우 유능하며 법적인 보호권이나 귀족의 비호를 받기도 합니다. 하지만 불길한 소식을 전달하는 일이 많아 대중의 분노를 사기도 쉽습니다.

- 방랑기사 (Knight-Errant) [Swords = 4]:
특정 주군 없이 스스로의 굳은 신조와 신념만을 쫓아 세상을 떠도는 정예 병사. 전투 기술이 뛰어나고 검술이 정교하나, 주군이 없는 신세이기 때문에 억울한 일에 처했을 때 기댈 수 있는 법적 안전망이 부족합니다.

- 비술사 (Mystic) [Wands = 4]:
현자, 치료사, 마녀, 주술사, 약초꾼 등으로 불리는 신비로운 마법 구현자. 대중들은 이들의 기이한 힘을 기피하고 꺼리면서도, 한 끼 식사를 대접하는 대가로 유용한 마법을 쓰기 위해 묵인하곤 합니다. 저편 세계의 비밀을 쏩니다.

- 소매치기 (Cutpurse) [Coins = 4]:
생존을 위해 혹은 삐뚤어진 성정으로 어둠의 범죄에 발을 들인 전문가. 은신, 강탈, 매수, 암습 등에 도가 텄습니다. 문명사회는 이들을 경멸하지만, 뒤편에서 은밀하게 처리할 더러운 일이 생기면 가장 먼저 소매치기를 찾습니다.`
  },
  {
    pageNumber: 16, title: "Talents Guide", titleKo: "재능 (Talents) 사용법",
    content: `Talents (재능 사용 규칙)
각 천직은 여섯 가지의 고유한 능력인 재능(Talents)을 가지고 있습니다. 플레이 중 결의(Resolve)를 1점 소비함으로써 재능을 작동시킬 수 있습니다.

• 시작 재능 (Starting Talent):
신입 모험가는 해당 천직의 가장 첫 번째 재능(검은 다이아몬드 표시)을 이미 잠금 해제한 상태로 모험을 시작합니다.
- 전령관: Disarming Presence (무장 해제 미소)
- 방랑기사: Sally Forth (과감한 돌격)
- 비술사: Magick (비술 각성)
- 소매치기: Nimble (민첩한 대처)

• 재능의 발동:
결의를 1점 지불하면 재능이 발현됩니다. 재능에 따라 결의를 추가로 소모하여 효과의 강도를 증폭할 수도 있습니다.

• 새로운 재능 학습:
모험을 성공적으로 완수하고 얻은 경험치(XP)를 사용해 신규 재능을 살 수 있습니다. (성장 규칙, p.33 참고).

• 솔로 플레이 보너스:
혼자서 글롬을 즐기는 1인 플레이(Solo)의 경우, 캐릭터는 태생적 불리함을 보완하기 위해 **원하는 모든 천직의 재능 중 1개를 추가 시작 재능으로 선택하여** 가집니다.`
  },
  {
    pageNumber: 17, title: "Illustration Page 2", titleKo: "삽화 2",
    content: `[달빛을 등지고 서서 상아 뿔나팔을 불고 있는 망토를 두른 여행자]`
  },
  {
    pageNumber: 18, title: "Herald Talents", titleKo: "전령관의 재능",
    content: `Herald Talents (전령관의 여섯 재능)

◆ Disarming Presence (무장 해제 미소) [시작 재능]:
부드러운 미소와 비폭력적 기운으로 대인 반응 판정(Reaction Test) 결과치에 +3 보너스를 받습니다.

◇ Academic (학자적 지성):
문화, 사회 질서, 역사적 사건, 고문헌 기록 등 학술적 사실 한 가지를 마스터의 판단하에 완벽히 기억해 냅니다.

◇ Duel of Wits (언쟁의 달인):
관중이나 군중이 지켜보는 앞에서 토론과 논쟁을 벌여 청중의 눈에 완벽한 승리를 쟁취합니다. 상대의 속내를 완전히 바꾸진 못할지라도 요청에 굴복하게 만들 수 있습니다.

◇ Inspire (격려의 연설):
행동 판정을 시도하려는 동료에게 미리 격려의 말을 건네어, 해당 판정에 +3 보너스를 부여합니다. 반드시 판정을 굴리기 전에 지불해야 합니다.

◇ Parley (평화적 교섭):
아직 전투가 본격적으로 시작되기 전, 언어를 가진 모든 적대적 크리처를 온화하게 진정시켜 협상 테이블로 유도합니다.

◇ Verity & Guile (진실과 거짓말):
상대방이 나에게 거짓말을 하고 있는지 대번에 파악합니다. 또한, 거짓말을 속여 넘기고자 컵(Cups) 판정을 시도할 때 성공하면 상대는 의심 없이 거짓을 사실로 신뢰합니다.`
  },
  {
    pageNumber: 19, title: "Knight-Errant Talents", titleKo: "방랑기사의 재능",
    content: `Knight-Errant Talents (방랑기사의 여섯 재능)

◆ Sally Forth (과감한 돌격) [시작 재능]:
전투 라운드당 딱 한 번, 자신의 턴에 아무 페널티 없이 보너스 전투 행동(Action)을 추가로 1회 더 실행합니다.

◇ Geas (신성한 맹세 명령):
대상 크리처에게 단순하고 명료한 임무(예: '다리를 지켜라')를 강제로 맹세시킵니다. 저항 테스트에 실패하면 대상은 그 임무가 끝날 때까지 외골수적인 몰입 상태로 일해야 합니다. 동시에 단 하나의 기아스만 활성화 가능합니다.

◇ Itinerant Hospitality (기사의 환대):
세상의 어느 장원(Manor)이나 성채(Castle)에 도달하더라도, 자신과 동료들을 위해 따뜻한 식사와 무상 침실 잠자리를 요청해 받아낼 권리를 행사합니다.

◇ Martial Dominance (전투의 지배자):
자신의 리치(Range) 범위 안으로 들어오거나 범위 바깥으로 빠져나가려는 적 크리처를 향해 즉시 '대응(Response) 행동'으로서 근접 일반 공격을 가합니다.

◇ Oath-sworn (피의 맹세):
타인에게 명확한 목표에 대한 서약을 맺습니다. 이 서약을 이행하기 위한 직접적인 모든 판정에 +3 보너스를 가집니다. 맹세에 실패할 경우 평생 불명예스러운 '서약 파기자(Oath-breaker)' 낙인이 찍힙니다.

◇ Trial by Combat (결투 대결):
도전장을 던져 1대1 대결로 갈등을 해결하고자 제안합니다. 상대가 결투를 거부할 경우 기가 꺾여, 다음 1차례(Turn) 동안 대화나 협상 판정 시 +3 보너스를 받습니다.`
  },
  {
    pageNumber: 20, title: "Mystic Talents", titleKo: "비술사의 재능",
    content: `Mystic Talents (비술사의 여섯 재능)

◆ Magick (비술 각성) [시작 재능]:
마이너 아르카나 단어 1개와 메이저 아르카나 단어 1개를 엮어 만든 초기의 주문(Spell) 하나를 지닌 채 시작합니다. 결의를 내어 이 마법을 발동시킵니다 (비술 마법, p.38 참고).

◇ Augury (징조 읽기):
찻잎, 새들의 비행 궤적, 타로 카드 드로우 등을 통해 미래의 징조를 점칩니다. Referee에게 어떤 계획의 길흉을 물으며 대답으로 길(Weal), 흉(Woe), 둘 다, 혹은 무난함 중 하나의 답을 얻습니다.

◇ Sixth Sense (영적 제6감):
장소, 물건, 인물에게 깃든 마법적 왜곡이나 흔적을 감지합니다. 이 힘은 비술사들과 고양이들의 눈에만 연보라빛 안개처럼 희미하게 아른거립니다.

◇ Familiar (사역마 소환):
주인의 명령에 복종하는 영체 고양이나 임프(Imp)를 소환합니다. 갑옷 방어력은 없으며 부상을 1점이라도 입는 즉시 소멸합니다. 한 번에 한 마리만 유지합니다.

◇ Undo Magick (마법 해제):
시전된 마법이나 왜곡을 상쇄시키거나 강제로 디스펠합니다. 강력한 고대 마법의 경우 완드(Wands) 판정을 통해 성공해야 해제됩니다. 필멸자가 손댈 수 없는 태고의 비술도 존재합니다.

◇ Bind Magick (마법 부여):
특정 장비나 물건에 마법 주문을 주입하여 봉인합니다. 주입 시 소비한 결의 1점당 1개의 충전(Charge)을 얻습니다. 이 물건을 접촉한 누구든 결의를 내고 충전을 소모해 주문을 쓸 수 있습니다.`
  },
  {
    pageNumber: 21, title: "Cutpurse Talents", titleKo: "소매치기의 재능",
    content: `Cutpurse Talents (소매치기의 여섯 재능)

◆ Nimble (민첩한 손놀림) [시작 재능]:
전투 중 몬스터의 공격 대상으로 지정되었을 때, 신속하게 손안에 쥐고 있던 카드 중 1장을 자신의 선제권(Initiative) 카드와 맞바꿔치기 합니다.

◇ One with the Shadows (그림자 동화):
어두운 구석이나 그늘 속에 완벽하게 녹아들어 육안으로는 거의 투명 상태가 됩니다. 단, 냄새를 통한 후각 추적은 피할 수 없습니다.

◇ Sneak-Attack (급소 암습):
대상을 물리적으로 기습하거나 보지 못할 때 기습 근접 공격을 실행해 상대방의 모든 갑옷 방어치(AP)를 완전히 무시하고 살에 피해를 입힙니다.

◇ Poisoner (독극물 제조):
치명적인 맹독을 연금합니다. 이 독을 음식이나 액체에 섞어 마시게 만들면 1시간 내에 대상을 조용히 사망시킵니다.

◇ Impersonate (변장과 모사):
다른 인간의 목소리, 외모, 행동양식을 완벽하게 모방하여 변장합니다. 이 완벽한 연기는 최대 1경점(Watch, 8시간) 동안 유지됩니다.

◇ Split (신속한 퇴각):
싸움이 불리하게 전개될 때, 민첩한 판단력으로 코인 판정 없이 자신과 동료들 모두 안전하게 전투 영역을 이탈(Flee)해 도망칩니다.`
  },
  {
    pageNumber: 22, title: "Goals", titleKo: "목표 설정 (Goals)",
    content: `Goals (이야기를 주도하는 목표)
글롬에서 여러분은 항상 **3개의 구체적인 목표**를 마음속에 품고 살아야 합니다. 이 목표는 '행동 진술'과 '달성 조건'의 조합으로 구성됩니다.
예: "엘리스턴 경은 타락한 자이므로, 나는 그를 영지에서 실각시킬 것이다."

• 목표 수립의 세 가지 가이드라인:
1. 실질적으로 행동 가능한 것 (Actionable): 도달 가능한 확실한 범주여야 합니다. 발견하기나 알아내기 같은 추상적 동사보다 건설하기, 파괴하기, 설득하기 같은 물리적 동사를 쓰십시오.
2. 도전받을 수 있는 것 (Challenged): Referee가 이 목표를 향하는 당신에게 시련과 딜레마를 던져 꼬아둘 수 있어야 합니다.
3. 역동적인 것 (Dynamic): 성공했을 때 주변 세상의 기득권이나 상태를 변혁시키는 결과여야 합니다.

• 목표 수정과 변경:
타락한 영주를 실각시키는 데 마침내 성공했다면, 완료한 목표는 보관하고 즉시 새로운 목표 1개를 수립해 채웁니다. 원한다면 언제든 목표를 바꾸거나 폐기할 수 있으나, 항상 수중에 3개의 목표를 유지해야 합니다. 목표 달성 시 결의(Resolve)를 얻습니다.`
  },
  {
    pageNumber: 23, title: "Instincts", titleKo: "본능과 버릇 (Instincts)",
    content: `Instincts (캐릭터의 본능)
본능은 캐릭터가 무의식중에 행동하는 고유한 습관이자 삶의 고집입니다. 목표와 달리 쉽게 바뀌지 않습니다. 세 가지를 정해 시트에 작성합니다.
이는 특정 상황이 트리거되었을 때 즉시 기계적으로 실행하는 일종의 매크로 명령어입니다.
예:
- "위험을 감지하면, 나는 질문 없이 무조건 검을 빼 든다."
- "던전에 발을 들이면, 항상 함정이 있는지 바닥을 확인한다."
- "부유한 자들의 감언이설은 결코 믿지 않는다."
- "생각나는 첫 마디를 거르지 않고 뱉는다."

• 서사 꼬임의 보상:
이 본능 때문에 상황이 악화되거나 동료들 간의 드라마가 발생해 고초를 겪을 때마다 즉시 결의(Resolve, p.34)를 1점 얻습니다.

• 귀찮은 확인 절차 생략:
"무기 안 뽑아두셨으니 꺼내는 데 1액션 소모하세요"라는 상황이 왔을 때, "제 본능에 의해 전 칼을 쥐고 있습니다"라고 외쳐 방지할 수 있는 시스템입니다.`
  },
  {
    pageNumber: 24, title: "Friend & Foe", titleKo: "친구와 적 (Friend & Foe)",
    content: `Friend & Foe (친구와 적 설정)
각 캐릭터는 출신 배경에서 비롯된 아군 '친구(Friend)' 1명과 라이벌 '적(Foe)' 1명을 가지고 시작합니다. 이름, 위치, 한 줄 설명을 지어냅니다.

• 친구 (Friend):
소꿉친구, 동료 기사, 혈육, 은인 등 돈독한 사이입니다.
- 기능: 모험 중 위기에 처했을 때 결의(Resolve) 1점을 지불하고 친구에게 연줄을 대면, 친구는 자신이 도울 수 있는 한 수단과 방법을 가리지 않고 아군을 지원하러 행동합니다.

• 적 (Foe):
라이벌 탐험가, 전직 종자, 질투하는 동료, 산적 두목 등 나를 증오하는 자입니다.
- 기능: 모험 도중에 수시로 나타나 아군의 모험(Quest)을 물리적으로 훼방 놓거나 음모를 꾸며 난관을 배가시킵니다. 이를 해결하는 것은 플레이어의 몫입니다.`
  },
  {
    pageNumber: 25, title: "Equipment Guide", titleKo: "장비 소지 규칙",
    content: `Equipment (장비 슬롯 및 무게 시스템)
글롬은 직관적인 '슬롯(Slot) 기반 소지품창'을 사용합니다.
- 기본 소지량: **10개 + 코인(Coins) 스탯 값**만큼의 장비 슬롯을 가방에 보유합니다. 최대 스탯 4점 기준 보통 14개의 슬롯을 가집니다.
- 모든 아이템(입고 있는 전신 갑옷과 투구, 방패 포함)은 각각 딱 **1슬롯**씩을 고르게 차지합니다. 신규 캐릭터는 5개의 기본 아이템을 고르고 시작합니다.

• 아이템 구매 (Buying Items):
글롬에서는 낱개 동전을 일일이 세지 않습니다. 물건을 구매할 때 자신의 코인(Coins) 판정을 수행합니다.
- 판정치: 타로 카드 드로우 값 + Coins 스탯 + 아이템별 Coins 구매 수정치.
- 결과: 성공 시 돈을 정상 지불하고 아이템을 얻습니다. 실패 시 소지 현금이 모자라거나 상점에 재고가 없는 등으로 해석해 실패하며 사지 못합니다.`
  },
  {
    pageNumber: 26, title: "Equipment - Weapons Table", titleKo: "장비: 무기 목록",
    content: `[Weapons - 근접 및 원거리 무기 정보]

1. 곤봉 (Club): 피해 1 | 리치 1 | 구매수정치 +1 | 소드요구치 1 | [Melee, Blunt]
2. 단검 (Dagger): 피해 1 | 리치 1 | 구매수정치 - | 소드요구치 1 | [Melee, Concealed]
3. 지팡이 (Staff): 피해 1 | 리치 2 | 구매수정치 - | 소드요구치 1 | [Melee, Blunt]
4. 투석구 (Sling): 피해 1 | 리치 3 | 구매수정치 - | 소드요구치 1 | [Ranged, Blunt]
5. 도끼 (Axe): 피해 1 | 리치 1 | 구매수정치 +2 | 소드요구치 2 | [Melee, Slash]
6. 활 (Bow): 피해 1 | 리치 6 | 구매수정치 -1 | 소드요구치 2 | [Ranged, Pierce]
7. 창 (Spear): 피해 2 | 리치 2 | 구매수정치 -1 | 소드요구치 2 | [Melee, Pierce]
8. 채찍 (Whip): 피해 1 | 리치 2 | 구매수정치 - | 소드요구치 2 | [Melee, Grab, Disarm]
9. 검 (Sword): 피해 2 | 리치 1 | 구매수정치 -2 | 소드요구치 3 | [Melee, Slash]
10. 메이스 (Mace): 피해 2 | 리치 1 | 구매수정치 -2 | 소드요구치 3 | [Melee, Blunt]
11. 석궁 (Crossbow): 피해 3 | 리치 6 | 구매수정치 -2 | 소드요구치 3 | [Ranged, Pierce, Reload]
12. 전투망치 (Warhammer): 피해 3 | 리치 1 | 구매수정치 -2 | 소드요구치 3 | [Melee, Blunt, Bulky]
13. 대검 (Greatsword): 피해 4 | 리치 2 | 구매수정치 -3 | 소드요구치 4 | [Melee, Slash, Bulky]
14. 폴암 (Polearm): 피해 3 | 리치 3 | 구매수정치 -3 | 소드요구치 4 | [Melee, Pierce, Brace]
15. 랜스 (Lance): 피해 3 | 리치 3 | 구매수정치 -3 | 소드요구치 4 | [Melee, Pierce, Charge]`
  },
  {
    pageNumber: 27, title: "Equipment - Armor Table", titleKo: "장비: 방어구와 내구도",
    content: `Armor & Shield (갑옷과 방패 규칙)
방어구는 타격 부위로 들어오는 부상을 흡수(AP 만큼 차감)합니다. 공격을 받았을 때 플레이어는 어느 부위 방어구로 받을지 결정합니다 (방패를 들어 막는 등).

• 피해 차감 예시:
3점의 부상을 가하는 무기에 맞았을 때, 몸통의 흉갑(AP 3)으로 이를 받아내면 3 - 3 = 0점이 되어 부상을 전혀 입지 않습니다.

• 내구도 마모 (Armor Durability):
만약 가해진 피해량(Wounds)이 갑옷의 방어 한계치(AP)보다 높은 강력한 타격인 경우, 갑옷이 파손되며 버블(Notch)을 체크합니다. 이 체크수가 해당 갑옷의 AP와 같아지면 갑옷은 완전히 박살 나 망가지며, 마을 장인에게 수리받기 전까지 방어력을 잃습니다.

[Armor List - 방어구 정보]
1. 투구 (Helmet): 방어력 2 | 구매수정치 -2 | 소드요구치 1 | 적용부위: 머리 (Head)
2. 흉갑 (Cuirass): 방어력 3 | 구매수정치 -3 | 소드요구치 3 | 적용부위: 몸통 (Torso)
3. 갬비슨 (Gambeson): 방어력 1 | 구매수정치 -1 | 소드요구치 1 | 적용부위: 몸통 (Torso)
4. 왼손 건틀릿 (Gauntlet L): 방어력 1 | 구매수정치 -1 | 소드요구치 2 | 적용부위: 왼팔 (L. Arm)
5. 오른손 건틀릿 (Gauntlet R): 방어력 1 | 구매수정치 -1 | 소드요구치 2 | 적용부위: 오른팔 (R. Arm)
6. 사슬갑옷 (Chainmail): 방어력 3 | 구매수정치 -3 | 소드요구치 3 | 적용부위: 몸통 (Torso)
7. 왼발 정강이받이 (Greave L): 방어력 2 | 구매수정치 -2 | 소드요구치 2 | 적용부위: 왼다리 (L. Leg)
8. 오른발 정강이받이 (Greave R): 방어력 2 | 구매수정치 -2 | 소드요구치 2 | 적용부위: 오른다리 (R. Leg)
9. 방패 (Shield): 방어력 3 | 구매수정치 -3 | 소드요구치 1 | 적용부위: 자유롭게 지정 가능`
  },
  {
    pageNumber: 28, title: "Equipment - Trade Goods A-L", titleKo: "의문의 교역품 목록 A-L",
    content: `[Trade Goods (교역품과 여행 장비) A - L]
물품 옆의 괄호 숫자는 구매 시 적용할 코인(Coins) 수정치입니다. (-)는 수정치 없음입니다.

- 사포 (Abrasive paper) [1]
- 화살 20발 (Arrows 20) [-]
- 곰 덫 (Bear trap) [-3]
- 침낭 (Bedroll) [-1]
- 종 (Bell) [-]
- 풀무 (Bellows) [-1]
- 담요 (Blanket) [-1]
- 병 (Bottle) [-1]
- 새장 (Cage, small) [-3]
- 마름쇠 100개 (Caltrops 100) [-3]
- 양초 (Candle) [-]
- 가마솥 (Cauldron) [-1]
- 사슬 10칸 (Chain 10 sq) [-3]
- 분필 (Chalk) [-]
- 끌 (Chisel) [-1]
- 나침반 (Compass) [-2]
- 쇠지레 (Crowbar) [-1]
- 주사위 (Dice) [-]
- 사냥개 (Dog) [-2]
- 줄 (File) [-1]
- 불쏘시개 (Fire poker) [-1]
- 부싯돌과 부쇠 (Flint & Steel) [-1]
- 밀가루 (Flour) [-]
- 풀/접착제 (Glue) [-1]
- 갈고리 닻 (Grappling Hook) [-3]
- 망치 (Hammer) [-1]
- 약초 (Herbs) [-]
- 모래시계 (Hourglass) [-2]
- 향 (Incense) [-]
- 쇠말뚝 10개 (Iron Spikes 10) [-1]
- 칼 (Knife) [-]
- 랜턴 (Lantern) [-1]
- 독주 (Liquor) [-]
- 자물쇠따개 (Lockpicks) [-1]`
  },
  {
    pageNumber: 29, title: "Equipment - Trade Goods M-W", titleKo: "의문의 교역품 목록 M-W",
    content: `[Trade Goods (교역품과 여행 장비) M - W]

- 수갑 (Manacles) [-1]
- 유리구슬 100개 (Marbles 100) [-2]
- 거울 (Mirror) [-3]
- 그물 (Net) [-1]
- 기름 (Oil) [-]
- 종이 (Paper) [-1]
- 향수 (Perfume) [-3]
- 장대 (Pole) [-]
- 깃펜과 잉크 (Quill & ink) [-2]
- 휴대 식량 7일분 (Rations 7) [-]
- 밧줄 (Rope) [-]
- 자루 (Sack) [-]
- 톱 (Saw) [-1]
- 설피 (Snowshoes) [-1]
- 비누 (Soap) [-]
- 스펀지 (Sponge) [-]
- 망원경 (Spyglass) [-3]
- 말뚝 4개 (Stakes 4) [-]
- 실 (String) [-]
- 방수포 (Tarp) [-1]
- 천막 (Tent) [-]
- 횃불 3개 (Torches 3) [-]
- 물가죽 (Waterskin) [-1]
- 밀판 (Wax tablets) [-]
- 호루라기 (Whistle) [-]
- 나무 상자 (Wooden chest) [-1]`
  },
  {
    pageNumber: 30, title: "Combat Guide & Initiative", titleKo: "전투 개요와 선제권",
    content: `Combat (전투 격자 및 턴 진행)
전투는 격자판(Grid) 위에서 벌어지며, 대각선 이동은 불가하고 오직 상하좌우 직교 이동만 지원합니다.

• 전투의 흐름 (Round Flow):
1. 카드 받기 (Draw up to 4): 라운드 시작 시 플레이어는 손패가 4장이 될 때까지 플레이어 덱에서 드로우합니다. Referee는 몬스터 1마리당 3장의 카드를 쏩니다.
2. 선제권 제출 (Initiative): 각자 손패에서 카드 1장을 골라 뒷면으로 제출합니다.
3. 턴 순서 (Turn Order): 0점(가장 빠름)부터 14점(가장 느림)까지 차례대로 올라가며 액션을 취합니다. 자기 순서가 오면 덮어둔 선제권 카드를 공개합니다.
4. 라운드 종료: 원하지 않는 손패를 버릴 수 있으며 다음 라운드로 들어갑니다.

• 선제권의 이중 역할:
제출한 선제권 카드의 숫자는 선제권 순서임과 동시에, **적이 나를 맞추기 위해 극복해야 하는 방어 타겟 난이도**가 됩니다. 낮은 숫자 카드를 내면 턴이 빠르게 오지만 적이 나를 맞추기 아주 쉬워집니다. 반대로 높은 숫자를 내면 턴은 늦지만 방어력이 극도로 올라갑니다!

• 광대(The Fool) 카드 규칙:
광대 카드는 선제권 0으로 제출해 누구보다 먼저 행동하게 할 수도 있으며, 혹은 소지한 아군의 행동 판정에 +3 보너스 카드로 기부할 수도 있습니다. 광대가 사용된 라운드의 끝에는 덱과 버려진 더미를 모두 모아 새로 셔플합니다.`
  },
  {
    pageNumber: 31, title: "Combat Actions & Responses", titleKo: "전투 행동과 대응",
    content: `Combat Actions & Tests (전투 행동과 판정)
전투 중 내 턴이 오면 손에 들고 있는 카드를 소모하여 액션을 실행합니다. 손패에 카드가 남아 있는 한 횟수 제한 없이 행동할 수 있습니다!

• 전투 중 판정의 예외 규칙:
전투 중 판정을 수행할 때는 플레이어 덱에서 새 카드를 드로우하지 않고, **자신의 손에 든 카드 중 하나를 골라 제출**해 스탯을 더합니다. 목표 난이도치는 대상 적이 제출했던 '선제권(Initiative) 카드 숫자'가 됩니다. 전투 판정 시 '푸시(Push)'는 불가능합니다.

[Combat Actions - 내 턴에 취하는 행동]
- 공격 (Attack): 소드(Swords) 판정을 벌여 적 선제권 이상을 냅니다. 성공 시 적은 내 무기의 부상(Wound) 피해를 입습니다. 대성공 시 +1 부상을 추가로 가합니다.
- 비술 시전 (Cast a Spell): 결의를 소비하고 적의 완드(Wands) 수치만큼 페널티를 받는 대항 완드 판정을 수행합니다.
- 무기 탈착 (Draw/Sheathe): 패에서 1장을 버리고 수행합니다.
- 탈출 (Flee): 적과 코인 대항 판정을 거쳐 성공하면 전투에서 탈출합니다.
- 잡기 (Grapple): 소드 대항 판정으로 적을 붙잡아 묶어둡니다. 내 이동력의 절반만큼 적을 끌고 이동할 수 있습니다.
- 이동 (Move): 패에서 카드 1장을 버리고 자신의 Speed 칸만큼 격자를 이동합니다.
- 밀치기 (Shove): 소드 대항 판정으로 상대를 내 소드 스탯 칸만큼 밀어냅니다.
- 던지기 (Throw): 카드 1장을 버리고 (카드 숫자 + 소드 스탯) 칸만큼 물건을 던집니다.

[Responses - 상대방 턴에 반응하는 행동]
- 회피 (Dodge): 코인 대항 판정으로 적의 공격을 피합니다. 대성공 시 원하는 부위에 적에게 역부상 1점을 가합니다.
- 반격 (Riposte): 적의 근접 공격이 빗나갔을 때 패에서 카드 1장을 버리고 즉시 근접 반격을 가합니다.
- 조준 사격 (Called Shots): 특정한 부위를 노려 때리는 판정으로, 소드 대항 판정으로 성사됩니다.`
  },
  {
    pageNumber: 32, title: "Wounds", titleKo: "신체 부상과 페널티 (Wounds)",
    content: `Wounds (신체 부위별 부상 규칙)
부상은 신체 부위별로 기록되며, 부상 발생 시 캐릭터의 기능에 영구적인 지대한 방해를 줍니다. 몬스터도 동일하게 부상을 입습니다.

• 부상의 특징:
부위는 부상을 입었거나 입지 않았거나 둘 중 하나의 상태만 가집니다. 동일 부위에 입는 중복 부상은 무의미(Redundant)하여 추가 페널티가 생기지 않습니다.

[부상 부위별 페널티]
1. 머리 (Head):
즉시 땅에 쓰러지며 의식을 완전히 잃고 졸도합니다 (Unconscious). 무방비 상태에서 머리에 추가로 딱 1점의 부상이라도 더 입으면 그 자리에서 즉사(Die)합니다.

2. 몸통 (Torso):
전신에 지독한 타격을 입어, 캐릭터가 수행하는 앞으로의 모든 능력치 판정(Tests)에 **-3 페널티**가 영구 적용됩니다.

3. 팔 (Arms - L. Arm / R. Arm):
해당 팔에 쥐고 있던 모든 장비를 땅에 떨어뜨리며, 치료되기 전까지 해당 팔을 장비 쥐기나 도구 사용 등 어떠한 목적으로도 절대 사용할 수 없게 됩니다.

4. 다리 (Legs - L. Leg / R. Leg):
부상당한 다리 한 짝당 캐릭터의 이동력(Speed)이 2칸씩 영구 감소합니다. 두 다리가 모두 다쳐 이동력이 0이 되면 바닥에 쓰러지며 동료의 부축 없이는 전혀 움직일 수 없게 됩니다.`
  },
  {
    pageNumber: 33, title: "Illustration Page 3", titleKo: "삽화 3",
    content: `[검과 무거운 방패를 든 전사가 머리 부분에 투구를 쓴 채 어두운 폐허를 탐색하는 뒤태]`
  },
  {
    pageNumber: 34, title: "Resolve", titleKo: "의지의 불꽃: 결의 (Resolve)",
    content: `Resolve (의지력과 투지)
결의는 캐릭터가 품은 불굴의 정신력, willpower, 혹은 분노와 증오의 힘을 뜻합니다. 전설적인 업적을 세우는 원동력이 됩니다.

• 결의의 한도와 획득:
최대 10점까지 누적하여 가질 수 있습니다. 결의는 다음 상황에 차오릅니다:
- 새로운 세션의 시작
- 나의 구체적 목표(Goals) 중 1개를 완수했을 때
- 나의 목표 중 1개가 우발적으로 절대 달성 불가능하게 좌절되었을 때
- 자신의 본능(Instincts) 때문에 심각한 시련에 빠지거나 서사가 꼬였을 때
- 판정에서 대실패(Great Failure, 푸시 후 실패)를 겪었을 때
- 선술집 축제(Carousing) 테이블 드로우 결과로 획득할 때

• 결의의 소모처:
- 천직의 고유 재능(Talents)을 발동시킬 때 (기본 1점 소모)
- 판정 결과를 이미 눈으로 확인한 뒤, 아쉬운 눈금을 **소비한 결의 1점당 +1씩 보강해** 성공으로 조작할 때
- 결의 소모를 요하는 고대 마법 보물들을 가동할 때

• Referee의 결의:
플레이어가 결의를 1점 얻을 때마다, Referee도 동일하게 결의 1점을 받습니다. Referee는 이 결의를 적들의 사기 보강이나 몬스터 전용 재능 발동에 아낌없이 투자합니다.`
  },
  {
    pageNumber: 35, title: "Resting & Advancement", titleKo: "휴식과 성장 (Resting & XP)",
    content: `Resting & Advancement (치유와 경험치 성장)

• 휴식 (Resting):
안전한 야영지나 정착지 마을에 도달해 따뜻한 한 끼 식사를 곁들여 밤샘 숙면(Full night's sleep)을 취하면, 원하는 부위 부상 **딱 1개**를 치유할 수 있습니다.
예컨대 다리, 몸통, 팔이 다친 상태라면 완전히 원래 스펙을 복원하기 위해 총 3일 연속의 안전한 휴식(하루당 부상 1개 복원)이 소요됩니다.

• 경험치 획득 (Gaining XP):
한 세션이 끝날 때마다 활약상에 따라 최소 1점에서 최대 3점의 경험치(XP)를 획득합니다:
- 세션에 정식으로 참가하여 플레이함 (+1 XP)
- 자신의 목표(Goals) 중 1개 이상을 달성함 (+1 XP)
- 생명이 오락가락하는 목숨 건 치명적인 위기 상황에 처했었음 (+1 XP)

• 경험치 소비 (Spending XP):
- 자기 천직의 새로운 재능 1개 학습: 5 XP 소비 (학습 시간 5일 소요)
- 다른 천직의 재능 1개 학습: 10 XP 소비 (학습 시간 10일 소요, 단 타 천직의 시작 재능은 절대 배울 수 없음)
- 임의 능력치(Stat) 1점 영구 증가: 10 XP 소비. (스탯의 최대 상한치는 6점이며, 스탯 상승에 소요되는 학습 시간은 10일입니다. 코인이 올라가도 소지 슬롯 상한치는 14개로 제한됩니다.)`
  },
  {
    pageNumber: 36, title: "Alchemy", titleKo: "연금술 (Alchemy)",
    content: `Alchemy (비약과 기름 제조)
모험을 벌이며 굴복시킨 크리처나 괴수의 특수 장기, 에센스를 채집해 유용한 비약, 연막탄, 칼날 기름 등을 조제할 수 있습니다.

• 제조법:
수집한 시그니처 몬스터 파트, 가마솥 솥단지, 깨끗한 빈 병을 준비하고 1경점(Watch, 8시간) 동안 불을 피워 끓입니다. 완료될 때 완드(Wands) 판정을 수행해 성공하면 원하는 비약 1도스(Dose)를 완성해 냅니다.

• 제조 예시 (시그니처 능력 복제):
- 바실리스크 안구 -> 상대를 일시 석화시키는 물약 (Petrifying potion)
- 밴시의 혼백 안개 -> 수면 안개를 피워내는 연막탄 (Sleep-smoke bomb)
- 트롤의 심장 -> 전신 부상을 즉각 재생하는 치유약 (Regeneration potion)
- 바게스트의 어금니 -> 마시면 거대한 사냥개로 강체 변신하는 환약 (Hound-form elixir)
- 블러드 애스프의 독주머니 -> 닿는 즉시 극독 피해를 입히는 포이즌 폭탄 (Poison bomb)`
  },
  {
    pageNumber: 37, title: "Folk Magick", titleKo: "민간 마법 (Folk Magick)",
    content: `Folk Magick (생활 마법)
민간 전승 마법은 비술사뿐만 아니라 농민이나 장인들도 일상에서 사용하는 대중적인 미신이자 전통의 기운입니다.
예: 악령을 쫓으려 문지방에 무쇠 편자를 박아두기, 풍작을 기원하며 논밭을 세 바퀴 돌기, 말들을 지키고자 마구간에 rowan 가지 묶어두기, 아이의 열병 치료에 야로우 차 달여 먹이기 등.

• 민간 마법 시전법:
물리적 부상을 입히는 공격 용도로는 쓸 수 없습니다. 동양의 주술처럼 유사의 법칙(Sympathy)에 바탕을 둔 매개체인 '참(Charm)'이 반드시 소요됩니다.
(예: 묶기 위한 천 줄, 태우기 위한 촛불, 치유를 돕는 허브초, 단단함을 주는 조약돌 등)

1. 원하는 마법적 목표를 구체적으로 선언합니다.
2. 매개물에 맞는 가장 상식적인 행동을 취합니다. (초를 창가에 켜두거나 돌을 집 중앙에 놓는 등)
3. 마스터와 조율해 적정한 판정 문양(Suit)을 결정하고 판정하여 결과를 해결합니다.`
  },
  {
    pageNumber: 38, title: "Arcane Magick & Minor Arcana", titleKo: "원소 비술과 소아르카나 단어",
    content: `Arcane Magick (비술사의 마법 체계)
비술사가 차원을 찢고 실체화하는 에너지 마법입니다. 비술 마법은 **소아르카나 단어 1개 + 대아르카나 단어 1개**를 조합하여 즉흥적인 주문을 구성하고 그 효력을 마스터와 함께 해석해 창출합니다.
- 발동비: 최소 결의 1점 이상 지불. 전투 중 시전 시에는 완드 대항 판정 성공이 필수입니다. 공격계 마법은 지불한 결의 1점당 1점의 부상을 가합니다.

[마이너 아르카나 단어 목록 (Minor Arcana Words)]
• 컵 (Cups) 문양 단어:
- A: 채우다 (Fill) | 2: 끌어당기다 (Attract) | 3: 기쁘게 하다 (Delight) | 4: ~로부터 보호하다 (Protect from) | 5: 붕괴시키다 (Disintegrate) | 6: 기워내다 (Mend) | 7: 소환하다 (Conjure) | 8: 약화시키다 (Weaken) | 9: 고체화/액체화 (Solidify/liquefy) | 10: 진정시키다 (Calm) | P: ~와 대화하다 (Speak with) | Kn: 매혹하다 (Charm) | Q: 치료하다 (Heal) | K: ~가 되다 (Become)

• 완드 (Wands) 문양 단어:
- A: 활력주다 (Energize) | 2: 변화시키다 (Change) | 3: 자라나다 (Grow) | 4: 모으다 (Gather) | 5: 격분시키다 (Enrage) | 6: 정복하다 (Conquer) | 7: 제어하다 (Control) | 8: 가속하다 (Quick) | 9: 단단히 하다 (Toughen) | 10: 명령하다 (Command) | P: 방출하다 (Release) | Kn: 부추기다 (Incite) | Q: 가열하다 (Heat) | K: 창조하다 (Create)

• 소드 (Swords) 문양 단어:
- A: 폭발하다 (Explode) | 2: 감추다 (Hide) | 3: 고통주다 (Afflict) | 4: 침묵시키다 (Silence) | 5: 위협하다 (Intimidate) | 6: 공간이동 (Teleport) | 7: 훔치다 (Steal) | 8: 포획하다 (Ensnare) | 9: 낙담시키다 (Discourage) | 10: 쳐부수다 (Defeat) | P: 연금변환 (Transmute) | Kn: 강제하다 (Force) | Q: 감지하다 (Detect) | K: 이해하다 (Comprehend)

• 코인 (Coins) 문양 단어:
- A: 선사하다 (Give) | 2: 평형잡다 (Balance) | 3: 융합하다 (Combine) | 4: 빼앗다 (Take) | 5: 차단하다 (Isolate) | 6: 공유하다 (Share) | 7: 수확하다 (Harvest) | 8: 조각하다 (Sculpt) | 9: 불러내다 (Summon) | 10: 초월하다 (Transcend) | P: 사로잡다 (Enthrall) | Kn: 둔화시키다 (Slow) | Q: 수호하다 (Protect) | K: 증폭하다 (Multiply)`
  },
  {
    pageNumber: 39, title: "Major Arcana Magick Words", titleKo: "대아르카나 주문 단어표",
    content: `[Major Arcana Words (대아르카나 단어와 역방향)]

- 0. 광대: 자아 (Self) | 역방향: 산만함 (Distraction)
- I. 마법사: 정신 (Mind) | 역방향: 환각 (Illusion)
- II. 여사제: 자각 (Consciousness) | 역방향: 목소리 (Voice)
- III. 여황제: 아름다움 (Beauty) | 역방향: 추함 (Ugliness)
- IV. 황제: 권위 (Authority) | 역방향: 얼음 (Ice)
- V. 교황: 지식 (Knowledge) | 역방향: 무지 (Ignorance)
- VI. 연인: 유혹 (Temptation) | 역방향: 불화 (Conflict)
- VII. 전차: 금속 (Metal) | 역방향: 장벽 (Barrier)
- VIII. 힘: 강함 (Strength) | 역방향: 약함 (Weakness)
- IX. 은둔자: 인물 (Person) | 역방향: 고독 (Isolation)
- X. 운명의 수레바퀴: 운명 (Fate) | 역방향: 지연 (Delay)
- XI. 정의: 진실 (Truth) | 역방향: 피 (Blood)
- XII. 매달린 사람: 육체 (Flesh) | 역방향: 공허 (Emptiness)
- XIII. 죽음: 죽음 (Death) | 역방향: 생명 (Life)
- XIV. 절제: 물 (Water) | 역방향: 불평등/불균형 (Imbalance)
- XV. 악마: 고통 (Pain) | 역방향: 통제 (Control)
- XVI. 탑: 대지 (Earth) | 역방향: 혼돈 (Chaos)
- XVII. 별: 신념 (Faith) | 역방향: 시간 (Time)
- XVIII. 달: 야수 (Beast) | 역방향: 비밀 (Secret)
- XIX. 태양: 빛 (Light) | 역방향: 슬픔 (Sorrow)
- XX: 심판: 언데드 (Undead) | 역방향: 목적 (Purpose)
- XXI: 세계: 화염 (Fire) | 역방향: 어둠 (Darkness)`
  },
  {
    pageNumber: 40, title: "Adventure Sites & Map Generation", titleKo: "모험지 설계와 지도 생성",
    content: `Adventure Sites (던전 및 모험 구역 설계법)
Referee는 모험 지역을 구축할 때 다음 요소를 섞어 배치합니다:
- 말통할 수 있는 몬스터/NPC 최소 1개체 이상
- 무언가를 두고 치열하게 이권을 다투는 라이벌 두 정파 파벌(Factions)

• 무작위 지도 드로우 (Generating Maps):
Referee 덱(메이저 아르카나)에서 카드를 한 장씩 뽑아 바닥에 격자나 트리 형태로 나열하여 구역 지도를 즉흥적으로 조각해 나갑니다.
- 야외 지도 (Wilderness): 카드 1장은 반경 5마일의 육각형/정방형 토지를 뜻합니다. 인접 구역 이동에 보통 1경점(Watch)이 소요됩니다. 마을이나 기지가 나오면 지형 판정용 보조 카드를 1장 더 뽑습니다. 도로와 강줄기로 마을과 물길을 잇습니다.
- 던전 지도 (Dungeon): 카드 1장은 지하 통로, 대회랑, 혹은 방들의 묶음을 뜻합니다.
- 정착지 지도 (Settlement): 카드 1장은 특정 랜드마크나 주요 상점 건물을 지칭합니다.`
  },
  {
    pageNumber: 41, title: "Adventure Area Generators", titleKo: "구역 지형 결정표 (I~XXI)",
    content: `[Area Type Generators - 메이저 아르카나 매핑 표]

• 야외 야생 (Wilderness Area)
- I. 농경지 | II. 방목지 | III. 거친 수풀 | IV. 조그만 못 | V. 요정의 봄샘 | VI. 호수 | VII. 고분 무덤가 | VIII. 언덕 | IX. 포도원 | X. 토탄 늪지 | XI. 질퍽한 수렁 | XII. 강 범람원 | XIII. 버섯 숲 | XIV. 참나무 숲 | XV. 홀린 환각의 숲 | XVI. 황량한 벌목지 | XVII. 평원지대 | XVIII. 옛 유적 전장터 | XIX. 평범한 시골 마을 | XX. 거대 성채 요새 | XXI. 제국 대도시 정착지

• 지하 던전 (Dungeon Area)
- I. 빈 통로/방 | II. 레드캡의 소굴 | III. 요리 주방 | IV. 지하 감옥실 | V. 회합 광장 | VI. 올라가는 계단 | VII. 내려가는 돌계단 | VIII. 천연 석회동굴 | IX. 녹슨 철광산 | X. 이글거리는 대장간 | XI. 야생 버섯 밭 | XII. 어두운 지하 수로 | XIII. 고블린 소굴 벌집 | XIV. 옛 드워프 주거지 | XV. 보스 괴수의 요람 | XVI. 차가운 지하 호수 | XVII. 군견/경비병 막사 | XVIII. 고대 귀족 납골당 | XIX. 요정들의 지하 술집 | XX. 끔찍한 고문실 | XXI. 피비린내 나는 제단

• 마을 정착지 (Settlement Area)
- I. 약재방 | II. 대도서관 | III. 평화로운 정원 밭 | IV. 경비대 초소 | V. 신전 사당 | VI. 여관 선술집 | VII. 마구간 | VIII. 연무 훈련소 | IX. 망루 초소 | X. 물건 파는 시장터 | XI. 지방 유치장 | XII. 공개 처형대 | XIII. 마을 묘지 | XIV. 자비의 요양원 | XV. 도박장 환락가 | XVI. 폐허가 된 던전 입구 | XVII. 성스러운 성소 우물 | XVIII. 나루터 선착장 | XIX. 축제 박람회장 | XX. 거대한 종탑 | XXI. 고대 영웅의 대리석상`
  },
  {
    pageNumber: 42, title: "Event Decks", titleKo: "무작위 이벤트 덱 운용",
    content: `Event Deck (이벤트 발동 규칙)
Referee 덱(메이저 아르카나 21장)을 사용하여 즉흥 무작위 조우를 창출합니다.
카드는 플레이어가 큰 소음을 내거나, 다른 구역으로 이동하거나, 제자리에서 너무 오래 지체하거나, 혹은 극적인 흐름이 요구될 때마다 드로우합니다.
이벤트는 평화로운 대화 상대, 퍼즐/장애물, 위협적인 전투 등을 골고루 내포합니다.

• 역방향 이벤트 규칙 (Optional: Reversed Event Cards):
카드를 뽑았는데 역방향(거꾸로)으로 솟았다면, 본래 기재된 사건의 반대 상황이나 한층 꼬이고 부정적으로 비틀린 배드 엔딩 사건으로 묘사합니다.
예: VII. 전차 카드를 뽑았을 때, 본래는 왕실 전령관이 다가와 아군에게 승전 등의 '기쁜 소식'을 주는 인카운터이지만, 이것이 뒤집혀 역방향으로 나오면 '최악의 비보'나 '참패의 뉴스'를 몰고 다급히 뛰어오는 것으로 비틀어 적용합니다.`
  },
  {
    pageNumber: 43, title: "Random Event Tables", titleKo: "랜덤 이벤트 표 (I~XXI)",
    content: `[Random Event Tables - 메이저 아르카나 카드별 사건 목록]

• 야외 이벤트 (Wilderness Events)
- I. 매서운 돌풍 | II. 새들이 놀라 날아가는 땅울림 | III. 푸른 초원 속 요정의 고리 | IV. 천둥을 동반한 폭풍우 | V. 먹구름이 걷히며 내리쬐는 서광 | VI. 숲으로 향하는 기괴한 발자국 | VII. 맹렬히 싸운 핏자국 흔적 | VIII. 주인 잃고 서성이는 명마 | IX. 비어 있는 아늑한 오두막 | X. 방랑 상인단 | XI. 야영 중인 땜장이 | XII. 다친 채 전장을 도망쳐온 기사 | XIII. 약탈자 습격을 받는 수송 마차 | XIV. 고대 신비가 서린 선돌(Stone) | XV. 길가 여관 선술집 | XVI. 지도에 없는 은둔 부락 | XVII. 통행세를 뜯는 도적 떼 | XVIII. 오싹한 묘지 | XIX. 바실리스크에게 석화되는 주민 | XX. 도적들의 기습 매복 | XXI. 신비로운 퀘스트 단서 발견

• 지하 이벤트 (Dungeon Events)
- I. 주변 색채가 소멸하는 현상 | II. 압도적인 심연의 어둠 | III. 멀리서 들려오는 기괴한 발소리 | IV. 급류가 흐르는 지하 폭포 소리 | V. 시체가 썩어 냄새가 가득한 방 | VI. 몰래 훔쳐보는 고블린 척후병 | VII. 넓은 크레바스 절벽 | VIII. 지상으로 통하는 수직 통로 | IX. 온기가 남은 모닥불 터 | X. 갇혀 울부짖는 드워프 광부 | XI. 함정 발판 찰칵 소리 | XII. 약초 물약을 끓이는 은둔 현자 | XIII. 대마에 취해 누운 요정 아편굴 | XIV. 붕괴하여 떨어진 옛 묘실 | XV. 고블린과 사나운 바게스트 습격 | XVI. 피의 제물을 바치는 이단 의식 | XVII. 뼈다귀를 갖고 놀며 길을 막는 오우거 | XVIII. 도망치는 부상당한 현상수배범 | XIX. 지형 통로가 뒤틀리며 재구성됨 | XX. 저편 세계의 균열 포탈 | XXI. 둥지를 향해 접근해오는 드래곤

• 마을 이벤트 (Settlement Events)
- I. 비술사가 마을 광장에 도착 | II. 다둥이가 동시 출생 | III. 아군을 향한 영지 가십 전파 | IV. 근방에 거인이 나타났다는 괴소문 | V. 엄숙한 성스러운 축복 의식 | VI. 온 마을 축제 결혼 잔치 | VII. 왕실 사절의 도달 | VIII. 핏빛 독사가 가축을 도륙 | IX. 점술가가 대재앙을 예언 | X. 이장의 중독 증세 유발 | XI. 주민간 유혈 폭력 사태 | XII. 사형수의 교수형 집행 | XIII. 마을 대종이 혼자 울림 | XIV. 주민들의 공통 집단 몽환 꿈 | XV. 여관의 보물 도난 사태 | XVI. 배역자 무법 기사단 점거 | XVII. 마을 언저리에 떨어진 별똥별 | XVIII. 단체 몽유병 아이들 습격 | XIX. 낮이 지속되는 정체 상태 | XX. 종소리가 누군가의 이름을 발음 | XXI. 요정들이 선물을 잔뜩 안겨줌`
  },
  {
    pageNumber: 44, title: "Monsters Mechanics", titleKo: "몬스터 판정과 스탯 읽는 법",
    content: `Monsters (몬스터 인카운터 규칙)

1. 반응 판정 (Reaction Tests):
마주친 몬스터나 NPC의 첫 적대감 여부가 불명확할 때, 설득력이 높은 캐릭터가 컵(Cups) 판정을 굴려 반응을 테스트합니다.
- 성공: 대화에 응하며 비교적 온화하고 우호적인 반응을 이끌어 냅니다.
- 실패: 즉각 선공을 펼치거나, 대화를 단절하고 쌀쌀맞게 퇴장합니다.

2. 사기 판정 (Morale Tests):
몬스터들은 목숨 바쳐 끝까지 싸우는 광신도가 드뭅니다. 동료 수가 줄어 열세에 놓이거나, 강력한 두목이 전사하거나, 신체 부상을 무겁게 입으면 즉시 자신의 스탯치로 '사기 판정'을 벌입니다. 실패 시 무기를 버리고 항복을 구걸하거나 전투 격자판 밖으로 신속하게 도망(Flee)칩니다.

3. 몬스터 스탯창 해독 (Anatomy of a Statblock):
- 스탯 (Stat): 공격 판정, 사기 판정 등 몬스터가 굴리는 모든 판정에 이 단일 주치(Stat)를 그대로 적용합니다. 또한, 플레이어가 이 적에게 행동 대항 판정을 시도할 때 차감할 난이도 페널티 값이 됩니다.
- 부상 한도 (Wounds): 몬스터가 사망하기 전까지 견딜 수 있는 총 부상 수입니다.
- 이동력 (Speed): 전투 시 1액션당 이동하는 칸수입니다.
- 장갑 (Armor): 몬스터 전용 방어 장치는 소지 부위와 상관없이 항상 **일괄 AP 2점**의 가치를 지닙니다.`
  },
  {
    pageNumber: 45, title: "Bestiary 1-8", titleKo: "괴수 도감: 1번~8번",
    content: `Bestiary (괴수 백과)

1. 도적 (Bandit)
- 스탯: 2 | 부상: 2 | 이동: 2
- 공격: 검 또는 활 1점 (리치 1칸/6칸)
- 방어구: 투구, 흉갑 (AP 2)
- 특수 재능: 없음

2. 반시 (Banshee)
- 스탯: 3 | 부상: 2 | 이동: 1
- 공격: 없음 | 약점: 화염 (불에 닿으면 즉사)
- 방어구: 없음
- 특수 재능: Deadly shriek (결의 1점 소비 시, 반경 2칸 내 영혼을 흔드는 울부짖음으로 피해 1점씩 가함)

3. 바게스트 (Barghest)
- 스탯: 2 | 부상: 3 | 이동: 고블린 폼 2 / 하운드 사냥개 폼 4
- 공격: 물기 1점 (리치 1칸)
- 방어구: 없음
- 특수 재능: 형상변환(Shapechange), 공중부양(Levitate), 환상 환각(Illusion), 공간이동(Teleport), 유혹 매혹(Charm)

4. 바실리스크 (Basilisk)
- 스탯: 3 | 부상: 6 | 이동: 2
- 공격: 물기 2점 (리치 1칸)
- 방어구: 비늘 (몸통에만 AP 2)
- 특수 재능: Petrify (결의 소비, 반경 8칸 내 대상을 돌로 석화시킴)

5. 블러드 애스프 (Blood Asp)
- 스탯: 8 | 부상: 8 | 이동: 4
- 공격: 덮치기 독이빨 3점 (리치 3칸)
- 방어구: 핏빛 비늘 (전신 AP 2)
- 특수 재능: Deadly Venom (치명적인 맹독), Constrict (똬리 틀어 조이기), Mock (조롱하기)

6. 클루라칸 (Clurichaun)
- 스탯: 3 | 부상: 5 | 이동: 2
- 공격: 단검 1점 (리치 1칸)
- 방어구: 없음
- 특수 재능: Invisibility (투명화), Word of Opening Doors (자물쇠나 문 여는 해제 비술)

7. 드래곤 (Dragon)
- 스탯: 10 | 부상: 12 | 이동: 6
- 공격: 발톱 4점 (1칸) 또는 턱 물기 5점 (1칸)
- 방어구: 강철 비늘 (전신 AP 2)
- 특수 재능: Firebreath (결의 소비, 부채꼴 범위 6칸 내 화염 브레스 분사해 대량 부상), Overwhelming Roar (사기 저하 포효)

8. 거인 (Giant)
- 스탯: 4 | 부상: 6 | 이동: 4
- 공격: 거대 곤봉 3점 (리치 2칸)
- 방어구: 나무 정강이받이 (다리에만 AP 2)
- 특수 재능: Grab (양손으로 플레이어 움켜쥐기)`
  },
  {
    pageNumber: 46, title: "Bestiary 9-12", titleKo: "괴수 도감: 9번~12번",
    content: `Bestiary (괴수 백과)

9. 고블린 (Goblin)
- 스탯: 2 | 부상: 2 | 이동: 3
- 공격: 녹슨 단검 1점 (리치 1칸)
- 방어구: 가죽 투구 (머리에만 AP 2)
- 특수 재능: Sneak attack (불시에 등 뒤 습격 시 아머 무시 피해), Scurry (빠르게 엄폐물로 숨기)

10. 린트부름 (Lindwurm)
- 스탯: 5 | 부상: 7 | 이동: 4
- 공격: 물기 3점 (리치 2칸)
- 방어구: 질긴 가죽 비늘 (몸통에만 AP 2)
- 특수 재능: Acid spit (강산성 침 뱉기, 범위 4칸), Meld into Mud (진흙탕 속으로 은신)

11. 만티코어 (Manticore)
- 스탯: 5 | 부상: 6 | 이동: 지상 4 / 비행 6
- 공격: 발톱 2점 (1칸) 또는 꼬리 침 2점 (3칸)
- 방어구: 두꺼운 모피 (몸통에만 AP 2)
- 특수 재능: Fly (비행하기), Poison tail spike (독 전갈 꼬리침으로 마비 및 중독 유발)

12. 나이트메어 (Nightmare)
- 스탯: 4 | 부상: 5 | 이동: 8
- 공격: 불타는 발굽 2점 (리치 1칸) | 약점: 다량의 물
- 방어구: 그을린 악마 가죽 (전신 AP 2)
- 특수 재능: Incite fear (눈빛으로 절대 공포 유발), Spontaneous combustion (발굽 주변 격발 발화)`
  },
  {
    pageNumber: 47, title: "Bestiary 13-18", titleKo: "괴수 도감: 13번~18번",
    content: `Bestiary (괴수 백과)

13. 배역자 (Oathbreaker)
- 스탯: 6 | 부상: 6 | 이동: 6
- 공격: 타락의 대검 4점 (리치 2칸)
- 방어구: 파괴된 판금 갑옷 (전신 AP 2)
- 특수 재능: Martial dominance (범위 이탈 시 선공권 행사), Geas (기아스 속박)

14. 오우거 (Ogre)
- 스탯: 3 | 부상: 7 | 이동: 3
- 공격: 단단한 곤봉 2점 (리치 2칸)
- 방어구: 통가죽 털옷 (몸통에만 AP 2)
- 특수 재능: Frightening roar (심장 저격 포효), Smell treasure (보물 상자 냄새 맡기)

15. 픽시 (Pixie)
- 스탯: 3 | 부상: 1 | 이동: 7
- 공격: 마법 침 바늘 1점 (리치 1칸)
- 방어구: 없음
- 특수 재능: Induce Sleep (수면 독 바늘), Charm (유혹), Evade (초근접 회피), Disappear (신기루화)

16. 레드캡 (Redcap)
- 스탯: 3 | 부상: 3 | 이동: 3
- 공격: 피 묻은 도끼 2점 (리치 1칸)
- 방어구: 투구, 흉갑, 건틀릿 (AP 2)
- 특수 재능: Leech (살에 타격 시 입힌 피해만큼 내 체력 회복), Tackle (강력한 몸통 박치기로 넉다운)

17. 떠도는 시체들 (Restless Dead)
- 스탯: 2 | 부상: 2 | 이동: 2
- 공격: 물어뜯기/해골 손톱 1점 (리치 1칸)
- 방어구: 썩은 시체 상태에 따라 다름 (AP 2)
- 특수 재능: Strangle (양손 목 졸라 숨막히게 묶기)

18. 허수아비 (Scarecrow)
- 스탯: 6 | 부상: 6 | 이동: 2
- 공격: 거친 강타 3점 (리치 1칸) | 약점: 화염
- 방어구: 없음
- 특수 재능: Summon Murder (자신을 수호하는 포악한 까마귀 떼를 대량 소환)`
  },
  {
    pageNumber: 48, title: "Bestiary 19-21", titleKo: "괴수 도감: 19번~21번",
    content: `Bestiary (괴수 백과)

19. 트롤 (Troll)
- 스탯: 4 | 부상: 4 | 이동: 4
- 공격: 거대 통나무 곤봉 4점 (리치 2칸)
- 방어구: 뼈 갑주 투구, 흉갑 (AP 2)
- 특수 재능: Regenerate Wound (매 턴 종료 시 신체 부상 1점을 즉시 재생시킴)

20. 위커맨 (Wicker Man)
- 스탯: 4 | 부상: 5 | 이동: 4
- 공격: 거대 발 밟기 4점 (리치 2칸) | 약점: 화염 (불붙을 시 연쇄 피해)
- 방어구: 엮은 고리버들 쉘 (전신 AP 2)
- 특수 재능: Collect (플레이어를 잡아서 가슴의 화로 안에 집어넣음), Spontaneous Combustion (체내 불씨 폭발)

21. 우드워즈 (Woodwose)
- 스탯: 3 | 부상: 6 | 이동: 3
- 공격: 가시 곤봉 2점 (리치 1칸)
- 방어구: 마른 이끼 피복 (몸통에만 AP 2)
- 특수 재능: Meld into Foliage (수풀과 풀잎 속에 그대로 은형해 동화됨)`
  },
  {
    pageNumber: 49, title: "Illustration Page 4", titleKo: "삽화 4",
    content: `[고대의 거대한 석상 머리 유적 위에 다리를 꼬고 앉아 미소 짓고 있는 검은 날개 픽시 요정]`
  },
  {
    pageNumber: 50, title: "Time & Downtime", titleKo: "시간과 막간 활동",
    content: `Time & Downtime (시간 체계와 막간 행동)
모험 중의 시간은 전적으로 세 가지 스케일로 흘러갑니다:
- 경점 (Watch): 8시간 단위의 긴 활동. 하루는 3경점입니다. 야외 여정 및 연금술 조제 단위.
- 차례 (Turn): 15분 단위의 신속한 전개. 마을 안 수색이나 방 탐색 시 적용.
- 라운드 (Round): 10초 단위의 숨 가쁜 격투. 오직 전투 중 소모.

• 막간 정비 활동 (Downtime):
만약 모험가들이 안전한 장벽 마을이나 안전지대 영지 안에서 세션을 끝마쳤다면, 다음 현실의 주차 시간만큼 캐릭터들도 정비 기간을 누립니다.
- 주요 정비 행동 예시: 도서관 유적 연구, 선술집 축제(Carousing), 부상 치료 수술, 신규 재능 트레이닝, 마을 용병 탐색(Hirelings).
- 막간의 목표 이행: 정비 도중에도 개인 목표를 이행하여 해결할 수 있으며, 이 경우 다음 플레이의 시작 때 보너스 결의를 1점 지니고 출발합니다.`
  },
  {
    pageNumber: 51, title: "Carousing Table", titleKo: "선술집 축제 무작위 드로우 표",
    content: `Carousing (막간 흥청망청 놀기)
안전한 영지 여관에서 술독에 빠져 밤새 놀며 무너지면, 마음에 쌓인 스트레스를 극복해 결의를 회복합니다. 플레이어 덱에서 카드 1장을 드로우해 사건을 대조합니다.

[Carousing Outcomes - 드로우 결과]
- 광대: 알몸으로 깸. 소지품 장비 전부 영구 유실! (Woke up naked, all stuff gone)
- A: 시골 도랑에서 교역품 1개를 소지한 채 머리가 깨질 듯한 숙취와 함께 잠에서 깸.
- 2: 선술집 주먹 다짐을 벌여 전신에 2점의 부상을 무작위로 안음.
- 3: 자신의 최애 애용 무기 1개를 술값 대용으로 아무 교역품 1개와 강제로 바꿔버림.
- 4: 술김에 난롯가 장작으로 장난치다 술집 건물의 절반을 태워 먹음.
- 5: 여관 시비 끝에 평생을 괴롭힐 원수이자 적(Foe)을 한 명 만듦.
- 6: 나를 평생 도울 의리의 귀인 친구(Friend) 한 명과 결의 형제를 맺음.
- 7: 맛이 간 상태로 이상한 악마 교단이나 오컬트 지하 비밀 클럽 가입 서명서에 사명함.
- 8: 술집 한량들의 꼬드김에 넘어가 허무맹랑한 사기 사업에 전재산을 투자해 시작함.
- 9: 선술집 주인장에게 특출난 시적 영감을 건네, 평생 무상 투숙권을 얻음.
- 10: 술주정꾼들의 밀어 뒤에서 매우 쓸모 있고 은밀한 고대 소문 단서를 들음.
- P: 나를 수호해줄 용병 보디가드 한 명을 주급 약정으로 정식 고용함.
- Kn: 누군가 장난이랍시고 자는 내 얼굴에 대고 강력한 지침 맹세(Geas)를 서약시켜 둠.
- Q: 깨어나니 귀엽지만 꼬질꼬질한 떠돌이 개 한 마리가 나를 주군으로 모시며 절대 곁을 안 떠남.
- K: 어젯밤 저지른 온갖 만행과 소란 범죄(본인이 지은 것이 명백함)로 인해 1d14일간 영지 토굴 감옥에 정식 구금 수감됨.`
  },
  {
    pageNumber: 52, title: "Hirelings", titleKo: "추종자 고용 (Hirelings)",
    content: `Hirelings (마을 용병 및 일꾼 고용)
위험한 일이나 심부름을 대신해 줄 일꾼들을 고용합니다. 이들은 주인을 돕고 막간 정비 기간에도 대신 파견 보낼 수 있지만, 목숨이 날아갈 만한 직설적인 위기 전장에는 절대 먼저 들어가지 않으려 발뺌합니다.

• 고용 과정:
1. 마을 안에서 적절한 스펙의 용병 후보를 물색하고자 컵(Cups) 판정을 굴립니다.
2. 찾은 후, 그들과 주급 협상을 벌이기 위해 코인(Coins) 판정을 거쳐 성공하면 고용합니다.
3. 캐릭터 한 명이 최대로 고용해 데리고 다닐 수 있는 용병 한계 수는 자신의 **컵(Cups) 능력치 값**과 동일합니다.

• 임금 지불:
용병을 고용한 매주가 끝날 때마다, 유지 코인(Coins) 판정을 수행합니다.
- 성공: 임금을 차질 없이 주어 만족스럽게 계속 복역합니다.
- 실패: 지불한 자금이 없어 용병이 직장을 포기하고 떠나거나, 일이 너무 고되어 위험하다고 판단해 사직서를 낸 뒤 영영 이탈합니다.`
  },
  {
    pageNumber: 53, title: "Folk You Might Meet On the Road", titleKo: "길 위에서 만나는 유랑민",
    content: `Folk You Might Meet (인물 생성 오라클)
모험을 벌이다 마주치는 마을 주민이나 여정 길의 무작위 유랑민들의 사양과 행동양식을 엮어내는 표입니다.

[Occupation - 직업 (메이저 카드 I~XXI 매핑)]
I. 연금술사 | II. 서기/사서 | III. 약초꾼 | IV. 경비대장 | V. 성직자 | VI. 맹세의 기사 | VII. 마상시합 준비생 | VIII. 조련사 | IX. 은둔 현자 | X. 유랑 상인 | XI. 재판관 | XII. 추방된 부랑인 | XIII. 암살자 | XIV. 전문 치료사 | XV. 투전방 딜러 | XVI. 유적 굴파기 | XVII. 점성가 | XVIII. 라이칸스로프 | XIX. 소박한 농부 | XX. 성주/이장 | XXI. 역사 학자

[Female Names - 요조숙녀들의 이름 (I~XXI)]
알리스, 브리지드, 카트리오나, Dreda, 에디, 엘레오노르, Gretel, Iris, 조안, Jankin, 메이벨, 마드라, Mira, Odda, 오를라, 로즈, 로완, Selene, Winifred, Willow, Wynn

[Male Names - 시골 청년들의 이름 (I~XXI)]
Coalman, 코난, 에그버트, 에드가, Faris, Garold, Hob, Jack, Jankin, Jory, Kagan, Lewin, Lochlann, 미하일, Navir, 오스릭, 랄프, Steffon, Temar, Wat, Yoris

[Personality - 별자리에 따른 성격 기운 (I~XXI)]
- 태양좌: 자신만만한 (confidence) / 오만한 (proud) / 리더 기질의 (leader)
- 달의 좌: 헌신적 돌봄 (nurturing) / 감성적인 (emotional) / 직관적 감지 (perceptive)
- 수성좌: 영민한 재치 (clever) / 호기심 많은 (curious) / 분석가적 (analytical)
- 금성좌: 매혹적인 (charming) / 조화 외교적 (diplomatic) / 쾌락 만끽 (pleasure-seeking)
- 화성좌: 담대한 용맹 (courageous) / 투쟁 공격적 (aggressive) / 경쟁 승부욕 (competitive)
- 목성좌: 자비로운 은혜 (generous) / 현명한 통찰 (wise) / 사색 철학가 (philosophical)
- 토성좌: 엄격한 통제 (disciplined) / 극도로 신중한 (cautious) / 인내심 깊은 (patient)`
  },
  {
    pageNumber: 54, title: "Oracles - Action & Yes/No", titleKo: "신탁: 행동 및 질문 오라클",
    content: `Oracles (운명의 신탁 사용법)
스토리 진행 시 궁금한 의문이나 미지의 돌발 변수가 생기면 타로를 드로우하여 운명을 묻습니다.

• 예/아니오 신탁 (Yes/No Oracle):
덱에서 카드 1장을 드로우해 판정합니다:
- 홀수 숫자 카드 (3, 5, 7, 9): **아니오 (No)**
- 짝수 숫자 카드 (2, 4, 6, 8, 10): **예 (Yes)**
- 페이지 / 나이트 (Page/Knight): **아니오, 그러나... (No, but...)**
- 퀸 / 킹 (Queen/King): **예, 하지만... (Yes, but...)**
- 에이스 (Ace): **극단적인 운명 (Extreme) [이 카드를 치우고 1장을 즉시 더 뽑아 더 강하게 해석합니다]**

• 양적 크기 신탁 (Amount Oracle):
사건의 규모나 물건의 재력을 쏩니다:
- 2 ~ 5: 없음 / 미미함 (None)
- 6 ~ 10: 무난하고 평균치 수준 (Average)
- 궁정 카드(Court Cards): 상당히 막대함 (Considerable)
- 에이스 (Ace): 도를 지나치게 압도적인 스케일 (Excessive)

* 만약 오라클 질문을 연달아 던졌는데 **같은 숫자 카드가 연속으로 두 번 드로우**되었다면, 세상에 이상 왜곡이 벌어진 것입니다. 즉시 레프리 이벤트 덱(Event Deck)에서 카드 1장을 뽑아 돌발 인카운터를 격발하십시오.`
  },
  {
    pageNumber: 55, title: "Oracles - Words Meanings", titleKo: "신탁: 카드 문양별 행동 키워드",
    content: `Oracle Word Meanings (행동-주제 키워드)
두 장의 카드를 뽑아 엮어냅니다. 플레이어 덱에서 1장을 뽑아 **행동(Action)**을 얻고, 레프리 덱에서 1장을 뽑아 **주제(Subject)**를 엮어 상상력을 동원해 상황을 묘사합니다.

[문양별 행동 키워드 (Action Words)]
• 컵 (Cups):
A. 수용하다 | 2. 결합하다 | 3. 모으다 | 4. 심사숙고하다 | 5. 절망하다 | 6. 회상하다 | 7. 선택하다 | 8. 유기하다 | 9. 놓아주다 | 10. 실현하다 | P. 직감하다 | Kn. 순종하다 | Q. 치유하다 | K. 균형잡다

• 완드 (Wands):
A. 고취하다 | 2. 도모하다 | 3. 확장하다 | 4. 교감하다 | 5. 투쟁하다 | 6. 징벌하다 | 7. 수호하다 | 8. 운신하다 | 9. 저항하다 | 10. 이룩하다 | P. 답사하다 | Kn. 대결하다 | Q. 버텨내다 | K. 통솔하다

• 소드 (Swords):
A. 벼리다 | 2. 주저하다 | 3. 신음하다 | 4. 엄호하다 | 5. 갈취하다 | 6. 도주하다 | 7. 기만하다 | 8. 유금하다 | 9. 공포하다 | 10. 격멸하다 | P. 전달하다 | Kn. 설파하다 | Q. 알아채다 | K. 호령하다

• 코인 (Coins):
A. 개시하다 | 2. 길들이다 | 3. 축조하다 | 4. 아끼다 | 5. 유폐하다 | 6. 베풀다 | 7. 수집하다 | 8. 연마하다 | 9. 은혜하다 | 10. 고착하다 | P. 연찬하다 | Kn. 대기하다 | Q. 영접하다 | K. 봉급하다

* 주제 단어는 메이저 아르카나 매핑(p.39)을 사용하여 해석을 더합니다.`
  },
  {
    pageNumber: 56, title: "Magick Items - Swords", titleKo: "마법 무기 (소드 슈트)",
    content: `Magick Weapons (Swords suit) - 검의 카드 보물
플레이어 덱에서 소드(Swords) 카드를 드로우해 고대 전설의 칼날 무기를 획득합니다:

- A. 아스칼론 (Ascalon): 성 조지의 칼. 비술이나 요정의 능력에 의해 흠집 나거나 파괴될 수 없습니다.
- 2. 발뭉 (Balmung): 시구르드의 검. 이 무기로 입힌 상처는 오직 초자연적 마법 치료로만 수복됩니다.
- 3. 칼라드볼그 (Caladbolg): 무지개 대검. 결의 1점을 소비 시, 내 주변 3칸 내 모든 존재에게 부상 1점씩 분사합니다.
- 4. 쿠르타나 (Curtana): 자비의 검. 결의 1점을 사용하면, 칼등 치기로 죽이지 않고 상대를 즉시 기절시킵니다.
- 5. 듀란달 (Durendal): 롤랑의 보검. 칼끝의 단단함이 무쇠에 달해, 적의 어떠한 갑옷 AP 방어력도 완전히 무시합니다.
- 6. 엑스칼리버 (Excalibur): 눈부신 신검. 결의 1점을 소비해 칼날을 밝혀, 주변 3칸 내 눈이 있는 적의 명중률에 -3 페널티를 입힙니다.
- 7. 그람 (Gram): 용살검. 불결한 용이나 거대 괴수에게 두 배의 피해 부상을 입힙니다.
- 8. 루아즈 (Joyeuse): 샤를마뉴의 30색 검. 하루에 딱 한 번 판정을 수행할 때 결의 소모 없이 즉석 +3 보너스 판정을 받습니다.
- 9. 로베라 (Lobera): 야수 사냥검. 야수와 격투 중 결의 1점을 지불하면 아군 턴에 보너스 공격을 즉각 행사합니다.
- 10. 미스틸테인 (Mistilteinn): 기생 겨우살이 검. 철제 갑옷을 입지 않는 요정 크리처에게 부상 가타 시 +2의 추가 피해를 줍니다.
- P. 오르나 (Orna): 수다쟁이 검. 주인이 기절하면 검이 알아서 허공에 부양해 주인 주변을 사수하고 칼부림을 칩니다.
- Kn. 티조나 (Tizona): 겁쟁이 사냥검. 검을 꺼내 흔들면 적은 마크당 즉각 사기 판정을 치러야 합니다.
- Q. 티르핑 (Tyrfing): 피를 탐하는 저주검. 칼집에 넣을 때 반드시 결의 1점을 바쳐야만 들어갑니다.
- K. 줄피카르 (Zulfiqar): 두 갈래 끝의 검. 결의 1점을 지불하면 이번 칼질의 딜을 두 배로 증폭시킵니다.`
  },
  {
    pageNumber: 57, title: "Magick Items - Coins", titleKo: "마법 방어구 (코인 슈트)",
    content: `Magick Armor & Shields (Coins suit) - 방어구와 방패
플레이어 덱에서 코인(Coins) 카드를 드로우해 강력한 장갑 보물을 획득합니다:

- A. 고통의 면류관 (Circlet of Agony): 조여드는 머리띠. 머리에 씌우고 영창을 외우면 벗지 못하고 두개골을 죄여 즉사시킬 수 있습니다.
- 2. 뒤반 (Dubán): 자아의 방패. 전투 개시 시, 현재 전장에 있는 적들의 총 머릿수와 동일한 수치로 방패 AP가 맞춤 승상됩니다. (최소 AP 3)
- 3. 소멸의 건틀릿 (Gauntlets of Missing Missiles): 결의를 소비해 나에게 격발된 화살이나 투척 무기를 차원 소멸시킵니다.
- 4. 녹색 흉갑 (Green Armor): 요정 친구의 상징. 장착 시 저편 세계의 요정들이 무조건 형제나 우방으로 맞이해 줍니다.
- 5. 생목 흉갑 (Heartwood Cuirass): 고목의 심재로 엮은 방어구. 전투 종료 후 손상을 완벽하게 자가 복원합니다.
- 6. 공포의 투구 (Helm of Terror): 장착 후 결의를 소비해 적에게 공포 사기 판정을 즉시 씌웁니다.
- 7. 은형 헬멧 (Huliðshjálmr): 오직 필멸자인 '인간'들에게만 내 육체를 완벽하게 투명 상태로 차단해 줍니다.
- 8. 철의 건틀릿 (Járnglófar): 결의 1점을 소모해 강철 쇠창살을 한 손으로 우그러뜨리거나 큰 바위를 날려 보냅니다.
- 9. 카인헬름 (Kynehelm): 절대 수호의 투구. 이 투구를 착용하고 있는 동안에는 무슨 일이 있어도 머리(Head) 부분에 부상을 받지 않습니다.
- 10. 미스릴 체인 (Mithril Shirt): 중량을 차지하지 않는 전신 방어도 10짜리 가죽 이너 사슬 갑옷.
- P. 팔랑기나 (Palangina): 착용자를 모든 물리적/화학적 화염이나 브레스 지옥 불길로부터 절대 보호하는 가죽 갑옷.
- Kn. 무소음 방패 (Silence): 시선이나 포효성 음파를 완벽히 굴절시켜 주인을 석화나 포효로부터 완전 방어해주는 방패.
- Q. 비단 쇠사슬 (Silken Mail): 움직일 때 먼지 한 톨 소리조차 무음으로 제어해 주며 올을 풀어 튼튼한 동아줄로 씁니다. 광대가 나오면 풀립니다.
- K. 타른헬름 (Tarnhelm): 사용자를 원할 때 두꺼비 폼으로 완벽하게 신체 크기를 줄여 변신시켜 주는 헬멧.`
  },
  {
    pageNumber: 58, title: "Magick Items - Cups", titleKo: "마법 용기 (컵 슈트)",
    content: `Mystical Containers & Vessels (Cups suit) - 항아리와 주머니
플레이어 덱에서 컵(Cups) 카드를 드로우해 요술 용기 보물을 획득합니다:

- A. 바람 주머니 (Bag of Wind): 열면 돛단배나 풍차를 돌릴 수 있는 거대 여름 훈풍 폭풍을 한 점 뿜어내 줍니다.
- 2. 브란의 뿔잔 (Brân's Horn): 잔 안에서 언제나 마르지 않고 원하는 임의의 고농도 액체 주류나 물이 계속 리필됩니다.
- 3. 무통 칼집 (Caladbolg's Scabbard): 소지하는 동안 전신에 어떠한 신체 부상을 입어도 부상 페널티(-3 등)를 완전 무시합니다.
- 4. 요술 주머니 (Corrbolg): 아침에는 아무리 가득 차 있어도 무조건 비어 보이고, 밤에는 빈 자루여도 콩으로 차 있는 것처럼 무겁게 체감됩니다.
- 5. 쿠르소의 병 (Curso): 마시면 1개월 동안 늙지 않으며 한 달에 한 번 신탁의 미래 질문에 대해 예/아니오 진실된 대답을 얻습니다.
- 6. 용기의 솥 (Dyrnwch's Cauldron): 용기 있는 자가 다가가면 고기가 10초 만에 끓지만 비겁자 앞에서는 아궁이에 불을 때도 절대 안 삶아집니다.
- 7. 귀드노의 바구니 (Gwyddno's Basket): 바구니 안에 소량 담아둔 건조 비상 식량을 즉시 100배 부피로 증폭시켜 줍니다.
- 8. 진실의 성배 (Goblet of Truth): 이 잔의 물을 한 모금 들이켠 대상은 다가오는 1경점 동안 결코 어떠한 종류의 사소한 거짓말도 불가능해집니다.
- 9. 나이팅게일 컵 (Nightingale Cup): 하루에 3번 이 잔의 음료를 마시는 즉시 신체에 박힌 상흔 부상 1점을 완전 무통으로 치료합니다.
- 10. 밤걸이 모래시계 (Nightwalker's Hourglass): 모래시계를 거꾸로 엎으면 현재 서 있는 토양 구역의 고대 역사가 홀로그램처럼 실감 나게 흘러갑니다. 10년당 결의 1점 소모.
- P. 예술의 술병 (Oðrerir): 시인의 물약. 한 잔 마시면 신적인 시인이 되어 1차례 동안 persuasion, 속임수 소셜 판정이 자동 성공합니다.
- Kn. 황금 단지 (Pot of Gold): 거래 시 무조건 Coins 판정이 자동 성공하는 소모되지 않는 돈단지. 요정 주인의 추적을 받습니다.
- Q. 붉은 조표 자루 (Red Gourd): 결의를 소비해 적 1개체를 자루 속으로 축소 소환해 봉인합니다.
- K. 영혼석 (Soul Stone): 대상의 영혼을 강제로 뽑아내 보관하고, 보관 중인 혼을 다른 무생물이나 시체에 불어넣어 소생시킵니다.`
  },
  {
    pageNumber: 59, title: "Magick Items - Wands", titleKo: "마법 악기 (완드 슈트)",
    content: `Arcane Musical Instruments (Wands suit) - 연주하는 마법 보물
플레이어 덱에서 완드(Wands) 카드를 드로우해 신비한 힘을 품은 마법 악기를 획득합니다:

- A. 에바르의 소형 북 (Aevarr's Tabor): 결의를 소비해 가볍게 타격하면 소리가 들리는 범위 내의 모든 군중을 제어 불가 춤판에 밀어 넣습니다.
- 2. 암두시아스의 나팔 (Amdusias' Screamer): 하루 한 번 결의를 소비해 불면, 고막을 찢는 사운드로 지정 부위에 즉각 부상 1점을 꽂습니다.
- 3. 암피온의 하프 (Amphion's Lyre): 결의를 사용해 연주하면 약 1000파운드의 무거운 사물을 텔레키네시스 공중 부양으로 옮깁니다.
- 4. 드루이드 하프 (Archdruid's Lyre): 숲속의 소형 조류나 토끼, 다람쥐들을 완벽하게 나의 사역마이자 통신원으로 복종시킵니다.
- 5. 아틀라스 소라 (Atlas Conch): 결의를 소비해 일대 전장에 폭우를 몇 차례 쏟아지게 하거나 격자판에 거대 집단 수해 파도를 일으킵니다.
- 6. 엔델리온의 오카리나 (Endellion's Ocarina): 악기 스스로 하늘을 날며 허공에서 아름답게 자가 연주를 치도록 조종합니다.
- 7. 마녀의 허디거디 (Harridan's Hurdy-Gurdy): 웅장한 백사운드로 소비한 결의 점수만큼의 적을 황홀경(Trance)에 묶어 바보로 만듭니다.
- 8. 릴리윈의 레벡 (Liliwin's Rebec): 연주할 때마다 무작위로 하나의 마이너 아르카나 마법 용어를 허공에 빚어내 주문을 보강해 줍니다.
- 9. 미노리의 뼈하프 (Minnorie's Harp): 살인자가 주변 반경에 숨어 있으면 하프 스스로가 구슬프고 음산한 사령 멜로디를 자가 조율해 튕깁니다.
- 10. 롤랑의 상아 뿔피리 (Rowland's Horn): 크게 불면 세상 반대편에 있는 전령관 동료들에게까지 긴박한 경보 신호가 닿습니다.
- P. 영혼의 징 (Spirit Chime): 두드리면 소리와 함께 영적 영역 및 은신 몬스터의 실루엣이 투명화를 깨고 시각화됩니다.
- Kn. 극단원 류트 (Trouper's Lute): 결의를 지불해 연주하여 일대의 거대 인파 전체를 감동 속에 무력하게 매료시킵니다.
- Q. 파쇄의 트럼펫 (Trumpet of Shattering): 단단한 화강암 문, 쇠창살, 유리 장갑 등을 사운드 파장으로 즉시 깨부숴 가루로 만듭니다.
- K. 방랑자의 소형 아코디언 (Vagabond's Concertina): 연주를 들려주면 낯선 요정 부락조차 나에게 공짜로 VIP 잠자리 숙소를 제공합니다.`
  },
  {
    pageNumber: 60, title: "Character Sheet Reference", titleKo: "캐릭터 시트 레이아웃",
    content: `Character Sheet Reference (시트 레이아웃 가이드)
글롬의 캐릭터 시트 구성 요소 및 마모 양식:

1. 상단 인적 사항:
- 이름(Name), 천직(Vocation), 초상화(Portrait), 나이(Age)
- 인생로(Lifepath) 내력 기록 란

2. 스탯 블록 (Stats Block):
- 컵(Cups), 완드(Wands), 소드(Swords), 코인(Coins)
- 이동력 (SPEED - Coins 스탯과 동일)
- 축적 경험치 (EXP), 결의 (RESOLVE - 최대 10)

3. 신체 상태 정보창 (Wounds & Armor):
- 머리 (Head): 1칸 빈방 (부상 시 기절 / 추가 타격 시 사망) | 투구 방어구 슬롯 (내구도 Notch 2개)
- 몸통 (Torso): 1칸 빈방 (부상 시 모든 판정에 -3 페널티 적용) | 흉갑/갬비슨 슬롯 (내구도 Notch 3개/1개)
- 양팔 (L/R Arm): 부상 시 쥐고 있는 무기를 떨어뜨리고 손을 쓰지 못함
- 양다리 (L/R Leg): 부상 한 짝당 Speed가 2 감소. 두 다리 파손 시 거동 불가
- 방패 (Shield): 임의 부상 대신 피해를 차단하는 슬롯 (내구도 Notch 3개)

4. 하단 기타 기록 란:
- 목표(Goals) 3칸 적는 필드
- 본능(Instincts) 3칸 기록 필드
- 친구와 적 (Friends & Foes) 관계망
- 활성화한 천직 재능(Talents) 체크 란`
  }
];
