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
  speed: number | string;
  attacks: string;
  attacksKo: string;
  armor: string;
  armorKo: string;
  weakness?: string;
  weaknessKo?: string;
  talents: string[];
  talentsKo: string[];
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
    descriptionKo: "Goblin 사이에 섞여 사는 영악한 형상변환 악마. 농민을 많이 잡아먹을수록 강해집니다.",
    stat: 2, wounds: 3, speed: "2/4 (Goblin/사냥개 형상)",
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
  "Strong gust of wind",
  "Faint tremor startles birds",
  "Fairy circle, verdant meadow",
  "Storm clouds roll in; thunder",
  "Clouds recede/light breaks",
  "Footprints leading into woods",
  "Signs of a struggle",
  "Noble’s horse, abandoned",
  "Cozy cottage, nobody home",
  "Traveling merchant, selling",
  "Humble tinker at their camp",
  "Wounded knight riding horse",
  "Caravan under an ambush",
  "Ancient standing stones",
  "Lively roadside tavern",
  "Tiny hamlet not on maps",
  "Bandits demanding coin",
  "Haunted graveyard",
  "NPC trapped in Basilisk cave",
  "PCs are ambushed by bandits",
  "Milestone/clue for quest",
];

export const DUNGEON_EVENTS = [
  "Color drains from the area",
  "Overwhelming darkness",
  "Extra footsteps echo far off",
  "Sound of rushing water",
  "Chamber of rotting corpses",
  "Goblin scouts watch PCs",
  "Wide chasm blocks the path",
  "Narrow shaft to the surface",
  "Smoldering fire pit, recent",
  "Caged dwarf needs rescue",
  "A click alerts you of a trap",
  "Hermit brewing potions",
  "Opium den, fairies partaking",
  "Stumble into catacombs",
  "Barghest & goblins attack",
  "Cultists, dark ritual sacrifice",
  "Ogre, playing with bones",
  "Injured thief being hunted",
  "Dungeon corridors shift",
  "Doorway to the Otherworld",
  "Dragon approaches",
];

export const SETTLEMENT_EVENTS = [
  "Traveling Mystic arrives",
  "Multiple births at once",
  "Gossip about PCs spreads",
  "Rumor of a Giant nearby",
  "Sacred rite performed",
  "Seven-day wedding feast",
  "Herald brings good news",
  "Blood Asp attacks town",
  "Sage gives an omen",
  "Mayor is poisoned",
  "Heated argument escalates",
  "Cooper hanged for a crime",
  "Old bell tolls on its own",
  "All have the same dream",
  "Innkeeper’s heirloom stolen",
  "Oathbreakers occupy town",
  "Star falls just outside town",
  "Children sleepwalk to marsh",
  "The sun does not set",
  "The bell chimes names",
  "Fairies arrive bringing gifts",
];

export const MAP_WILDERNESS = [
  "Farmland", "Pasture", "Tall grasses", "Pond", "Fairy spring", "Lake", "Barrow-downs",
  "Rolling hills", "Vineyards", "Peat bog", "Forested swamp", "River floodplain",
  "Mushroom forest", "Oak forest", "Fairy-haunted forest", "Deforested forest",
  "Heather moor", "Ancient battleground", "Settlement—village", "Settlement—castle/fort",
  "Settlement—city",
];

export const MAP_DUNGEON = [
  "Empty room", "Redcap den", "Kitchen", "Prison complex", "Meeting place", "Stairs up",
  "Stairs down", "Natural cave", "Iron mines", "Blazing forge", "Mushroom farm",
  "Underground river", "Goblin hive", "Dwarf settlement", "Monster lair", "Subterranean lake",
  "Barracks", "Crypt", "Fairy tavern", "Torture chamber", "Altar",
];

export const MAP_SETTLEMENT = [
  "Apothecary shop", "Library", "Garden/farm", "Garrison", "Temple", "Inn/tavern", "Stables",
  "Training grounds", "Watchtower", "Bustling marketplace", "Jailhouse", "Gallows", "Cemetery",
  "House of healing", "Pleasure den", "Ruins—dungeon entrance", "Sacred shrine/spring", "Docks",
  "Festival grounds", "Bell tower", "Statue of an old hero",
];

export const WILDERNESS_EVENTS_KO = [
  "매서운 돌풍", "새 떼를 놀라게 하는 희미한 땅울림", "푸른 초원의 요정 고리", "천둥을 품은 폭풍 구름",
  "구름이 걷히며 비치는 빛", "숲으로 이어지는 발자국", "격투의 흔적", "주인 없이 버려진 귀족의 말",
  "주인 없는 아늑한 오두막", "물건을 파는 떠돌이 상인", "야영 중인 소박한 땜장이", "부상한 채 말을 타는 기사",
  "매복 공격을 받는 대상단", "고대의 선돌", "떠들썩한 길가 선술집", "지도에 없는 작은 촌락",
  "돈을 요구하는 도적 떼", "귀신 들린 묘지", "Basilisk 동굴에 갇힌 인물", "도적 떼의 기습",
  "임무의 이정표 또는 단서",
];

