# GLOAM v1.1 — Personal Rulebook Transplant Certification

## 보호 기준

- Golden Master 기준: `55c5cb57dffe82726421cc72b7424bab421c2a20`
- 작업 브랜치: `feature/v1.1-personal-rulebook-transplant`
- 캠페인 저장 키/스키마: `gloam_companion_v2` / v2 유지
- 개인 참조 저장: `gloam-rulebook-reference-v1` (캠페인 저장과 분리)
- 공개 저장소 원문 형식: AES-256-GCM + PBKDF2-SHA-256(310,000회) 암호문
- 암호 보관: 저장하지 않음. 입력한 브라우저 세션의 메모리에서만 해독
- Gameplay logic, rule engine, card economy, save state: 변경 없음

## Source of Truth

- `Gloam1.02.pdf`: 60쪽
- `Gloam Combat Example.pdf`: 3쪽
- `Gloam Char Sheet.pdf`: 1쪽

총 64쪽을 lazy encrypted source data로 이식했다. 룰북의 표가 있는 쪽은 인쇄 열 정렬을 보존하고, 본문은 해독 뒤 검색 가능한 원문으로 제공한다. 기계적 PDF 추출에서 분리된 장식용 drop cap만 원래 단어로 복원했으며 규칙 문장이나 수치를 새로 쓰지 않았다.

## Rulebook Transplant Coverage

수치는 source section 단위다. 괴수 항목처럼 하나의 section 안에 여러 entry가 있는 경우 별도로 병기한다.

| 항목 | 실제 수치 |
|---|---:|
| Chapters / 색인 구획 | 7 |
| Source sections | 44 |
| Rules transplanted | 31 |
| Tables transplanted | 23 |
| Procedures transplanted | 26 |
| Examples transplanted | 9 |
| Referee guidance transplanted | 30 |
| Context/reference transplanted | 23 |
| Cross-links transplanted | 146 |
| Historical Reference | 0 dedicated sections |
| Geographic Reference | 2 dedicated sections |
| Creature Reference | 2 sections / 21 statblocks |
| Cultural Reference | 7 sections |

Historical Reference가 0인 이유는 Gloam v1.02에 별도의 역사/연대기 장이 없기 때문이다. 없는 역사 자료를 만들지 않았다. Geographic Reference는 `Dungeons & Adventure Sites`, `Generating Maps`; Creature Reference는 `Monsters`, `Bestiary`; Cultural Reference는 소개, 천직 개요, 네 천직 자료, Road Folk를 센 값이다.

## 구현된 참조 흐름

- 모든 주요 gameplay 기록지에서 관련 `원문` section을 바로 연다.
- 전역 `Rulebook`에서 목차, 23개 표 서고, 갈피, 최근 펼친 곳을 탐색한다.
- printed page `p.1–60` 직접 이동을 지원한다.
- rule/term/Talent/monster/procedure/table/full source text를 함께 검색한다.
- related rule 146개를 실제 section link로 연결한다.
- canonical source, practical summary, Referee boundary, runtime consumer를 분리한다.
- `현재 게임에서 관련 장부 열기`는 기존 탭으로만 이동하며 규칙을 자동 적용하지 않는다.
- rule/table/page bookmark와 개인 메모/House Rule을 캠페인 state 밖에 저장하고 JSON으로 내보낸다.
- 개인 메모와 House Rule은 canonical engine을 override하지 않는다.

## Remaining PDF Dependencies

**NONE FOR NORMAL PLAY**

원본 삽화, 장식, 실제 인쇄 조판을 감상하거나 원본 PDF 자체를 검수할 때만 PDF가 필요하다. 정상 캠페인의 규칙 문장, 절차, 예외, 표, 공식 전투 예시, Character Sheet 항목 확인에는 필요하지 않다.

## Golden Master Regression

**PASS**

