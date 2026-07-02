# CHANGES — Phase 3E v3-r16-r3 (대학추천 신뢰도 향상)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline)

`axis-lms-v1_2-phase3e-university-counseling-summary-v3-r16-r2-github-upload__2_.zip`
(GitHub main, v3-r16-r2 검수 통과본) 위에 그대로 적용했다. 이번 작업에서 v3-r14-r3
(엠블럼), v3-r14-r4(성장/Rival/Emblem), v3-r15-r1(내신 대비 가이드), v3-r16-r1/r16-r2
(대학추천 빠른 부착/상담 요약)는 **한 줄도 되돌리지 않았다**(§5 검증).

## 1. 첨부 zip 처리 방침 (지시서 §2 그대로)

지시서가 명시한 대로, 첨부된 두 zip은 **코드 기준선이 아니라 참고 자료**로만 다뤘다.

- `axis-lms-v1_2-phase6_1-university-analysis-integration-github-upload.zip` — 구조/함수명만
  참고. 그 zip의 `src/lib/universityAnalysis/**`(격리 폴더), `mockUniversities.ts`(대학
  25개 샘플 DB), `UniversityAnalysisModal.tsx`/`UniversityAnalysisResult.tsx`, RBAC 권한
  `universityAnalysis.view`는 **이번 산출물에 전혀 포함하지 않았다** — Phase 6.1은 이번
  지시서 범위 밖의 훨씬 큰 스코프다. 유일하게 재사용한 개념은 `DataConfidence`
  (A/B/C 등급 표기 방식) 하나뿐이며, 그 등급이 매겨지는 **대상 자체를 완전히 바꿨다**
  (§2 참고 — 원래는 "대학 DB 출처 품질", 이번엔 "학생 데이터 자체의 상담 참고 가능성").
- `axis-lms-v1_2-phase3d-exam-prep-guide-relocate-v3-r15-r2-github-upload.zip` — 이번
  r16-r3 작업에는 **전혀 적용하지 않았다**(지시서 명시). 참고조차 하지 않았다 — 내신
  대비 운영 가이드 위치 재설계는 대학추천 신뢰도와 무관한 별개 기능이기 때문이다.
- 두 zip 모두 전체 소스 덮어쓰기를 하지 않았고, 이번 산출물의 코드 기준선은 첨부 zip이
  아니라 **v3-r16-r2 GitHub main**이다.

## 2. 개발 순서 1번 — 기존 파일 구조 파악 결과

| 파일 | 역할 | 이번 작업과의 관계 |
|------|------|-------------------|
| `universityPayloadAdapter.ts` | 교사 입력(내신/모의고사) → `UniversityRecommendationFullPayload` 조립. `dataCompleteness`, `getRecommendationFitScore`, `getSubjectImprovementNeeds` 등 기존 계산 보유 | **무수정** — 신뢰도 엔진의 유일한 입력 타입 소스로만 사용 |
| `universityCounselingSummary.ts` | 위 payload → 6가지 상담 요약(현재 위치/시나리오/데이터 갭 등) | reliability 확장 필드 1개만 추가(§4) |
| `studentUniversityPreview.ts` | 수능실전 누적 회차 기반 학생 프리뷰 상태(Phase 6.1 연결 전 placeholder) | **무수정** — 신뢰도 엔진과 별개 화면(학생 다른 프리뷰 위젯)이라 손대지 않음 |
| `StudentTargetPreview.tsx` / `ParentTargetSummary.tsx` / `TeacherUniversityData.tsx` / `UniversityReportManagement.tsx` | 4개 화면. 전부 이미 `buildUniversityCounselingSummary()`를 호출 중이었음 | 화면마다 정확히 1곳씩만 반영(§6) |

## 3. 신규 파일 — `src/lib/universityReliabilityEngine.ts` (지시서 §4 그대로)

순수 계산 함수만 있다(React/localStorage/API 호출 없음). 입력은 오직
`UniversityRecommendationFullPayload` 하나다.