export const DUNGEON_EVENTS_KO = [
  "주변에서 색채가 빠져나간다", "압도적인 어둠", "먼 곳에 울리는 여분의 발소리", "거세게 흐르는 물소리",
  "썩은 시체로 가득한 방", "일행을 지켜보는 Goblin 척후병", "길을 가로막는 넓은 균열", "지상으로 이어지는 좁은 수직 통로",
  "최근까지 타오른 화덕", "구출을 기다리는 우리 속 Dwarf", "함정을 알리는 찰칵 소리", "물약을 달이는 은둔자",
  "Fairy들이 취해 있는 아편굴", "우연히 들어선 지하 묘지", "Barghest와 Goblin의 습격", "희생 의식을 치르는 사교도",
  "뼈를 가지고 노는 Ogre", "추격받는 부상한 도둑", "던전 통로가 자리를 바꾼다", "Otherworld로 통하는 문",
  "Dragon이 다가온다",
];

export const SETTLEMENT_EVENTS_KO = [
  "떠돌이 Mystic이 도착한다", "여러 아이가 한꺼번에 태어난다", "일행에 관한 소문이 퍼진다", "근처 Giant에 관한 풍문",
  "성스러운 의식이 치러진다", "일주일 동안 이어지는 혼인 잔치", "Herald가 좋은 소식을 가져온다", "Blood Asp가 마을을 덮친다",
  "현자가 징조를 전한다", "촌장이 독에 중독된다", "격한 말다툼이 커진다", "죄를 물어 통 제작자를 교수형에 처한다",
  "낡은 종이 저절로 울린다", "모두가 같은 꿈을 꾼다", "여관 주인의 가보가 도난당한다", "Oathbreaker들이 마을을 점거한다",
  "별이 마을 밖에 떨어진다", "아이들이 몽유하며 늪으로 향한다", "해가 지지 않는다", "종이 사람들의 이름을 울린다",
  "Fairy들이 선물을 들고 찾아온다",
];

export const MAP_WILDERNESS_KO = [
  "농경지", "방목지", "키 큰 풀밭", "연못", "Fairy의 샘", "호수", "고분 벌판", "완만한 구릉",
  "포도밭", "이탄 늪", "숲이 우거진 습지", "강의 범람원", "버섯 숲", "참나무 숲", "Fairy 들린 숲",
  "벌목된 숲", "헤더 황야", "고대 전장", "정착지—마을", "정착지—성 또는 요새", "정착지—도시",
];

export const MAP_DUNGEON_KO = [
  "빈 방", "Redcap 소굴", "부엌", "감옥 구역", "회합 장소", "위로 향하는 계단", "아래로 향하는 계단",
  "천연 동굴", "철광", "이글거리는 대장간", "버섯 농장", "지하 강", "Goblin 군락", "Dwarf 정착지",
  "괴수의 소굴", "지하 호수", "병영", "납골당", "Fairy 선술집", "고문실", "제단",
];

export const MAP_SETTLEMENT_KO = [
  "약재상", "도서관", "정원 또는 농장", "수비대", "신전", "여관 또는 선술집", "마구간", "훈련장",
  "감시탑", "붐비는 장터", "감옥", "교수대", "묘지", "치유소", "환락굴", "폐허—던전 입구",
  "성스러운 사당 또는 샘", "부두", "축제 터", "종탑", "옛 영웅의 석상",
];

export const CAROUSING_TABLE: { [key: string]: string } = {
  Fool: "Woke up naked, all your stuff gone",
  A: "Woke up in a ditch, clutching a random Trade Good",
  "2": "Started a tavern brawl, gain 2 Wounds",
  "3": "Traded your weapon for any Trade Good",
  "4": "Started a fire, part of tavern is gone",
  "5": "Made a new Foe",
  "6": "Made a new Friend",
  "7": "Initiated into some weird group",
  "8": "Started a harebrained scheme",
  "9": "Impressed the barkeep, can stay for free",
  "10": "Learned a secret or rumor",
  P: "Hired a mercenary body guard",
  Kn: "Someone put a Geas on you as a prank",
  Q: "A dog woke you up and won’t leave your side",
  K: "Jailed for 1-14 days for a crime you definitely committed",
};

