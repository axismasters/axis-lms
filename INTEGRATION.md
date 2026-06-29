# AXIS LMS v1.2 - University Analysis Mock Exam Subject Detail Bridge v1 buildfix

## ChatGPT QA 판정

원본 zip은 `Student.mockExamScores`를 Phase 5.1 request draft에 연결하려는 방향은 맞다.
다만 직전 baseline 37번에서 실제 Phase 5.1 계약 기준으로 고친 `AnalyzeRequest` draft 타입을 다시 이전 추론형 구조로 되돌렸다.

따라서 원본 zip 대신 이 buildfix 업로드본을 사용한다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | `MockExamScore` 타입 import, `mockExamScores` 선택 인자 추가, 과목별 모의고사 draft 변환 helper 추가 |

## buildfix 기준

| 항목 | 기준 |
|------|------|
| `Phase51GradeLevel` | `1 | 2 | 3` 유지 |
| `Phase51Track` | `'인문' | '자연' | '통합'` 유지 |
| `schoolRecord` | `Phase51SchoolRecordInputDraft | null` 유지 |
| `targetUniversities` | `Phase51TargetUniversityInputDraft[]` 유지 |
| `improvementScenario` | 단일 `Phase51ImprovementScenarioInputDraft` 유지 |
| `mockExamRecords` | 실제 Phase 5.1 `MockExamRecord` 대응 평면 필드 구조 유지 |

## 추가 함수

| 함수 | 역할 |
|------|------|
| `adaptMockExamScoreToRecordDraft(score)` | `Student.mockExamScores` 단일 항목을 `Phase51MockExamRecordDraft`로 변환 |
| `adaptMockExamScoresToRecordDrafts(scores)` | `Student.mockExamScores` 배열 전체를 draft 배열로 변환 |

## 변환 규칙

| LMS 원자료 | draft 필드 |
|-----------|------------|
| `examName` | `examLabel` |
| `examDate` 또는 `examName`의 연도 | `year` |
| `korean.standardScore` | `koreanStdScore` |
| `korean.percentile` | `koreanPercentile` |
| `korean.grade` | `koreanGrade` |
| `math.standardScore` | `mathStdScore` |
| `math.percentile` | `mathPercentile` |
| `math.grade` | `mathGrade` |
| `english.grade` | `englishGrade` |
| `inquiry1.subject` | `inquiry1Name` |
| `inquiry1.standardScore` | `inquiry1StdScore` |
| `inquiry1.percentile` | `inquiry1Percentile` |
| `inquiry1.grade` | `inquiry1Grade` |
| `inquiry2.subject` | `inquiry2Name` |
| `inquiry2.standardScore` | `inquiry2StdScore` |
| `inquiry2.percentile` | `inquiry2Percentile` |
| `inquiry2.grade` | `inquiry2Grade` |
| `history.grade` | `koreanHistoryGrade` |

LMS에 없는 과목 선택값(`koreanSubjectType`, `mathSubjectType`)과 탐구 영역(`inquiry1Area`, `inquiry2Area`)은 추론하지 않고 비워 둔다.

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

`axis-lms-v1_2-university-analysis-mock-exam-subject-detail-bridge-v1-buildfix-github-upload.zip`

커밋명:

`대학분석 모의고사 과목상세 브릿지 반영`

## baseline 반영 조건

GitHub Actions가 정상 통과하면 baseline에 다음 항목을 추가한다.

38. University Analysis Mock Exam Subject Detail Bridge v1 buildfix

## 보류 유지

- `axis-university-analysis-engine-phase5.1` 직접 통합 없음
- 실제 대학추천 계산 없음
- 대학명 / 학과명 / 합격 가능성 / 추천 순위 계산 없음
- PDF Export 없음
- AI 분석 없음
- 문제은행 / NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음
