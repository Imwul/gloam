export interface TarotCard {
  id: string;
  name: string;
  suit: 'Major' | 'Cups' | 'Swords' | 'Wands' | 'Pentacles';
  value: number;
  imageUrl: string;
  // Gloam specific attributes
  statAssociation?: string; // Cups = Care/Judgement, Swords = Strength/Combat, Wands = Will/Spirit, Pentacles/Coins = Agility/Wealth
  actionKeyword?: string;  // For Player Deck cards (Minor + Fool)
  subjectKeywordUpright?: string; // For Referee Deck cards (Major I-XXI)
  subjectKeywordReversed?: string; // For Referee Deck cards (Major I-XXI)
}

const ROMAN_NUMERALS = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"
];

const MAJOR_NAMES = [
  "광대 (The Fool)",
  "마술사 (The Magician)",
  "고위 여사제 (The High Priestess)",
  "여황제 (The Empress)",
  "황제 (The Emperor)",
  "교황 (The Hierophant)",
  "연인 (The Lovers)",
  "전차 (The Chariot)",
  "힘 (Strength)",
  "은둔자 (The Hermit)",
  "운명의 수레바퀴 (Wheel of Fortune)",
  "정의 (Justice)",
  "매달린 사람 (The Hanged Man)",
  "죽음 (Death)",
  "절제 (Temperance)",
  "악마 (The Devil)",
  "탑 (The Tower)",
  "별 (The Star)",
  "달 (The Moon)",
  "태양 (The Sun)",
  "심판 (Judgement)",
  "세계 (The World)"
];

const SUITS: ('Cups' | 'Pentacles' | 'Swords' | 'Wands')[] = ['Cups', 'Pentacles', 'Swords', 'Wands'];

const SUIT_STAT_ASSOCIATIONS = {
  Cups: "판단력, 학식, 의술, 돌봄, 인내, 도구 (관련 스탯: Cups / 컵)",
  Swords: "근력, 용기, 인내력, 활력, 전투 (관련 스탯: Swords / 검)",
  Wands: "의지, 신비주의, 정신력, 열정, 오컬트 지식 (관련 스탯: Wands / 완드)",
  Pentacles: "민첩성, 은신, 교활함, 조작, 부 (관련 스탯: Coins / 동전)"
};

// Oracle Action Keywords (Page 54)
export const ActionKeywords: Record<string, Record<number, string>> = {
  Cups: {
    1: "수용 (Accept)", 2: "결합 (Unite)", 3: "모임 (Gather)", 4: "성찰 (Contemplate)", 5: "절망 (Despair)",
    6: "기억 (Remember)", 7: "선택 (Choose)", 8: "포기 (Abandon)", 9: "해방 (Release)", 10: "성취 (Fulfill)",
    11: "직감 (Sense)", 12: "추종 (Follow)", 13: "치유 (Heal)", 14: "균형 (Balance)"
  },
  Wands: {
    1: "고무 (Inspire)", 2: "계획 (Plan)", 3: "확장 (Expand)", 4: "교감 (Commune)", 5: "투쟁 (Fight)",
    6: "처벌 (Punish)", 7: "방어 (Defend)", 8: "이동 (Move)", 9: "저항 (Resist)", 10: "달성 (Accomplish)",
    11: "탐험 (Explore)", 12: "대면 (Confront)", 13: "인내 (Endure)", 14: "인도 (Lead)"
  },
  Swords: {
    1: "연마 (Sharpen)", 2: "망설임 (Hesitate)", 3: "고통 (Suffer)", 4: "보호 (Protect)", 5: "속임수 (Cheat)",
    6: "도주 (Flee)", 7: "기만 (Deceive)", 8: "감금 (Imprison)", 9: "두려움 (Fear)", 10: "패배 (Defeat)",
    11: "전달 (Communicate)", 12: "주장 (Assert)", 13: "인지 (Perceive)", 14: "명령 (Command)"
  },
  Pentacles: {
    1: "시작 (Begin)", 2: "적응 (Adapt)", 3: "건설 (Build)", 4: "보존 (Conserve)", 5: "고립 (Isolate)",
    6: "공유 (Share)", 7: "수확 (Collect)", 8: "숙달 (Master)", 9: "보상 (Reward)", 10: "안정 (Stabilize)",
    11: "연구 (Study)", 12: "대기 (Await)", 13: "환영 (Welcome)", 14: "제공 (Provide)"
  }
};