export const CAROUSING_TABLE_KO: { [key: string]: string } = {
  Fool: "알몸으로 깨어났고 모든 소지품이 사라졌다",
  A: "도랑에서 임의의 교역품 하나를 움켜쥔 채 깨어났다",
  "2": "선술집 싸움을 벌여 부상 2점을 입었다",
  "3": "무기를 원하는 교역품 하나와 바꾸었다",
  "4": "불을 내 선술집 일부가 타 버렸다",
  "5": "새로운 적을 만들었다",
  "6": "새로운 친구를 만들었다",
  "7": "기묘한 무리에 입회했다",
  "8": "무모한 계획을 시작했다",
  "9": "주점 주인을 감동시켜 무료로 머물 수 있게 되었다",
  "10": "비밀이나 소문을 하나 알아냈다",
  P: "용병 호위꾼을 고용했다",
  Kn: "누군가 장난으로 기아스를 걸었다",
  Q: "개 한 마리가 깨웠고 이제 곁을 떠나지 않는다",
  K: "분명히 저지른 죄로 1–14일 동안 투옥되었다",
};
export const FOLK_ROAD = {
  occupations: [
    "Alchemist", "Record-Keeper", "Herbalist", "Captain of the Guard", "Local Priest",
    "Oath-Sworn Knight", "Tournament Hopeful", "Beast Handler", "Reclusive Sage",
    "Traveling Merchant", "Lawspeaker", "Exile", "Assassin", "Healer", "Vice Vendor",
    "Ruin Delver", "Astrologer", "Lycanthrope", "Farmer", "Mayor", "Loremaster",
  ],
  femaleNames: [
    "Alise", "Brigid", "Catriona", "Dreda", "Edie", "Eleanor", "Gretel", "Iris", "Joan",
    "Laney", "Mabel", "Mardra", "Mira", "Odda", "Orla", "Rose", "Rowan", "Selene",
    "Winifred", "Willow", "Wynn",
  ],
  maleNames: [
    "Coalman", "Connan", "Egbert", "Edgar", "Faris", "Garold", "Hob", "Jack", "Jankin",
    "Jory", "Kagan", "Lewin", "Lochlann", "Mikhail", "Navir", "Osrick", "Ralph", "Steffon",
    "Temar", "Wat", "Yoris",
  ],
  personalities: [
    "Sun: confident", "Sun: proud", "Sun: leader", "Moon: nurturing", "Moon: emotional",
    "Moon: perceptive", "Mercury: clever", "Mercury: curious", "Mercury: analytical",
    "Venus: charming", "Venus: diplomatic", "Venus: pleasure-seeking", "Mars: courageous",
    "Mars: aggressive", "Mars: competitive", "Jupiter: generous", "Jupiter: wise",
    "Jupiter: philosophical", "Saturn: disciplined", "Saturn: cautious", "Saturn: patient",
  ],
};

export const FOLK_ROAD_KO = {
  occupations: [
    "연금술사", "기록관", "약초꾼", "경비대장", "지역 사제", "서약한 기사", "마상 시합 도전자",
    "야수 조련사", "은둔 현자", "떠돌이 상인", "법률가", "추방자", "암살자", "치료사", "향락 상인",
    "폐허 탐사자", "점성술사", "Lycanthrope", "농부", "촌장", "전승 학자",
  ],
  personalities: [
    "태양: 자신만만함", "태양: 자부심", "태양: 지도자 기질", "달: 보살핌", "달: 감정적", "달: 통찰력",
    "수성: 영리함", "수성: 호기심", "수성: 분석적", "금성: 매력적", "금성: 외교적", "금성: 쾌락 추구",
    "화성: 용감함", "화성: 공격적", "화성: 경쟁적", "목성: 관대함", "목성: 지혜로움", "목성: 철학적",
    "토성: 절제됨", "토성: 신중함", "토성: 인내심",
  ],
};

export const ORACLE_SUITS = {
  Cups: {
    A: "Accept", "2": "Unite", "3": "Gather", "4": "Contemplate", "5": "Despair", "6": "Remember",
    "7": "Choose", "8": "Abandon", "9": "Release", "10": "Fulfill", P: "Sense", Kn: "Follow",
    Q: "Heal", K: "Balance",
  },
  Wands: {
    A: "Inspire", "2": "Plan", "3": "Expand", "4": "Commune", "5": "Fight", "6": "Punish",
    "7": "Defend", "8": "Move", "9": "Resist", "10": "Accomplish", P: "Explore", Kn: "Confront",
    Q: "Endure", K: "Lead",
  },
  Swords: {
    A: "Sharpen", "2": "Hesitate", "3": "Suffer", "4": "Protect", "5": "Cheat", "6": "Flee",
    "7": "Deceive", "8": "Imprison", "9": "Fear", "10": "Defeat", P: "Communicate", Kn: "Assert",
    Q: "Perceive", K: "Command",
  },
  Coins: {
    A: "Begin", "2": "Adapt", "3": "Build", "4": "Conserve", "5": "Isolate", "6": "Share",
    "7": "Collect", "8": "Master", "9": "Reward", "10": "Stabilize", P: "Study", Kn: "Await",
    Q: "Welcome", K: "Provide",
  },
};

export const ORACLE_SUITS_KO = {
  Cups: {
    A: "받아들이다", "2": "결합하다", "3": "모으다", "4": "숙고하다", "5": "절망하다", "6": "기억하다",
    "7": "선택하다", "8": "버리다", "9": "놓아주다", "10": "이루다", P: "감지하다", Kn: "따르다", Q: "치유하다", K: "균형을 잡다",
  },
  Wands: {
    A: "고취하다", "2": "계획하다", "3": "확장하다", "4": "교감하다", "5": "싸우다", "6": "벌하다",
    "7": "수호하다", "8": "움직이다", "9": "저항하다", "10": "성취하다", P: "탐사하다", Kn: "맞서다", Q: "견디다", K: "이끌다",
  },
  Swords: {
    A: "벼리다", "2": "주저하다", "3": "고통받다", "4": "보호하다", "5": "속이다", "6": "달아나다",
    "7": "기만하다", "8": "가두다", "9": "두려워하다", "10": "꺾다", P: "전하다", Kn: "주장하다", Q: "간파하다", K: "명령하다",
  },
  Coins: {
    A: "시작하다", "2": "적응하다", "3": "세우다", "4": "아끼다", "5": "고립시키다", "6": "나누다",
    "7": "거두다", "8": "숙달하다", "9": "보상하다", "10": "안정시키다", P: "연구하다", Kn: "기다리다", Q: "맞이하다", K: "마련하다",
  },
};