| 함수 | 지시서 대응 항목 |
|------|------------------|
| `buildReliabilityGrade()`(내부) → `ReliabilityGradeResult` (A/B/C/D + 라벨 + 설명) | ① 데이터 신뢰도 등급 산출 |
| `buildDataBalanceAssessment()` → `DataBalanceAssessment` (내신/전국연합/수능실전 3축, thin/adequate/strong) | ② 내신/모의고사/수능실전 데이터 균형 평가 |
| `buildSuneungCumulativeReliability()` → `SuneungCumulativeReliability` (insufficient/building/stable) | ③ 고3 수능실전 누적 회차 신뢰도 평가 |
| `getCounselingInputGaps()` → `CounselingInputGapItem[]` (우선순위 정렬) | ④ 상담 시 추가 입력 필요 항목 추출 |
| `buildStudentMessage()`/`buildParentMessage()`/`buildTeacherHeadline()`(내부) | ⑤ "어느 정도 참고 가능한가" 설명 문장(화면별 3종) |
| `buildUniversityReliabilityAssessment()` | 위 전부를 묶은 종합 빌더 — 이것만 외부에서 쓰면 된다 |

**등급 산출 기준(순수 계산, 임의 컷 없음)**: 고3은 내신(30점)·전국연합모의고사(30점,
1회 이상 18점/3회 이상 30점)·수능실전 누적(40점, 1~2회 20점/3회 이상 40점) 100점 만점.
고1/2는 수능실전 축이 없어 60점 만점을 100점으로 환산한다. 데이터가 한 축에만 몰려
있으면(다른 축이 전부 0건) 10점을 감점한다. 80점 이상 A, 55점 이상 B, 25점 이상 C,
그 미만 D. **이 임계값은 전부 프로젝트 안에서 이미 쓰이던 1회/2회/3회 기준**
(`getUniversityRecommendationReadiness` — `hasRecentScore`/`hasCumulativeAvg`/
`hasLast3Avg`)과 일치시켰다 — 새 임계값을 임의로 만들지 않았다.

**금지 사항 준수**: 이 파일은 대학 tier(상향/적정/안정/기본확보권), cut50 비교,
`mockUniversities` 같은 대학 DB 구조를 전혀 참조하지 않는다. "신뢰도"는 오로지
"선생님이 입력한 내신/모의고사/수능실전 데이터가 상담에서 얼마나 참고할 만한가"만
가리킨다. 배치표 원점수/표준점수/백분위 컷, 대교협/시행계획/배치표 등 원자료명은
이 파일 어디에도 없다(주석의 금지 목록 나열 제외).

## 4. `universityCounselingSummary.ts` 연결 (지시서 §5 그대로)

`UniversityCounselingSummary` 인터페이스에 `reliability: UniversityReliabilityAssessment`
**확장 필드 1개만 추가**했다. 기존 8개 필드(`studentId`/`gradeLevel`/`dataReadiness`/
`fitScore`/`currentPosition`/`topWeakSubjects`/`mathScenario`/`internalGradeScenario`/
`dataGaps`/`oneLiner`)의 계산 로직과 반환값은 **전혀 바뀌지 않았다**(§5 통합 테스트로
검증 — 필드 11개 전부 존재 확인).

## 5. 화면 반영 — 정확히 4곳(지시서 §6 그대로)

| 화면 | 반영 내용 | 원칙 준수 |
|------|-----------|-----------|
| `StudentTargetPreview.tsx` | 헤더 배지 줄에 `분석 {등급라벨}` 배지 1개 + 그 아래 `reliability.studentMessage` 한 줄 | 등급 문자(A/B/C/D)·점수·건수 노출 없음. "아직은 참고 정도로만 봐주세요" 같은 담백한 문구만 — 불안 조장/합격·불합격 뉘앙스 없음 |
| `ParentTargetSummary.tsx` | 기존 "설명형 안내" 카드 다음에 **"상담 참고도"** 카드 신설, `reliability.parentMessage` 문장 1개만 표시 | 숫자/등급 문자 노출 없음. 설명형 문장만 |
| `TeacherUniversityData.tsx`(상담 요약 탭) | **"데이터 신뢰도"** 카드 신설 — 등급 배지(A~D 문자 노출), 내신/전국연합/수능실전 3열 그리드(건수+수준), 균형 설명, 수능실전 누적 설명, 상담 전 확인 항목 목록 | 선생님 화면이므로 근거(건수)까지 그대로 노출 — "분석 근거와 부족 데이터가 명확해야 한다" 원칙 |
| `UniversityReportManagement.tsx` | 기존 **"상담 준비 상태" 카드 안**(새 카드 아님)에 신뢰도 등급 배지 1개 + `teacherHeadline`(부족 데이터 근거 포함 한 줄) 추가 | 지시서 "카드에 신뢰도 요약 추가" 문구 그대로 — 별도 카드를 만들지 않았다 |

