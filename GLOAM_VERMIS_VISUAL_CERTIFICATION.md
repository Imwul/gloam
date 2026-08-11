# GLOAM — 잃어버린 안내서판 시각 구현 인증

## 시각 기준

Hollow Press의 `Vermis I` 제품 페이지와 사용자가 제공한 내지 캡처의 시각 문법을 참고했다. 원본 그림이나 로고를 복제하지 않고 다음 편집 언어만 Gloam에 옮겼다.

- 먹빛 도감 면과 바랜 기록 면의 교차
- 병든 녹색, 녹슨 적색, 오래된 상아색, 탁한 황금색
- 이중 인쇄선, 색이 어긋난 구분선, 거친 망점과 주사선
- 고문서형 장 제목과 조밀한 도감 표
- 괴수 항목의 고딕 아치 표식

## 화면별 판형

- 인물 기록: 바랜 인물지와 표 형식의 기입란
- 판정과 전투: 검은 전투 도감과 적색·녹색 상태표
- 비술과 징조: 암흑 주문서와 봉인 기록
- 여정 지도와 사건: 오래된 탐사 지도와 좌표 기록지
- 괴수 도감과 막간: 검은 괴수 도감, 고딕 아치 표식, 도감형 수치표
- 연대기와 보존: 바랜 캠페인 장부와 보존 기록

모든 탭·라우팅·폼·상태·게임 규칙은 이전 구조를 그대로 사용한다. 현재 탭을 나타내는 시각용 class만 `main`에 추가했다.

## 서체

- 본문·기입란: Hahmlet
- 한글 장 제목·도감 표제: Song Myung 400, 로컬 WOFF2
- GLOAM 표제·영문 장 색인·원문 고유명: 사용자가 제공한 1492 Quadrata Lim 원본 TTF
- 3440×1440 기본 본문: 22px

Song Myung은 OFL-1.1 패키지로 포함되며 외부 서체 요청 없이 오프라인에서 표시된다. 1492 Quadrata Lim은 제공된 원본 TTF를 변형 없이 포함하며, 파일 메타데이터에 따라 비상업용 제한판으로 기록했다. 상업 이용 전에는 적합한 라이선스를 확인해야 한다.

## 원문 표기

- 상단 장 색인은 룰북의 `Create Your Character`, `Tests`, `Combat`, `Magick`, `Oracles`, `Generating Maps`, `Event Deck`, `Bestiary`, `Downtime` 용어를 조합해 영어로 표기한다.
- 괴수명, Vocation, Talent, Arcane Magick word, Magick item은 Gloam v1.02의 영어 고유명을 사용한다.
- 설명, 상태, Referee 기록은 한글을 유지한다.
- 저장 schema와 규칙 값은 변경하지 않으며, 기존 전투 괴수명도 화면에서만 canonical Bestiary 이름으로 읽는다.

## 색

- 암흑: `#080a07`, `#0d100c`
- 상아색 잉크: `#d7d0a6`
- 바랜 기록지: `#c8c29e`
- 녹슨 적색: `#a94736`
- 병든 녹색: `#688e3f`
- 탁한 황금색: `#c1a23f`
- 멍든 자주색: `#71304f`

## 지면과 장식

- 일반 panel radius: `0px`
- 얇은 테두리, 이중선, 어긋난 적색·녹색 구분선을 사용한다.
- 보조 그림 파일을 추가하지 않았다.
- 네 개의 가벼운 CSS 배경층으로 망점·주사선·바랜 잉크를 표현한다.
- 실제 타로 카드 그림은 원본 비율을 유지하며 채도와 대비만 인쇄물처럼 약하게 보정한다.
- 괴수 카드의 아치 표식은 순수 CSS 장식이며 데이터나 동작을 추가하지 않는다.

## 반응형

### 3440×1440

**PASS**

- 기준 글자 22px
- 지면 2400px
- 본문 2160px
- Chrome, Firefox, WebKit 모두 가로 넘침 0

### 360px

**PASS**

- 가로 넘침 0
- 두 열 기록이 한 열로 재배치
- 지도·괴수·카드 그림 비율 유지
- 탭, 입력, 초점 표시 유지

## 회귀

- 테스트: **PASS** — 16/16
- lint: **PASS**
- production build: **PASS**
- Chrome, Firefox, WebKit: **PASS** — 3440×1440, desktop, mobile-360
- 깨진 카드 그림: **0**
- 이름 없는 버튼: **0**
- 온라인 콘솔 오류: **0**
- keyboard focus: **PASS**
- reduced motion: **PASS**
- 카드 경제·저장 schema·service worker·게임 규칙: **변경 없음**

WebKit의 오프라인 재로드 자동화 내부 오류는 이전 인증 때와 동일하며, 이번 변경은 service worker와 저장 코드를 수정하지 않았다.

## 빌드 크기

| 항목 | 결과 |
| --- | ---: |
| gameplay 앱 JS | 151.42KB / gzip 49.39KB |
| vendor JS | 189.63KB / gzip 59.65KB |
| CSS | 37.43KB / gzip 8.33KB |
| 1492 Quadrata Lim original TTF | 68.25KB |
| Song Myung WOFF2 | 314.51KB |
| Hahmlet + fallback Unifraktur | 691.27KB |

시각용 탭 class로 앱 JS gzip이 약 0.02KB 늘었으며 게임 로직 증가는 없다.

## 최종 판정

**Does the application now read as a strange, worn Gloam game book rather than a monochrome web dashboard?**

**YES**

**Did this visual pass change any gameplay, rules, state, save behavior, or referee decisions?**

**NO**
