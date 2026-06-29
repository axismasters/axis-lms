# AXIS LMS v1.2 — Senior Mock Accumulation Bridge v1

## ChatGPT QA 판정

이번 zip은 고3 수능실전 주간 루틴 결과를 누적 요약하는 실제 Bridge 단계다.

대학추천 본체, 목표대학 분석, AI 분석, PDF Export는 구현하지 않고, 기존 공개 결과를 요약하는 순수 헬퍼와 UI 카드만 추가한다.

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

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/assessmentData.ts` | `MockAccumulationSummary`, `getMockAccumulationSummary()` 추가 |
| `src/pages/student/StudentWeeklyMocks.tsx` | 학생 주간 루틴 화면에 누적 요약 카드 추가 |
| `src/pages/parent/ParentWeeklyMocks.tsx` | 학부모 주간 루틴 화면에 누적 요약 카드 추가 |

## 구현 범위

`mock-suneung` 공개 결과로 이미 필터링되고 시험일 오름차순으로 정렬된 `weeklyResults`를 입력받아 누적 요약을 계산한다.

요약 항목:
- 응시 회차 수
- 최근 점수
- 최고 점수
- 평균 점수
- 최근 3회 평균
- 첫 회차 대비 변화량

## QA 확인

| 항목 | 상태 |
|------|------|
| `AssessmentContext.getPublishedResultsForStudent(studentId)` 공개 필터 유지 | 정상 |
| 학생은 본인 `assignedStudentIds[0]` 기준만 조회 | 정상 |
| 학부모는 연결 자녀 `assignedStudentIds` 범위만 조회 | 정상 |
| 기존 회차별 목록/전회 대비 추이/뒤로가기 유지 | 정상 |
| 평균 점수/최근 3회 평균 표시 | 정상 |
| 2회차 이상일 때 첫 회차 대비 변화량 표시 | 정상 |
| 라우트 변경 없음 | 정상 |
| Context 변경 없음 | 정상 |
| `StudentHome.tsx`, `ParentHome.tsx` 미변경 | 정상 |
| `TeacherExamGrading.tsx` 미변경 | 정상 |

## 변경하지 않은 파일

- `src/pages/student/StudentHome.tsx`
- `src/pages/parent/ParentHome.tsx`
- `src/pages/student/StudentMockExams.tsx`
- `src/pages/parent/ParentMockExams.tsx`
- `src/routes/StudentRoutes.tsx`
- `src/routes/ParentRoutes.tsx`
- `src/contexts/AssessmentContext.tsx`
- `src/pages/teacher/TeacherExamGrading.tsx`
- Finance / Homework / Content / Attendance 전체
- Admin Back Office 전체

## 보류 유지

- 대학추천 시스템 구현 없음
- 목표대학 분석 구현 없음
- AI 분석 추가 없음
- PDF Export 추가 없음
- 등급/백분위/표준점수 계산 없음
- 문제은행/NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.
