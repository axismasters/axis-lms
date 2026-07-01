# CHANGES_PHASE3A_2.md

## 반려 대응 (라운드 2 — v2 최종, 산출물명 v2 확정)

1차(v1) 산출물 반려 사유 4건에 대한 조치:

1. **StudentDetail.tsx 금지 표현 잔존** → 실제 `<p>`/`<strong>` UI 텍스트 3곳("합격 가능성")을
   승인된 대체 표현(추천 적합도, 상승 시 추천 변화 등)으로 교체. 같은 방식으로
   `UniversityReportManagement.tsx`의 안내 배너 1곳도 추가 발견해 함께 교체(상세: QA 문서 §1).
2. **STUDENT_INPUT/PENDING_REVIEW 흔적** → `studentGradeInput.ts`를 `universityMenuLabel.ts`로
   개명하고(파일명 자체가 "학생 입력"을 연상시키는 혼란 원인이었음) 삭제 로그 주석에서
   `STUDENT_INPUT`/`PENDING_REVIEW` 리터럴 문자열을 완전히 제거. `StudentInputGradeReview.tsx`는
   `export {}` 스텁 대신 **물리 삭제**(상세: QA 문서 §2).
3. **QA 문서 뒤섞임** → `QA_PHASE3A_2.md`를 v2 최종 검수 결과만 담도록 전면 재작성.
4. **산출물명 v1 잔존** → 아래 전체를 `-v2.zip` / `-v2-github-upload.zip`으로 재생성.

---

## 반려 대응 (라운드 1 — build/typecheck·UX 보완)

1차 산출물 반려 사유 4건에 대한 조치:

1. **StudentLayout.tsx BarChart2 미import** → `lucide-react` import에 `BarChart2` 추가.
2. **실제 build/typecheck** → package.json 실제 의존성 8종을 근사한 정교한 타입 선언으로
   프로젝트 전체(152개 파일)를 `tsc -b --noEmit` 재검증, 0 errors 달성. 그 과정에서 Phase 3A
   베이스라인부터 있던 사전 결함 7건도 함께 발견·수정(상세: QA 문서 §3).
3. **내신 26과목 기본 전체노출** → 대학 반영 기본 과목(국/수/영/한국사)만 기본 노출, 나머지는
   "+ 과목 추가"로 펼치는 구조로 변경. 성취도/석차등급 조건부 노출은 유지.
4. **추천 적합도/보완 필요도** → `getRecommendationFitScore()`(0~100+5단계 라벨),
   `getSubjectImprovementNeeds()`(과목별 0~100) 신규 추가, 학생·교사 화면에 반영. 금지 표현
   재검사 통과.


상세 내용은 QA_PHASE3A_2.md 최상단 "반려 대응(v2)" 섹션 및 아래 1차 원본 섹션 참조.

---

## (1차 문서 원본)

## Phase 3A-2 — Student Test / University Recommendation Final Fix v1

베이스: Phase 3A(axis-lms-v1_2-phase3a-role-based-portal-rebuild-v1) + Phase 3A-1
(github-upload-3a1 / github-upload-3a1b) 병합 + PHASE3A_2_REVIEW_ADDENDUM_v1.md 보강 지시 반영.

---

## 1. 산출물 정리 (중복 루트 제거)

- 첨부된 `axis-lms-v1_2-phase3a-1-role-based-portal-buildfix-v1-github-upload.zip`은
  `github-upload-3a1/`과 `github-upload-3a1b/` 두 루트가 함께 들어 있었다.
- `github-upload-3a1b`를 기준으로 병합했다. 근거: `diff -rq` 결과 3a1b에만
  `teacherSchoolRecordInput.ts` / `teacherMockExamInput.ts` / `universityPayloadAdapter.ts`
  (구조화된 최신 데이터 계층)가 존재했고, `StudentTargetPreview.tsx` / `TeacherUniversityData.tsx`도
  3a1b가 이 최신 데이터 계층을 사용하도록 재작성되어 있었다. 3a1은 구버전
  (`teacherAcademicInput.ts` / `universityRecommendationPayload.ts`) 기반이었다.
