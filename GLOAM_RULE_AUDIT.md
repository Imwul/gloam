# Gloam v1.02 Rulebook Companion Audit

감사 기준:

- `Gloam1.02.pdf`
- `Gloam Combat Example.pdf`
- `Gloam Char Sheet.pdf`

원칙: 앱은 계산, 상태, 카드 이동, 진행, 기록만 담당한다. Referee의 상황 판단, 해석, 세계 설정, 목표 선택, 서사 결론은 자동화하지 않는다.

## 분류 기준

| 분류 | 의미 |
|---|---|
| Automatic | 원문에 단일한 산식·한도·카드 이동·상태 변화가 명시되어 앱이 그대로 처리할 수 있음 |
| Choice | 플레이어나 Referee가 원문이 허용한 선택지를 직접 선택해야 함 |
| GM Decision | Test 필요 여부, Suit·수정치, 적합성, 효과 범위처럼 Referee 판정이 필요함 |
| Narrative | 카드·표가 주는 재료를 플레이어와 Referee가 해석하거나 소설적 결과를 기록해야 함 |
| Reference Only | 설정, 조언, 예시, 표 원문을 보여주되 자동 결론을 내리지 않음 |

## Complete Rule Coverage

### Core Cards & Tests

| 위치 | 규칙 | 분류 | 앱 처리 |
|---|---|---|---|
| p.6 | Player Deck = Minor Arcana 56장 + Fool | Automatic | 57장 고유 ID와 모든 live zone을 검증 |
| p.6 | Referee Deck = Major Arcana I–XXI | Automatic | 21장 고유 ID와 모든 live zone을 검증 |
| p.6 | Fool 0, Ace 1, 2–10, Page 11, Knight 12, Queen 13, King 14 | Automatic | 공통 카드 값 함수 |
| p.6 | Fool을 뽑으면 양쪽 덱 회수·셔플 | Automatic | 비전투 즉시 회수, 전투 중 round end까지 보류 |
| p.6 | Reversed는 Magic, Event, Oracle에서 사용 | Automatic / GM Decision | 방향 저장; 표 선택만 자동, 해석은 수동 |
| p.8 | 불확실할 때만 Test | GM Decision | 앱은 Test 필요 여부를 결정하지 않음 |
| p.8 | Player card + Stat, 목표 14 | Automatic | 산식과 성공/실패 계산 |
| p.8 | Push는 선택, 두 번째 카드 값을 더함 | Choice / Automatic | Push 버튼과 합산 |
| p.8 | Push 후 실패 = Great Failure + Resolve 1 | Automatic | 상태와 Resolve 반영, 실패 서사는 생성하지 않음 |
| p.8 | 첫 장 성공 + Suit 일치 = Great Success | Automatic | 첫 장에만 적용 |
| p.8 | Help는 draw 전 선언, 한 명, 관련 Stat 추가 | Choice / Automatic | draw 전 Help Stat 입력 잠금 |
| p.8 | Help한 사람도 실패 결과를 공유 | Narrative / GM Decision | 기록·적용은 테이블에 남김 |
| p.8 | Test 수정치와 Opposed penalty | GM Decision / Automatic | Referee 입력 후 산식 적용 |

### Character

