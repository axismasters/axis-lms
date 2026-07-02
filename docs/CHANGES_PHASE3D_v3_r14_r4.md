# CHANGES — Phase 3D v3-r14-r4 (Student Growth / Rival / Emblem Premium UI Cleanup)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline)

`axis-lms-v1_2-phase3d-emblem-assets-full-audit-v3-r14-r3-github-upload.zip`(엠블럼 PNG
69개 전수조사 재작업 완료본) 위에, 이전에 safe-apply한 v3-r15-r1(내신 대비 운영 가이드
엔진)이 이미 반영된 상태를 기준선으로 삼았다. 이번 Phase는 그 위에 학생 성장/Rival/Emblem
화면의 시각 디자인만 정리하며, 엠블럼 자산·데이터·r15-r1 기능은 전혀 건드리지 않는다.

## 1. 문제 진단 — 코드에서 실제로 확인한 부분

지시서가 지적한 증상을 화면별로 코드 레벨에서 재현/확인했다.

### 1-1. "Rival 비교 카드가 PC 화면에서 세로로 눌려 보임"

`RivalMatchupCard.tsx`(구 v3-r10-r1)의 헤더는 `grid-cols-[1fr_auto_1fr]`을 항상 쓰면서,
아바타 옆 성장률 텍스트는 `hidden sm:block`, 주간 추이 미니 차트는 `hidden lg:block`으로
숨겼다. 뷰포트가 정확히 `lg`(1024px) 경계 근처거나 그 사이일 때 정보가 들쭉날쭉 빠지고,
남아있는 좌우 열은 `min-w-0` flex라 내용에 맞춰 계속 눌리는 구조였다 — "PC에서 세로로
눌려 보인다"는 지적과 정확히 맞아떨어진다.

### 1-2. "프로필/VS/그래프/진행바 비율이 깨짐" — 실제 CSS 버그 확인

`StudentRival.tsx`의 "유사 수준 비교" 막대그래프에서, 막대 높이를 `height: '${pct}%'`로
지정했는데 그 **직접 부모**(`flex flex-col items-center justify-end`)가 명시적 높이를
갖지 않는 auto-height flex item이었다. CSS 스펙상 조상 요소에 명시적 높이가 없으면
퍼센트 높이는 정상적으로 계산되지 않는다 — 즉 이 막대는 실제로 찌그러지거나 의도한
비율대로 그려지지 않는 **진짜 버그**였다. 같은 파일의 다른 차트(주간 학습 습관,
`StudentGrowthShowcase.tsx`)는 이미 픽셀 고정값(`${...}px`)으로 계산해 이 문제가 없었다 —
전체 코드베이스에서 퍼센트 높이 패턴은 이 두 줄이 유일했다(`grep` 확인).

### 1-3. "Emblem은 고급 이미지가 들어갔지만 화면 구성 때문에 가치가 낮아 보임"

`StudentGrowthShowcase.tsx`의 엠블럼 갤러리는 72px 이미지를 3~5열 그리드의 `p-3` 카드
안에 넣었고, `StudentMyPage.tsx`의 "보유 엠블럼" 섹션은 그보다도 작은 48px 이미지를
`w-16`(64px) 폭 `flex flex-wrap` 안에 욱여넣고 있었다 — 프리미엄 PNG 에셋(v3-r14-r3에서
전수 재작업)이 작은 아이콘처럼 소비되는 구조였다.

### 1-4. "색 구성이 조잡함" / "전투/게임 과몰입 표현 금지"

관리자 성장관리 화면(`RivalManagement.tsx`, `GrowthOverview.tsx`)에서 Tailwind 기본
팔레트 hex(`#EF4444`, `#DC2626`, `#059669`, `#D1FAE5`, `#FEE2E2`, `#991B1B`, `#4F46E5`,
`#1D4ED8`, `#3B82F6`, `#10B981` 등)가 AXIS oklch 팔레트와 뒤섞여 있었다. 더 심각하게는
`RivalManagement.tsx`가 **칼(Swords) 아이콘**을 헤더와 연결 관계 칩에 두 번 사용하고
있었다 — "Rival은 전투가 아니라 성장 자극 장치"라는, 이 프로젝트가 여러 Phase에 걸쳐
지켜온 원칙(`StudentRival.tsx`/`rivalMatchupEngine.ts` 파일 상단 주석에도 명시)에 정면으로
위배되는 상태였다.

## 2. 수정 내용

### 2-1. `RivalMatchupCard.tsx` — 전면 재구성

