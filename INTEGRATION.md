# AXIS LMS v1.2 — University Analysis Improvement Scenario Draft Input UI Wiring v1 buildfix

## 문서 개요

`StudentDetail.tsx`의 Phase 5.1 Draft 검증 미리보기 영역에서 IF 개선 시나리오 placeholder를 실제 입력 UI 초안으로 교체하는 단계다.

- 실제 Phase 5.1 API 호출 없음
- AI 분석 버튼 없음
- PDF Export 없음
- 대학 추천 결과 생성 없음
- 합격 가능성 / 추천 순위 산출 없음
- 신규 route / Provider 추가 없음
- 성적조회 탭 외부에서 대학분석 draft 계산 없음

## buildfix 사유

원본 `axis-lms-v1_2-university-analysis-improvement-scenario-draft-input-ui-wiring-v1.zip`은 `StudentDetail.tsx`가 `src/pages/StudentDetail.tsx` 경로가 아니라 zip 루트에 들어 있었다.

또한 `INTEGRATION.md`에 이전 Draft Preview / Target University 단계 문서가 누적되어 있어 이번 단계만 남기도록 정리했다.

이 buildfix는 업로드 경로를 `src/pages/StudentDetail.tsx`로 바로잡고, 직전 baseline의 `src/lib/universityAnalysisAdapter.ts` 계약을 함께 포함해 Phase 5.1 draft 계약 회귀를 방지한다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/StudentDetail.tsx` | `Phase51ImprovementScenarioInputDraft` import, `draftScenarioInput` state, `draftScenario` useMemo, draft bundle 6번째 인수 연결, IF 개선 시나리오 입력 UI |
| `src/lib/universityAnalysisAdapter.ts` | 직전 Target University Draft Input UI Wiring buildfix 기준 계약 유지 |

## UI 동작

- IF 개선 시나리오는 합격 가능성 변화 계산이 아니라 사용자가 직접 입력하는 수학 향상 가정값이다.
- 입력값은 `Phase51ImprovementScenarioInputDraft` 단수 형태로 유지한다.
- `mathStdScoreDelta`, `mathPercentileDelta`, `mathGradeUp` 중 유한 숫자만 draft에 포함한다.
- 3개 값이 모두 비어 있거나 유효 숫자가 아니면 `undefined`로 전달한다.
- 입력값이 있으면 payload preview의 `improvementScenario`에 반영된다.
- 모바일 입력칸 눌림을 줄이기 위해 입력 grid는 `grid-cols-1 sm:grid-cols-3`로 구성한다.

## 성능/구조 원칙 확인

| 항목 | 상태 |
|------|------|
| LMS 본체 경량 유지 | 실제 분석 실행 없이 입력/검증/preview만 표시 |
| 탭 단위 계산 | `GradesTab`은 `tab === 'grades'`일 때만 렌더링됨 |
| 엔진 분리 | Phase 5.1 엔진 import/API 호출 없음 |
| PDF 분리 | PDF Export 없음 |
| 대용량 목록 | 신규 대용량 목록 렌더링 없음 |
| StudentDetail 비대화 방지 | 성적조회 탭 내부의 작은 입력 UI만 추가 |

## 유지 확인

| 항목 | 상태 |
|------|------|
| `TeacherExamGrading.tsx` scopedExam 타입픽스 | 변경 파일에 포함하지 않음 |
| `StudentDetail.tsx` adapterMockSummaries 타입픽스 | `const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];` 유지 |
| `Phase51GradeLevel` | `1 | 2 | 3` 유지 |
| `Phase51Track` | `'인문' / '자연' / '통합'` 유지 |
| `Phase51MockExamRecordDraft` | `examLabel / year / koreanPercentile / mathPercentile / englishGrade / inquiry1Percentile` 평면 구조 유지 |
| `Phase51SchoolRecordInputDraft` | `avgGrade / koreanGrade / mathGrade / note?` 유지 |
| `targetUniversities` | `Phase51TargetUniversityInputDraft[]` 유지 |
| `improvementScenario` | `Phase51ImprovementScenarioInputDraft` 단수 유지 |

## 검증 메모

- 현재 환경에서 `npm install`은 registry 403으로 실패해 로컬 `npm run build` 재현은 불가했다.
- 정적 확인 기준으로 원본의 zip 경로 위험을 제거했다.
- `draftScenario`는 `buildPhase51AnalyzeRequestDraftBundle`의 6번째 optional 인수 타입과 일치한다.

## 산출물

`axis-lms-v1_2-university-analysis-improvement-scenario-draft-input-ui-wiring-v1-buildfix-github-upload.zip`