// Oracle Subject Keywords (Page 55)
export const SubjectKeywords: Record<number, { upright: string; reversed: string }> = {
  1: { upright: "기술 (Skill)", reversed: "속임수 (Trickery)" },
  2: { upright: "신비 (Mystery)", reversed: "혼란 (Confusion)" },
  3: { upright: "자연 (Nature)", reversed: "공허 (Emptiness)" },
  4: { upright: "구조 (Structure)", reversed: "폭정 (Tyranny)" },
  5: { upright: "전통 (Tradition)", reversed: "반역 (Rebellion)" },
  6: { upright: "협력 (Partnership)", reversed: "갈등 (Conflict)" },
  7: { upright: "의지력 (Willpower)", reversed: "장애물 (Obstacle)" },
  8: { upright: "용기 (Bravery)", reversed: "의심 (Doubt)" },
  9: { upright: "인도 (Guidance)", reversed: "고독 (Loneliness)" },
  10: { upright: "운명 (Fortune)", reversed: "통제 (Control)" },
  11: { upright: "진실 (Truth)", reversed: "부정직 (Dishonesty)" },
  12: { upright: "희생 (Sacrifice)", reversed: "무관심 (Apathy)" },
  13: { upright: "변화 (Change)", reversed: "쇠퇴 (Decay)" },
  14: { upright: "인내 (Patience)", reversed: "불화 (Discord)" },
  15: { upright: "억압 (Oppression)", reversed: "독립 (Independence)" },
  16: { upright: "재앙 (Disaster)", reversed: "축복 (Blessing)" },
  17: { upright: "희망 (Hope)", reversed: "불안 (Insecurity)" },
  18: { upright: "본능 (Instinct)", reversed: "오해 (Misunderstanding)" },
  19: { upright: "기쁨 (Joy)", reversed: "슬픔 (Sadness)" },
  20: { upright: "목적 (Purpose)", reversed: "회의론 (Skepticism)" },
  21: { upright: "온전함 (Wholeness)", reversed: "붕괴 (Brokenness)" }
};

// Generate all 78 cards with Korean names
export function generateTarotDeck(): TarotCard[] {
  const deck: TarotCard[] = [];

  // 1. Major Arcana (0 to 21)
  for (let i = 0; i <= 21; i++) {
    const roman = ROMAN_NUMERALS[i];
    const name = i === 0 ? "광대 (The Fool)" : `${roman} - ${MAJOR_NAMES[i]}`;
    const card: TarotCard = {
      id: `Major_${i}`,
      name,
      suit: 'Major',
      value: i,
      imageUrl: `/tarot/Major_${i}.jpg`
    };

    if (i === 0) {
      card.actionKeyword = "덱 리콜 & 셔플 트리거 (Recall & Reshuffle)";
      card.statAssociation = "플레이어 덱과 리프리 덱을 즉시 회수하여 섞으십시오.";
    } else {
      const subject = SubjectKeywords[i];
      if (subject) {
        card.subjectKeywordUpright = subject.upright;
        card.subjectKeywordReversed = subject.reversed;
      }
    }
    deck.push(card);
  }

  // 2. Minor Arcana (Cups, Swords, Wands, Pentacles)
  for (const suit of SUITS) {
    let suitKr = "";
    if (suit === 'Cups') suitKr = "컵";
    else if (suit === 'Swords') suitKr = "검";
    else if (suit === 'Wands') suitKr = "완드";
    else if (suit === 'Pentacles') suitKr = "동전";

    for (let value = 1; value <= 14; value++) {
      let name: string;
      let valStr = `${value}`;
      if (value === 1) {
        name = `${suitKr}의 에이스`;
      } else if (value === 11) {
        name = `${suitKr}의 시종 (Page)`;
        valStr = "Page";
      } else if (value === 12) {
        name = `${suitKr}의 기사 (Knight)`;
        valStr = "Knight";
      } else if (value === 13) {
        name = `${suitKr}의 여왕 (Queen)`;
        valStr = "Queen";
      } else if (value === 14) {
        name = `${suitKr}의 왕 (King)`;
        valStr = "King";
      } else {
        name = `${suitKr} ${value}`;
      }

      const card: TarotCard = {
        id: `${suit}_${valStr}`,
        name,
        suit,
        value,
        imageUrl: `/tarot/${suit}_${valStr}.jpg`,
        statAssociation: SUIT_STAT_ASSOCIATIONS[suit],
        actionKeyword: ActionKeywords[suit]?.[value] || ""
      };
      deck.push(card);
    }
  }

  return deck;
}