export const ORACLE_SUBJECTS: { [key: string]: { name: string; meaning: string; reversed: string } } = {
  I: { name: "The Magician", meaning: "Skill", reversed: "Trickery" },
  II: { name: "The High Priestess", meaning: "Mystery", reversed: "Confusion" },
  III: { name: "The Empress", meaning: "Nature", reversed: "Emptiness" },
  IV: { name: "The Emperor", meaning: "Structure", reversed: "Tyranny" },
  V: { name: "The Hierophant", meaning: "Tradition", reversed: "Rebellion" },
  VI: { name: "The Lovers", meaning: "Partnership", reversed: "Conflict" },
  VII: { name: "The Chariot", meaning: "Willpower", reversed: "Obstacle" },
  VIII: { name: "Strength", meaning: "Bravery", reversed: "Doubt" },
  IX: { name: "The Hermit", meaning: "Guidance", reversed: "Loneliness" },
  X: { name: "Wheel of Fortune", meaning: "Fortune", reversed: "Control" },
  XI: { name: "Justice", meaning: "Truth", reversed: "Dishonesty" },
  XII: { name: "The Hanged Man", meaning: "Sacrifice", reversed: "Apathy" },
  XIII: { name: "Death", meaning: "Change", reversed: "Decay" },
  XIV: { name: "Temperance", meaning: "Patience", reversed: "Discord" },
  XV: { name: "The Devil", meaning: "Oppression", reversed: "Independence" },
  XVI: { name: "The Tower", meaning: "Disaster", reversed: "Blessing" },
  XVII: { name: "The Star", meaning: "Hope", reversed: "Insecurity" },
  XVIII: { name: "The Moon", meaning: "Instinct", reversed: "Misunderstanding" },
  XIX: { name: "The Sun", meaning: "Joy", reversed: "Sadness" },
  XX: { name: "Judgement", meaning: "Purpose", reversed: "Skepticism" },
  XXI: { name: "The World", meaning: "Wholeness", reversed: "Brokenness" },
};

export const ORACLE_SUBJECTS_KO: { [key: string]: { name: string; meaning: string; reversed: string } } = {
  I: { name: "마법사", meaning: "기예", reversed: "속임수" },
  II: { name: "여사제", meaning: "신비", reversed: "혼란" },
  III: { name: "여제", meaning: "자연", reversed: "공허" },
  IV: { name: "황제", meaning: "질서", reversed: "폭정" },
  V: { name: "교황", meaning: "전통", reversed: "반역" },
  VI: { name: "연인", meaning: "동행", reversed: "갈등" },
  VII: { name: "전차", meaning: "의지", reversed: "장애물" },
  VIII: { name: "힘", meaning: "용기", reversed: "의심" },
  IX: { name: "은둔자", meaning: "인도", reversed: "고독" },
  X: { name: "운명의 수레바퀴", meaning: "행운", reversed: "통제" },
  XI: { name: "정의", meaning: "진실", reversed: "부정직" },
  XII: { name: "매달린 사람", meaning: "희생", reversed: "무관심" },
  XIII: { name: "죽음", meaning: "변화", reversed: "부패" },
  XIV: { name: "절제", meaning: "인내", reversed: "불화" },
  XV: { name: "악마", meaning: "억압", reversed: "독립" },
  XVI: { name: "탑", meaning: "재앙", reversed: "축복" },
  XVII: { name: "별", meaning: "희망", reversed: "불안" },
  XVIII: { name: "달", meaning: "본능", reversed: "오해" },
  XIX: { name: "태양", meaning: "기쁨", reversed: "슬픔" },
  XX: { name: "심판", meaning: "목적", reversed: "회의" },
  XXI: { name: "세계", meaning: "온전함", reversed: "파손" },
};

