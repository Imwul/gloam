import type { GameState } from "../App";
import { ARMOR, WEAPONS } from "../gameData";
import { MAJOR_RANKS, SUITS, cardValue, carryingCapacity, effectiveArmorPoints, woundedSpeed, type Card, type Suit } from "../rules";

type Update = (recipe: (state: GameState) => GameState) => void;
type Destination = "character" | "tests" | "magic" | "map" | "downtime" | "log";

export interface PlayTableProps {
  state: GameState;
  update: Update;
  talents: { name: string; textKo: string }[];
  onRollTest: () => void;
  onPushTest: () => void;
  onBoostTest: () => void;
  onNewTest: () => void;
  onEvent: () => void;
  onOracle: (kind: "yes-no" | "amount" | "action-subject") => void;
  onResolveGain: (reason: string) => void;
  onResolveSpend: (reason: string) => void;
  onGoal: (id: string, status: "completed" | "impossible") => void;
  onNavigate: (destination: Destination) => void;
  onRule: (sectionId: string) => void;
  onTalent: (name: string) => void;
  onStartReaction: () => void;
  onAdvanceWatch: () => void;
  onAdvanceTurn: () => void;
  onRecallFool: () => void;
}

const suits: Record<Suit, { name: string; symbol: string; use: string; meaning: string }> = {
  cups: { name: "Cups", symbol: "∪", use: "판단 · 배움 · 돌봄", meaning: "판단, 학습, 의술, 돌봄, 인내, 도구" },
  wands: { name: "Wands", symbol: "✦", use: "의지 · 신비 · 비술", meaning: "의지, 신비, 정신, 열정, 오컬트 지식" },
  swords: { name: "Swords", symbol: "†", use: "힘 · 용기 · 인내", meaning: "힘, 용기, 지구력, 활력, 전투" },
  coins: { name: "Coins", symbol: "◉", use: "민첩 · 은밀함 · 재화", meaning: "민첩, 은밀함, 꾀, 조종, 재화" },
};

const ranks: Record<string, string> = { A: "에이스", Page: "시종", Knight: "기사", Queen: "여왕", King: "왕" };
const majorNames = ["광대", "마법사", "여사제", "여황제", "황제", "교황", "연인", "전차", "힘", "은둔자", "운명의 수레바퀴", "정의", "매달린 사람", "죽음", "절제", "악마", "탑", "별", "달", "태양", "심판", "세계"];
const resultNames = { "great-success": "대성공", success: "성공", failure: "실패", "great-failure": "대실패" };
const environmentNames = { wilderness: "야외", dungeon: "던전", settlement: "정착지" };
const oracleNames = { "yes-no": "예 / 아니오", amount: "양 · 규모", "action-subject": "행동 + 주제" };
const armorKeys: Record<string, keyof GameState["character"]["armorNotches"]> = {
  Helmet: "helmet", Cuirass: "cuirass", Gambeson: "gambeson", Chainmail: "chainmail", "Gauntlet L": "leftGauntlet", "Gauntlet R": "rightGauntlet", "Greave L": "leftGreave", "Greave R": "rightGreave", Shield: "shield",
};
const woundNames: Record<keyof GameState["character"]["wounds"], string> = {
  head: "머리: 의식 없음 · 다음 머리 부상은 사망", torso: "몸통: 모든 판정 −3", leftArm: "왼팔: 물건을 놓침 · 사용 불가", rightArm: "오른팔: 물건을 놓침 · 사용 불가", leftLeg: "왼다리: 이동력 −2", rightLeg: "오른다리: 이동력 −2",
};

function cardName(card: Card, showDirection = false) {
  const number = card.rank === "0" ? 0 : MAJOR_RANKS.indexOf(card.rank as (typeof MAJOR_RANKS)[number]) + 1;
  const name = card.type === "major" ? `${card.rank} · ${majorNames[number] || "메이저 아르카나"}` : `${suits[card.suit as Suit].name} ${ranks[card.rank] || card.rank}`;
  return `${name}${showDirection && card.reversed ? " · 역방향" : ""}`;
}

