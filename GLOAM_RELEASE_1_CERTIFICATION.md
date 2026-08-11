# Gloam — Release 1.0 Gate Closure

인증일: 2026-08-11  
원문 기준: `Gloam1.02.pdf`, `Gloam Combat Example.pdf`, `Gloam Char Sheet.pdf`

이 인증은 새 규칙·새 플레이 체계·서사 자동화를 추가하지 않고, 실제 심판이 룰북 곁에서 장기 캠페인을 운영할 수 있는지만 검증한다. 규칙별 Automatic / Choice / GM Decision / Narrative / Reference Only 원문 대조는 `GLOAM_RULE_AUDIT.md`에 있다.

## Long Campaign — PASS

- 실제 브라우저의 단일 장부에서 인물 생성, 삶의 행로, 전투, 부상, 비술, 징조, 사건, 휴식, 성장, 소지품, 연대기, 보존·재시작을 이어서 수행했다.
- 실제 실행 기록: 전투 100회, 징조 시도 130회 중 기록 124건, 사건 206건, 회차 시작 100회, 되돌리기 100회, 최종 연대기 732건.
- 자동 인증은 같은 흐름을 100회차로 다시 구성하고 매 회 전투 → 징조·사건 → 막간·경험치 → 보존 → 복원 → 되돌리기 → 계속하기를 수행했다.
- 별도 스트레스는 전투·뽑기·징조·사건 전이 125회와 비술 장기 사용 100회를 수행했다.
- 인물, 관계, 고용인, 소지품, 부상, 경험치, 주문서, 봉인 비술, 사건·징조·전투·연대기가 마지막 복원까지 유지됐다.

## Card Economy — PASS

- Player Deck 57장, Referee Deck 21장.
- 덱, 버린 더미, 손패, 선제권, 사용, 대응, 지도 실물 카드를 매 전이마다 고유 카드 집합으로 검증했다.
- 사용·대응 카드는 일시 영역에서 검사한 뒤 버린 더미로 옮겼다. 결과·연대기 속 카드 정보는 실물 카드 영역이 아닌 참조 기록이다.
- Bind Magick 기록은 물건·주문·충전만 보존하며 실물 카드를 붙잡지 않으므로 Bound Cards 실물 영역은 0장으로 유지된다.
- 모든 검사 지점에서 57/21 불변식이 유지됐다. 중복 카드를 주입한 손상 저장은 캠페인 기록을 버리지 않고 카드 영역만 정상 복구했다.
- 화면에 보이는 실제 카드 원화는 Chrome·Firefox·WebKit의 desktop/360px에서 파손 0건이었다.

## Combat Stress — PASS

- Combat → Undo → Reload → Continue를 100회 반복했다.
- 공식 전투 예시의 네 판정 합계, 갑옷 흡수, 흠집, 파손, 부상을 별도 회귀 시험으로 재현했다.
- 숨긴 선제권, 플레이어·괴수 손패, 사용·대응 카드의 이동 중 카드 중복은 없었다.
- 부상·갑옷 상태와 현재 장부를 되돌린 뒤 다시 계속해도 저장본과 일치했다.

## Magic — PASS

- 아는 소·대 아르카나 단어, 주문서, Bind Magick 물건·충전, 플레이어·심판 Resolve를 100회 장기 사용·내보내기·불러오기 순환으로 검증했다.
- 단어·주문·봉인 항목은 중복되거나 사라지지 않았고, 소비한 Resolve는 같은 횟수만큼 심판 Resolve로 이동했다.
- Undo Magick의 실제 효과와 성공 여부는 상태 기록만 남기고 심판 판단으로 유지했다.

## Save — PASS

- 100회 Save / Reload / Undo / Export / Import JSON 순환을 완료했다.
- 관계, 고용인, 소지품, 주문서, 봉인 비술, 사건, 징조, 전투, 연대기 손실은 0건이었다.
- 100회차·수백 기록의 최종 저장 크기: **489,776 bytes**.
- 자동 인증 최악값: 직렬화 **0.53 ms**, 복원 **1.36 ms**.
- 실제 브라우저 재시작 시험에서는 캠페인명, 연대기 732건, 카드 57/21을 복원했다.
- 손상 JSON은 새 안전 장부로 복구하고, 카드 중복 저장은 카드 영역만 재구성한다.

## Offline — PASS