export const MAGICK_ITEMS = {
  Swords: [
    { key: "A", name: "Begallta", text: "When paired with Morallta and held in the off-hand, this dagger negates the need to spend Resolve to guarantee a hit with Morallta." },
    { key: "2", name: "Dáinsleif", text: "A cursed dwarven sword that must take a life once unsheathed or it shatters within one Watch. Wounds inflicted by it can never heal." },
    { key: "3", name: "Draugr", text: "Forged of rare iron with a giant’s-bone hilt. It is weightless, uses no inventory slot, has Swords Requirement 1, and can only be unsheathed at night." },
    { key: "4", name: "Dyrnwyn", text: "A slim silver-hilted sword. When unsheathed by a person of noble blood, the blade blazes with fire." },
    { key: "5", name: "Elf-Shot", text: "Arrows fired by this bow become invisible and incorporeal, wounding the target but leaving no visible mark." },
    { key: "6", name: "Fragarach", text: "Once per Watch, spend Resolve to unleash a gust of wind that pushes an enemy up to 10 squares." },
    { key: "7", name: "La Scàvara", text: "Any rider struck by this lance is knocked to the ground." },
    { key: "8", name: "Mistletoe", text: "This sword never dulls. It deals one Wound per attack and, when spending Resolve, ignores armor." },
    { key: "9", name: "Morallta", text: "When an attack with this godforged sword misses, the wielder may spend Resolve to hit instead." },
    { key: "10", name: "Orna", text: "When unsheathed, it recounts in a powerful voice all deeds done with it by its wielder." },
    { key: "P", name: "Sling", text: "Against Giants and similar monsters such as Ogres, Trolls, and Wicker Men, it inflicts 3 Wounds." },
    { key: "Kn", name: "Szczerbiec", text: "On a Riposte, the wielder may catch and shatter the opponent’s weapon instead of inflicting Wounds." },
    { key: "Q", name: "Thunderbolt", text: "A javelin of pure electricity that inflicts 3 Wounds when thrown. For each Resolve spent, it bounces to a new target." },
    { key: "K", name: "Tizona", text: "When unsheathing, the wielder may spend Resolve to force an enemy to make a Morale Test." },
  ],
  Coins: [
    { key: "A", name: "Circlet of Agony", text: "Its command word makes it tighten. While worn it cannot be removed, causes unbearable pain, and kills if tightened too much." },
    { key: "2", name: "Dubán", text: "At the start of combat, this sentient shield’s AP becomes the total number of enemies its wielder is fighting, minimum 3." },
    { key: "3", name: "Gauntlets of Missing Missiles", text: "Spend Resolve to make arrows and other missiles fired at the wearer disappear." },
    { key: "4", name: "Green Armor", text: "Fey consider its wearer a friend, and the wearer is welcomed in the Otherworld." },
    { key: "5", name: "Heartwood Cuirass", text: "Living armor made from ancient heartwood. It repairs itself fully after each combat." },
    { key: "6", name: "Helm of Terror", text: "Spend Resolve to force a creature to make a Morale Test. Paired with Tizona, spending Resolve instead makes any creature flee." },
    { key: "7", name: "Huliðshjálmr", text: "Renders the wearer invisible to humans, but not fey." },
    { key: "8", name: "Járnglófar", text: "Grants great physical strength. Spend Resolve for a feat such as bending bars or lifting boulders. Its iron is also effective against fey." },
    { key: "9", name: "Kynehelm", text: "Impenetrable: no weapon can Wound the wearer’s head." },
    { key: "10", name: "Mithril Shirt", text: "A chain shirt with defense rating 10. It is lightweight and does not count toward items carried." },
    { key: "P", name: "Palangina", text: "A leather cuirass granting complete protection from fire." },
    { key: "Kn", name: "Silence", text: "Completely protects its wielder from gaze- and sound-based attacks, including roars, shrieks, and petrifying gazes." },
    { key: "Q", name: "Silken Mail", text: "The wearer cannot produce sound. Strands form strong rope; each time one is pulled, draw from the Player Deck. The armor unravels if the Fool is drawn." },
    { key: "K", name: "Tarnhelm", text: "Allows the wearer to turn into a toad and back at will. All carried gear transforms too." },
  ],
  Cups: [
    { key: "A", name: "Bag of Wind", text: "When opened, it blows captured summer winds strong enough to turn a windmill, power a sailboat, or disperse a field of dandelions." },
    { key: "2", name: "Brân’s Horn", text: "Whatever drink is wished for is found in it." },
    { key: "3", name: "Caladbolg’s Scabbard", text: "Its bearer suffers no negative effects from Wounds, but still dies from two Head Wounds." },
    { key: "4", name: "Corrbolg", text: "Appears empty after dawn and full of beans after dusk regardless of its contents; otherwise it is a normal bag." },
    { key: "5", name: "Curso", text: "Once per month, fresh spring water drunk from it allows one truthful yes/no question about the future and pauses aging for a month." },
    { key: "6", name: "Dyrnwch’s Cauldron", text: "Does not boil meat for cowards, but fully boils it in 10 seconds, one Round, for the courageous." },
    { key: "7", name: "Gwyddno’s Basket", text: "Increases any food put inside a hundredfold." },
    { key: "8", name: "Goblet of Truth", text: "Anyone drinking from it cannot tell a lie for the next Watch." },
    { key: "9", name: "Nightingale Cup", text: "Thrice per day, heals a Wound when drunk from." },
    { key: "10", name: "Nightwalker’s Hourglass", text: "Shows the past of the current location as if happening now, costing one Resolve per decade viewed." },
    { key: "P", name: "Oðrerir", text: "A gulp makes the drinker a godlike poet for one Turn. Persuasion, deception, and performance Tests succeed unless opposed by magick." },
    { key: "Kn", name: "Pot of Gold", text: "Its possessor never fails a Coins Test when paying. Its fey owner is surely trying to get it back." },
    { key: "Q", name: "Red Gourd", text: "Spend Resolve to shrink and trap one target creature. Breaking the gourd releases it at normal size." },
    { key: "K", name: "Soul Stone", text: "Spend Resolve to extract a living human’s soul. The target makes a Wands Test; failure traps the soul. Spend Resolve to place it into a soulless body." },
  ],
  Wands: [
    { key: "A", name: "Aevarr’s Tabor", text: "While played, spend Resolve to make nearby humans and fairies dance uncontrollably." },
    { key: "2", name: "Amdusias’ Screamer", text: "While played, spend one Resolve once per day to cause a Wound to any body part the musician chooses." },
    { key: "3", name: "Amphion’s Lyre", text: "While played, spend Resolve to move a nearby item weighing up to 1,000 pounds by telekinesis." },
    { key: "4", name: "Archdruid’s Lyre", text: "While played, the musician may charm and communicate with birds, fish, and rabbits." },
    { key: "5", name: "Atlas Conch", text: "While played, spend Resolve to summon a wave lasting a Round or a downpour lasting a Turn." },
    { key: "6", name: "Endellion’s Ocarina", text: "Its bearer may spend Resolve to make it play itself from any distance away." },
    { key: "7", name: "Harridan’s Hurdy-Gurdy", text: "While played, spend one Resolve per creature to hold them in a trance for as long as the music continues." },
    { key: "8", name: "Liliwin’s Rebec", text: "While played, spend Resolve to produce a random Minor Arcana magick word that may be added to a spell or used alone." },
    { key: "9", name: "Minnorie’s Harp", text: "In the presence of a murderer, it plays a haunting melody on its own." },
    { key: "10", name: "Rowland’s Horn", text: "Its blast is heard by everyone." },
    { key: "P", name: "Spirit Chime", text: "When played, the musician can see the spirit realm and things hidden by invisibility." },
    { key: "Kn", name: "Trouper’s Lute", text: "While played, spend Resolve to completely enrapture an entire crowd." },
    { key: "Q", name: "Trumpet of Shattering", text: "While played, spend Resolve to shatter one solid object made of stone, wood, metal, glass, or similar material." },
    { key: "K", name: "Vagabond’s Concertina", text: "While played, grants free room and board in any settlement, including fairy settlements." },
  ],
};

