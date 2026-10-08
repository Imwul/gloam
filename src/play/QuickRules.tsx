import { useEffect, useRef, useState } from "react";

const QUICK_RULES = [
  { id: "tests", title: "일반 판정", page: "8", tags: "test push help 판정 도움 밀어붙이기 대성공 대실패", text: "좋은 장비·충분한 시간·훌륭한 계획이면 바로 성공합니다. 결과가 불확실할 때만 플레이어 카드 + 능력치로 14 이상을 노립니다. 첫 카드로 성공하고 문양도 같으면 대성공입니다.", steps: "도움은 뽑기 전에 한 명만 선언하고 해당 능력치를 더하며 실패의 결과도 함께 겪습니다. 실패하면 선택적으로 두 번째 카드 값을 더합니다. 밀어붙인 뒤에도 실패하면 대실패이며 결의 1점을 얻습니다." },
  { id: "combat", title: "전투 순서와 행동", page: "30–31", tags: "combat initiative move attack flee grapple shove throw dodge riposte 전투 선제권 회피 반격 조준 이동", text: "플레이어는 손패 4장까지 보충하고 심판은 적마다 3장을 뽑습니다. 선제권 한 장을 뒷면으로 놓고 0부터 14까지 낮은 순서로 행동합니다. 그 카드 값은 자신을 공격하는 판정의 목표치이기도 합니다.", steps: "행동마다 손패를 사용합니다. 전투 판정은 상대 선제권이 목표치이며 밀어붙일 수 없습니다. 조준·붙잡기·밀치기·도주·회피·반격·적에게 영향을 주는 주문은 상대 능력치도 뺍니다. 공격은 소드 판정, 대성공이면 부상 +1입니다. 회피 대성공은 자신이 고른 상대의 신체 부위에 부상 1점을 줍니다. 이동은 카드 한 장을 버리고 이동력만큼 직교 이동합니다. 대응은 다른 사람의 턴에만, 반격은 근접 공격이 빗나간 뒤에 합니다. 라운드 끝에는 원치 않는 손패를 버릴 수 있습니다." },
  { id: "equipment-armor", title: "갑옷과 피해 적용", page: "27, 31–32", tags: "armor ap notch damage called shot 갑옷 흠집 파손 피해 방패 조준", text: "명중하면 방어자가 맞을 부위를 고릅니다. 조준 공격은 대항 소드 판정이며, 방어자는 대항 소드 판정에 성공하면 다른 부위로 돌릴 수 있습니다. 해당 부위의 AP를 빼고 남은 부상을 적용합니다.", steps: "들어온 부상이 AP보다 클 때 갑옷에 흠집 하나를 냅니다. 흠집 수가 원래 AP에 도달하면 수리 전까지 AP 0입니다. 괴수의 갑옷은 부위마다 AP 2입니다. 조준은 갑옷 자체를 무시하지 않습니다." },
  { id: "wounds", title: "부상 효과", page: "32", tags: "wound head torso arm leg speed 부상 머리 몸통 팔 다리 이동력 죽음", text: "머리: 의식불명, 다시 머리에 부상을 입으면 사망. 몸통: 모든 판정 −3. 팔: 든 물건을 떨어뜨리고 그 팔을 사용할 수 없음. 다리: 한쪽마다 이동력 −2, 0이면 도움 없이 이동할 수 없음.", steps: "머리의 치명적 예외를 제외하면 같은 부위의 중복 부상은 추가 효과가 없습니다. 괴수는 도감의 부상 한계도 추적합니다. 갑옷을 뺀 부상은 명중한 부위에 적용합니다." },
  { id: "resolve", title: "결의", page: "34", tags: "resolve talent 결의 심판 재능 획득 소비", text: "플레이어 결의의 최대치는 10입니다. 세션 시작, 목표 완수·불가능, 본능이 문제를 일으키거나 이야기를 형성, 대실패, 흥청망청 표를 뽑을 때 1점을 얻습니다. 플레이어가 얻을 때마다 심판도 얻습니다.", steps: "재능·마법 물품을 발동하거나 판정에 점당 +1을 더할 때 씁니다. 결과를 본 뒤에도 판정에 쓸 수 있습니다. 소비는 심판에게 결의를 주지 않습니다." },
  { id: "cards", title: "덱과 광대", page: "7, 30", tags: "fool cards deck shuffle 광대 카드 덱 섞기", text: "플레이어 덱은 소 아르카나 56장 + 광대, 심판 덱은 대 아르카나 I–XXI입니다. 에이스 1, 시종 11, 기사 12, 여왕 13, 왕 14입니다. 전투 예시에서 심판의 전투 손패도 소 아르카나를 사용합니다.", steps: "일반 판정에서 광대 값은 0입니다. 광대가 나오면 결과를 처리하며 두 덱의 카드를 회수해 섞습니다. 전투에서는 즉시 알리고 자신이나 다른 사람의 행동에 +3 또는 선제권 0으로 사용하며 그 라운드 끝에 사용 중인 모든 카드를 회수해 각 덱에 섞습니다. 일반 표에서 광대 결과가 명시되지 않았다면 심판이 처리합니다." },
  { id: "event-deck", title: "사건을 뽑는 때", page: "42–43", tags: "event noise travel reversed 사건 소음 이동 지체 역방향", text: "소음을 냈을 때, 새 장소로 이동했을 때, 한곳에 오래 머물렀을 때, 극적으로 적절한 때 심판 덱에서 사건을 뽑습니다. 야외·던전·정착지 표를 환경에 맞게 사용합니다.", steps: "역방향 사건은 선택 규칙입니다. 반대 사건이나 나쁜 일을 적용할지는 심판이 해석합니다. 필요한 횟수와 사건의 실제 전개도 심판이 정합니다." },
  { id: "oracles", title: "징조", page: "54–55", tags: "oracle yes no amount action subject 징조 예 아니오 양 행동 주제", text: "예/아니오: 홀수 3·5·7·9는 아니오, 짝수 2–10은 예, 시종·기사는 아니오 그러나, 여왕·왕은 예 하지만. 에이스는 극단적 결과로 다시 뽑습니다. 양: 2–5 없음, 6–10 보통, 궁정 상당함, 에이스 과도함.", steps: "행동/주제는 플레이어 카드 한 장의 행동과 심판 카드 한 장의 주제를 결합해 해석합니다. 같은 숫자가 연속되면 사건 덱을 뽑습니다. 주제는 역방향 의미를 따릅니다." },
  { id: "goals", title: "목표와 본능", page: "22–23", tags: "goal instinct 목표 본능", text: "항상 목표 세 개를 유지합니다. 구체적으로 행동할 수 있고, 심판이 도전할 수 있으며, 현재 상태를 바꾸는 목표를 씁니다. 완수하거나 불가능해지면 결의를 얻고 새 목표를 정합니다.", steps: "본능 세 개는 특정 상황에서 할 행동을 정합니다. 단순한 실행 자체가 아닌, 문제를 일으키거나 이야기를 의미 있게 형성할 때 결의를 얻습니다." },
  { id: "friend-foe", title: "친구와 적", page: "24", tags: "friend foe relationship 친구 적 관계 도움", text: "친구와 적을 한 명씩 만들고 이름·장소·관계를 기록합니다. 친구에게 결의를 써서 도움을 청할 수 있습니다. 적은 모험을 방해합니다.", steps: "가능한 도움과 적의 행동은 심판이 상황에 맞게 정합니다." },
  { id: "resting", title: "휴식과 회복", page: "35", tags: "rest heal meal sleep 휴식 회복 식사 수면", text: "야영지나 정착지에서 식사하고 온전히 하룻밤 자면 고른 부상 하나를 회복합니다. 세 부위를 다쳤다면 모두 회복하려면 세 번의 밤이 필요합니다.", steps: "사망한 인물은 휴식으로 되살아나지 않습니다. 실제 수면과 식사 여부를 확인한 뒤 회복합니다." },
  { id: "advancement", title: "세션 정산과 성장", page: "35, 50", tags: "xp training advancement session downtime 경험치 성장 세션 정산 수련 막간", text: "세션 끝에 참여, 목표 완수, 생명을 위협한 상황을 각각 한 번씩 세어 경험치 1–3점을 얻습니다. 자기 천직 재능은 5 XP, 다른 천직 재능은 10 XP, 능력치 +1은 10 XP입니다.", steps: "다른 천직의 시작 재능은 배울 수 없습니다. 능력치는 최대 6, 소지품은 최대 14칸입니다. 막간에 완수한 목표의 결의는 다음 세션 시작에 얻습니다. XP 1점마다 수련 하루가 필요합니다. 안전한 장소의 세션 사이 시간은 보통 실제 시간만큼 흐릅니다." },
  { id: "time-downtime", title: "시간 단위", page: "40, 50", tags: "time watch turn round travel 시간 경점 차례 라운드 여행", text: "경점(Watch)은 8시간이며 하루에 3경점입니다. 차례(Turn)는 15분, 라운드(Round)는 10초입니다. 야외 지도 한 구역은 5마일이며 인접 구역으로 여행하는 데 1경점이 걸립니다.", steps: "소음·이동·지체에 따른 사건은 시간을 올리는 것과 별도로 판단합니다. 막간에 하려는 일은 세션 끝에 심판에게 선언합니다." },
  { id: "equipment", title: "장비와 구매", page: "25–29", tags: "equipment inventory coins purchase sword requirement 장비 구매 소지품 무기 요구치", text: "소지품 칸은 10 + 코인 능력치, 최대 14입니다. 착용한 갑옷을 포함해 물품 하나는 한 칸입니다. 새 인물은 무료 물품 다섯 개를 고릅니다.", steps: "구입은 코인 판정에 물품 수정치를 적용합니다. 도움과 밀어붙이기도 가능합니다. 실패하면 구입하지 못합니다. 무기·갑옷의 소드 요구치를 확인하세요." },
  { id: "monsters", title: "반응과 사기", page: "44", tags: "reaction morale monster 반응 사기 괴수 도감", text: "반응이 불확실하면 상호작용하는 플레이어가 반응 판정을 합니다. 성공하면 대화에 우호적이고, 실패하면 적대적이거나 물러납니다. 판정 문양은 상황에 맞게 플레이 자리에서 고릅니다.", steps: "수적 열세·심한 부상·지도자 사망 등에는 괴수가 사기 판정을 합니다. 실패하면 도주하거나 항복합니다. 괴수의 능력치는 모든 판정에 사용하고, 약점 활용은 심판이 확인합니다." },
  { id: "bestiary", title: "괴수 운용", page: "44–48", tags: "monster bestiary stat weakness 괴수 도감 능력치 약점", text: "괴수 능력치는 판정 능력치이자 플레이어 대항 판정의 불이익입니다. 갑옷은 부위마다 AP 2입니다. 약점을 활용하면 괴수를 물리칩니다. 재능 하나를 발동하는 데 심판 결의 1점을 씁니다.", steps: "적은 플레이어 수 이하일 때 운영하기 좋습니다. 많은 적은 작은 파도로 나눌 수 있습니다. 공격·위치·부상·사기와 재능의 효과를 함께 확인하세요." },
  { id: "arcane-magick", title: "비전 비술", page: "20, 38–39", tags: "arcane spell magick 비전 비술 주문 단어", text: "소 아르카나 단어 하나와 대 아르카나 단어 하나를 조합해 심판과 효과를 해석합니다. 최소 결의 1점을 써서 시전합니다. 일반적으로 쓴 결의마다 부상 하나를 줄 수 있습니다.", steps: "전투 중 적에게 영향을 주면 손패로 대항 완드 판정을 합니다. p.38은 전투 주문 전부를 대항 판정으로 표현하므로 비적대 주문의 판정 여부는 심판이 확인합니다. 아는 단어로 주문을 만들고 새로운 단어는 모험으로 얻습니다." },
  { id: "folk-magick", title: "민간 비술", page: "37", tags: "folk magick charm 민간 비술 부적", text: "모두가 사용할 수 있습니다. 원하는 효과를 정하고, 그 효과에 어울리는 부적을 적절히 사용한 뒤 문양·수정치를 심판과 정해 판정합니다.", steps: "천은 묶고, 불은 태우고, 약초는 치유하며, 돌은 견고하게 하는 식으로 해석합니다. 민간 비술은 부상을 줄 수 없습니다." },
  { id: "alchemy", title: "연금술", page: "36", tags: "alchemy brew watch monster 연금술 조제 솥 재료", text: "특징적인 능력이 있는 괴수의 재료·정수, 끓일 솥, 실용 지식이 필요합니다. 한 경점 동안 끓이고 완드 판정에 성공하면 조제품 한 회분을 만듭니다.", steps: "완성품을 담을 병이나 용기도 필요합니다. 재료의 특징으로 효과를 심판과 해석합니다." },
  { id: "hirelings", title: "고용인", page: "52", tags: "hireling cups coins weekly 고용인 주급", text: "정착지에서 컵 판정으로 후보를 찾고 코인 판정으로 고용합니다. 최대 인원은 컵 능력치입니다. 매주 코인 판정으로 주급을 지급하며 실패하면 고용인이 떠납니다.", steps: "합리적인 지시는 따르지만 직접 위험에 놓이는 일은 하지 않습니다. 여행과 막간에 목표를 도울 수 있습니다." },
  { id: "carousing", title: "흥청망청 보내기", page: "51", tags: "carousing resolve downtime 흥청망청 결의 막간", text: "저녁에 흥청망청 보내며 플레이어 카드를 뽑아 결과표를 참조하고 결의 1점을 얻습니다.", steps: "물품 손실·부상·친구와 적 등 표의 결과를 상황에 맞게 적용합니다. 광대는 전부 잃은 채 알몸으로 깨어나는 결과이며 두 덱도 회수합니다." },
  { id: "create-character", title: "인물 생성 순서", page: "9–25", tags: "character creation lifepath vocation stats talents 인물 생성 행로 천직 재능 능력치", text: "삶의 행로 → 능력치 → 천직 → 목표·본능 → 친구·적 → 장비 순서입니다. 나이는 최소 18세, 능력치는 1·2·3·4를 배분하며 4인 문양이 천직을 정합니다.", steps: "해당 천직의 시작 재능을 얻습니다. 혼자 또는 심판과 일대일이면 다른 천직을 포함해 재능 하나를 추가로 얻습니다. 목표와 본능은 각각 세 개, 무료 물품은 다섯 개입니다." },
  { id: "generating-maps", title: "지도 만들기", page: "40–41", tags: "map wilderness dungeon settlement 지도 야외 던전 정착지", text: "심판 카드를 원하는 배치로 펼칩니다. 야외는 5마일 구역, 던전은 복도·방 묶음, 정착지는 건물·장소입니다. 야외에서 정착지가 나오면 지형 카드 한 장을 추가합니다.", steps: "정착지 사이 길과 물 사이 강을 연결합니다. 여러 출입구와 순환 경로, 퍼즐, 대화 가능한 생물, 대립하는 세력을 고려하세요. 지도 크기와 배치는 심판이 자유롭게 정합니다." },
];