- 헤더를 `grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`로 바꿨다. `md`
  미만에서는 나(위)/VS(중간)/Rival(아래) 3블록이 각각 전체 폭을 쓰며 세로로 쌓이고
  (찌그러지지 않음), `md` 이상에서는 항상 좌/중앙/우 3열이 `minmax(0,1fr)`의 넉넉한
  최소폭으로 나란히 선다.
- 성장률 텍스트와 주간 추이 미니 차트를 더 이상 `hidden`으로 숨기지 않는다 — 항상
  렌더링한다. 뷰포트 경계에서 정보가 들쭉날쭉 빠지는 문제 자체를 없앴다.
- 헤더 배경을 3-tone 그라데이션 배너에서 단일 톤(아이보리, `oklch(0.98 0.008 85)`)으로
  정리했다. 진한 색(Deep Navy)은 하단 CTA 바 한 곳에만 남겼다(§ 색상 원칙 — Gold는
  강조선/CTA에 제한적으로).
- 아바타 56→64px, VS 메달 72→80px, 성장률 숫자 `text-2xl`→`text-3xl`로 키워 전체적으로
  여백과 무게감을 더했다.
- 🏆 이모지를 lucide `Trophy` 아이콘으로 교체(아이콘 톤 통일).

### 2-2. `StudentRival.tsx` — 막대그래프 버그 수정 + 정리

- §1-2의 퍼센트 높이 버그를 픽셀 고정값(`BAR_MAX_PX = 108`) 계산으로 바꿨다. 막대가
  컨테이너 높이와 무관하게 항상 올바른 비율로 그려진다.
- 막대 폭/간격을 소폭 키우고(`w-6`→`w-7`, `gap-1.5`→`gap-2`) 상단 모서리를 `rounded-t-md`로
  다듬었다.

### 2-3. `StudentGrowthShowcase.tsx` — 엠블럼 타일 프리미엄화

- `EmblemTile` 이미지 크기 72→96px, 감싸는 원형 프레임(흰 배경 + 옅은 Gold 테두리) 추가.
- 카드 배경을 흰색→아이보리 그라데이션으로, 테두리를 옅은 Gold 톤으로 바꿔 "성취
  배지"다운 무게감을 줬다.
- 그리드 열 수를 `3/4/5`(모바일/sm/lg)에서 `2/3/4`로 줄여 타일당 면적을 늘렸다.
- 획득일 표기를 흐린 회색에서 Gold 계열(`#B7935A`)로 바꿔 "성취" 느낌을 강조.

### 2-4. `StudentMyPage.tsx` — 보유 엠블럼 섹션 재구성

- `flex flex-wrap` + `w-16` + 48px 이미지 구조를 `grid grid-cols-3 sm:grid-cols-4
  lg:grid-cols-5` + 64px 이미지 + 카드 프레임 구조로 바꿔 `StudentGrowthShowcase.tsx`와
  톤을 맞췄다.
- 엠블럼이 9개를 초과하면 "전체 보기"(→ 성장 진열장) 링크를 헤더에 노출한다(신규).

### 2-5. `RivalManagement.tsx` — 전투 표현 제거 + 색상 정리

- `Swords`(칼) 아이콘을 완전히 제거하고 `Users`(헤더), `ArrowRight`(연결 관계 칩)로
  교체했다.
- "활성 N건" 배지, "나를 지정" 배지: 강한 red/indigo → AXIS gold-neutral(`#F1EEE4` /
  `#8A6D2E`, 기존 `MATERIAL_BADGE`류와 동일 톤).