| 위치 | 규칙 | 분류 | 앱 처리 |
|---|---|---|---|
| p.11–13 | Lifepath 첫 장은 출생 배경, 이후 장은 사건 | Choice / Narrative | 정확한 표 결과와 카드만 기록 |
| p.11 | 각 카드 값만큼 나이 증가, 최소 18세 | Automatic / Choice | 나이 합산과 18세 체크 |
| p.11 | Lifepath 결과 해석과 PC 간 연결 | Narrative | 자유 입력 |
| p.14 | Stats에 1, 2, 3, 4 배치 | Choice / Automatic | 생성 유효성 검사 |
| p.14–15 | 4를 둔 Suit가 Vocation 결정 | Automatic | 선택 시 적용 가능 |
| p.14 | Speed = Coins | Automatic | Leg Wound까지 포함해 계산 |
| p.16–20 | Vocation별 6 Talents, 첫 Talent 시작 해금 | Choice / Automatic | 24개 원문 Talent와 시작 Talent 제한 |
| p.16, 34 | Talent 활성화는 Resolve 1, 일부는 추가 Resolve | Choice / Automatic | 일반 Talent 1; Magick/Bind 전용 비용 흐름 |
| p.22 | 구체적·행동 가능·도전 가능·동적인 Goal 3개 | Choice / GM Decision | active 3개 체크, 내용은 수동 |
| p.22 | Goal 수정·폐기 가능 | Choice | 상태·메모·이력 저장 |
| p.23 | Instinct 3개 | Choice | 3칸 고정 저장 |
| p.23, 34 | Instinct가 trouble을 만들거나 story를 형성하면 Resolve | GM Decision / Automatic | Referee 확인 후 Trigger 버튼 |
| p.24 | Friend 1, Foe 1: 이름·장소·연결 | Choice / Narrative | Friends/Foes/NPCs와 이력 |
| p.24 | Resolve를 써서 Friend에게 가능한 도움 요청 | Choice / GM Decision | Resolve 이동만 자동, 도움 내용은 수동 |
| p.25 | 10 + Coins slots, 상한 14, worn armor도 1 slot | Automatic | 사용량·상한 표시 |
| p.25 | 새 캐릭터는 free item 5개 | Choice | 소유/시작 아이템 기록 |
| p.25–29 | 구매 = Coins Test + 표의 modifier | Automatic / GM Decision | 인쇄 modifier로 Test 준비, 입수는 성공 확인 후 기록 |
| p.35 | 세션 말 XP: 참여, Goal, 생명 위협 각 1 | Choice / Automatic | 각 조건 확인 버튼 |
| p.35 | 자기 Vocation Talent 5 XP, 타 Vocation 10 XP | Automatic | XP와 training day 차감 |
| p.35 | 타 Vocation 시작 Talent는 학습 불가 | Automatic | 버튼 차단 |
| p.35 | Stat +1 = 10 XP, 최대 6 | Automatic | 비용·상한 적용 |
| p.35 | XP 1당 training 1일 | Automatic | 일수 진행 |

### Equipment, Armor & Wounds

| 위치 | 규칙 | 분류 | 앱 처리 |
|---|---|---|---|
| p.26 | Weapons의 Wounds, Range, Coins, Swords Req., Tags | Reference Only | 전체 표 제공 |
| p.27 | Armor의 AP, Coins, Swords Req., body part | Reference Only | 전체 표 제공 |
| p.27 | 피격 대상 body part는 target이 선택 | Choice | 자동 선택하지 않음 |
| p.27 | Wounds − AP, 0 이하면 무효 | Automatic | 계산 |
| p.27 | incoming Wounds > AP면 notch | Automatic | durability 증가 |
| p.27 | notch = AP면 파손, 수리 전 AP 0 | Automatic / Narrative | 파손 상태와 유효 AP 0; 수리 경위는 수동 |
| p.27 | Called Shot redirect = Opposed Swords Test | Choice / Automatic | 전투 Response 항목 |
| p.32 | Head Wound = unconscious, 다음 Head Wound = death | Automatic | 단일 hit의 두 번째 Wound도 사망 처리 |
| p.32 | Torso Wound = 모든 Test −3 | Automatic | 일반·전투 Test에 적용 |
| p.32 | Arm Wound = 물건 drop, arm 사용 불가 | Automatic / Narrative | 상태·참조 문구; 실제 보유물 선택은 수동 |
| p.32 | Leg Wound당 Speed −2, 0이면 쓰러짐·도움 없이 이동 불가 | Automatic / Narrative | Speed 계산; 위치 서술은 수동 |
| p.28–29 | Trade Goods는 Coins modifier 외 효과가 fiction | Reference Only / GM Decision | 원문 표와 소유·damage·uses·container notes |

### Combat

