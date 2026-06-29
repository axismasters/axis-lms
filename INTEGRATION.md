# AXIS LMS v1.2 - University Analysis Phase5.1 Request Draft Adapter Spec v1 buildfix

## ChatGPT QA 판정

이번 zip은 Phase 5.1 본체를 import하거나 실행하지 않고, 현재 LMS `universityAnalysisAdapter.ts` 안에 Phase 5.1 `AnalyzeRequest` 대응 draft 타입만 추가하는 단계다.

원본 방향은 맞지만, 문서와 draft 타입 일부가 실제 Phase 5.1 `AnalyzeRequest` 계약과 어긋났다. 따라서 실제 `docs/API_CONTRACT.md`, `src/api/types.ts`, `src/adapters/lmsAdapter.ts` 기준으로 buildfix 업로드본을 따로 만든다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | Phase 5.1 AnalyzeRequest 대응 LMS 내부 draft 타입과 placeholder 조립 함수 추가 |

## 실제 Phase 5.1 계약 기준

참조한 Phase 5.1 파일:

| 파일 | 확인 내용 |
|------|-----------|
| `docs/API_CONTRACT.md` | `AnalyzeRequest`, `AnalyzeResponse`, 연동 주의사항 |
| `src/api/types.ts` | `SchoolRecordInput`, `MockExamRecord`, `TargetUniversityInput`, `ImprovementScenarioInput` |
| `src/adapters/lmsAdapter.ts` | Phase 5.1이 기대하는 LMS 변환 페이로드 |

## 추가된 타입

| 타입 | 실제 Phase 5.1 대응 |
|------|---------------------|
| `Phase51GradeLevel` | `1 | 2 | 3` |
| `Phase51Track` | `'인문' | '자연' | '통합'` |
| `Phase51KoreanSubjectType` | `'화작' | '언매'` |
| `Phase51MathSubjectType` | `'확통' | '미적분' | '기하'` |
| `Phase51InquiryArea` | `'사탐' | '과탐' | '직탐'` |
| `Phase51SchoolRecordInputDraft` | `SchoolRecordInput` draft |
| `Phase51MockExamRecordDraft` | `MockExamRecord` draft |
| `Phase51TargetUniversityInputDraft` | `TargetUniversityInput` draft |
| `Phase51ImprovementScenarioInputDraft` | `ImprovementScenarioInput` draft |
| `Phase51AnalyzeRequestDraft` | `AnalyzeRequest` draft |

## 추가된 함수

| 함수 | 역할 |
|------|------|
| `buildPhase51AnalyzeRequestDraft(input)` | `UniversityAnalysisInput`에서 Phase 5.1 request draft 골격만 조립 |

현재 `UniversityAnalysisInput`만으로는 `gradeLevel`, `track`, 과목별 `mockExamRecords`, `targetUniversities`를 만들 수 없으므로 placeholder 함수는 해당 필드를 `null` 또는 빈 배열로 둔다.

## buildfix 정리

| 항목 | buildfix 기준 |
|------|---------------|
| Phase 5.1 계약 근거 | 실제 계약 파일 기준 |
| `gradeLevel` | `1 | 2 | 3` |
| `track` | `'인문' | '자연' | '통합'` |
| 내신 구조 | Phase 5.1 `SchoolRecordInput` draft 중심 |
| 목표대학 | `targetUniversities` |
| 향상 시나리오 | Phase 5.1 `ImprovementScenarioInput` draft |

## QA 확인

| 항목 | 판정 |
|------|------|
| 원본 zip 래퍼 폴더 없음 | 정상 |
| 실제 Phase 5.1 import 없음 | 정상 |
| Phase 5.1 실행 없음 | 정상 |
| 실제 대학추천 계산 없음 | 정상 |
| 대학명/학과명/합격 가능성/추천 순위 산출 없음 | 정상 |
| PDF Export 없음 | 정상 |
| AI 분석 버튼 없음 | 정상 |
| 신규 라우트/Provider/UI 변경 없음 | 정상 |
| `TeacherExamGrading.tsx` scopedExam 타입픽스 유지 | 정상 |
| `StudentDetail.tsx` 배열 타입 명시 유지 | 정상 |

## 빌드 확인

로컬 검사 폴더에는 프로젝트 의존성이 설치되어 있지 않아 `npm run build`가 `tsc: not found`로 중단된다.

이전과 동일하게 `npm install`도 레지스트리 정책으로 `@tailwindcss/vite` 다운로드가 403 차단되는 환경이라 로컬 빌드 완료까지는 확인하지 못했다.

최종 main 반영은 GitHub Actions 통과 기준으로 승인한다.

## 업로드 판단

원본 zip 대신 buildfix zip 업로드 권장.

업로드 파일:

`axis-lms-v1_2-university-analysis-phase5_1-request-draft-adapter-spec-v1-buildfix-github-upload.zip`

커밋명:

`대학분석 요청초안 어댑터 명세 반영`

## baseline 반영 조건

GitHub Actions가 정상 통과하면 baseline에 다음 항목을 추가한다.

37. University Analysis Phase5.1 Request Draft Adapter Spec v1 buildfix

## 보류 유지

- `axis-university-analysis-engine-phase5.1` 직접 통합 없음
- 실제 대학추천 계산 없음
- 대학명 / 학과명 / 합격 가능성 / 추천 순위 계산 없음
- PDF Export 없음
- AI 분석 없음
- 문제은행 / NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음