function CardThumb({ card, showDirection = false }: { card: Card; showDirection?: boolean }) {
  const number = card.rank === "0" ? 0 : MAJOR_RANKS.indexOf(card.rank as (typeof MAJOR_RANKS)[number]) + 1;
  const suitFile = card.suit === "coins" ? "Pentacles" : card.suit ? suits[card.suit].name : "";
  const path = card.type === "major" ? `/tarot/Major_${number}.jpg` : `/tarot/${suitFile}_${card.rank === "A" ? "1" : card.rank}.jpg`;
  return <figure className={`play-card${showDirection && card.reversed ? " reversed" : ""}`}>
    <img src={path} alt={cardName(card, showDirection)} loading="lazy" decoding="async" />
    <figcaption>{cardName(card, showDirection)}</figcaption>
  </figure>;
}

function RuleLink({ section, children, onRule }: { section: string; children: string; onRule: PlayTableProps["onRule"] }) {
  return <button type="button" className="play-rule-link" onClick={() => onRule(section)}>{children} <span aria-hidden="true">↗</span></button>;
}

export default function PlayTable(props: PlayTableProps) {
  const { state, update, onRule, onNavigate } = props;
  const { character, test } = state;
  const hasCharacter = Boolean(character.name.trim() || character.vocation || character.age >= 18);
  const hasDrawn = Boolean(test.firstCard);
  const incapacitated = character.dead || character.wounds.head;
  const speed = woundedSpeed(character.stats.coins, Number(character.wounds.leftLeg) + Number(character.wounds.rightLeg));
  const activeGoals = character.goals.filter((goal) => goal.status === "active");
  const instincts = character.instincts.map((text, index) => ({ text, index })).filter((instinct) => instinct.text.trim());
  const wounds = (Object.keys(character.wounds) as (keyof typeof character.wounds)[]).filter((part) => character.wounds[part]);
  const equipment = character.inventory.filter((item) => item.category === "weapon" || item.category === "armor");
  const latestTool = state.logs.find((entry) => entry.category === "event" || entry.category === "oracle");
  const latestEvent = state.events[0];
  const latestOracle = state.oracles[0];
  const showEvent = latestTool?.category === "event" || (!latestOracle && Boolean(latestEvent));
  const patchTest = (patch: Partial<GameState["test"]>) => update((previous) => ({ ...previous, test: { ...previous.test, ...patch } }));
  const drawDisabled = hasDrawn || state.combat.active || !hasCharacter || incapacitated || state.playerDeck.length === 0;
  const slotsUsed = character.inventory.reduce((total, item) => total + item.slots, 0);

  return <div className="play-table">
    {!hasCharacter && <section className="play-empty" aria-labelledby="play-empty-title">
      <div><h2 id="play-empty-title">먼저 모험할 인물을 만드세요.</h2><p>생애 → 능력치와 천직 → 목표와 본능 → 친구와 적 → 장비. 플레이할 때는 이 탁자로 돌아오세요.</p></div>
      <button type="button" className="play-primary" onClick={() => onNavigate("character")}>인물 만들기 <span aria-hidden="true">→</span></button>
    </section>}

    <div className="play-layout">
      <div className="play-main">
        <section className="panel play-test" aria-labelledby="play-test-title">
          <header className="play-panel-head"><div><span className="play-eyebrow">행동을 말한 다음</span><h2 id="play-test-title">불확실할 때 판정</h2></div><RuleLink section="tests" onRule={onRule}>판정 규칙</RuleLink></header>
          <p className="play-hint">좋은 장비, 충분한 시간, 훌륭한 계획으로 가능한 일은 그대로 해냅니다.</p>
          {state.combat.active && <div className="notice warn play-combat-notice"><strong>전투 중에는 전투 손패를 사용합니다.</strong><button type="button" onClick={() => onNavigate("tests")}>전투 탁자 열기 →</button></div>}
          {incapacitated && <div className="notice warn">{character.dead ? "인물이 사망했습니다." : "머리 부상으로 의식을 잃었습니다."} <button type="button" onClick={() => onNavigate("character")}>인물 상태 확인</button></div>}
          <div className="play-suits" role="group" aria-label="판정에 사용할 능력치">
            {SUITS.map((suit) => <button type="button" key={suit} className={`play-suit${test.suit === suit ? " selected" : ""}`} aria-pressed={test.suit === suit} title={suits[suit].meaning} disabled={hasDrawn || state.combat.active} onClick={() => patchTest({ suit, stat: character.stats[suit] })}>
              <span className="play-suit-top"><span>{suits[suit].name}</span><strong>{character.stats[suit]}</strong></span>
              <small>{suits[suit].use}</small>
            </button>)}
          </div>

          <details className="play-options"><summary>행동 기록 · 도움 · 수정치{test.help || test.modifier || test.opposedPenalty ? " · 적용 중" : ""}</summary>
            <label className="play-purpose">어떤 일을 시도하나요? <span>선택</span><input value={test.purpose} disabled={hasDrawn} placeholder="예: 문지기를 설득한다" onChange={(event) => patchTest({ purpose: event.target.value })} /></label>
            <div className="form-grid">
              <label>수정치<input type="number" value={test.modifier} disabled={hasDrawn} onChange={(event) => patchTest({ modifier: Number(event.target.value) })} /></label>
              <label>도와주는 한 사람의 능력치<input type="number" min={0} max={6} value={test.help} disabled={hasDrawn} onChange={(event) => patchTest({ help: Math.min(6, Math.max(0, Number(event.target.value))) })} /></label>
              <label>상대 능력치 · 대항 불이익<input type="number" min={0} value={test.opposedPenalty} disabled={hasDrawn} onChange={(event) => patchTest({ opposedPenalty: Math.max(0, Number(event.target.value)) })} /></label>
            </div><p className="play-hint">도움은 뽑기 전에 선언합니다. 한 사람만 도울 수 있으며 실패의 결과를 함께 겪습니다. 수정치와 대항 여부는 심판이 정합니다.</p>
          </details>
          {!hasDrawn && <div className="play-draw-line"><button type="button" className="play-primary" onClick={props.onRollTest} disabled={drawDisabled}>판정 카드 뽑기 <span aria-hidden="true">→</span></button><span>카드 + {suits[test.suit].name} {character.stats[test.suit]}{character.wounds.torso ? " − 부상 3" : ""} · 목표 14</span></div>}
          {state.playerDeck.length === 0 && !hasDrawn && <p className="play-hint">플레이어 덱이 비었습니다. <button type="button" className="play-rule-link" onClick={() => onNavigate("tests")}>전투·덱 관리 열기</button></p>}
          {test.firstCard && test.result && <div className={`play-test-result ${test.result.success ? "success" : "failure"}`} aria-live="polite" aria-atomic="true">
            <div className="play-result-cards"><CardThumb card={test.firstCard} />{test.pushedCard && <CardThumb card={test.pushedCard} />}</div>
            <div className="play-result-copy"><div className="play-result-score"><strong>{resultNames[test.result.status]}</strong><span><b>{test.result.total}</b> / {test.result.target}</span></div>
              <p className="play-calculation">{cardValue(test.firstCard)} + 능력치 {test.stat}{test.modifier ? ` ${test.modifier >= 0 ? "+" : "−"} 수정치 ${Math.abs(test.modifier)}` : ""}{test.help ? ` + 도움 ${test.help}` : ""}{test.opposedPenalty ? ` − 상대 ${test.opposedPenalty}` : ""}{character.wounds.torso ? " − 부상 3" : ""}{test.pushedCard ? ` + 밀어붙이기 ${cardValue(test.pushedCard)}` : ""}{test.resolveSpent ? ` + 결의 ${test.resolveSpent}` : ""}</p>
              <p>{test.result.status === "great-success" ? "원한 것을 얻고 그 이상도 얻습니다." : test.result.status === "success" ? "하려던 일을 해냅니다." : test.result.status === "great-failure" ? "상황이 크게 악화됩니다. 대실패로 결의 1점을 얻었습니다." : "무언가 잘못됩니다. 이 결과를 받아들이거나 밀어붙일 수 있습니다."}</p>
              <div className="button-row play-result-actions">
                {test.result.status === "failure" && !test.pushedCard && <button type="button" onClick={props.onPushTest} disabled={state.combat.active || state.playerDeck.length === 0}>밀어붙이기 · 한 장 더</button>}
                {!test.result.success && <button type="button" onClick={props.onBoostTest} disabled={character.resolve < 1 || state.combat.active}>결의 1점 · 합계 +1</button>}
                <button type="button" className="play-new-test" onClick={props.onNewTest}>다음 판정 →</button>
              </div>
              {test.result.status === "failure" && <small>밀어붙여도 실패하면 대실패입니다. 결의는 결과를 본 뒤 쓸 수 있습니다.</small>}
            </div>
          </div>}
          <footer className="play-rule-row"><button type="button" className="play-rule-link" disabled={state.combat.active || !hasCharacter || incapacitated} onClick={props.onStartReaction}>반응 판정 준비</button><RuleLink section="resolve" onRule={onRule}>결의</RuleLink><RuleLink section="combat" onRule={onRule}>전투 행동·대응</RuleLink><button type="button" className="play-rule-link" onClick={() => onNavigate("magic")}>비술 도구 →</button></footer>
          <details className="play-decks"><summary>덱 현황 · 플레이어 {state.playerDeck.length}장 / 심판 {state.refereeDeck.length}장</summary><dl className="play-deck-counts"><div><dt>플레이어 뽑을 더미</dt><dd>{state.playerDeck.length}</dd></div><div><dt>플레이어 버린 더미</dt><dd>{state.playerDiscard.length}</dd></div><div><dt>심판 뽑을 더미</dt><dd>{state.refereeDeck.length}</dd></div><div><dt>심판 버린 더미</dt><dd>{state.refereeDiscard.length}</dd></div></dl><p className="play-hint">광대를 뽑으면 두 덱의 모든 카드를 회수해 섞습니다. 전투 중에는 라운드가 끝날 때 회수합니다.</p><button type="button" disabled={state.combat.active} onClick={props.onRecallFool}>실물 덱에서 광대 뽑음 · 두 덱 회수</button><RuleLink section="cards" onRule={onRule}>덱·광대 규칙</RuleLink></details>
        </section>

        <section className="panel play-exploration" aria-labelledby="play-exploration-title">
          <header className="play-panel-head"><div><span className="play-eyebrow">다음 장면이 필요할 때</span><h2 id="play-exploration-title">사건과 징조</h2></div><button type="button" className="play-rule-link" onClick={() => onNavigate("map")}>지도 열기 →</button></header>
          <div className="play-event-tools"><label>현재 환경<select value={state.mapType} onChange={(event) => update((previous) => ({ ...previous, mapType: event.target.value as GameState["mapType"] }))}>{Object.entries(environmentNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label><button type="button" onClick={props.onEvent} disabled={state.refereeDeck.length === 0}>사건 카드 뽑기</button></div>
          <p className="play-hint">소음, 새 장소, 오래 머무름, 극적인 순간에 사건을 뽑습니다.</p>
          <div className="play-oracle-tools" role="group" aria-label="징조 질문"><button type="button" onClick={() => props.onOracle("yes-no")} disabled={state.playerDeck.length === 0}>예 / 아니오</button><button type="button" onClick={() => props.onOracle("amount")} disabled={state.playerDeck.length === 0}>양 · 규모</button><button type="button" onClick={() => props.onOracle("action-subject")} disabled={state.playerDeck.length === 0 || state.refereeDeck.length === 0}>행동 + 주제</button></div>
          <div className="play-time-row"><span>{state.day}일째 · {state.watch}번째 경점 · {state.turns}차례</span><button type="button" onClick={props.onAdvanceTurn}>차례 +1 · 15분</button><button type="button" onClick={props.onAdvanceWatch}>경점 +1 · 8시간</button></div>
          <div className="play-exploration-result" aria-live="polite" aria-atomic="true">
            {showEvent && latestEvent ? <><CardThumb card={latestEvent.card} showDirection /><div><span className="play-eyebrow">최근 사건 · {environmentNames[latestEvent.type]}</span><p className="play-oracle-answer">{latestEvent.text}</p>{latestEvent.reversedInstruction && <p className="play-hint">역방향 선택 규칙: 반대 사건 또는 나쁜 일이 일어납니다. 심판과 해석하세요.</p>}</div></> : latestOracle ? <><div className="play-result-cards">{latestOracle.cards.map((card, index) => <CardThumb key={`${card.type}-${card.suit}-${card.rank}-${index}`} card={card} showDirection />)}</div><div><span className="play-eyebrow">최근 징조 · {oracleNames[latestOracle.kind]}</span><p className="play-oracle-answer">{latestOracle.result}</p>{latestOracle.triggeredEvent && <p className="play-hint">같은 숫자가 연속으로 나와 사건 카드도 뽑았습니다. <button type="button" className="play-rule-link" onClick={() => onNavigate("log")}>기록 확인 →</button></p>}</div></> : <p className="play-hint">세계에 물어볼 질문을 먼저 정하고, 필요한 표를 고르세요.</p>}
          </div>
          <footer className="play-rule-row"><RuleLink section="event-deck" onRule={onRule}>사건을 뽑는 시점</RuleLink><RuleLink section="oracles" onRule={onRule}>징조 표</RuleLink><RuleLink section="generating-maps" onRule={onRule}>이동과 지도</RuleLink></footer>
        </section>

        <section className="panel play-recent" aria-labelledby="play-recent-title"><header className="play-panel-head"><h2 id="play-recent-title">방금 일어난 일</h2><button type="button" className="play-rule-link" onClick={() => onNavigate("log")}>전체 기록 →</button></header>{state.logs.length ? <ol className="play-log-list">{state.logs.slice(0, 3).map((entry) => <li key={entry.id}><span>{entry.day}일째 · {entry.watch}번째 경점</span><p>{entry.text}</p></li>)}</ol> : <p className="play-hint">판정과 사건, 목표 변화가 여기에 기록됩니다.</p>}</section>
      </div>

      <aside className="play-character" aria-label="플레이 중 인물 정보">
        {(character.dead || wounds.length > 0) && <section className="panel play-condition"><header className="play-panel-head"><h2>현재 부상</h2><RuleLink section="wounds" onRule={onRule}>부상 효과</RuleLink></header>{character.dead ? <p className="notice warn">사망</p> : <ul className="play-wounds">{wounds.map(part => <li key={part}>{woundNames[part]}</li>)}{speed === 0 && <li>이동 불가 · 도움 필요</li>}</ul>}<button className="play-rule-link" onClick={() => onNavigate("downtime")}>휴식으로 부상 회복 →</button></section>}

        <section className="panel play-goals" aria-labelledby="play-goals-title"><header className="play-panel-head"><h2 id="play-goals-title">지금 좇는 목표 <small>{activeGoals.length} / 3</small></h2><RuleLink section="goals" onRule={onRule}>목표 규칙</RuleLink></header>
          {activeGoals.length ? <ol className="play-goal-list">{activeGoals.map((goal) => <li key={goal.id}><p>{goal.text || "목표를 구체적으로 적어주세요."}</p>{goal.note && <small>{goal.note}</small>}<div className="button-row"><button type="button" onClick={() => props.onGoal(goal.id, "completed")} aria-label={`목표 완수: ${goal.text}. 결의 1점 획득`}>{state.sessionNumber > 0 && !state.sessionStarted ? "완수 · 다음 세션 +1" : "완수 · 결의 +1"}</button><button type="button" onClick={() => props.onGoal(goal.id, "impossible")} aria-label={`목표가 불가능해짐: ${goal.text}. 결의 1점 획득`}>불가능 · 결의 +1</button></div></li>)}</ol> : <p className="play-hint">구체적인 사람·장소·사건을 바꾸는 목표 세 개가 모험을 이끕니다.</p>}
          {activeGoals.length !== 3 && <button type="button" className="play-rule-link" onClick={() => onNavigate("character")}>목표를 세 개로 채우기 →</button>}
        </section>

        <section className="panel play-instincts" aria-labelledby="play-instincts-title"><header className="play-panel-head"><h2 id="play-instincts-title">본능</h2><RuleLink section="instincts" onRule={onRule}>발동 조건</RuleLink></header><p className="play-hint">문제를 일으키거나 이야기를 의미 있게 바꿨을 때 결의를 얻습니다.</p>
          {instincts.length ? <ul className="play-instinct-list">{instincts.map(({ text, index }) => <li key={index}><p>{text}</p><button type="button" onClick={() => props.onResolveGain(`본능이 문제를 일으키거나 이야기를 형성함: ${text}`)} aria-label={`본능으로 문제 또는 이야기 변화: ${text}. 결의 1점 획득`}>문제·이야기 변화 · +1</button></li>)}</ul> : <button type="button" className="play-rule-link" onClick={() => onNavigate("character")}>본능 세 개 정하기 →</button>}
        </section>

        <section className="panel play-talents" aria-labelledby="play-talents-title"><header className="play-panel-head"><h2 id="play-talents-title">사용할 수 있는 재능</h2><RuleLink section="talents" onRule={onRule}>재능 규칙</RuleLink></header>
          {props.talents.length ? <ul className="play-talent-list">{props.talents.map((talent) => {
            const dedicated = ["Magick", "Bind Magick", "Undo Magick"].includes(talent.name);
            const combatTalent = ["Nimble", "Sally Forth"].includes(talent.name);
            return <li key={talent.name}><div><strong>{talent.name}</strong><p>{talent.textKo}</p></div><button type="button" disabled={!dedicated && !combatTalent && (character.resolve < 1 || incapacitated || (state.combat.active && ["Parley", "Disarming Presence"].includes(talent.name)) || (talent.name === "Disarming Presence" && Boolean(state.test.disarmingPresenceUsed)))} onClick={() => props.onTalent(talent.name)}>{dedicated ? "비술 열기 →" : combatTalent ? "전투 열기 →" : talent.name === "Disarming Presence" ? state.test.disarmingPresenceUsed ? "반응 +3 적용됨" : "반응 +3 · 결의 1" : "발동 · 결의 1"}</button></li>;
          })}</ul> : <p className="play-hint">천직의 시작 재능을 인물 기록지에 기록하세요.</p>}
          <details className="play-other-resolve"><summary>비술 물품 발동</summary><button type="button" disabled={character.resolve < 1} onClick={() => props.onResolveSpend("결의가 필요한 비술 물품 발동")}>비술 물품 발동 · 결의 1</button><RuleLink section="resolve" onRule={onRule}>결의 사용 규칙</RuleLink></details>
        </section>

        <section className="panel play-equipment" aria-labelledby="play-equipment-title"><header className="play-panel-head"><h2 id="play-equipment-title">무기와 방어</h2><button type="button" className="play-rule-link" onClick={() => onNavigate("character")}>장비 관리 →</button></header>
          {equipment.length ? <ul className="play-equipment-list">{equipment.map((item) => {
            const weapon = WEAPONS.find((entry) => entry.name === item.name || entry.nameKo === item.name);
            const armor = ARMOR.find((entry) => entry.name === item.name || entry.nameKo === item.name);
            const notches = armor ? character.armorNotches[armorKeys[armor.name]] : 0;
            const ap = armor ? effectiveArmorPoints(armor.ap, notches) : 0;
            return <li key={item.id}><strong>{item.name}</strong><span>{weapon ? `부상 ${weapon.wounds} · 사거리 ${weapon.range}칸` : armor ? `${armor.bodyPartKo} · AP ${item.damaged ? 0 : ap} · 흠집 ${notches}/${armor.ap}` : "효과는 장비 기록 확인"}{item.damaged ? " · 파손" : ""}{weapon && character.stats.swords < weapon.swordsReq ? ` · Swords ${weapon.swordsReq} 필요` : armor && character.stats.swords < armor.swordsReq ? ` · Swords ${armor.swordsReq} 필요` : ""}</span></li>;
          })}</ul> : <p className="play-hint">기록된 무기와 갑옷이 없습니다.</p>}
          <p className={`play-hint${slotsUsed > carryingCapacity(character.stats.coins) ? " warn" : ""}`}>소지품 {slotsUsed} / {carryingCapacity(character.stats.coins)}칸</p><div className="play-rule-row"><RuleLink section="equipment-armor" onRule={onRule}>갑옷·흠집</RuleLink><RuleLink section="equipment-weapons" onRule={onRule}>무기 표</RuleLink></div>
        </section>
        <details className="panel play-relationships"><summary>친구 도움과 관계</summary>{character.friends.length ? <ul className="play-contact-list">{character.friends.map((friend) => <li key={friend.id}><strong>{friend.name || "이름 없는 친구"}</strong>{friend.location && <small>{friend.location}</small>}<p>{friend.connection}</p><button type="button" disabled={character.resolve < 1} onClick={() => props.onResolveSpend(`친구 ${friend.name || "이름 없음"}에게 도움을 청함`)}>도움 청하기 · 결의 1</button></li>)}</ul> : <p className="play-hint">친구를 기록하면 도움을 청할 수 있습니다.</p>}{character.foes.length > 0 && <p className="play-hint">나를 가로막는 적: {character.foes.map((foe) => foe.name || "이름 없는 적").join(", ")}</p>}<div className="play-rule-row"><button type="button" className="play-rule-link" onClick={() => onNavigate("character")}>관계 기록 →</button><RuleLink section="friend-foe" onRule={onRule}>친구와 적 규칙</RuleLink></div></details>
      </aside>
    </div>
  </div>;
}