// Yes/No Oracle interpretation helper (Page 54)
export function getYesNoOutcome(card: TarotCard): { outcome: string; note: string } {
  if (card.suit === 'Major' && card.value === 0) {
    return { outcome: "회수 및 셔플 (Reshuffle)", note: "광대 카드는 즉시 모든 덱을 회수해 다시 섞게 만듭니다." };
  }

  const value = card.value;
  if (value === 1) {
    return { outcome: "극단적인 결과", note: "세부 내용을 알기 위해 다시 드로우하되, 결과는 극단적입니다." };
  } else if ([3, 5, 7, 9].includes(value)) {
    return { outcome: "아니오 (No)", note: "명확한 부정적인 답변입니다." };
  } else if ([2, 4, 6, 8, 10].includes(value)) {
    return { outcome: "예 (Yes)", note: "명확한 긍정적인 답변입니다." };
  } else if ([11, 12].includes(value)) {
    return { outcome: "아니오, 하지만...", note: "부정적인 답변이지만, 이를 상쇄할 만한 요인이나 부가 기회가 뒤따릅니다." };
  } else if ([13, 14].includes(value)) {
    return { outcome: "예, 하지만...", note: "긍정적인 답변이지만, 약간의 귀찮은 장애 요소나 예외 조항이 붙습니다." };
  }

  // Fallback for Major Arcana (using odd/even index rules as standard fallback)
  if (value % 2 === 1) {
    return { outcome: "아니오", note: "홀수 번호 메이저 아르카나 - 부정적으로 해석됩니다." };
  } else {
    return { outcome: "예", note: "짝수 번호 메이저 아르카나 - 긍정적으로 해석됩니다." };
  }
}

// Amount Oracle interpretation helper (Page 54)
export function getAmountOutcome(card: TarotCard): { outcome: string; note: string } {
  if (card.suit === 'Major' && card.value === 0) {
    return { outcome: "예측 불가 / 셔플", note: "광대 카드는 즉시 모든 덱을 회수해 섞도록 합니다." };
  }

  const value = card.value;
  if (value === 1) {
    return { outcome: "과도함 (Excessive)", note: "압도적이거나 아주 많은 수량/정도입니다." };
  } else if (value >= 2 && value <= 5) {
    return { outcome: "없음 (None)", note: "수량이 거의 없거나 존재하지 않는 정도입니다." };
  } else if (value >= 6 && value <= 10) {
    return { outcome: "평범함 (Average)", note: "표준적이거나 평범하고 적당한 정도입니다." };
  } else if (value >= 11 && value <= 14) {
    return { outcome: "상당함 (Considerable)", note: "비교적 크거나 눈에 띄게 풍부한 수량/정도입니다." };
  }

  // Fallback for Major Arcana
  if (value < 6) return { outcome: "없음", note: "낮은 번호 메이저 아르카나 - 미미한 수량." };
  if (value < 12) return { outcome: "평범함", note: "중간 번호 메이저 아르카나 - 적당한 수량." };
  return { outcome: "상당함", note: "높은 번호 메이저 아르카나 - 눈에 띄는 수량." };
}