| 관문 | 결과 | 검증 근거 |
|---|---|---|
| Service Worker registered | PASS | production build에서 `sw.js` 1건 등록, active 상태 확인 |
| controlled | PASS | Chrome, Firefox engine, WebKit engine, 실제 Safari에서 controller 확인 |
| warm offline reload | PASS | 네트워크 차단 Chrome·Firefox와 원본 서버 중단 Safari·WebKit에서 앱 셸 복원 |
| existing campaign offline | PASS | Service Worker 설치 전에 만든 장부를 설치 후·오프라인 재시작 후 그대로 복원 |
| offline gameplay | PASS | Character, Combat, Oracle, Magic, Inventory, Session Log, Save, Undo 수행·재복원 |
| return online | PASS | 오프라인에서 이어 쓴 기록·소지품·비술·연대기를 재접속 후 동일하게 복원 |
| card asset runtime cache | PASS | install shell의 Tarot 0장, 화면에 보인 카드 4장만 runtime cache; 오프라인 원화 파손 0 |

- 명시적 cache version은 `gloam-v1.0.0-20260811`이다. 새 버전 활성화 시 이전 `gloam-v*` app-shell/runtime cache만 지우며 local campaign storage는 읽거나 지우지 않는다.
- app shell은 HTML, production JS/CSS, favicon, 기본 글꼴 stylesheet를 담는다. 전체 Tarot 6.7 MB는 precache하지 않는다.
- 최종 Chrome 심층 시험의 cache는 shell 8항목, runtime 11항목이었다. shell Tarot은 0장, runtime Tarot은 실제로 표시한 4장뿐이었다.
- 앱을 한 번도 받은 적 없는 cold-first offline은 열리지 않았다. 요구된 허용 범위이며 Release Blocker가 아니다.
- 오프라인에서 처음 뽑아 아직 한 번도 표시·캐시되지 않은 카드 원화 한 장은 네트워크 요청이 실패했다. 규칙 처리·기록·저장·되돌리기는 계속 작동했고, 이미 표시된 원화는 모두 복원됐다. 이는 전체 덱 precache를 금지한 runtime-cache 경계다.

실제 Safari에서는 `Safari 관문 기록자`와 전투 손패 4장을 저장한 뒤 원본 서버를 완전히 중단했다. 새로고침 후 이름, 57/21, 괴수, 플레이어 손패와 카드 원화를 복원했고, 서버 재가동 뒤에도 동일 상태를 유지했다.

## Browser Matrix

| 환경 | 상태 | Desktop | Narrow / 360px | 콘솔 | 카드·가로 넘침·저장/핵심 상호작용 |
|---|---|---|---|---|---|
| 설치된 Google Chrome 실행 파일 | **PASS** | PASS | PASS · 360px 자동화 | 오류 0 | 원화 파손 0, 문서 가로 넘침 0, 전투·휴식·저장·오프라인 복원 PASS |
| 설치된 Safari 앱 | **PASS** | PASS · 실제 앱 조작 | PASS · Safari 응답형 디자인 모드 360×800 | 오류 0 | 실제 이름 저장/재시작, 전투 손패 원화, 서버 중단 복원 PASS |
| Firefox engine 자동화 | **PASS** | PASS | PASS · 360px 자동화 | 오류 0 | 원화 파손 0, 문서 가로 넘침 0, 전투·휴식·저장·오프라인 복원 PASS |
| WebKit engine 자동화 | **PASS** | PASS | PASS · 360px 자동화 | 온라인 오류 0 | 원화 파손 0, 문서 가로 넘침 0, 원본 서버 중단·복원 PASS |
| 실제 Firefox 앱 | **NOT TESTED — ENVIRONMENT UNAVAILABLE** | — | — | — | `/Applications/Firefox.app` 없음 |
| 실제 Microsoft Edge 앱 | **NOT TESTED — ENVIRONMENT UNAVAILABLE** | — | — | — | `/Applications/Microsoft Edge.app` 없음 |
| 실제 iPhone / 공식 Simulator | **NOT TESTED — ENVIRONMENT UNAVAILABLE** | — | — | — | Xcode Simulator runtime 없음 |
| 실제 Android / 공식 Emulator | **NOT TESTED — ENVIRONMENT UNAVAILABLE** | — | — | — | `adb`·Android Emulator 없음 |

