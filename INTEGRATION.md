# AXIS LMS v1.2 — University Analysis GradeLevel Input UI Wiring v1 buildfix

## 문서 개요

`StudentDetail.tsx`의 Phase 5.1 Draft 검증 미리보기 영역에 학년(`gradeLevel`) 선택 UI를 추가하고, `buildPhase51AnalyzeRequestDraftBundle`의 context 인수에 `gradeLevel`과 `track`을 함께 전달하는 단계다.

- 실제 Phase 5.1 API 호출 없음
- AI 분석 버튼 없음
- PDF Export 없음
- 대학 추천 결과 생성 없음
- 합격 가능성 / 추천 순위 산출 없음
- 신규 route / Provider 추가 없음

## buildfix 사유

원본 `axis-lms-v1_2-university-analysis-gradelevel-input-input-ui-wiring-v1.zip`은 `StudentDetail.tsx`가 `src/pages/StudentDetail.tsx` 경로가 아니라 zip 루트에 들어 있었다.

또한 직전 buildfix에서 모바일 보호를 위해 적용한 IF 개선 시나리오 입력 grid의 `grid-cols-1 sm:grid-cols-3`가 원본에서 `grid-cols-3`으로 되돌아가 있었다. 이 buildfix에서 다시 복구했다.

파일명도 `gradelevel-input-input`으로 중복되어 있어, 업로드본은 `gradelevel-input-ui-wiring-v1-buildfix-github-upload.zip`으로 정리한다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/StudentDetail.tsx` | `deriveGradeLevelFromMockExamScores`, `Phase51GradeLevel` import, `draftGradeLevel` state, `derivedGradeLevel` / `draftContext` useMemo, 학년 선택 UI, draft bundle context 연결 |
| `src/lib/universityAnalysisAdapter.ts` | 직전 Improvement Scenario Draft Input UI Wiring buildfix 기준 계약 유지 |

## 동작

- 사용자는 `고1 / 고2 / 고3` 토글로 `gradeLevel`을 직접 선택할 수 있다.
- `draftGradeLevel`을 선택하면 자동 파생값보다 우선한다.
- `draftGradeLevel`이 없으면 기존 `deriveGradeLevelFromMockExamScores(student.mockExamScores)` fallback이 유지된다.
- 자동 파생값이 있을 때는 `(예: 고3 자동파생)` 안내를 표시한다.
- context 전달은 아래 형태를 따른다.

```typescript
(draftGradeLevel != null || draftTrack != null)
  ? { gradeLevel: draftGradeLevel, track: draftTrack }
  : undefined
```

## 성능/구조 원칙 확인

| 항목 | 상태 |
|------|------|
| LMS 본체 경량 유지 | 실제 분석 실행 없이 입력/검증/preview만 표시 |
| 탭 단위 계산 | `GradesTab` 내부에만 추가 |
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
| 목표대학 입력 연결 | 유지 |
| 개선 시나리오 입력 연결 | 유지 |

## 검증 메모

- 현재 환경에서 `npm install`은 registry 403으로 실패해 로컬 `npm run build` 재현은 불가했다.
- 정적 확인 기준으로 원본의 zip 경로 위험을 제거했다.
- `draftContext`는 `Phase51StudentContextDraft` 시그니처와 호환된다.
- `src/lib/universityAnalysisAdapter.ts`는 직전 baseline과 동일하게 유지한다.

## 산출물

`axis-lms-v1_2-university-analysis-gradelevel-input-ui-wiring-v1-buildfix-github-upload.zip`