| 위치 | 규칙 | 분류 | 앱 처리 |
|---|---|---|---|
| p.29 | Grid, squares, orthogonal movement | Reference Only / Choice | 거리·위치 판단은 테이블, Speed 계산 제공 |
| p.30 | 플레이어는 hand 4장까지, Referee는 NPC마다 3장 | Automatic | 모두 공용 Player Deck에서 배분 |
| p.30 | 각 combatant가 hidden initiative 1장 선택 | Choice | facedown 상태와 개별 reveal |
| p.30 | 0부터 14까지 initiative 순서 | Automatic | 공개된 값 순서 표시 |
| p.30 | round end에 원치 않는 player hand discard | Choice | 개별 discard |
| p.30 | initiative가 적의 Test target | Automatic | 전투 목표값에 사용 |
| p.30 | Fool = initiative 0 또는 action +3, 타인에게도 가능 | Choice / Automatic | hand 선택과 +3 |
| p.30 | Fool을 뽑은 round end에 cards in play discard 후 양쪽 shuffle | Automatic | round-end 회수 |
| p.31 | hand가 있는 동안 action 가능 | Choice | action마다 hand card 이동 |
| p.31 | Combat Test는 hand card, Push 불가 | Automatic | 별도 전투 흐름 |
| p.31 | Opposed Test는 상대 Stat penalty | Automatic | Bestiary Stat 적용 |
| p.31 | Attack = Swords vs initiative; Great Success +1 Wound | Automatic | 결과와 raw Wounds 계산 |
| p.31 | Cast = Resolve 지출; enemy면 Opposed Wands | Choice / Automatic | Talent·Resolve·Wands 처리, 효과 수동 |
| p.31 | Draw/Sheathe = card discard | Automatic | card 이동 |
| p.31 | Flee = Opposed Coins | Automatic | Test만 계산, 탈출 서술 없음 |
| p.31 | Grapple = Opposed Swords, immobilize, pull half Speed | Automatic / Choice | 성공 계산, 대상 상태/위치는 notes |
| p.31 | Move/Jump = card discard, Speed squares | Automatic | 거리 제시 |
| p.31 | Shove = Opposed Swords, Swords squares | Automatic | 성공·거리 제시 |
| p.31 | Throw = discard, card value + Swords squares | Automatic | 거리 계산 |
| p.31 | Dodge Response = Opposed Coins; Great Success 1 Wound anywhere | Automatic / Choice | 결과와 1 Wound, body choice 수동 |
| p.31 | Riposte = missed melee 뒤 Opposed melee Attack | Choice / Automatic | Response 항목과 계산 |
| p.31 | Called Shot = Opposed Swords | Choice / Automatic | 체크와 penalty |
| Example | Lizzie 6→Resolve 7, Oscar 10, Mabel 11 GS, Anna Fool/Resolve 7 | Automatic | 회귀 테스트로 고정 |
| 종료 | 전투 종료의 승리·죽음·도주 의미 | GM Decision / Narrative | 종료 note만 받고 결과를 추론하지 않음 |

### Resolve, Rest, Advancement, Alchemy & Magic

| 위치 | 규칙 | 분류 | 앱 처리 |
|---|---|---|---|
| p.34 | Resolve 최대 10 | Automatic | clamp |
| p.34 | session start, Goal, Instinct, Great Failure, Carousing으로 획득 | Automatic / GM Decision | 확정 조건은 자동, 해석 조건은 확인 버튼 |
| p.34 | Test 결과를 Resolve당 +1, 결과를 본 뒤 사용 가능 | Choice / Automatic | 반복 +1과 Referee Resolve 이동 |
| p.34 | player가 Resolve를 쓰면 Referee가 Resolve 획득 | Automatic | 모든 전용 소비 흐름에 반영 |
| p.34 | Referee Resolve는 monster Talent와 NPC Test 증가에 사용 | Choice / Automatic | Talent 지출과 마지막 NPC Test +1 |
| p.35 | camp/settlement의 full night + meal = Wound 하나 회복 | Choice / Automatic | 두 조건 확인 후 하나 회복 |
| p.36 | Alchemy 재료, pot/cauldron, practical knowledge, vessel 필요 | Choice | 네 조건 확인 |
| p.36 | Wands Test, 한 Watch, 성공 시 one dose | Automatic / GM Decision | 시간·Test·성공 후 1 dose 기록, 효과는 수동 |
| p.37 | Folk Magic: goal, charm, use, Suit/modifier 공동 결정 | GM Decision / Narrative | 입력과 Test 준비 |
| p.37 | Folk Magic은 Wounds를 inflict할 수 없음 | Reference Only | UI에 명시, 공격 효과 생성 없음 |
| p.38–39 | Arcane Spell = known Minor word + known Major word | Choice / Automatic | known words, draw, Spellbook |
| p.38 | 두 word를 Referee와 해석 | GM Decision / Narrative | effect note를 Referee 입력 그대로 저장 |
| p.38 | cast에 최소 Resolve 1 | Choice / Automatic | Magick Talent와 비용 검사 |
| p.38 | Wound spell은 일반적으로 Resolve당 Wound 1 | GM Decision / Reference Only | “generally”를 고정 damage로 만들지 않음 |
| p.38 | 전투 spell은 Opposed Wands | Automatic | Combat action |
| p.20 | Undo Magick, 강력한 magic은 Wands Test 가능 | GM Decision / Automatic | Referee 선택 후 비용·Test |
| p.20 | Bind Magick: Resolve당 charge, 사용 시 Resolve + charge | Choice / Automatic | object, charges, 비용 추적 |
| p.56–59 | 56 Magick Item card entries | Reference Only / Choice | 원문 수치·효과 reference, 자동 서사 없음 |