- Vitest: 3 files / 20 tests PASS
- 57/21 card economy: 100회 이상 combat/draw/oracle/zone 전이 PASS
- 100-session save, hundreds of records, 100 undo/save cycles PASS
- Combat Example totals, armor, notches, Wounds PASS
- Known words, Spellbook, Bind, Resolve 100-cycle PASS
- Duplicate live-card recovery PASS
- Lint PASS
- TypeScript/Vite production build PASS
- `git diff --check` PASS

## Browser / Mobile / Offline

- Google Chrome: 3440×1440 / 1440×900 / 360×800 PASS
- Firefox: 3440×1440 / 1440×900 / 360×800 PASS
- WebKit: online layout and interaction PASS
- WebKit origin unavailable → offline restore → origin recovery: PASS
- 360px document overflow: 0
- 넓은 인쇄 표: 문서 전체가 아니라 source block 내부에서만 가로 스크롤
- Keyboard focus, visible focus outline, Escape close, trigger focus return: PASS
- Reduced Motion: PASS
- Online console errors: 0
- Service Worker controlled warm offline reload: PASS
- Offline integrated p.31 source reopen: PASS
- Existing campaign state before/after Service Worker install: PASS
- 잘못된 암호 거부 / 올바른 암호 해독: PASS
- 암호 localStorage·sessionStorage 기록 없음: PASS

WebKit headless의 `context.setOffline(true) + reload` 조합은 엔진 내부 오류를 내므로, 실제 장애에 가까운 별도 origin shutdown 시나리오로 검증했다. 서버를 완전히 내린 동안 카드 이미지, save, p.31 통합 원문이 모두 복원되었고 서버 재기동 뒤 같은 state가 유지됐다.

## Performance

| 항목 | Before | After |
|---|---:|---:|
| 초기 gameplay JS | 151.42 kB / gzip 49.39 kB | 154.8 kB / gzip 51.1 kB |
| Rulebook component | 없음 | lazy 39.3 kB / gzip 12.5 kB |
| Rulebook source | 없음 | lazy encrypted data 103.1 kB |

원문 component와 64쪽 암호문은 `Rulebook`을 처음 열기 전까지 전송되지 않는다. 해독된 source bundle은 현재 SPA 세션의 module memory에서만 재사용되며 새로고침하면 암호를 다시 묻는다. Gameplay vendor bundle은 변하지 않았다.

## Referee에게 남긴 항목

- 판정 필요 여부와 실패의 의미
- Lifepath, Goal, Instinct, 관계의 해석
- Magic/Oracle/Event/Map 결과의 의미와 서사 결론
- 괴수 행동, Morale, Weakness, Talent의 구체 운용
- Folk Magic과 Arcane Magic의 구체 효과·범위·지속
- 장소, NPC, 모험, 전투 결말의 창작과 판정

## Information Gap / PDF Reopen

- Deterministic rule gaps: 0 유지
- Normal-play information gaps: 0 where practical
- 인증 시나리오 PDF reopen count: 0
- Source ambiguity: 해당 source section의 Referee boundary로 표시하며 앱이 하나의 해석으로 고정하지 않음

## Final Assessment

Can the private GLOAM v1.1 build function as both:

1. the complete deterministic Gloam companion engine, and
2. a practical integrated replacement for the physical/PDF rulebook during normal play?

**YES**

Does it invent rules, narrative outcomes, or Referee decisions?

**NO**

**GLOAM PERSONAL RULEBOOK TRANSPLANT COMPLETE**

## Publish Safety Gate

**PASS**

- 공개 branch와 production에는 `gloam-source.enc.json` 암호문만 포함한다.
- 평문 source file은 publish 대상 commit 및 push range에서 제거한다.
- 암호는 source code, Git, campaign save, localStorage, sessionStorage, Service Worker에 저장하지 않는다.
- 해독 실패와 손상은 같은 안전한 오류로 처리하며 원문을 노출하지 않는다.
