# AXIS LMS v1.2 - University Analysis Improvement Scenario Bridge v1 buildfix

## ChatGPT QA 판정

원본 zip은 `improvementScenario` 단일값을 명시 입력으로 채우려는 방향은 맞다.
다만 직전 baseline 42번에서 고친 Phase 5.1 실제 계약 draft 일부를 다시 이전 구조로 되돌렸다.

따라서 원본 zip 대신 이 buildfix 업로드본을 사용한다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | `buildPhase51AnalyzeRequestDraft`에 `improvementScenario` 선택 인자 추가, `sanitizeImprovementScenarioInput` helper 추가 |

## buildfix 기준

| 항목 | 기준 |
|------|------|
| `Phase51GradeLevel` | `1 | 2 | 3` 유지 |
| `Phase51Track` | `'인문' | '자연' | '통합'` 유지 |
| `Phase51MockExamRecordDraft` | 실제 Phase 5.1 `MockExamRecord` 대응 평면 필드 구조 유지 |
| `Phase51SchoolRecordInputDraft` | `avgGrade`, `koreanGrade`, `mathGrade`, `note?` 구조 유지 |
| `schoolRecord` | `Phase51SchoolRecordInputDraft | null` 유지 |
| `targetUniversities` | `Phase51TargetUniversityInputDraft[]` 유지 |
| `Phase51TargetUniversityInputDraft` | `univId`, `univName`, `deptName` 유지 |
| `improvementScenario` | 단일 `Phase51ImprovementScenarioInputDraft` 유지 |

## improvementScenario 정제 기준

| 항목 | 판단 |
|------|------|
| `mathStdScoreDelta` | 유한한 숫자일 때만 반영 |
| `mathPercentileDelta` | 유한한 숫자일 때만 반영 |
| `mathGradeUp` | 유한한 숫자일 때만 반영 |
| 모두 비어 있음 | `undefined` 반환 |

개선 시나리오 자동 계산, 합격 가능성 변화 계산, 추천 순위 변화 계산은 수행하지 않는다.

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

최종 main 반영은 GitHub Actions 통과 기준으로 승인한다.

## 업로드 판단

원본 zip 대신 buildfix zip 업로드 권장.

업로드 파일:

`axis-lms-v1_2-university-analysis-improvement-scenario-bridge-v1-buildfix-github-upload.zip`

커밋명:

`대학분석 개선시나리오 브릿지 반영`

## baseline 반영 조건

GitHub Actions가 정상 통과하면 baseline에 다음 항목을 추가한다.

43. University Analysis Improvement Scenario Bridge v1 buildfix

## 보류 유지

- `axis-university-analysis-engine-phase5.1` 직접 통합 없음
- 실제 대학추천 계산 없음
- 대학명 / 학과명 / 합격 가능성 / 추천 순위 계산 없음
- PDF Export 없음
- AI 분석 없음
- 문제은행 / NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음