WebKit의 Playwright `setOffline(true)` 새로고침은 automation 내부 오류를 반환했다. 같은 WebKit에서 원본 서버 자체를 중단하는 독립 시험은 360px 앱 셸, 57/21, 기존 이름, 카드 4장, 재접속을 모두 복원했다. 따라서 자동화 수단의 오류를 앱 기능 실패로 기록하지 않았다. Chrome 자동화는 설치된 Chrome 실행 파일을 직접 사용했지만 Edge 실기라고 부르지 않으며, Firefox engine 결과도 실제 Firefox 앱 결과로 부르지 않는다.

## Performance

| 항목 | Before | After |
|---|---:|---:|
| 앱 JS | 152.18 KB / gzip 49.65 KB | 152.71 KB / gzip 49.94 KB |
| React vendor | 189.63 KB / gzip 59.65 KB | 189.63 KB / gzip 59.65 KB |
| CSS | 11.24 KB / gzip 3.34 KB | 11.24 KB / gzip 3.34 KB |
| Production build | 163 ms | 147 ms |

- 앱 JS 증가는 Service Worker 등록·현재 사용 resource 전달 코드 0.53 KB, gzip 0.29 KB뿐이다. Service Worker 본문은 bundle 밖 4,758 bytes이다.
- 카드 원화 6.7 MB는 JS bundle 밖 정적 파일이며 보이는 시점에만 지연 로딩한다.
- 긴 연대기·도감·목록은 `content-visibility`로 화면 밖 그리기를 미룬다. 선택하지 않은 갈피는 mount하지 않는다.
- 최종 DOMContentLoaded 15–248 ms였다. 한 WebKit 360px cold run에서 외부 글꼴의 load event가 9.06초까지 늦었지만 앱 셸과 상호작용은 먼저 준비됐고 기능 정체는 재현되지 않았다.
- 489,776-byte 장기 저장의 직렬화는 0.53 ms 이하, 복원은 1.36 ms 이하였다.

## Accessibility — PASS

- Keyboard Tab 이동과 가시적인 focus outline 확인.
- 이름 없는 버튼과 카드 figure 0건.
- 카드 무결성·저장 오류는 live status/alert로 알린다.
- `prefers-reduced-motion`에서 transition 0초, animation 0.01 ms.
- desktop/360px 모두 가로 넘침 0건.
- 본문 Pretendard, `GLOAM` 메인 타이틀의 고딕 서체를 실제 computed style로 확인했다.

## Dead End Audit — PASS

- orphan / duplicated card: 0건. 손상 주입 복구 시험 PASS.
- impossible combat: 공식 전투 흐름과 100회 반복에서 deadlock 0건.
- broken reload / broken history / stale save: 100회 순환과 손상 저장 복구 PASS.
- dead button: 이름 없는 버튼 0건, 휴식 대상과 회복 버튼 동기화 회귀 PASS.
- unused state: lint 오류 0건. 새 상태는 추가하지 않았다.

## Regression — PASS

| 항목 | 결과 |
|---|---|
| Long Campaign | **PASS** |
| Card Economy 57/21 | **PASS** |
| Combat | **PASS** |
| Magic | **PASS** |
| Save / Reload / Undo / Export / Import | **PASS** |
| Performance | **PASS** |
| Accessibility | **PASS** |
| Companion Philosophy | **PASS** |

- `npm test -- --reporter=verbose`: test files 2/2, tests 16/16 PASS.
- `npm run lint`: 오류 0.
- `npm run build`: production build PASS.
- Service Worker 추가 뒤 장기 캠페인, 카드 불변식, 전투 예시, 비술 장기 사용, 손상 저장 복구가 기존 PASS에서 후퇴하지 않았다.

## Bugs Found

이번 Gate Closure에서 새 gameplay 버그는 **0건**이었다. 구현 도중 실제로 재현하고 수정한 offline cache 버그는 두 건이다.

1. Vite production module response의 `Vary: Origin` 때문에 일반 cache match가 JS를 찾지 못해 warm offline이 빈 화면이 되던 문제.
2. `crossorigin` Pretendard stylesheet를 opaque `no-cors` response로 저장해 오프라인 stylesheet 로드가 실패하던 문제.

WebKit automation의 `setOffline(true)` 내부 오류와 설치되지 않은 브라우저·기기는 앱 버그로 기록하지 않았다.

## Changes Made