export default function QuickRules({ initialId, onClose, onSource }: { initialId?: string; onClose: () => void; onSource: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initialId || "tests");
  const dialog = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const returnFocus = useRef(document.activeElement as HTMLElement | null);
  const normalized = query.trim().toLocaleLowerCase();
  const hits = QUICK_RULES.filter(rule => `${rule.title} ${rule.tags} ${rule.text} ${rule.steps}`.toLocaleLowerCase().includes(normalized));
  const aliases: Record<string, string> = { instincts: "goals", talents: "resolve", stats: "create-character", vocation: "create-character", lifepath: "create-character", "equipment-weapons": "equipment", "combat-example": "combat", "how-to-play": "goals", "magic-items": "equipment", "road-folk": "bestiary" };
  const rule = QUICK_RULES.find(item => item.id === (aliases[selected] || selected)) || QUICK_RULES[0];
  useEffect(() => {
    const target = returnFocus.current;
    search.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "Tab") {
        const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button, input, [tabindex="0"]') || []);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = oldOverflow; target?.focus(); };
  }, [onClose]);
  return <div className="quick-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} className="quick-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-title">
      <header><div><span className="eyebrow">AT THE TABLE</span><h2 id="quick-title">규칙 빠른 참조</h2></div><button onClick={onClose} aria-label="규칙 빠른 참조 닫기">닫기 ×</button></header>
      <label className="quick-search">규칙 검색<input ref={search} value={query} onChange={event => setQuery(event.target.value)} placeholder="회피, 결의, 휴식, Riposte…" /></label>
      <div className="quick-layout"><nav aria-label="빠른 규칙 목록">{hits.map(item => <button key={item.id} className={selected === item.id ? "active" : ""} onClick={() => { setSelected(item.id); setQuery(""); }}><span>{item.title}</span><small>p.{item.page}</small></button>)}{!hits.length && <p>검색 결과가 없습니다.</p>}</nav>
        <article className="quick-reading" aria-live="polite"><span className="eyebrow">GLOAM · p.{rule.page}</span><h3>{rule.title}</h3><p>{rule.text}</p><p>{rule.steps}</p><button onClick={() => onSource(rule.id)}>원문 룰북 펼치기 ↗</button><small>플레이용 요약입니다. 상황의 해석과 서사적 결과는 심판이 정합니다.</small></article></div>
    </section>
  </div>;
}