- `github-upload-3a1`에만 있던 `src/pages/parent/ParentHome.tsx` 변경분을 diff로 확인 후
  3a1b 기준 위에 병합했다(추측 병합 금지 — diff 결과로만 판단).
- 최종 zip은 단일 루트만 포함한다(github-upload).

## 2. 학생 화면 메뉴명 확정

- "성적" → "테스트" (StudentLayout.tsx, StudentGrades.tsx) — 이미 3a1b에 반영되어 있었음, 유지.
- "모의고사" → 학년별 "목표대학추천"(고1/고2) / "대학추천"(고3) — `studentGradeInput.ts`의
  `getUniversityMenuLabel()` 통해 이미 구현되어 있었음, 유지.
- 학생 성적 직접 입력 버튼: 3a1b 시점에 이미 제거되어 있었음(확인만 수행, 재발 방지를 위해
  아래 4항에서 재무와 동일한 수준의 데이터 계층 검증까지는 하지 않았음 — 학생 화면에 입력 UI
  자체가 없으므로 노출 경로 없음).

## 3. 테스트 성적표 상세 — 버그 수정 + IF 채점 quick-tap 구조 전환

**버그 수정(필수)**: `StudentGrades.tsx`(3a1b)가 `StudentExamResult.averageScore` /
`highestScore` / `participantCount` / `myRank`를 참조하고 있었으나, `assessmentData.ts`의
`StudentExamResult` 타입에는 해당 필드가 정의되어 있지 않았다. 즉 `npm run build`(`tsc -b`가
먼저 실행됨) 시 타입 오류로 실패했을 상태였다. `assessmentData.ts`에 `computeExamStatistics()`를
추가해 같은 시험의 전체 제출본(결석 제외, 채점완료만) 기준으로 평균/최고점/응시인원/등수를
계산해 채워 넣도록 수정했다.