- 승/패 관련 색 전체(승 스탯, 패 스탯, 승률, 연승/연패 배지, 승/패 빠른 액션 버튼):
  Tailwind green/red → `CHART_TEAL`/`CHART_AMBER`(`brandColors.ts`의 기존 원칙 "강한 red
  남발 금지 → warm amber로 제한"과 동일 적용).
- 보안 안내 배너: 빨간 경고 배너 → 기존 정보 배너 톤(`AssessmentDetail.tsx` 등에서 이미
  쓰는 `oklch(0.95 0.04 250)` / `oklch(0.38 0.18 250)`)으로 통일 — 이 문구는 경고가 아니라
  안내이므로.
- "종료 확인"(관계 종료 확정) 버튼만 예외적으로 진한 색(`#E11D48`, Tailwind rose-600)을
  유지했다 — 이건 실제 파괴적 액션이며, `src/components/ui/button.tsx`의 기존 공용
  `destructive` 변형과 정확히 같은 색이다(전투 표현이 아니라 정당한 UX 위험 신호).

### 2-6. `GrowthOverview.tsx` — 통계 카드/테이블 색상 정리

- 요약 카드 5종의 아이콘 색을 Tailwind 기본 hex(`#3B82F6`/`#10B981`/`#EF4444`/`#040D1E`
  등)에서 `brandColors.ts`의 `CHART_BLUE`/`CHART_TEAL`/`CHART_GOLD`/`CHART_AMBER`/
  `AXIS_NAVY`로 교체.
- 최근 SP 이력 토글 버튼, SP 금액, 출처 배지, 누적/시즌 SP 컬럼, 보유 엠블럼 배지의
  ad-hoc indigo/green(`#E7EBF3`/`#4F46E5`/`#059669`/`#1D4ED8`)을 전부 AXIS 팔레트 또는
  기존 gold-neutral 칩 톤으로 통일.

## 3. 건드리지 않은 것 — 금지 목록 그대로 준수

- `src/assets/emblems/**` — PNG 69개, byte 단위로 원본과 완전 동일(§4 검증).
- `src/lib/growthData.ts` / `src/components/brand/AxisEmblemImageBadge.tsx` /
  `src/components/brand/AxisTierMedallion.tsx` — MD5 완전 동일.
- v3-r15-r1 파일 5종(`examPrepGuideTypes.ts`/`examPrepGuideEngine.ts`/
  `examPrepGuideStore.ts`/`ExamPrepGuidePanel.tsx`/`AssessmentDetail.tsx`) — MD5 완전
  동일(직전 safe-apply 산출물과 그대로 일치).
- `src/routes/*.tsx`, `src/App.tsx` — 무변경(신규 라우트 없음, 회귀 없음).
- 학부모 화면(`src/pages/parent/**`) — 무변경. 기존에 이미 있던 "Rival/Emblem/SP/Tier
  등 학생용 게임형 지표는 포함하지 않는다"는 가드 주석/구조를 그대로 재확인만 했다.

## 4. 부수 발견 — tsbuildinfo 오염과 복구

이전 세션에서 `npm run typecheck`/`npm run build`를 이 샌드박스에서 시도했을 때, 실패로
끝났음에도 `tsc -b`의 증분 컴파일 캐시가 `tsconfig.app.tsbuildinfo` /
`tsconfig.node.tsbuildinfo`에 부분적으로 기록되어(`"version":"5.9.3"` → `"6.0.3"`,
`"errors":true` 추가) 원본과 달라져 있었다. 이번 Phase 시작 시점에 이를 발견해 두 파일을
원본 byte 그대로 복구했다(§5 검증에서 재확인). 두 파일 모두 `.gitignore`에 이미
`*.tsbuildinfo`로 등록되어 있어 원래도 커밋 대상은 아니지만, 지시서가 명시적으로
"커밋 금지"를 요구했으므로 작업 트리 자체도 오염 없이 원본과 동일하게 맞춰뒀다.

## 5. 검증

세부 결과는 `docs/QA_PHASE3D_v3_r14_r4.md`, 파일별 MD5는
`docs/MODIFIED_FILES_PHASE3D_v3_r14_r4.md`, 적용 순서는
`docs/APPLY_ORDER_PHASE3D_v3_r14_r4.md` 참고.

## 6. §GPT(개발 총괄)에게 전달할 의견

1. **MiniTrend 차트는 여전히 고정 픽셀(128×48) 크기다.** 카드 좌우 열 폭이 매우 넓어지는
   초광폭 모니터에서는 트렌드 차트 주변에 여백이 남을 수 있다 — `viewBox` + `width:
   100%`로 완전히 유동적으로 만드는 것도 가능하지만, 이번엔 확실히 검증 가능한 고정
   크기를 택했다(§ 리스크 최소화). 다음 단계에서 필요하면 유동 크기로 전환을 제안한다.
2. **RivalManagement.tsx의 "종료 확인" 버튼만 예외적으로 진한 색을 유지한 판단**에
   대해 재검토를 요청한다 — 이 프로젝트의 공용 `Button` 컴포넌트(`variant="destructive"`)
   를 직접 쓰도록 리팩터링하면(현재는 raw `<button>` + 동일한 hex 수동 지정) 향후 그
   토큰이 바뀌어도 자동으로 따라간다. 이번엔 파일의 기존 raw-button 패턴과의 일관성을
   우선해 손대지 않았다.
3. **`EmblemManagement.tsx`(엠블럼 정의 CRUD 관리 화면)는 이번 정리 대상에서 제외했다.**
   활성/비활성 토글의 초록/빨강 배지는 "학생 화면과 연결되는 UI"라기보다 순수 관리자
   CRUD 상태 표시라 판단했다 — 다만 그 화면에도 같은 계열의 ad-hoc green/red hex가
   남아있으니, 전사적 색상 정리를 원하면 다음 단계 후보로 제안한다.