### Maps, Events, Monsters, Downtime & Oracles

| 위치 | 규칙 | 분류 | 앱 처리 |
|---|---|---|---|
| p.40–41 | Referee cards를 선택한 grid/formation에 배치 | Choice | 4×4 기록판, 위치·연결 의미는 Referee |
| p.40 | Wilderness card = 5-mile zone, adjacent travel 1 Watch | Automatic / Choice | reference와 time tracker |
| p.40 | Wilderness Settlement면 terrain card 추가 | Automatic | 같은 cell의 추가 live card로 추적 |
| p.40 | roads/rivers/settlement 연결 | GM Decision | notes에 남김 |
| p.40 | Dungeon card = corridor/chamber/rooms | GM Decision / Reference Only | 정확한 표 결과만 제공 |
| p.40 | Settlement card = building/point of interest | GM Decision / Reference Only | 정확한 표 결과만 제공 |
| p.42 | noise/new location/tarry/dramatic할 때 Event draw | GM Decision / Automatic | 이유 선택 후 Referee card 이동 |
| p.42 | Reversed optional: opposite event or something bad | GM Decision / Narrative | 두 원문 선택지만 표시, 앱은 고르지 않음 |
| p.44 | Reaction Test success = amiable/talk, failure = hostile/withdrawn | Automatic / Narrative | Test 계산; 구체 반응은 수동 |
| p.44 | monster Stat = 모든 Test, PC Opposed penalty | Automatic | 전투·Morale에 적용 |
| p.44 | monster armor piece는 AP 2 | Automatic | damage flow에서 고정 |
| p.44 | weakness를 exploit하면 defeat | GM Decision / Automatic | exploit 여부는 Referee, 자동 판정 없음 |
| p.44 | monster Talent는 Referee Resolve 1, harm은 일반적으로 Opposed | Choice / GM Decision | 비용 기록; 효과·Test 여부 수동 |
| p.44 | 불리한 상황에 Morale Test, 실패 시 flee/surrender | GM Decision / Automatic | Test 계산, 두 결과 중 선택은 Referee |
| p.45–48 | Bestiary 21 statblocks | Reference Only | 전체 원문 statblock과 전투 추가 |
| p.49–50 | Watch 8h, Turn 15m, Round 10s | Automatic | time tracker |
| p.50 | safe downtime 결과와 야심찬 활동 가능 여부 | GM Decision / Narrative | Referee notes/log |
| p.50 | downtime Goal은 다음 session start에 Resolve | Choice / GM Decision | session/Goal 기록; 타이밍은 Referee 확인 |
| p.51 | Carousing card table + Resolve | Automatic / Narrative | 정확한 표와 Resolve; 결과 적용은 수동 |
| p.52 | settlement에서 Cups search, Coins hire | Automatic / Choice | 두 Test 준비 |
| p.52 | hireling 최대 Cups | Automatic | active 수 제한 |
| p.52 | weekly Coins Test 실패 시 resign | Automatic / Narrative | 실패 확인 후 상태 변경 |
| p.53 | Folk on the Road 21-entry table | Reference Only / Choice | 한 Referee card의 모든 인쇄 후보 제공 |
| p.54 | Yes/No, Ace extreme 후 다시 draw | Automatic | 표 결과 |
| p.54 | Amount | Automatic | 표 결과 |
| p.54 | 같은 number가 연속이면 Event Deck | Automatic | Player/Referee oracle draw sequence 비교 |
| p.54–55 | Action Player card + Subject Referee card | Automatic | 정확한 두 표 단어 결합 |
| p.55 | Subject Reversed | Automatic | orientation별 표 entry |
| p.54–55 | Oracle 단어의 의미 해석 | Narrative | 자동 해석·story 생성 없음 |

설정 소개, dungeon-design 조언, Referee tips, 예시 fiction은 모두 `Reference Only`이며 규칙 엔진으로 만들지 않았다.