export const MAGICK_ITEM_NAMES_KO: Record<keyof typeof MAGICK_ITEMS, string[]> = {
  Swords: [
    "베갈타", "다인슬레이프", "드라우그르", "디른윈", "엘프 화살", "프라가라흐", "라 스카라바",
    "미슬토", "모랄타", "오르나", "투석구", "슈체르비에츠", "벼락", "티조나",
  ],
  Coins: [
    "고통의 관", "두반", "투사체 소실의 건틀릿", "녹색 갑옷", "심재 흉갑", "공포의 투구", "훌리드스햘므르",
    "야른글로파르", "카인헬름", "미스릴 셔츠", "팔랑기나", "침묵", "비단 사슬갑옷", "탄헬름",
  ],
  Cups: [
    "바람 주머니", "브란의 뿔잔", "칼라드볼그의 칼집", "코르볼그", "쿠르소", "디른후흐의 가마솥", "귀드노의 바구니",
    "진실의 잔", "나이팅게일 잔", "밤길잡이의 모래시계", "오드레리르", "황금 항아리", "붉은 호리병", "영혼석",
  ],
  Wands: [
    "에이바르의 작은북", "암두시아스의 절규 악기", "암피온의 리라", "대드루이드의 리라", "아틀라스의 소라고둥", "엔델리온의 오카리나", "해리던의 허디거디",
    "릴리윈의 레벡", "미노리의 하프", "롤런드의 뿔나팔", "영혼 차임", "유랑 악사의 류트", "파쇄의 나팔", "방랑자의 콘서티나",
  ],
};

