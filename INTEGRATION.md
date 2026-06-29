# AXIS LMS v1.2 — Senior Weekly Mock Routine Foundation v1

## ChatGPT QA 판정

이번 zip은 `INTEGRATION.md`만 있는 QA 기록이 아니라, 고3 수능실전모의 주간 루틴 조회 화면을 학생/학부모 포털에 추가하는 실제 기능 Foundation 단계다.

원본 zip의 코드 변경 방향은 적절하다. 다만 업로드본은 현재 확정 baseline을 명확히 하고, 변경 파일만 포함하도록 정리한다.

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

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/assessmentData.ts` | `mock-suneung` 주간 루틴 더미 시험/응시 결과 추가 |
| `src/pages/student/StudentWeeklyMocks.tsx` | 학생 수능실전 주간 루틴 조회 화면 추가 |
| `src/pages/parent/ParentWeeklyMocks.tsx` | 학부모 자녀 수능실전 주간 루틴 조회 화면 추가 |
| `src/pages/student/StudentMockExams.tsx` | `/student/weekly-mocks` 진입 카드 추가 |
| `src/pages/parent/ParentMockExams.tsx` | `/parent/weekly-mocks` 진입 카드 추가 |
| `src/routes/StudentRoutes.tsx` | `/student/weekly-mocks` 라우트 추가 |
| `src/routes/ParentRoutes.tsx` | `/parent/weekly-mocks` 라우트 추가 |

## 구현 범위

고3 수능실전모의 주간 루틴을 `mock-suneung` 카테고리의 공개 결과로 조회한다.

학생은 `currentUser.assignedStudentIds[0]` 기준 본인 결과만 조회한다. 학부모는 `currentUser.assignedStudentIds`로 연결된 자녀만 조회하고, 다자녀 선택을 지원한다.

`AssessmentContext.getPublishedResultsForStudent(studentId)` 공개 필터를 경유하므로 미공개/미채점/결석 결과는 표시하지 않는다.

## QA 확인

| 항목 | 상태 |
|------|------|
| 학생 `/student/weekly-mocks` 라우트 추가 | 정상 |
| 학부모 `/parent/weekly-mocks` 라우트 추가 | 정상 |
| 기존 `/student/finance`, `/student/mock-exams` 라우트 유지 | 정상 |
| 기존 `/parent/finance`, `/parent/mock-exams` 라우트 유지 | 정상 |
| `mock-suneung` 공개 결과만 필터 | 정상 |
| 회차순 정렬 및 전회 대비 추이 표시 | 정상 |
| 학생은 본인 데이터만 조회 | 정상 |
| 학부모는 연결 자녀 데이터만 조회 | 정상 |
| `StudentHome.tsx`, `ParentHome.tsx` 미변경 | 정상 |
| `AssessmentContext.tsx` 미변경 | 정상 |
| `TeacherExamGrading.tsx` 미변경 | 정상 |

## 변경하지 않은 파일

- `src/pages/student/StudentHome.tsx`
- `src/pages/parent/ParentHome.tsx`
- `src/contexts/AssessmentContext.tsx`
- `src/pages/teacher/TeacherExamGrading.tsx`
- `src/layouts/StudentLayout.tsx`
- `src/layouts/ParentLayout.tsx`
- Finance / Homework / Content / Attendance 전체
- Admin Back Office 전체

## 보류 유지

- 등급/백분위/표준점수 계산 없음
- 대학추천/목표대학 분석 없음
- AI 분석 없음
- PDF Export 없음
- 문제은행/NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.