## Domain Assessment

### Character — PASS

Lifepath, Stats, Vocation, 24 Talents, Goals 3개, Instincts 3개, Friend/Foe/NPC, portrait/notes, Wounds, Resolve, XP, advancement, equipment와 inventory가 저장되고 실제 Test·combat·downtime 흐름에 연결된다.

### Combat — PASS

공용 Player Deck 배분, hand 4/NPC 3, hidden initiative, action·response card 이동, Called Shot, armor/notch/break, Resolve/Fool, Great Success/Failure 관련 상태, combat end note가 동작한다. 공식 Combat Example의 네 계산을 재현한다.

### Magic — PASS

Folk Magic 입력, Alchemy 조건/Test/one dose, known words, reversed Major word, Spellbook, 최소 Resolve, combat Wands, Bind/Undo를 지원한다. Spell 효과는 생성하지 않는다.

### Oracle — PASS

Yes/No, Ace extreme, Amount, Action/Subject, Subject Reversed, consecutive same-number Event trigger, history가 동작한다.

### Inventory — PASS

slot/capacity, worn armor, weapon/armor/trade/magic/container/other, damage, uses, contents, 구매 Test modifier, equipment catalog를 지원한다.

### Save — PASS

전체 v2 state, Undo 25단계, debounce auto-save, JSON export/import, legacy save migration, impossible card economy 자동 복구를 지원한다. live card 57/21 유일성을 계속 검사하며 history snapshot은 live zone에서 제외한다.

### Map / Event / Bestiary / Downtime / Session Log — PASS

세 지도·이벤트 표, live card와 history 분리, settlement terrain 추가 카드, visited/notes, 21 Bestiary, Reaction/Morale/Referee Resolve, Rest, Carousing, Hirelings, time, quest/relationship/session log를 지원한다.

### UI — PASS

- Desktop, tablet breakpoint, 360px 및 더 좁은 보수적 viewport에서 document overflow 없음.
- 모든 UI 기본 폰트: Pretendard.
- 메인 `GLOAM` 타이틀만 기존 blackletter/gothic 계열 유지.
- 탭은 선택된 section만 mount해 비활성 대형 목록의 rerender를 피함.

### Performance — PASS

- Production app chunk: 약 152 KB raw / 50 KB gzip.
- CSS: 약 11 KB raw / 3.4 KB gzip.
- React vendor 분리.
- 미사용 Firebase와 icon dependency, 미사용 rulebook/tarot data 제거.
- `npm audit`: 0 vulnerabilities.

## Bugs Found

다음은 감사 당시 코드 또는 실행에서 확인한 실제 문제다.

1. TypeScript build 실패: 중복 handler, 존재하지 않는 magic/alchemy 함수, 미사용 state.
2. NPC combat hand를 Referee Deck에서 뽑아 공식 예시의 suit card를 재현할 수 없었음.
3. state updater 안의 draw 결과를 바깥 local 변수로 반환해 Oracle/Magic/Hireling draw가 `null`이 되는 경로.
4. 지도 live card를 Referee discard에도 넣어 같은 실물 카드가 두 live zone에 존재.
5. save sanitizer가 map live card를 card economy에서 누락해 reload 후 duplicate 가능.
6. map clear가 card history와 notes를 삭제.
7. Fool을 전투 중 즉시 reshuffle하거나, round end 이후에도 recall하지 않는 경로.
8. 파손 armor를 계속 full AP로 계산.
9. 첫 hit에서 Head Wound가 2 이상 들어와도 death를 기록하지 않음.
10. Monster armor에 player armor AP 1/2/3을 잘못 적용할 수 있음.
11. Friend +2, Foe −2, loyalty/HP/bodyguard wound absorption 같은 원문 없는 수치.
12. Folk Magic 고정 spell/cost/backlash/repeat penalty.
13. combat victory/boss slain, map curse/scar/sanctuary 같은 자동 narrative 결론.
14. Rest에 bedroll/tent를 필수로 만든 원문 외 조건.
15. 시작 Arcane words를 고정값으로 부여하고 자동 spell effect를 생성.
16. Carousing King 결과를 원문 `1-14 days`가 아닌 `1d14`로 바꿈.
17. Referee Resolve를 추적하거나 NPC Test에 사용할 방법이 없음.
18. armor durability, Shield, map/history, bound charges, hireling resignation 일부가 save에서 누락되거나 orphan state.
19. 화면 전체가 serif/gothic를 혼용하고 360px 아래에서 document overflow.
20. 미사용 Firebase, tarot data, 창작 RULEBOOK_PAGES가 남아 bundle/dead-end audit를 방해.