**PC 웹 레이아웃**: `TeacherUniversityData.tsx`의 신뢰도 축 현황은 `grid-cols-3`로
내신/전국연합/수능실전을 가로로 나란히 배치했다(모바일식 세로 나열 아님) — 기존
페이지가 이미 쓰던 grid 패턴(`grid-cols-2`/`grid-cols-4`)과 동일한 관례를 따랐다.

**색상**: Ivory/Warm White 배경 유지, Deep Navy·Gold는 기존처럼 브랜드 강조 요소로만
제한 사용(신규 배지/카드는 기존 프로젝트가 써온 oklch 그린/호박색/중립회색 팔레트를
그대로 재사용 — 신규 색상 토큰을 만들지 않았다). 보라색/그라데이션/blob 없음.

## 6. 검증

### 6-1. 오프라인 typecheck
npm 레지스트리 차단 환경이라, 외부 타입만 스텁으로 대체한 tsc(6.0.3) 하네스로 `src`
전체 검사 — **오류 0건**. 실제 `npm ci`/`npm run typecheck`/`npm run build`는 GitHub
Actions에서 최종 확인.

### 6-2. 신뢰도 엔진 스모크 테스트 (5케이스, 전부 통과)
1. 고3·데이터 전무 → D등급, gap 3개(내신/모의고사/수능실전), 금지 표현 0건.
2. 고3·내신+모의 3회+수능실전 3회(풍부) → A등급, 균형 true, gap 0개.
3. 고3·모의고사 1회만 있고 나머지 없음 → `dominantAxis: 'mock'` 편중 정상 감지,
   `balance-skewed` gap 생성.
4. 고1(수능실전 축 미적용) → `balance.axes`에 suneung 없음, `suneungCumulative.applicable
   === false`, suneung 관련 gap 없음.
5. 고3·수능실전 1회(building) → `suneung-more-rounds` gap 생성, B등급.

### 6-3. 통합 테스트 (실제 더미 데이터 stu-001, localStorage 폴리필)
`buildUniversityRecommendationPayloadForStudent('stu-001', '고3')` →
`buildUniversityCounselingSummary()` 실행 결과, **기존 11개 필드 전부 존재**(구조
안 깨짐), `reliability.grade: C`(내신 1건·모의고사 2회·수능실전 0회 → 타당), gap:
`suneung-missing` 1건만 — 계산 결과가 논리적으로 정합함을 확인.

### 6-4. 회귀(원본 zip 대비 재귀 diff)
변경 = 이 문서 §5 화면 4개 + `universityCounselingSummary.ts` + 신규
`universityReliabilityEngine.ts`, **정확히 6개 파일뿐**. `src/assets/emblems/**`
(PNG 69개), `growthData.ts`, `AxisEmblemImageBadge.tsx`, `AxisTierMedallion.tsx`,
`App.tsx`, `rbac.ts`(권한 추가 없음 재확인), `universityAnalysisAdapter.ts`,
`universityRecommendationPayload.ts`, `universityPayloadAdapter.ts`,
`studentUniversityPreview.ts`, `src/routes/**` — **전부 원본과 diff 없음**.

### 6-5. 금지 표현/원자료명 전수 grep
변경 파일 6개 전체에서 "합격률/합격 가능성/합격 보장/불합격/안정합격/컷 통과/배치표/
대교협/메가스터디/시행계획/cut50/cut70/원점수/표준점수" 검색 — **전부 주석(금지 목록
서술)에만 존재**하고 실제 코드/문구에는 0건. `TeacherUniversityData.tsx`의 기존
"원점수" 입력 필드는 교사가 학생 원점수를 입력하는 **선재 기능**(원본에도 존재)이며,
대학 컷 노출과 무관하다.

