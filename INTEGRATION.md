# AXIS LMS v1.2 - University Analysis School Record Input Bridge v1 buildfix

## ChatGPT QA 판정

원본 zip은 `Student.internalScores`에서 `schoolRecord`를 채우려는 방향은 맞다.
다만 직전 baseline 38번에서 고친 Phase 5.1 실제 계약 draft 일부를 다시 이전 구조로 되돌렸다.

따라서 원본 zip 대신 이 buildfix 업로드본을 사용한다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | `buildPhase51AnalyzeRequestDraft`에 `internalScores` 선택 인자 추가, `adaptInternalScoresToSchoolRecordInputDraft` helper 추가 |

## buildfix 기준

| 항목 | 기준 |
|------|------|
| `Phase51GradeLevel` | `1 | 2 | 3` 유지 |
| `Phase51Track` | `'인문' | '자연' | '통합'` 유지 |
| `Phase51MockExamRecordDraft` | 실제 Phase 5.1 `MockExamRecord` 대응 평면 필드 구조 유지 |
| `Phase51SchoolRecordInputDraft` | `avgGrade`, `koreanGrade`, `mathGrade`, `note?` 구조 유지 |
| `targetUniversities` | `Phase51TargetUniversityInputDraft[]` 유지 |
| `improvementScenario` | 단일 `Phase51ImprovementScenarioInputDraft` 유지 |

## 추가 함수

| 함수 | 역할 |
|------|------|
| `adaptInternalScoresToSchoolRecordInputDraft(scores)` | `Student.internalScores` 배열에서 Phase 5.1 `SchoolRecordInput` draft를 생성 |

## 변환 규칙

| draft 필드 | 변환 규칙 |
|-----------|-----------|
| `avgGrade` | 전체 `InternalScore.grade` 단순 평균 |
| `koreanGrade` | 과목명에 `국어`가 포함된 항목의 단순 평균 |
| `mathGrade` | 과목명에 `수학`이 포함된 항목의 단순 평균 |
| `note` | 데이터가 있을 때 LMS 기준 단순 평균임을 표시 |

평균은 소수점 둘째 자리까지 반올림한다. 해당 데이터가 없으면 `null`로 둔다.
가중 평균, 교과 전형 계산, 대학추천 계산은 수행하지 않는다.

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

`axis-lms-v1_2-university-analysis-school-record-input-bridge-v1-buildfix-github-upload.zip`

커밋명:

`대학분석 내신입력 브릿지 반영`

## baseline 반영 조건

GitHub Actions가 정상 통과하면 baseline에 다음 항목을 추가한다.

39. University Analysis School Record Input Bridge v1 buildfix

## 보류 유지

- `axis-university-analysis-engine-phase5.1` 직접 통합 없음
- 실제 대학추천 계산 없음
- 대학명 / 학과명 / 합격 가능성 / 추천 순위 계산 없음
- PDF Export 없음
- AI 분석 없음
- 문제은행 / NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음