// Arcane Magick Verbs (Page 38)
export const ArcaneMagickVerbs: Record<string, Record<number, string>> = {
  Cups: {
    1: "채우다 (Fill)", 2: "끌어당기다 (Attract)", 3: "기쁘게 하다 (Delight)", 4: "보호하다 [~로부터] (Protect from)", 5: "분해하다 (Disintegrate)",
    6: "고치다 (Mend)", 7: "소환하다 (Conjure)", 8: "약화시키다 (Weaken)", 9: "고체/액체화하다 (Solidify/liquefy)", 10: "진정시키다 (Calm)",
    11: "대화하다 [~와] (Speak with)", 12: "매료시키다 (Charm)", 13: "치유하다 (Heal)", 14: "되다 [~이] (Become)"
  },
  Wands: {
    1: "활성화하다 (Energize)", 2: "변화시키다 (Change)", 3: "성장시키다 (Grow)", 4: "모으다 (Gather)", 5: "격분시키다 (Enrage)",
    6: "정복하다 (Conquer)", 7: "통제하다 (Control)", 8: "가속하다 (Quick)", 9: "강화하다 (Toughen)", 10: "명령하다 (Command)",
    11: "해방하다 (Release)", 12: "선동하다 (Incite)", 13: "가열하다 (Heat)", 14: "창조하다 (Create)"
  },
  Swords: {
    1: "폭발시키다 (Explode)", 2: "숨기다 (Hide)", 3: "괴롭히다 (Afflict)", 4: "침묵시키다 (Silence)", 5: "위협하다 (Intimidate)",
    6: "순간이동하다 (Teleport)", 7: "훔치다 (Steal)", 8: "올가미 씌우다 (Ensnare)", 9: "낙담시키다 (Discourage)", 10: "패배시키다 (Defeat)",
    11: "변형시키다 (Transmute)", 12: "강제하다 (Force)", 13: "탐지하다 (Detect)", 14: "이해하다 (Comprehend)"
  },
  Pentacles: { // Coins
    1: "주다 (Give)", 2: "균형 맞추다 (Balance)", 3: "결합하다 (Combine)", 4: "빼앗다 (Take)", 5: "고립시키다 (Isolate)",
    6: "나누다 (Share)", 7: "수확하다 (Harvest)", 8: "조각하다 (Sculpt)", 9: "소환하다 (Summon)", 10: "초월하다 (Transcend)",
    11: "매료하다 (Enthrall)", 12: "감속하다 (Slow)", 13: "보호하다 (Protect)", 14: "복제하다 (Multiply)"
  }
};

// Arcane Magick Nouns (Page 39)
export const ArcaneMagickNouns: Record<number, { upright: string; reversed: string }> = {
  0: { upright: "자신 (Self)", reversed: "주의산만 (Distraction)" },
  1: { upright: "정신 (Mind)", reversed: "환상 (Illusion)" },
  2: { upright: "의식 (Consciousness)", reversed: "목소리 (Voice)" },
  3: { upright: "아름다움 (Beauty)", reversed: "추함 (Ugliness)" },
  4: { upright: "권위 (Authority)", reversed: "얼음 (Ice)" },
  5: { upright: "지식 (Knowledge)", reversed: "무지 (Ignorance)" },
  6: { upright: "유혹 (Temptation)", reversed: "갈등 (Conflict)" },
  7: { upright: "금속 (Metal)", reversed: "장벽 (Barrier)" },
  8: { upright: "힘 (Strength)", reversed: "약함 (Weakness)" },
  9: { upright: "사람 (Person)", reversed: "고립 (Isolation)" },
  10: { upright: "운명 (Fate)", reversed: "지연 (Delay)" },
  11: { upright: "진실 (Truth)", reversed: "피 (Blood)" },
  12: { upright: "육체 (Flesh)", reversed: "공허 (Emptiness)" },
  13: { upright: "죽음 (Death)", reversed: "생명 (Life)" },
  14: { upright: "물 (Water)", reversed: "불균형 (Imbalance)" },
  15: { upright: "고통 (Pain)", reversed: "통제 (Control)" },
  16: { upright: "대지 (Earth)", reversed: "혼돈 (Chaos)" },
  17: { upright: "신념 (Faith)", reversed: "시간 (Time)" },
  18: { upright: "짐승 (Beast)", reversed: "비밀 (Secret)" },
  19: { upright: "빛 (Light)", reversed: "슬픔 (Sorrow)" },
  20: { upright: "언데드 (Undead)", reversed: "의도 (Purpose)" },
  21: { upright: "불 (Fire)", reversed: "어둠 (Darkness)" }
};

export interface FolkNPC {
  occupation: string;
  femaleName: string;
  maleName: string;
  personality: string;
}