**IF 채점 quick-tap 구조(권장 반영 → 필수 반영으로 승격, PHASE3A_2_REVIEW_ADDENDUM_v1.md #1)**:
- `assessmentData.ts`에 `WrongQuestionInfo`(문항 id/번호/배점)와 `computeWrongQuestions()`를
  추가. `exam.questions`(문항별 배점 이미 존재 — `ExamQuestionDef.points`)와
  `submission.answers`(문항별 정오 — `AnswerRecord.isCorrect`)를 대조해 오답 문항만 추출한다.
  → 리뷰 문서에서 우려했던 "문항별 배점 필드 부재"는 기존 시스템에 이미 존재했음을 확인했다.
- `studentIfAnalysis.ts`에 `IfQuestionEntry` / `calcIfAnalysisFromQuestions()` /
  `getIfMotivationCommentFromQuestions()`를 신규 추가. 오답 문항별로 IF 사유 3개(계산 실수/개념
  부족/시간 부족) 중 하나를 quick-tap으로 선택하면 문항 배점 기준으로 실제점수/IF점수/놓친점수/
  상승가능성을 계산한다. 사유별 문항 수·점수 breakdown도 함께 제공한다.
- 기존 시험 전체 단위 함수(`calcIfAnalysis`)는 삭제하지 않고 그대로 유지했다. 문항별 채점
  데이터가 없는 legacy 시험(과거 데이터, 문항 단위 채점 없이 총점만 있는 경우)을 위한
  fallback으로 `StudentGrades.tsx`에서 `result.wrongQuestions.length > 0` 여부로 분기한다.
- `StudentGrades.tsx`의 `ResultDetailModal`을 문항별 quick-tap UI로 교체(fallback UI 유지).

## 4. 한국사 절대평가 처리 (필수)

- 데이터 계층(`teacherMockExamInput.ts`)의 `history` 필드는 원래부터
  `{ rawScore?: number; grade?: number }`만 가지고 있어(표준점수/백분위 없음) 올바르게
  설계되어 있었다. UI(`TeacherUniversityData.tsx`의 한국사 `SubjectRow`)도 원점수/등급 2개
  입력만 제공하고 있어 이미 올바르게 구현되어 있었다.
- `universityPayloadAdapter.ts`의 `convertTeacherMockExamToUniversityPayload()`도 `history`에
  `grade`만 매핑하고 표준점수/백분위를 참조하지 않음을 확인했다.
- 이번 작업에서는 코드 수정 없이 3개 지점(데이터 타입/입력 UI/payload 변환) 모두 검수만
  수행했다. 회귀 방지를 위해 QA 문서에 검수 결과를 명시적으로 기록했다(아래 QA 문서 참조).

## 5. 내신성적 입력 — 성취도/석차등급 조건부 노출 (필수)

- `teacherSchoolRecordInput.ts`의 `SchoolSubjectDef`에 `evaluationType: 'relative' | 'absolute'`
  필드를 추가했다. 한국사/통합사회/통합과학은 `'absolute'`(성취평가제), 나머지는 `'relative'`
  (상대평가·석차등급제)로 지정했다.
- `TeacherUniversityData.tsx`의 내신 입력표에서 과목별 `evaluationType`에 따라:
  - `absolute` 과목: 성취도(A~E) 입력 활성화, 석차등급 칸은 "해당없음"으로 표시(비활성).
  - `relative` 과목: 석차등급(1~9등급) 입력 활성화, 성취도 칸은 "해당없음"으로 표시(비활성).
  - 과목명 옆에 "(성취평가)" 배지를 추가해 교사가 한눈에 구분할 수 있게 했다.
- 두 필드를 모든 과목에 동일하게 열어두던 기존 방식(빈 칸이 항상 남는 문제)을 제거했다.

## 6. IF 채점 — 문항별 배점 확인

- 위 3항 참조. `ExamQuestionDef.points`가 이미 존재해 별도 배점 필드 추가는 불필요했다.

## 7. 추천 적합도 / 보완 필요도 스케일

- 이번 작업 지시 목록(1~15)에는 포함되지 않아 반영하지 않았다. `getReadinessLabel()`은 기존
  3단계 라벨(데이터 준비 중/부분 준비/분석 가능) 방식을 그대로 유지했다.
- 참고: 0~100 점수 + 5단계 라벨 스케일 정의는 여전히 유효한 제안이며, 다음 phase에서
  `getReadinessLabel()` 확장 또는 신규 함수 추가로 반영 가능하다(하위 호환 유지 가능한 구조).

## 8. Payload Adapter — require() 제거 + adapterVersion 추가 (필수)

- `universityPayloadAdapter.ts`의 `convertTeacherSchoolRecordToUniversityPayload()` 내부에 있던
  `const { SCHOOL_SUBJECTS } = require('./teacherSchoolRecordInput');`를 제거하고, 파일 상단
  ESM import(`import { getSchoolRecordsForStudentAll, SCHOOL_SUBJECTS } from
  './teacherSchoolRecordInput'`)로 통합했다. Vite/TypeScript ESM 빌드에서 `require()`는
  지원되지 않아 빌드 실패 위험이 있었다.
- `ADAPTER_VERSION = '3a2-1'` 상수를 추가하고, `UniversityRecommendationFullPayload`에
  `adapterVersion` 필드를 추가해 빌더 함수(`buildUniversityRecommendationPayloadForStudent`)가
  항상 이 값을 포함하도록 했다. 기존 `payloadVersion`('3a1-plus', payload 스키마 버전)과는
  별개로 adapter 자체의 버전을 추적한다.
- `TeacherUniversityData.tsx`의 Payload 미리보기 탭에 `adapterVersion`을 함께 표시하도록
  강화했다.
- `SCHOOL_SUBJECTS.find((s: any) => ...)`의 `any` 캐스팅도 ESM import 도입으로 실제 타입
  참조가 가능해져 제거했다.

## 9. 교사 화면 빌드 경고 수정 (필수)

- `TeacherLayout.tsx`: 사용하지 않는 `TrendingUp` import 제거(3a1b에서 `/teacher/growth`
  bottom-nav 항목이 `/teacher/university-data`로 교체되며 미사용 상태였음). `GraduationCap`은
  유지.
- `TeacherUniversityData.tsx`: 내신 입력표에서 `catOrder.map()`이 반환하던 `<>...</>` 축약
  Fragment에 key가 없어 React 콘솔 경고가 발생하고 있었다. `Fragment`를 named import해
  `<Fragment key={...}>`로 명시했다.

## 10. 학생 재무 노출 차단 — 데이터 계층 강화 (필수)

- `StudentFinance.tsx` 격리, `/student/finance` 리다이렉트, 학생 화면 어디에도 재무 관련
  import가 없는 것은 3a1b 이전부터 이미 완료되어 있었음을 재검수로 확인했다(UI 레벨 차단).
- 다만 "UI에서 숨기는 것만으로는 불충분하다"는 지시에 따라 데이터 계층에서 한 번 더 차단했다.
  `FinanceContext.tsx`의 `useFinance()` 훅이 `useAuth()`로 현재 로그인한 사용자의 `position`을
  확인해, `'STUDENT'`인 경우 실제 재무 데이터(청구서/수납/환불/정산/영수증)를 절대 반환하지
  않고 빈 배열과 거부 응답만 반환하는 `STUDENT_SAFE_FINANCE` 스텁으로 대체하도록 수정했다.
- **알려진 구조적 한계(App.tsx는 불변 파일이라 수정 불가)**: Provider 트리 순서상
  `FinanceProvider`가 `AuthProvider`보다 상위(바깥)에 위치해, `FinanceProvider` 자신의
  useEffect(매월 자동 청구서 생성 등)는 역할과 무관하게 항상 실행된다. 이는 React Context
  구조상 하위 Provider(AuthProvider)의 값을 상위 Provider가 알 수 없기 때문이며, App.tsx
  수정 없이는 근본적으로 해결할 수 없다. 이번 수정은 "실제 소비 지점"(컴포넌트가
  `useFinance()`를 호출하는 지점)에서 역할을 검사해 데이터가 학생 화면으로 흘러나가는 것을
  차단하는 방식으로, 현재 구조에서 얻을 수 있는 가장 강력한 방어선이다.

## 11. 교사 추천자료 입력 구조 강화

- 위 5항(성취도/석차등급 조건부), 8항(adapterVersion 표시), 9항(Fragment 경고 제거)이
  `TeacherUniversityData.tsx`의 실질적 강화에 해당한다.
- 탭 구조(내신성적/전국연합/수능실전/데이터현황/Payload), `source: 'TEACHER_INPUT'` /
  `status: 'TEACHER_CONFIRMED'` 저장 규약은 3a1b 시점에 이미 올바르게 구현되어 있어 변경하지
  않았다.

---

## 반영하지 않은 항목과 이유

- **적합도/보완필요도 0~100 스케일**: 최초 작업 지시(1~15번)에는 없었으나, 1차 산출물 반려
  대응(v2)에서 `getRecommendationFitScore()`/`getSubjectImprovementNeeds()`로 반영 완료.
  (본 항목은 v1 시점에 "미반영"으로 기록되었던 문구가 남아 있었던 것으로, v2 반영 후 이 문장을
  최신 상태로 정정한다. 최종 상태는 §4/§6 및 QA 문서 §13 참조.)
- **학년 자동 전환 배치**, **상담 기록 훅 자리**: "참고만 할 것" 항목으로 명시되어 있었고, 이번
  phase 범위(1~15) 밖이라 미반영. 코드 내 TODO 주석도 이번 범위에는 없어 추가하지 않았다
  (필요 시 별도 지시 요청).
