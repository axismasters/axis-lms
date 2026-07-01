# CHANGES_PHASE3B.md

## Phase 3B — IF 저장 / Rival·Emblem·SP 연동 기반 + 시험 상세 누적 성장 그래프

### 배경
Phase 3A-2까지 IF quick-tap은 성적표 상세 모달을 닫으면 선택이 사라지는 일회성 구조였다.
`GrowthContext.tsx`에는 이미 `onIfAnalysisResult`(Emblem 진행도 갱신), `addStudentSP`(SP 지급),
`linkIfAnalysis`(TODO: "onIfAnalysisResult로 대체") 등 연동 지점이 준비되어 있었지만, 실제로
호출하는 곳이 없어 연결되지 않은 상태였다.

### 이번에 한 일
1. **IF 저장** — `src/lib/studentIfRecord.ts`(신규) 추가. 학생이 오답 문항에 quick-tap으로
   고른 이유를 시험별로 localStorage에 저장한다. 모달을 다시 열면 이전 선택이 그대로 복원된다.
2. **Rival/Emblem/SP 연동 기반** — 오답 전체에 이유가 채워지면(`isComplete`) 1회만
   `onIfAnalysisResult()`(Emblem 진행도) + `addStudentSP(studentId, 5, ...)`(SP 5점)를 호출한다.
   `growthLinked` 플래그로 중복 지급을 막는다. `getIfCumulativeSummary()`는 학생별 누적 통계를
   반환해 Rival 비교에 그대로 재사용 가능하다.
3. **누적 성장 그래프** — 시험 상세 모달 안, "성적 요약" 아래·IF 채점 블록 위에 접이식 섹션
   추가. 6개: 최근 점수 추이 / 시험군 내 카테고리별 누적 성취도 / IF 점수 추이 / 놓친 점수
   누적 / IF 사유 비율 / 시험군 첫 기록 대비 성장 변화. 별도 메뉴 없이 이 모달 안에서만 노출.

### 지켜진 것 (재검증 완료)
- 학생 화면 재무/수납/청구/미납/환불/영수증 노출: 0건
- 학생 성적 직접 입력: 없음(이미 채점된 오답의 "이유 회고"만 저장, 점수·정답 자체는 건드리지
  않음)
- 합격률/합격 가능성/합격 보장/안정 합격/불합격 표현: 0건
- 새 라우트/메뉴: 0건(`StudentRoutes.tsx` 변경 없음)

### 알려진 타협
- "단원별" 누적 성취도는 문항 단위 단원 태그가 데이터 모델에 없어, 실제 존재하는
  `categoryId`(단원평가/인증평가 등) 단위로 구현했다. 진짜 "단원"이 필요하면
  `ExamQuestionDef`에 unit 필드를 추가하는 별도 작업이 먼저 필요하다.
- `GrowthContext.tsx`의 `onIfAnalysisResult`는 원래 "사유 플래그가 false면 보상"하는 구조라
  분석을 안 하면 부당 보상될 위험이 있었다. 호출부(`StudentGrades.tsx`)에서 `isComplete`일
  때만 호출하도록 게이트를 걸어 막았다 — `onIfAnalysisResult` 자체 로직은 손대지 않았다.

### 수정/신규 파일
- `src/lib/studentIfRecord.ts` (신규)
- `src/pages/student/StudentGrades.tsx` (수정)

### 검증
`tsc --noEmit --project tsconfig.app.json`(전체 프로젝트, 스텁 기반) → **0 errors**.
`npm install`은 이 작업 환경 네트워크 차단으로 불가 — 로컬에서 `npm install && npm run build`
1회 실행 권장.