// Folk NPCs meeting on the road (Page 53)
export const FolkNPCTable: Record<number, FolkNPC> = {
  1: { occupation: "연금술사 (Alchemist)", femaleName: "앨리스 (Alise)", maleName: "콜맨 (Coalman)", personality: "태양: 자신감 넘치는 (Sun: confident)" },
  2: { occupation: "기록보관자 (Record-Keeper)", femaleName: "브리지드 (Brigid)", maleName: "코난 (Connan)", personality: "태양: 자랑스러운/오만한 (Sun: proud)" },
  3: { occupation: "약초사 (Herbalist)", femaleName: "캐트리오나 (Catriona)", maleName: "에그버트 (Egbert)", personality: "태양: 지도자형 (Sun: leader)" },
  4: { occupation: "경비대장 (Captain of the Guard)", femaleName: "드레다 (Dreda)", maleName: "에드거 (Edgar)", personality: "달: 보살피는/양육형 (Moon: nurturing)" },
  5: { occupation: "지역 사제 (Local Priest)", femaleName: "에디 (Edie)", maleName: "파리스 (Faris)", personality: "달: 감정적인 (Moon: emotional)" },
  6: { occupation: "서약 기사 (Oath-Sworn Knight)", femaleName: "엘리너 (Eleanor)", maleName: "가롤드 (Garold)", personality: "달: 통찰력 있는 (Moon: perceptive)" },
  7: { occupation: "마상시합 참가 희망자 (Tournament Hopeful)", femaleName: "그레텔 (Gretel)", maleName: "홉 (Hob)", personality: "수성: 영리한/똑똑한 (Mercury: clever)" },
  8: { occupation: "맹수 조련사 (Beast Handler)", femaleName: "아이리스 (Iris)", maleName: "잭 (Jack)", personality: "수성: 호기심 많은 (Mercury: curious)" },
  9: { occupation: "은둔 현자 (Reclusive Sage)", femaleName: "조안 (Joan)", maleName: "젠킨 (Jankin)", personality: "수성: 분석적인 (Mercury: analytical)" },
  10: { occupation: "방랑 상인 (Traveling Merchant)", femaleName: "레이니 (Laney)", maleName: "조리 (Jory)", personality: "금성: 매력적인 (Venus: charming)" },
  11: { occupation: "율법 수호자 (Lawspeaker)", femaleName: "메이벨 (Mabel)", maleName: "케이건 (Kagan)", personality: "금성: 외교적인 (Venus: diplomatic)" },
  12: { occupation: "추방자 (Exile)", femaleName: "마르드라 (Mardra)", maleName: "루윈 (Lewin)", personality: "금성: 쾌락을 좇는 (Venus: pleasure-seeking)" },
  13: { occupation: "암살자 (Assassin)", femaleName: "미라 (Mira)", maleName: "로클란 (Lochlann)", personality: "화성: 용기 있는 (Mars: courageous)" },
  14: { occupation: "치유사 (Healer)", femaleName: "오다 (Odda)", maleName: "미하일 (Mikhail)", personality: "화성: 공격적인 (Mars: aggressive)" },
  15: { occupation: "악덕 장사꾼 (Vice Vendor)", femaleName: "오를라 (Orla)", maleName: "나비르 (Navir)", personality: "화성: 경쟁적인 (Mars: competitive)" },
  16: { occupation: "유적 도굴꾼 (Ruin Delver)", femaleName: "로즈 (Rose)", maleName: "오스릭 (Osrick)", personality: "목성: 너그러운 (Jupiter: generous)" },
  17: { occupation: "점성술사 (Astrologer)", femaleName: "로완 (Rowan)", maleName: "랄프 (Ralph)", personality: "목성: 현명한 (Jupiter: wise)" },
  18: { occupation: "수인 (Lycanthrope)", femaleName: "셀레네 (Selene)", maleName: "스테판 (Steffon)", personality: "목성: 철학적인 (Jupiter: philosophical)" },
  19: { occupation: "농부 (Farmer)", femaleName: "위니프레드 (Winifred)", maleName: "테마르 (Temar)", personality: "토성: 규율 잡힌 (Saturn: disciplined)" },
  20: { occupation: "시장 (Mayor)", femaleName: "윌로우 (Willow)", maleName: "왓 (Wat)", personality: "토성: 신중한 (Saturn: cautious)" },
  21: { occupation: "구전 이야기꾼 (Loremaster)", femaleName: "윈 (Wynn)", maleName: "요리스 (Yoris)", personality: "토성: 인내심 있는 (Saturn: patient)" }
};