export const MAGICK_ITEM_TEXT_KO: Record<keyof typeof MAGICK_ITEMS, string[]> = {
  Swords: [
    "모랄타와 짝지어 보조 손에 들면, 모랄타의 명중을 보장하기 위해 결의를 쓸 필요가 없다.",
    "한번 칼집에서 뽑으면 한 생명을 거두어야 하며, 그러지 못하면 1경점 안에 산산조각 나는 저주받은 드워프 검이다. 이 검이 남긴 부상은 결코 낫지 않는다.",
    "희귀한 철과 거인의 뼈로 만든 자루를 지닌 검이다. 무게가 없고 소지품 칸을 쓰지 않으며 소드 요구치는 1이다. 밤에만 칼집에서 뽑을 수 있다.",
    "가느다란 은빛 자루의 검이다. 귀족의 피를 이은 자가 뽑으면 칼날이 불길에 휩싸인다.",
    "이 활에서 쏜 화살은 보이지 않는 비물질이 된다. 대상에게 부상을 입히지만 눈에 보이는 흔적은 남기지 않는다.",
    "경점마다 한 번, 결의를 써서 적 하나를 최대 10칸 밀어내는 돌풍을 일으킨다.",
    "이 창에 맞은 기수는 누구든 땅으로 떨어진다.",
    "결코 무뎌지지 않는 검이다. 공격마다 부상 1점을 입히며, 결의를 쓰면 갑옷을 무시한다.",
    "신이 벼린 이 검의 공격이 빗나가면 결의를 써서 명중한 것으로 바꿀 수 있다.",
    "칼집에서 뽑히면, 주인이 이 검으로 행한 모든 일을 우렁찬 목소리로 낱낱이 이야기한다.",
    "Giant, Ogre, Troll, Wicker Man 같은 비슷한 괴수를 상대로 부상 3점을 입힌다.",
    "반격할 때 부상을 입히는 대신 상대의 무기를 받아내 산산조각 낼 수 있다.",
    "던지면 부상 3점을 입히는 순수한 전격의 투창이다. 결의 1점마다 새로운 대상 하나에게 튕겨 간다.",
    "검을 뽑을 때 결의를 써서 적 하나에게 사기 판정을 강요할 수 있다.",
  ],
  Coins: [
    "명령어를 외우면 머리띠가 조여든다. 착용 중에는 벗을 수 없고 견딜 수 없는 고통을 주며, 지나치게 조이면 죽음에 이른다.",
    "전투가 시작될 때 이 지각 있는 방패의 AP는 착용자가 맞서 싸우는 적의 총수와 같아진다. 최솟값은 3이다.",
    "결의를 쓰면 착용자를 향해 날아오는 화살과 다른 투사체를 사라지게 한다.",
    "착용자를 요정의 친구로 여기게 하며, 저편 세계에서 환영받게 한다.",
    "고대 나무의 심재로 만든 살아 있는 갑옷이다. 전투가 끝날 때마다 스스로 완전히 수리된다.",
    "결의를 써서 생물 하나에게 사기 판정을 강요한다. 티조나와 함께 쓰면 결의를 쓸 때 어떤 생물이든 달아나게 한다.",
    "착용자를 인간의 눈에는 보이지 않게 하지만, 요정의 눈까지 속이지는 못한다.",
    "엄청난 완력을 준다. 결의를 쓰면 쇠창살을 휘거나 바위를 드는 일을 해낼 수 있다. 이 건틀릿의 철은 요정에게도 효과적이다.",
    "어떤 무기도 착용자의 머리에 부상을 입힐 수 없는 난공불락의 투구다.",
    "방어 등급 10인 사슬 셔츠다. 가벼워서 소지품 수에 포함되지 않는다.",
    "착용자를 불로부터 완전히 지키는 가죽 흉갑이다.",
    "포효·비명·석화의 시선을 비롯한 시선 및 소리 기반 공격으로부터 착용자를 완전히 보호한다.",
    "착용자는 아무 소리도 내지 않는다. 실 한 가닥은 튼튼한 밧줄이 되지만, 한 가닥을 뽑을 때마다 Player Deck에서 뽑는다. 광대가 나오면 갑옷이 모두 풀린다.",
    "원할 때 두꺼비로 변했다가 되돌아올 수 있다. 지닌 장비도 모두 함께 변한다.",
  ],
  Cups: [
    "열면 여름 바람이 쏟아진다. 풍차를 돌리고 범선에 힘을 싣거나 민들레밭을 흩뜨릴 만큼 거세다.",
    "바라는 술이나 음료가 무엇이든 뿔잔 안에서 발견된다.",
    "지닌 자는 부상의 악영향을 받지 않는다. 다만 머리에 두 번째 부상을 입으면 여전히 죽는다.",
    "새벽 뒤에는 내용물과 상관없이 빈 것처럼 보이고, 황혼 뒤에는 콩으로 가득 찬 것처럼 보인다. 그 밖에는 평범한 자루다.",
    "한 달에 한 번, 이 잔으로 신선한 샘물을 마시면 미래에 관한 예/아니오 질문 하나에 참된 답을 얻고 한 달 동안 늙지 않는다.",
    "겁쟁이에게는 고기를 삶아 주지 않지만, 용기 있는 자에게는 10초, 곧 1라운드 만에 완전히 익혀 준다.",
    "안에 넣은 음식을 백 배로 늘린다.",
    "이 잔으로 마신 자는 다음 1경점 동안 거짓말을 할 수 없다.",
    "하루 세 번, 이 잔으로 마시면 부상 하나를 치유한다.",
    "현재 장소의 과거를 지금 일어나는 일처럼 보여 준다. 들여다보는 10년마다 결의 1점을 쓴다.",
    "한 모금 마시면 1차례 동안 신과 같은 시인이 된다. 비술이 맞서지 않는 한 설득·기만·공연 판정은 성공한다.",
    "이 단지를 지닌 자는 대금을 치르는 코인 판정에 실패하지 않는다. 본래의 요정 주인은 분명 되찾으려 할 것이다.",
    "결의를 써서 대상 생물 하나를 작게 줄여 가둘 수 있다. 조롱박을 깨면 원래 크기로 풀려난다.",
    "결의를 써서 살아 있는 인간의 영혼을 뽑는다. 대상은 완드 판정을 하며, 실패하면 영혼이 갇힌다. 결의를 써서 영혼 없는 몸에 그 혼을 넣을 수 있다.",
  ],
  Wands: [
    "연주하는 동안 결의를 쓰면 가까운 인간과 요정들이 멈출 수 없이 춤추게 된다.",
    "연주하는 동안 하루 한 번 결의 1점을 써서 연주자가 고른 신체 부위에 부상 1점을 입힌다.",
    "연주하는 동안 결의를 쓰면 가까이에 있는 최대 1,000파운드 무게의 물건 하나를 염력으로 움직인다.",
    "연주하는 동안 새·물고기·토끼를 매혹하고 그들과 대화할 수 있다.",
    "연주하는 동안 결의를 쓰면 1라운드 동안 이어지는 파도나 1차례 동안 이어지는 폭우를 불러낸다.",
    "지닌 자가 결의를 쓰면 아무리 멀리 떨어져 있어도 악기가 스스로 연주하게 할 수 있다.",
    "연주하는 동안 생물 하나당 결의 1점을 쓰면 음악이 계속되는 동안 그들을 황홀경에 붙들어 둔다.",
    "연주하는 동안 결의를 쓰면 임의의 마이너 아르카나 비술 단어 하나를 만든다. 그 단어는 주문에 더하거나 홀로 쓸 수 있다.",
    "살인자가 가까이에 있으면 스스로 음산한 선율을 연주한다.",
    "이 뿔피리 소리는 모든 이에게 들린다.",
    "연주하면 영의 세계와 투명화로 숨은 것들을 볼 수 있다.",
    "연주하는 동안 결의를 쓰면 군중 전체를 완전히 매혹한다.",
    "연주하는 동안 결의를 쓰면 돌·나무·쇠·유리 같은 단단한 물건 하나를 산산조각 낸다.",
    "연주하는 동안 요정 정착지를 포함한 어느 정착지에서든 무료 숙식이 주어진다.",
  ],
};

