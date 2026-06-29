# AXIS LMS v1.2 — University Analysis Target University Draft Input UI Wiring v1 buildfix

## 문서 개요

`StudentDetail.tsx`의 Phase 5.1 Draft 검증 미리보기 영역에 목표 대학/학과 입력 UI 초안을 연결하는 단계다.

- 실제 Phase 5.1 API 호출 없음
- AI 분석 버튼 없음
- PDF Export 없음
- 대학 추천 결과 생성 없음
- 합격 가능성 / 추천 순위 산출 없음
- 신규 route / Provider 추가 없음

## buildfix 사유

원본 `axis-lms-v1_2-university-analysis-target-university-draft-input-ui-wiring-v1.zip`은 `StudentDetail.tsx`가 `src/pages/StudentDetail.tsx` 경로가 아니라 zip 루트에 들어 있었다.

이 buildfix는 업로드 경로를 `src/pages/StudentDetail.tsx`로 바로잡고, 44번 이후 확정된 `src/lib/universityAnalysisAdapter.ts` 계약을 함께 포함해 Phase 5.1 draft 계약 회귀를 방지한다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/StudentDetail.tsx` | `Phase51TargetUniversityInputDraft` import, `nanoid` import, `draftTargetUniversities` / `targetInput` state, 목표 대학 입력 UI, draft bundle 5번째 인수 연결 |
| `src/lib/universityAnalysisAdapter.ts` | 44번 Request Draft Assembly Bridge buildfix 계약 유지 |

## UI 동작

- 목표 대학 입력은 추천 결과가 아니라 사용자가 직접 지정하는 분석 대상이다.
- 입력값은 `Phase51TargetUniversityInputDraft[]` 형태로 유지한다.
- `univId`는 `univ-${nanoid(6)}` 형태로 생성한다.
- 대학명 / 학과명이 모두 입력된 경우에만 추가할 수 있다.
- 추가된 항목은 payload preview의 `targetUniversities`에 반영된다.
- IF 개선 시나리오 입력은 다음 단계 placeholder로 유지한다.

## 성능/구조 원칙 확인

| 항목 | 상태 |
|------|------|
| LMS 본체 경량 유지 | 실제 분석 실행 없이 입력/검증/preview만 표시 |
| 탭 단위 계산 | `GradesTab`은 `tab === 'grades'`일 때만 렌더링됨 |
| 엔진 분리 | Phase 5.1 엔진 import/API 호출 없음 |
| PDF 분리 | PDF Export 없음 |
| 대용량 목록 | 신규 대용량 목록 렌더링 없음 |

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
| `improvementScenario` | 단수 유지 |

## 검증 메모

- 현재 환경에서 `npm install`은 registry 403으로 실패해 로컬 `npm run build` 재현은 불가했다.
- 정적 확인 기준으로 원본의 zip 경로 위험을 제거했다.
- `nanoid`는 기존 `package.json` dependencies에 포함되어 있고, repo 내 다른 파일에서도 동일 import 패턴을 사용한다.

## 산출물

`axis-lms-v1_2-university-analysis-target-university-draft-input-ui-wiring-v1-buildfix-github-upload.zip`
