# AXIS LMS v1.2 — University Analysis Draft Preview UI Wiring v1 buildfix

## 문서 개요

`buildPhase51AnalyzeRequestDraftBundle` 결과를 `StudentDetail.tsx`의 기존 대학분석 미리보기 영역에 연결하는 UI wiring 단계다.

- 실제 Phase 5.1 API 호출 없음
- AI 분석 버튼 없음
- PDF Export 없음
- 대학명 / 학과명 / 합격 가능성 / 추천 순위 산출 없음
- 신규 route / Provider 추가 없음

## buildfix 사유

원본 `axis-lms-v1_2-university-analysis-draft-preview-ui-wiring-v1.zip`의 `src/lib/universityAnalysisAdapter.ts`가 44번 Request Draft Assembly Bridge buildfix 계약 일부를 되돌렸다.

특히 `Phase51MockExamRecordDraft`가 `examLabel / year / koreanPercentile / mathPercentile / englishGrade / inquiry1Percentile` 중심의 Phase 5.1 평면 필드 구조가 아니라, 예전 `examName / examDate / categoryId / korean / math / english` 중첩 구조로 돌아가 있었다.

이 buildfix는 `src/lib/universityAnalysisAdapter.ts`를 44번 buildfix 기준으로 고정하고, `StudentDetail.tsx`의 UI wiring만 유지/보강한다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | 44번 Request Draft Assembly Bridge buildfix 계약 유지 |
| `src/pages/StudentDetail.tsx` | draftTrack state, draftBundle useMemo, Draft 검증 UI, missingFields 표시, AnalyzeRequest draft payload 접기 프리뷰 추가 |

## 유지 확인

| 항목 | 상태 |
|------|------|
| `TeacherExamGrading.tsx` scopedExam 타입픽스 | 변경 파일에 포함하지 않음 |
| `StudentDetail.tsx` adapterMockSummaries 타입픽스 | `const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];` 유지 |
| `Phase51GradeLevel` | `1 | 2 | 3` 유지 |
| `Phase51Track` | `'인문' | '자연' | '통합'` 유지 |
| `Phase51MockExamRecordDraft` | Phase 5.1 평면 필드 구조 유지 |
| `Phase51SchoolRecordInputDraft` | `avgGrade / koreanGrade / mathGrade / note?` 유지 |
| `schoolRecord` | nullable 유지 |
| `targetUniversities` | `Phase51TargetUniversityInputDraft[]` 유지 |
| `improvementScenario` | 단수 유지 |

## 검증 메모

- `npm install`은 현재 환경에서 `@tailwindcss/vite` registry 403으로 실패해 전체 빌드를 재현하지 못했다.
- 정적 확인 기준으로 원본의 adapter 계약 회귀는 제거했다.
- `StudentDetail.tsx`의 신규 UI는 실제 Phase 5.1 API를 호출하지 않고 draft bundle만 읽는다.

## 산출물

`axis-lms-v1_2-university-analysis-draft-preview-ui-wiring-v1-buildfix-github-upload.zip`