export interface LifepathEvent {
  en: string;
  ko: string;
}

export const LIFEPATH_EVENTS: { [suit: string]: { [cardRange: string]: LifepathEvent } } = {
  Cups: {
    "A-2": { en: "Had a brief romantic relationship", ko: "짧고 강렬한 로맨스 관계를 맺음" },
    "3-4": { en: "Fell out of favor with a group of people", ko: "어떤 집단이나 군중으로부터 신뢰를 잃고 눈 밖에 남" },
    "5-6": { en: "Passed up an alluring opportunity", ko: "매우 매력적이고 유혹적인 일생일대의 기회를 스쳐 보냄" },
    "7-8": { en: "Disillusioned of a previously-held belief", ko: "오랫동안 굳게 믿어왔던 가치관이나 사상에 환멸을 느낌" },
    "9-10": { en: "Lived in a far-off land", ko: "고향과 완전히 단절된 아주 먼 타국 땅에서 거주함" },
    "P": { en: "Pursued an ambition", ko: "가슴 깊이 품은 거대한 야망을 향해 헌신적으로 매진함" },
    "Kn": { en: "Were in a long-term relationship", ko: "평생에 걸친 장기적이고 진지한 관계를 이어감" },
    "Q": { en: "Took care of someone", ko: "아프거나 불우한 누군가를 정성껏 보살피며 지냄" },
    "K": { en: "Mentored in the arts by a patron", ko: "예술이나 기술 분야의 든든한 후원자를 만나 사사받음" }
  },
  Swords: {
    "A-2": { en: "Realized a difficult truth", ko: "뼈아프고 받아들이기 힘든 잔혹한 진실을 목격하고 깨달음" },
    "3-4": { en: "Mourned the loss of someone close to you", ko: "곁에 있던 매우 소중하고 가까운 사람의 죽음을 애도함" },
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
    "A-2": { en: "Worked long, hard days in a difficult job", ko: "척박하고 힘겨운 노동 환경에서 기나긴 하루를 묵묵히 버팀" },
    "3-4": { en: "Apprenticed a trade under a skilled teacher", ko: "일류 기술자 밑에서 도제 계약을 맺고 기술을 사사받음" },
    "5-6": { en: "Lost everything and became a vagabond", ko: "전 재산을 유실하고 완전히 빈털터리 방랑자 신세로 전락함" },
    "7-8": { en: "Mastered a craft or skill", ko: "특정 공예 기술이나 수련 분야를 마스터해 독자 영역을 개척함" },
    "9-10": { en: "Achieved an affluent lifestyle", ko: "큰 재물을 모아 여유롭고 호화로운 삶을 잠시 누림" },
    "P": { en: "Studied at a prestigious academy", ko: "명성 높은 명문 아카데미나 학술 기관에 입학해 공부함" },
    "Kn": { en: "Oversaw operation of a business", ko: "상업 거래망이나 핵심 비즈니스를 직접 총괄하여 운영함" },
    "Q": { en: "Raised a child", ko: "아이를 품에 안고 헌신적으로 길러냄" },
    "K": { en: "Spent time in a noble court", ko: "화려하지만 암투가 가득한 귀족 궁정에서 오랜 세월을 지냄" }
  }
};