## 7. 검수용 파일 지문

| 파일 | 상태 | 라인 수 | MD5 |
|------|------|---------|-----|
| `src/lib/universityReliabilityEngine.ts` | 신규 | 383 | `fb520d4a5123330e70545e5e3058b474` |
| `src/lib/universityCounselingSummary.ts` | 수정(확장 필드 1개) | 311 | `fdfc6bfa71e930dae3295fecd17ac418` |
| `src/pages/student/StudentTargetPreview.tsx` | 수정 | 405 | `c4af89a37046843f30ed9db25cd59b7d` |
| `src/pages/parent/ParentTargetSummary.tsx` | 수정 | 222 | `c1b1cbc312fc395d7827f60c25037534` |
| `src/pages/teacher/TeacherUniversityData.tsx` | 수정 | 825 | `b5654ea9fcf57c6bfde87340903d8f9e` |
| `src/pages/admin/UniversityReportManagement.tsx` | 수정 | 230 | `570fe35cfded49e8815c8ee17f9d5046` |
| `src/lib/universityPayloadAdapter.ts` | 무수정 | — | `31e3e80740871b15548f280df4d43c5c` |
| `src/lib/rbac.ts` | 무수정(권한 추가 없음) | — | `aa9e7ce07f711c5a81fb400d94ab8855` |
| `src/App.tsx` | 무수정 | — | `387bbf48a3d87ff63ce10d6dbc8bf33c` |

## § Opinion for Lead Developer (개발 총괄 검토용 — 코드 동작에는 영향 없음)

1) **"신뢰도 두 종류"가 앱에 공존하는 상태.** `universityPayloadAdapter.getReadinessLabel`
   (데이터 있다/없다 관점, '데이터 준비 중'/'부분 준비'/'분석 가능')과 이번
   `universityReliabilityEngine`(참고 가능성 관점, A~D 4단계)이 같은 화면에 나란히
   보인다(예: 학생 화면 헤더에 두 배지가 붙는다). 의도적으로 분리했지만
   (readiness="있냐 없냐", reliability="얼마나 믿을만하냐"), 다음 라운드에서 두 개념을
   하나의 배지로 합칠지, 지금처럼 병기할지 UX 결정이 필요하다.
2) **`studentUniversityPreview.ts`의 수능실전 회차 임계값과의 관계.** 이 파일은
   Phase 6.1 연결 전 placeholder이며 이미 1/2/3회 임계값을 쓰고 있었다(내가 그대로
   재사용한 값). 다만 이 파일 자체는 `buildUniversityCounselingSummary`를 거치지
   않는 별도 위젯이라 이번 reliability 필드가 연결되어 있지 않다. 학생 화면에
   이 위젯과 새 "분석 신뢰도" 배지가 같이 쓰이는 곳이 생기면 문구가 겹칠 수 있어
   확인이 필요하다.
3) **`ReliabilityGrade`를 학부모 화면에 문자로 노출하지 않은 이유.** "A/B/C/D" 표기는
   학점처럼 읽혀 상담 맥락에서 오해를 살 수 있다고 판단해, 학부모/학생 화면에는
   `label`(신뢰도 높음/양호/보통/낮음)이나 문장만 쓰고 등급 문자는 선생님/관리자
   화면에만 노출했다. 필요하면 학부모 화면에도 문자 배지를 추가하는 건 UI 한 줄
   변경으로 가능하다.
4) **밸런스 축 판정 기준(thin/adequate/strong)의 내신 카운트 특성.** `internalGrades`는
   교사가 학기당 1건으로 입력하는 구조라(과목별이 아니라 학기 단위 레코드), 실제
   운영에서는 이 축이 'strong'(3건 이상)에 도달하기 어렵다 — 여러 학기가 누적돼야
   가능하다. 의도된 설계지만, 원한다면 내신 축의 strong 기준을 "학기 수" 대신
   "포함된 과목 수"로 바꾸는 대안도 고려할 수 있다(이번 스코프에서는 변경하지 않음).
