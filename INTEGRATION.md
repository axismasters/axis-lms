# AXIS LMS v1.2 — University Analysis Adapter Spec v1

## ChatGPT QA 판정

이번 zip은 `axis-university-analysis-engine-phase5.1`을 직접 통합하지 않고, LMS 내부 데이터와 외부 대학분석 엔진 사이에서 사용할 입력 어댑터 명세만 추가하는 단계다.

코드 변경은 자립형 타입/placeholder 파일 1개 추가에 한정된다. UI, 라우트, Provider, 기존 성적/모의고사/리포트 화면은 변경하지 않는다.

## 현재 확정 baseline

- Teacher Workflow Persistence v1 buildfix
- Student Portal Foundation v1
- TeacherExamGrading scopedExam 타입픽스
- Parent Portal Foundation v1
- Admin Back Office QA Cleanup v1
- Teacher Content Engine v1
- Content Visibility Bridge v1
- Content Persistence v1 buildfix
- Content Detail UX v1
- Homework Foundation v1
- Homework Status / Completion v1
- Homework Detail UX v1
- Homework Home Bridge v1
- Parent Homework Bridge v1
- Homework QA Cleanup v1
- Attendance Home Bridge QA v1
- Assessment Home Bridge QA v1
- Portal Home Regression QA v1
- Student Parent Portal Scope QA v1
- Parent Finance View Foundation v1
- Parent Finance Home Bridge v1
- Student Finance View Foundation v1
- Student Finance Home Bridge v1
- Assessment Publish Stability Bridge v1 buildfix
- Mock Exam Result Foundation v1
- Senior Weekly Mock Routine Foundation v1
- Senior Mock Accumulation Bridge v1
- University Recommendation Readiness Foundation v1
- University Report Preview Foundation v1
- University Report Preview UX v1

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | 대학분석 엔진 연동 준비용 어댑터 타입 및 placeholder 함수 추가 |

## 정의된 범위

추가된 어댑터 명세:

- `UniversityAnalysisAdapterStatus`
- `UniversityAnalysisInternalGradeSnapshot`
- `UniversityAnalysisMockSummary`
- `UniversityAnalysisReadinessSnapshot`
- `UniversityAnalysisInput`

추가된 placeholder 함수:

- `checkAdapterStatus(snapshot)`
- `emptyInternalGradeSnapshot()`
- `emptyReadinessSnapshot()`
- `buildUniversityAnalysisInput(...)`

## QA 확인

| 항목 | 상태 |
|------|------|
| 외부 엔진 import 없음 | 정상 |
| 기존 LMS 파일 import 없음 | 정상 |
| UI 변경 없음 | 정상 |
| 라우트 변경 없음 | 정상 |
| Provider 변경 없음 | 정상 |
| 기존 성적/모의고사 Context 변경 없음 | 정상 |
| 학생/학부모 포털 변경 없음 | 정상 |
| 대학명/학과명/합격 가능성/추천 순위 타입 미포함 | 정상 |
| PDF Export 추가 없음 | 정상 |
| AI 분석 추가 없음 | 정상 |
| `TeacherExamGrading.tsx` 미변경 | 정상 |

## 보류 유지

- `axis-university-analysis-engine-phase5.1` 직접 통합 없음
- 실제 대학추천 계산 없음
- 목표대학 분석 본체 구현 없음
- 대학명/학과명 추천 없음
- 합격 가능성 계산 없음
- 추천 순위 산출 없음
- PDF Export 없음
- AI 분석 없음
- 문제은행/NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.