## Fixed

1. 앱 core를 source-aligned v2 state model로 교체하고 production build 복구.
2. 공용 Player Deck 전투 card economy와 57/21 uniqueness invariant 구현.
3. Fool의 비전투 즉시 recall과 전투 round-end recall 구현.
4. hidden initiative, hand/initiative/played/discard/reaction 이동 구현.
5. Test, Push, Great Success/Failure, Help, Opposed, Resolve 계산 구현.
6. Wounds, Shield/armor notches, break/AP 0, monster AP 2 구현.
7. 공식 Combat Example 산식과 armor 예시 회귀 테스트 추가.
8. Arcane/Folk/Alchemy를 원문 경계로 재작성하고 자동 effect 제거.
9. Oracle/Event/Map의 live card와 immutable history 분리.
10. 원문 의미와 수치를 보존한 한글 reference table로 event/map/oracle/carousing/magick items 정리.
11. Bestiary, Reaction, Morale, monster Talent와 Referee Resolve 통합.
12. Rest/XP/advancement/carousing/hireling/time/session 흐름 구현.
13. full save/reload/Undo/import/export, corrupt card economy repair 구현.
14. 창작 규칙·자동 story·자동 combat 결론 제거.
15. Pretendard 전역 적용, 메인 GLOAM gothic 유지, responsive CSS 교체.
16. dead data/dependency 삭제, audit vulnerabilities 0으로 정리.

## Left Intentionally Manual

- Test를 해야 하는지 여부.
- Folk Magic의 Suit와 modifier.
- Lifepath·Oracle·Event·Major Arcana·Magick word의 의미.
- Arcane Spell의 실제 효과, 범위, 지속시간과 “generally” Wound 적용.
- Called Shot/일반 hit의 body part 선택과 redirect 시도.
- Help의 fiction 및 실패 consequence 공유.
- Grapple, prone, unconscious, arm에서 떨어뜨린 물건, 위치와 terrain.
- Monster weakness가 실제로 exploited 되었는지.
- Morale failure의 flee 또는 surrender 선택.
- Monster Talent의 구체 효과와 harm을 위한 Opposed Test 필요 여부.
- Downtime 활동의 가능 여부와 결과.
- Goal·Instinct가 Resolve 조건을 충족했는지.
- Friend가 상황상 제공할 수 있는 도움.
- Event Reversed의 “opposite” 또는 “something bad” 선택.
- combat end가 승리, 패배, 도주, 협상 중 무엇인지.
- dungeon/settlement/wilderness 카드의 연결, roads, rivers, 분위기와 encounter.

## Verification

- `npm test`: 15 tests passed.
- `npm run build`: passed.
- `npm run lint`: passed.
- `npm audit`: 0 vulnerabilities.
- Google Chrome, Firefox engine, WebKit engine의 desktop/360px: console error 0, document overflow 없음, 보이는 카드 이미지 파손 0.
- 실제 Safari interaction: Player 4 + monster 3, 카드 원화와 접근성 이름 확인.
- Browser interaction: auto-save/reload, Undo, two hidden initiatives, Fool round recall, map card history, card integrity 확인.

## Final Assessment

**Can an experienced Gloam referee comfortably run an entire campaign with this application beside the rulebook without bookkeeping overhead?**

**YES.** 요청 범위의 수치 계산, card economy, character progression, combat state, Wounds/armor, Magic records, Oracles, maps/events, Bestiary, downtime, inventory, session log와 save는 companion이 맡는다. 룰북의 설명과 Referee의 창작·판정은 그대로 필요하다.

**Does the application ever invent rules or narrative outcomes not present in Gloam?**

**NO.** 자동 출력은 원문의 산식·표·명시적 상태 변화로 한정된다. 해석 가능한 모든 항목은 입력, note, 선택, reference로 남겨 두었다.

Release 1.0 출고 행렬의 최종 판정은 `GLOAM_RELEASE_1_CERTIFICATION.md`를 따른다. Edge와 실제 iPhone·Android 및 실제 Firefox 앱을 시험할 환경이 없어 현재 Candidate 판정은 PARTIAL이다.
