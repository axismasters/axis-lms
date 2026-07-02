# CHANGES — Phase 3E v3-r16-r2 (University Counseling Summary Engine)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline)

v3-r14-r3(엠블럼 PNG 69개) + v3-r15-r1(내신 대비 운영 가이드) + v3-r14-r4(성장/Rival/
Emblem UI 정리) + v3-r16-r1(대학추천 빠른 연결, 문구 정리 포함)이 전부 반영되고 GitHub
Actions가 통과한 최신 main 위에서 작업했다. 이 넷 중 어느 것도 되돌리지 않는다(§5 검증).
v3-r15-r2(내신 대비 가이드 위치 재설계)는 이번 Phase에서 다루지 않는다 — 지시서가 명시한
보류 작업 그대로 남겨뒀다.

## 1. 기준자료 검토 결과

작업 착수 전 첨부된 두 기준자료를 먼저 전부 읽었다.

### 1-1. `axis-university-analysis-engine-phase5.1.zip` (독립 엔진)

`src/engine/scoreNormalizer.ts` / `tierClassifier.ts` / `simulationEngine.ts` /
`reportGenerator.ts` / `src/adapters/lmsAdapter.ts` / `docs/API_CONTRACT.md`를 전부
읽었다. 핵심 확인 사항:

- 이 엔진은 **실제 대학 25개 샘플 DB**(`mockUniversities.ts`)와 대학별 `cut50`(커트라인)
  비교를 통해 상향목표/적정목표/안정목표/기본확보권 4단계를 계산한다 — 이건 AXIS LMS가
  다루지 않는 "특정 대학 대비 위치" 계산이라 그대로 가져올 수 없다(§ 지시서 5번 "Phase 5.1
  독립 엔진을 LMS 전체에 덮어쓰기 금지").
- 반면 **대학 정보 없이도 성립하는 계산**이 따로 있었다: `scoreNormalizer.ts`의 백분위
  구간 라벨(최상위권/상위권/중상위권/중위권/중하위권/하위권, 국내 수능 등급컷 통계 기반
  공개 구간), `simulationEngine.ts`의 등급→백분위 중앙값 lookup과 "수학 등급 1단계 향상"
  시나리오 계산 방식(등급 상승 시 백분위 증가폭을 lookup으로 추정 — cut50 비교 없이도
  성립), `reportGenerator.ts`의 상담 코멘트 조합 패턴(강점/약점 과목, 학년별 방향 안내).
  **이번 v3-r16-r2는 이 "대학 무관" 부분만 골라 가져왔다.**

### 1-2. `AXIS_LMS_INTEGRATION_PLAN_PHASE6_0_1.md` (통합 계획서)

이 문서는 "Phase 6.1"이라는 훨씬 큰 작업(격리 폴더 `src/lib/universityAnalysis/` 신설,
엔진 코드 전체 복사, 대학 샘플 DB 10~25개 복사, `universityAnalysis.view` RBAC 권한 신설,
`[목표대학 분석 시작]` 버튼 + 입력 모달 + 결과 표시 컴포넌트 신규 생성)을 설계한 문서다.
이번 v3-r16-r2 지시서는 이 계획서를 "참고"하되 실행 범위를 명시적으로 좁혔다(§ 지시서
3번 "이번 목표"는 대학명이 전혀 필요 없는 6가지 상담 요약 항목뿐이다). 그래서 **Phase 6.1
계획서의 구체적인 구현 지시(격리 폴더/RBAC 권한/신규 모달·컴포넌트/버튼)는 이번에
실행하지 않았다** — 그건 지시서 5번 금지 목록("대규모 UI 리디자인 금지", "신규 독립
메뉴 남발 금지", "Phase 5.1 독립 엔진을 LMS 전체에 덮어쓰기 금지")과 직접 충돌한다.

## 2. 신규 파일 — `src/lib/universityCounselingSummary.ts`

지시서가 지정한 파일명 그대로 신규 생성했다. 기존 `universityPayloadAdapter.ts`가 만든
`UniversityRecommendationFullPayload`를 입력받아, 대학명·합격 가능성 계산 없이 8개
항목을 계산하는 순수 함수 모음이다(AI 호출·외부 API 호출 없음).

| 항목 | 지시서 대응 | 계산 방식 |
|------|-------------|-----------|
| `dataReadiness` | 현재 데이터 준비 상태 | 기존 `readyForAnalysis`/`hasXxx` 플래그 조합 |
| `fitScore` | 추천 적합도 | 기존 `getRecommendationFitScore()` 그대로 재사용 |
| `currentPosition` | 현재 위치 요약 | 모의고사 백분위(있으면) 또는 내신 평균(없으면) → 6단계 위치 라벨 |
| `topWeakSubjects` | 보완 필요 과목 TOP 3 | 기존 `getSubjectImprovementNeeds()`를 3개로 자름 |
| `mathScenario` | 수학 등급 상승 시나리오 | 등급→백분위 중앙값 lookup 기반, 1·2단계 상승 시 백분위 증가폭 |
| `internalGradeScenario` | 내신 개선 시나리오 | 같은 lookup을 내신 가중 평균등급에 적용(신규 — 기존에 없던 개념) |
| `dataGaps` | 모의고사/수능실전 데이터 부족 여부 | 학년별로 필요한 데이터 종류를 구분해 안내 |
| `oneLiner` | 상담용 한 줄 요약 | 위 항목을 조합한 한 문장(데이터 부족 시 입력 안내로 대체) |

## 3. 화면별 연결 내용

### 3-1. 학생 — `StudentTargetPreview.tsx`

헤더 카드 바로 아래, 기존 "추천 적합도" 카드 위에 "현재 위치"·"목표 변화 가능성" 카드를
새로 추가했다 — 둘 다 문장 1~2줄뿐이다(지시서 "원자료 과다 노출 금지, 현재 위치/보완
과목/목표 변화 가능성만 간단히 표시"). 과목별 상세 원자료는 이미 v3-r16-r1에서 접어둔
`<details>` 안에 그대로 있다(유지).

### 3-2. 학부모 — `ParentTargetSummary.tsx`

"밴드 잠금 안내" 카드와 "선생님에게 문의하세요" 카드 사이에 "보완 필요 과목 · 다음 상담
포인트" 카드를 새로 추가했다. 점수·등급 숫자 나열 대신 과목 칩 + 방향 안내 한 문장으로만
구성했다(이 파일의 기존 정책 "학생용보다 설명형"에 맞춤). Rival/Emblem/SP/Tier는 이 파일
어디에도 없다(§5 grep 확인) — 합격 보장/불합격 단정 표현도 쓰지 않았다.

### 3-3. 교사 — `TeacherUniversityData.tsx` ("상담 요약" 탭)

가장 크게 보강했다. 한 줄 요약 → 데이터 준비 상태/적합도 → 현재 위치 → 보완 필요 과목
TOP3(막대그래프) → 수학·내신 등급 개선 시나리오 순으로 카드를 쌓았다. 기존처럼 "상담
원자료 보기" 토글은 맨 아래 그대로 유지했다(원자료 노출 최소화 원칙 유지). "데이터
현황" 탭에도 보완 우선 과목 한 줄을 추가했다.

### 3-4. 교사 — `TeacherStudentDetail.tsx`

기존 "{학년별 라벨} 준비 상태" 카드에 보완 우선 과목 1개와 수학 시나리오 요약 한 줄을
추가했다. 여전히 원자료는 노출하지 않고, 전체 내용은 `/teacher/university-data`로 연결한다
(기존 링크 유지).

### 3-5. 관리자 — `UniversityReportManagement.tsx`

학생 상세 섹션에 "상담 준비 상태" 카드를 신규 추가했다 — 한 줄 요약, 현재 위치, 보완
필요 과목 칩을 보여준다. **PDF/리포트 생성 버튼은 추가하지 않았다**(v3-r16-r1에서 이미
제거된 더미 버튼을 다시 만들지 않는다는 지시서 §4-8 원칙 그대로 유지).

> ⚠ 데이터 소스 참고: 이 화면 상단의 "데이터 현황 요약"(모의고사/내신 건수)은
> `student.mockExamScores`/`internalScores`(Assessment Engine 데이터)를 쓰고, 새로
> 추가한 "상담 준비 상태"는 `universityPayloadAdapter.ts`(교사 입력 데이터, 학생/교사
> 화면과 동일 소스)를 쓴다 — 두 값이 다르게 보일 수 있다(§6 개발 총괄 의견 참고).

## 4. 금지 사항 준수 — 하지 않은 것

- `src/lib/universityAnalysis/` 격리 폴더, `types.ts`/`mockAnalysisEngine.ts`/
  `lmsPayloadBuilder.ts`/`mockUniversities.ts` — 만들지 않았다(대학 25개 샘플 DB 포함,
  이번 범위 아님).
- `universityAnalysis.view` RBAC 권한, `rbac.ts` 수정 — 하지 않았다.
- `[목표대학 분석 시작]` 버튼, `UniversityAnalysisModal.tsx`, `UniversityAnalysisResult.tsx`
  — 만들지 않았다.
- 대학 tier 분류(상향/적정/안정/기본확보권), cut50 비교, 목표 대학 목록 — 계산하지 않았다.
- PDF/리포트 생성 버튼 — 추가하지 않았다(v3-r16-r1에서 제거된 그대로 유지).
- 신규 라우트, 신규 사이드바 메뉴 — 없다.
- 대규모 UI 리디자인 — 없다. 기존 카드 스타일(`axis-card`, 기존 색상 토큰) 그대로 재사용,
  섹션 추가만 했다.

## 5. 검증

세부 결과는 `docs/QA_PHASE3E_v3_r16_r2.md`, 파일별 MD5는
`docs/MODIFIED_FILES_PHASE3E_v3_r16_r2.md`, 적용 순서는
`docs/APPLY_ORDER_PHASE3E_v3_r16_r2.md` 참고.

## 6. §GPT(개발 총괄)에게 전달할 의견

1. **세 갈래 데이터 파이프라인 문제가 이번에 한 번 더 드러났다.** 관리자 화면(상단 데이터
   현황)은 Assessment Engine 데이터를, 이번에 추가한 상담 요약(관리자 포함 5개 화면
   전부)은 교사 입력 데이터(`universityPayloadAdapter.ts`)를 쓴다. 두 소스가 다르면 관리자
   화면에서 "모의고사 3회"인데 "상담 준비 상태: 데이터 준비 중"으로 보이는 모순이 생길 수
   있다 — v3-r16-r1 CHANGES 문서에서 이미 지적한 문제이며, 다음 Phase에서 파이프라인
   통합을 검토할 것을 다시 제안한다.
2. **`AXIS_LMS_INTEGRATION_PLAN_PHASE6_0_1.md`의 "Phase 6.1" 계획은 이번에 구현하지
   않았다.** 실제 대학 DB·API 서버·RBAC 신규 권한이 필요한 훨씬 큰 작업이라, 별도
   지시서로 명시적으로 요청받을 때 진행하는 것이 안전하다고 판단했다. 특히 그 계획서의
   샘플 대학 25개 DB(서울대/KAIST 등 실명 포함)를 LMS에 들이는 것은 이 프로젝트의
   "대학명 노출 금지" 원칙과 정면으로 부딪힌다 — 실행 전에 이 원칙을 어떻게 조율할지
   결정이 필요하다.
3. **`gradeToPercentileMid` lookup은 국내 수능 9등급 상대평가의 공개된 누적 비율
   통계를 근사한 것이다**(1등급 상위 4% 컷 등 공식 통계는 알려져 있으나, "등급 중앙값"은
   근사치다). 실제 정밀한 값이 필요하면 공식 통계 자료로 교체할 수 있도록
   `universityCounselingSummary.ts` 상단에 상수로 분리해뒀다.
