# CHANGES — Phase 3D v3-r11 (Premium Growth UI / Emblem / PC Layout Cleanup)

AXIS LMS v1.2 · React/TypeScript/Vite/Tailwind/wouter
기준 베이스: **v3-r10-r3** (+ 같은 v3-r11 태그의 선행 서브 패스인 "Growth Motivation Final QA/
Residual Cleanup" 10개 파일 변경이 이미 반영된 상태 — `CHANGES_PHASE3D_v3_r11.md` 참고).
성격: **프리미엄 재설계** — 엠블럼 시각 언어를 처음부터 다시 짜고, 성장 진열장을 PC 갤러리로
재구성했다. 데이터 계약(필드명·스키마)은 변경하지 않았다.

---

## 0. 요약

1. **엠블럼(AxisEmblemBadge) 전면 재설계** — 단색 원판 + 얇은 타원 잎이던 v1을 폐기하고,
   크리스프한 킬라인 · 끝이 뾰족한 실제 "잎" 모양 월계관(고정 광원) · 패싯 다이아몬드 젬(IF
   사유별 색상) · 아이콘 소프트 글로우를 갖춘 진짜 아카데믹 메달 구조로 재작성.
2. **네임 플레이트(AxisEmblemPlaque) 신설** — 메달에 좌표를 하드코딩하지 않고 별도 HTML/CSS
   컴포넌트로 분리(텍스트 길이 대응). 성장 진열장의 "대표 엠블럼"에서만 사용.
3. **성장 진열장(StudentGrowthShowcase) 프리미엄 갤러리 재구성** — "성장 엠블럼 컬렉션"을
   **대표 엠블럼 / 보유 엠블럼 / 다음 성장 목표** 3섹션으로 명확히 분리하고 전체 폭 갤러리로
   승격. 그 아래를 PC 3컬럼(IF 요약 · 성장 기록+Rival · 주간 습관 차트) 대시보드로 재배치.
4. **Rival VS 메달(RivalMatchupCard) 업그레이드** — 같은 "크리스프 킬라인 + 뾰족한 잎" 언어로
   재작업, 하단 CTA의 🏆 이모지를 lucide `Trophy` 아이콘으로 교체(이모지 배지 금지 원칙 적용).
5. **IF 사유 색상 통일** — `ParentGrowthReport.tsx`가 브랜드 팔레트를 무시하고 로컬에서
   강한 레드(#EF4444)를 재정의하던 것을 canonical `IF_REASON_COLOR`(amber/blue/teal)로 교체.
   `StudentGrowthShowcase.tsx`의 계산 실수/시간 부족 색상이 서로 뒤바뀌어 있던 것도 canonical
   매핑으로 정정.
6. **결과 추이 단일 데이터 처리** — `ParentGrowthReport.tsx`의 `TrendSparkline`이 데이터 1건일
   때 점 하나만 찍던 것을(StudentGrades에는 이미 있던 "첫 기준점" 처리가 여기엔 없었음) 첫
   기준점 안내 카드로 교체.
7. **PC 레이아웃 보강(관리자 2개 화면)** — `RivalSeasonManagement.tsx`, `ShowcasePolicyManagement.tsx`
   메인 wrapper가 `max-w-2xl` 고정으로 데스크톱에서도 모바일 폭이던 것을 반응형으로 확장.

---

## 1. 엠블럼 시각 언어 재설계 (§3)

### `src/components/brand/AxisEmblemBadge.tsx` (전면 재작성)
- **골드 링**: 방사형 그라데이션(좌상단 하이라이트 → 골드) + 크리스프한 다크 네이비
  킬라인(`#04101F`, 외곽 스트로크 + 링/원판 이음선)으로 베벨 표현.
- **월계관**: 기존 "타원 잎 5개, 얇은 아웃라인"을 폐기하고 끝이 뾰족한 렌즈형 `<path>` 잎(중심맥
  포함) 6개×2를 좌표 테이블(`LAUREL_NODES`) 기반으로 배치. 잎 그라데이션은
  `gradientUnits="userSpaceOnUse"`로 고정해 잎이 회전해도 좌상단 광원 방향이 일정하게 유지되도록
  함(잎마다 광원이 따로 도는 문제 방지).
- **상단 보석**: 패싯(하이라이트/셰도우 면) 분리 다이아몬드 컷 + 세팅 브라켓 + 스파클(글린트) 2개.
  색상은 `accent` prop(있으면) 우선 — IF 사유별 색상을 그대로 반영할 수 있게 함.
- **중앙 아이콘**: 기존 심볼 유지 + 뒤에 방사형 소프트 글로우 원 추가로 입체감.
- **외부 API 100% 동일** — `iconKey/level/accent/size/locked/className` prop 변경 없음.
  기존 6개 호출부(EmblemManagement/TeacherStudentDetail/TeacherStudentGrowth/
  StudentGrowthShowcase/StudentMyPage) **코드 수정 없이 시각만 업그레이드**됨.

### `src/components/brand/AxisEmblemPlaque.tsx` (신규)
- 메달 아래 붙는 골드 테두리 네임 플레이트. 텍스트 길이가 화면마다 다르므로 SVG에 내장하지 않고
  HTML/CSS로 분리(줄바꿈/말줄임 안전 처리). `title`(굵게, 상단) + `subtitle`(보조, 하단) +
  `accent` prop. 현재는 성장 진열장의 "대표 엠블럼" 자리에서만 사용.

---

## 2. 성장 진열장 프리미엄 갤러리 재구성 (§4)

### `src/pages/student/StudentGrowthShowcase.tsx`
- **"성장 엠블럼 컬렉션" 카드를 전체 폭으로 승격**하고 내부를 3섹션으로 분리:
  - **대표 엠블럼**: 보유 엠블럼 중 레벨(`MASTER>SIGNATURE>FOCUS>GROWTH>BASIC`) → 최신
    획득일 순으로 최상위 1개를 뽑아 100px 큰 배지 + `AxisEmblemPlaque`(정식 명칭 + 파렌트-세이프
    라벨)로 노출.
  - **보유 엠블럼**: 획득한 엠블럼 전체를 그리드로(개수 라벨 포함).
  - **다음 성장 목표**: 미획득 엠블럼 그리드(잠금 표시 유지).
  - 빈 상태(보유 0개) 안내 문구 추가.
- **IF 사유 연동 엠블럼 색상 반영**: `EmblemTile`이 `emblem.linkedIfAxis`가 있으면 레벨 기본
  accent 대신 해당 IF 사유 색상(`IF_REASON_COLOR` 기반)을 배지 젬/글로우에 사용하도록 변경 —
  "계산 실수/개념 부족/시간 부족과 연결되는 핵심 엠블럼은 의미가 한눈에 보여야 함" 요구사항 반영.
- **하단을 PC 3컬럼 대시보드로 재배치**: `IF 기반 성장 요약` / `최근 성장 기록 + Rival 연결` /
  `주간 학습 습관 차트`를 `grid-cols-1 lg:grid-cols-3`으로 배치(기존엔 2컬럼에 뒤섞여 있었음).
  모바일은 기존과 동일하게 세로 스택.

---

## 3. Rival VS 메달 & 이모지 정리 (§3 연장)

### `src/components/growth/RivalMatchupCard.tsx`
- `VsMedallion()`을 AxisEmblemBadge와 같은 "크리스프 킬라인 + 뾰족한 잎" 언어로 재작성(72px,
  4잎×2 축소 버전). 기존은 얇은 타원 잎 4개 + 단색 원판이라 참조 이미지 대비 허접해 보였음.
- 하단 CTA의 🏆 이모지를 `lucide-react`의 `Trophy` 아이콘으로 교체(단일 이모지 성취 표현 금지
  원칙을 엠블럼뿐 아니라 이 카드에도 일관 적용).

---

## 4. IF 사유 색상 통일 (헌법 §브랜드 팔레트)

### `src/pages/parent/ParentGrowthReport.tsx`
- IF 이유 3종 비율 막대(`ReasonRatioStack`)가 로컬에서
  `{'계산 실수': '#F59E0B', '개념 부족': '#EF4444', '시간 부족': '#C8A15A'}`로 **강한 레드를
  포함한 임의 팔레트**를 재정의하고 있던 것을 `@/lib/brandColors`의 canonical
  `IF_REASON_COLOR`(amber/blue/teal)로 교체. 브랜드 색상 중복 정의 제거 + 레드 사용 금지 원칙 준수.

### `src/pages/student/StudentGrowthShowcase.tsx`
- `IF_SUMMARY_META`에서 계산 실수/시간 부족 색상이 canonical 매핑과 반대로(계산 실수=teal,
  시간 부족=amber) 정의되어 있던 것을 `IF_REASON_COLOR` 기준으로 정정(계산 실수=amber, 개념
  부족=blue, 시간 부족=teal). 화면마다 같은 개념이 다른 색으로 보이던 불일치 제거.

---

## 5. 결과 추이 — 단일 데이터 처리 (§6)

### `src/pages/parent/ParentGrowthReport.tsx`
- `TrendSparkline`이 데이터 1건일 때 `step=0`으로 계산되어 **점 하나만 좌측에 찍히던 문제**를
  수정. 이제 1건일 때는 꺾은선 대신 "첫 기준점(회차) + 다음 결과 공개 시 비교 안내" 카드를
  보여준다. (`StudentGrades.tsx`의 `SeriesTrend`에는 v3-r10-r2에서 이미 이 처리가 있었으나
  `ParentGrowthReport.tsx`에는 누락되어 있었다 — 동일 원칙으로 통일.)

---

## 6. PC 레이아웃 보강 (§5)

### `src/pages/growth/RivalSeasonManagement.tsx`
- 메인 wrapper `max-w-2xl` → `max-w-2xl lg:max-w-4xl`(데스크톱에서도 모바일 폭으로 고정되어
  있던 것을 반응형으로). 단순 요약 카드 + 시즌 리스트 화면이라 무리한 다단 대시보드화는 하지
  않고, 읽기 좋은 폭까지만 확장.

### `src/pages/growth/ShowcasePolicyManagement.tsx`
- 메인 wrapper `max-w-2xl` → `max-w-2xl lg:max-w-3xl`(토글 목록 폼 — 마찬가지로 과도한
  다단화 없이 반응형 폭만 보강).

> 나머지 대상 화면(학생/학부모/교사 홈, Rival, Admin GrowthOverview, TeacherStudentGrowth,
> EmblemManagement)은 v3-r10-r3 및 선행 v3-r11 잔여정리 패스에서 이미 `lg:max-w-6xl` 반응형
> 구조가 확인되어 이번 패스에서는 재확인만 하고 추가 수정하지 않았다.

---

## 7. 결과 추이 영역 재확인 (§6)

`StudentGrades.tsx`의 `ResultTrendPanel`/`SeriesTrend`는 이미 v3-r10-r2에서 "좁은 카드 2개 +
점 하나" 문제를 넓은 분석 패널 + 1회뿐일 때 (첫 기준점/최근 기록/다음 테스트 안내) 3분할로
해결한 상태임을 재확인했다(코드 변경 없음). 동일 패턴 결여가 발견된 `ParentGrowthReport.tsx`만
이번에 맞춰 수정했다(§5).

---

## 8. 헌법 위반 스캔 (§7) — 전부 청정 확인

- 학생 화면 재무/수납/청구/미납/환불/영수증: 실노출 0건(가드 주석만 존재).
- 학부모 화면 Rival/Emblem/SP/Tier 직접 노출: 0건.
- 학생 직접 성적 입력 라우트: 없음(STUDENT_INPUT은 교사 승인 대기 상태로만 존재).
- IF 채점 별도 메뉴: 없음.
- 금지 표현(합격률 등) UI 노출: 0건(전부 "포함하지 않는다" 가드 주석).
- 보라/네온/블롭 색상: 0건. 엠블럼 그라데이션은 전부 네이비/골드 계열(메달 베벨 표현 목적).
- 이모지로 성취/배지 표현: 0건(RivalMatchupCard 🏆 제거 완료).
- 불변 파일 3종 MD5: 변경 없음(재확인).

---

## 9. §GPT(개발 총괄)에게 전달할 의견

1. **엠블럼 accent 색상 체계를 이번에 "IF 사유 우선"으로 정리했다.**
   `AxisEmblemBadge`/`EmblemTile`이 이제 `emblem.linkedIfAxis`가 있으면 레벨 기본색 대신 그
   사유 색상(계산 실수=amber/개념 부족=blue/시간 부족=teal)을 젬·글로우에 쓴다. IF와 무관한
   엠블럼(출결/습관/Rival 등)은 기존처럼 레벨 색상을 그대로 쓴다. 향후 새 엠블럼을 추가할 때
   `linkedIfAxis`를 채우면 자동으로 이 색상 체계를 따르게 된다.

2. **대표 엠블럼 선정 로직은 "레벨 우선, 동률 시 최신 획득일"이라는 단순 규칙이다.**
   교사/원장이 특정 엠블럼을 수동으로 "대표"로 고정하고 싶어질 가능성이 있다(예: 학부모 상담
   때 특정 성취를 강조하고 싶은 경우). 지금은 그런 수동 지정 필드가 없다 — 필요해지면
   `StudentEmblem`에 `featured?: boolean` 같은 필드를 추가하고 대표 선정 로직에서 우선
   반영하는 방식으로 확장 가능하다(이번 범위에서는 추가하지 않았다).

3. **AxisEmblemPlaque는 의도적으로 "성장 진열장 대표 엠블럼" 한 곳에서만 쓴다.**
   목록/그리드형 작은 배지(20~72px, EmblemManagement/TeacherStudentDetail/
   TeacherStudentGrowth/StudentMyPage)에는 붙이지 않았다 — 그 크기에서는 플레이트 텍스트가
   뭉개진다. 이름표가 필요한 다른 자리가 생기면(예: 교사용 "학생 대표 성취" 카드) 같은
   컴포넌트를 재사용하면 된다.

4. **RivalSeasonManagement/ShowcasePolicyManagement은 의도적으로 "대시보드화"하지 않았다.**
   지시서의 "단순 상세/모달/폼 화면은 무리하게 대시보드화하지 않는다" 원칙에 따라, 이 두
   화면은 단순 요약+리스트/토글 폼이라 폭만 반응형으로 넓히고 다단 그리드는 추가하지 않았다.
   만약 시즌 개수가 많아져 리스트가 길어지면 그때 카드형 다단 그리드로 승격을 고려할 수 있다.

5. **오프라인 검증 하네스로 회귀 없음을 확인했으나, 최종 확정은 GitHub Actions에서.**
   네트워크 제한 환경이라 `npm run build`를 로컬에서 돌릴 수 없어 스텁 기반 `tsc` 하네스로
   대상 파일 회귀 0건을 확인했다(baseline 57건은 전부 Finance/Assessment 등 비대상 파일의
   스텁 노이즈). 실제 `@types` 환경에서의 그린 빌드는 Actions에서 최종 확인 바란다.