1. production build에서만 최소 Service Worker를 등록하고, dev 환경은 그대로 두었다.
2. versioned app-shell cache와 runtime cache를 분리했다. cache lookup은 `Vary` 차이로 module을 놓치지 않도록 했고 외부 font asset은 CORS response로 저장한다.
3. HTML entry, production JS/CSS, favicon, 기본 font stylesheet만 install 단계에서 저장한다.
4. 화면에 실제 사용된 resource만 runtime cache에 전달하며 전체 Tarot 덱은 precache하지 않는다.
5. 활성화 때 이전 `gloam-v*` resource cache만 제거한다. save schema, local persistence, card economy, undo, import/export, character/combat/magic state는 변경하지 않았다.
6. offline·browser 인증 스크립트를 추가했다. 이는 production gameplay와 UI에 포함되지 않는다.

## Visual Redirection — Printed Rulebook Edition

- 따뜻한 아이보리 종이 바탕, 먹색·짙은 적갈색·황토·짙은 녹색의 인쇄색을 사용한다.
- 둥근 SaaS 카드 대신 직선, 얇은 선, 이중 장 구분선을 사용한다.
- 패널 radius 0, panel shadow `none`, CSS gradient 0건이다. 실제 카드 모서리만 0.12rem을 남겼다.
- 입력 상자를 기록란·밑줄·표 칸처럼 보이게 했고, Character와 Combat를 웹 폼/HUD가 아니라 기입 장부처럼 정리했다.
- Chapter → Section → Table → Record → Footnote 위계를 제목 크기·적갈색 장 제목·구분선·주석 문체로 나눴다.
- 기능, 탭, 규칙 엔진, 상태, 저장 구조는 바꾸지 않았다.

판정 기준은 “더 현대적”이 아니라 **룰북에 더 가까워졌다**이다.

이 Gate Closure에서는 승인된 Pretendard 본문, GLOAM 고딕 타이틀, 양피지, 적갈색 장 제목, 직선·이중선, radius 0, 무그림자·무그라디언트 장부형 UI를 변경하지 않았다.

## Known Verification Limitations

- 실제 Microsoft Edge 앱: **NOT TESTED — ENVIRONMENT UNAVAILABLE**.
- 실제 Firefox 앱: **NOT TESTED — ENVIRONMENT UNAVAILABLE**. Firefox engine automation만 PASS다.
- 실제 iPhone 또는 공식 Simulator: **NOT TESTED — ENVIRONMENT UNAVAILABLE**.
- 실제 Android 또는 공식 Emulator: **NOT TESTED — ENVIRONMENT UNAVAILABLE**.
- Safari 360px는 설치된 Safari의 응답형 디자인 모드이며 실제 iPhone 실기 시험이 아니다.
- cold-first offline과 오프라인에서 처음 만난 미캐시 카드 원화는 보장하지 않는다. 둘 다 요구된 최소 app-shell/runtime-cache 범위 밖이며 기존 캠페인 상태와 규칙 처리는 손상시키지 않는다.

## Left Intentionally Manual

- 판정이 필요한지와 사용할 문양·수정치.
- 서사와 이야기의 결론.
- 징조, 사건, 지도·던전 카드의 의미와 해석.
- 비술 단어 조합의 실제 효과·범위·지속시간과 Undo Magick 결과.
- 괴수 행동, 약점·재능 적용, 사기 실패 뒤 행동.
- 목표·본능·친구 도움·막간 조건을 충족했는지.
- 전투 종료가 승리·패배·도주·협상 중 무엇인지.

## Companion Philosophy — YES

**Does the application still refuse to invent rules, narrative outcomes, or referee decisions?**

**YES.** 앱은 계산, 상태, 카드 이동, 진행과 기록만 처리한다.

## Final Assessment

**Can an experienced Gloam referee comfortably run an entire long-term campaign with this application?**

**YES.** 장기 캠페인, 57/21 카드 경제, 전투, 비술, 저장, 성능, 접근성, warm offline과 가용 브라우저 행렬이 통과했다.

**Can a previously loaded campaign survive a network outage and continue after an offline reload?**

**YES.** Service Worker 설치 전 장부와 오프라인에서 이어 쓴 변경을 재접속 뒤까지 동일하게 복원했다.

**Does the application still refuse to invent rules, narrative outcomes, or referee decisions?**

**YES.**

**Are there any reproduced functional failures that block Version 1.0?**

**NO.** 가용하지 않은 실브라우저·실기기는 Known Verification Limitation이며 재현된 기능 실패가 아니다.

Long Campaign PASS, Card Economy PASS, Save PASS, warm offline PASS, Companion Philosophy YES, reproduced functional Release Blocker 0을 모두 만족한다.

# GLOAM v1.0 RELEASE CANDIDATE

새 gameplay 시스템은 추가하지 않았다.
