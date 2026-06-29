# AXIS LMS v1.2 — Homework QA Cleanup v1

## ChatGPT QA 판정

Claude 원본 `axis-lms-v1_2-homework-qa-cleanup-v1.zip`은 `StudentHome.tsx`, `TeacherHome.tsx`를 큰 폭으로 재작성하여 최신 통과 baseline을 되돌릴 위험이 있었다.

이번 GitHub 업로드본은 코드 파일을 포함하지 않고, 현재 GitHub Actions 통과 baseline에 대한 QA 기록만 남긴다.

## 원본 zip 업로드 제외 사유

| 파일 | 판정 | 사유 |
|------|------|------|
| `src/pages/student/StudentHome.tsx` | 제외 | 최신 baseline의 홈 레이아웃을 재작성하고, `profile.sp`, `profile.material`, `def.icon` 등 현재 Growth 타입과 맞지 않는 접근 가능성이 있음 |
| `src/pages/teacher/TeacherHome.tsx` | 제외 | 최신 baseline의 빠른 실행/오늘 수업/미채점/최근 성적 흐름을 다시 구성하고, 채점 링크를 `/teacher/exams/:id/grade`로 바꿔 현재 라우트(`/teacher/exams/:id/grading`)와 충돌 가능성이 있음 |

## 현재 baseline 유지 확인

| 항목 | 상태 |
|------|------|
| 강사 숙제 등록/공개/삭제 | 유지 |
| 학생 숙제 조회/확인/완료/상세 | 유지 |
| 강사 숙제 상세/학생별 상태 조회 | 유지 |
| 학생 홈 숙제 요약 | 유지 |
| 강사 홈 숙제 요약 | 유지 |
| 학부모 홈 자녀별 숙제 조회 | 유지 |
| 학생 홈 나의 진열장/티어/SP | 유지 |
| 강사 홈 빠른 실행/오늘 수업/미채점 시험/최근 성적 | 유지 |
| 학부모 홈 자녀 선택/출결/성적/공개자료/수납 | 유지 |

## 변경하지 않은 것

- `src/pages/teacher/TeacherHomework.tsx`
- `src/pages/student/StudentHomework.tsx`
- `src/pages/teacher/TeacherHome.tsx`
- `src/pages/student/StudentHome.tsx`
- `src/pages/parent/ParentHome.tsx`
- `src/pages/teacher/TeacherExamGrading.tsx`
- Context / Layout / Route / Provider 전체
- Admin Back Office 전체

## 보류 유지

- NGD2 연동 없음
- 문제은행 연동 없음
- 숙제 제출 기능 없음
- 자동채점 없음
- 알림 기능 추가 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 변경하지 않는다.

---

# AXIS LMS v1.2 — Attendance Home Bridge QA v1

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/teacher/TeacherHome.tsx` | 오늘 수업 카드에서 담당 반 출결 상태를 `useAttendance().getSession(classId, todayDate)`로 표시하고 `/teacher/attendance` 빠른 이동을 연결 |
| `src/pages/student/StudentHome.tsx` | 빠른 이동 4개 항목을 `grid-cols-2`로 조정하여 2×2 균형 배치 |

## 변경하지 않은 파일

- `src/pages/parent/ParentHome.tsx` — 이미 자녀 소속 반 세션과 선택 자녀 `studentId` 기준으로 출결 record를 필터링하므로 변경 불필요
- `src/pages/teacher/TeacherExamGrading.tsx` — scopedExam 타입픽스 유지
- Context / Layout / Route / Provider 전체
- Admin Back Office 전체

## QA 확인

| 항목 | 상태 |
|------|------|
| 강사 홈 assignedClassIds 스코프 | 유지 |
| 학생 홈 출결 빠른 이동 | 유지 |
| 학부모 홈 자녀별 출결 스코프 | 기존 구현 정상 확인 |
| 기존 숙제 홈 요약 | 유지 |
| 학생 홈 나의 진열장/티어/SP | 유지 |
| 강사 홈 빠른 실행/오늘 수업/미채점 시험/최근 성적 | 유지 |
| 학부모 홈 자녀 선택/수강 반/출결/성적/공개자료/수납/숙제 흐름 | 유지 |
| `/teacher/exams/:id/grading` 라우트 | 유지 |

## 보류 유지

- NGD2 연동 없음
- 문제은행 연동 없음
- 시험/성적 엔진 구조 변경 없음
- 숙제 제출/자동채점 없음
- 알림 기능 추가 없음
- Admin Back Office 변경 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.

---

# AXIS LMS v1.2 — Assessment Home Bridge QA v1

## ChatGPT QA 판정

성적/시험 관련 홈 요약 흐름을 검사한 결과, 현재 구현이 기준을 충족한다. 코드 변경 없이 QA 기록만 남긴다.

## QA 확인

| 항목 | 상태 |
|------|------|
| 강사 홈 `mySubmissions`가 `assignedStudentIds` 기준으로 제한됨 | 정상 |
| 강사 홈 `candidateExams`가 담당 반 또는 학원 전체 시험만 후보로 사용함 | 정상 |
| 강사 홈 미채점 시험이 담당 학생의 `채점중` 제출 기준으로 계산됨 | 정상 |
| 강사 홈 최근 성적이 담당 학생의 `채점완료` 제출 기준으로 계산됨 | 정상 |
| 강사 홈 채점 링크가 `/teacher/exams/:id/grading` 유지 | 정상 |
| 학생 홈 최근 성적이 `getPublishedResultsForStudent()` 공개 정책 사용 | 정상 |
| 학부모 홈 성적 요약이 `selectedChildId` 기준으로만 조회됨 | 정상 |
| 학부모 홈에 라이벌/경쟁/엠블럼 정보 미노출 | 정상 |
| 기존 숙제 홈 요약 | 유지 |
| 기존 출결 홈 연결 | 유지 |
| 기존 콘텐츠 공개자료 흐름 | 유지 |
| 기존 학생 홈 나의 진열장/티어/SP | 유지 |

## 변경하지 않은 파일

- `src/pages/teacher/TeacherHome.tsx`
- `src/pages/student/StudentHome.tsx`
- `src/pages/parent/ParentHome.tsx`
- `src/pages/teacher/TeacherExamGrading.tsx`
- Context / Layout / Route / Provider 전체
- Admin Back Office 전체

## 보류 유지

- NGD2 연동 없음
- 문제은행 연동 없음
- 시험/성적 엔진 구조 변경 없음
- 성적 산식 변경 없음
- 성적 공개 정책 변경 없음
- 숙제 제출/자동채점 없음
- 알림 기능 추가 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.

---

# AXIS LMS v1.2 — Portal Home Regression QA v1

## ChatGPT QA 판정

강사/학생/학부모 홈 전체를 회귀 검사한 결과, 숙제/출결/성적/콘텐츠 홈 요약이 서로 충돌하지 않는다. 코드 변경 없이 QA 기록만 남긴다.

## TeacherHome QA

| 항목 | 상태 |
|------|------|
| 빠른 실행 `/teacher/attendance`, `/teacher/exams`, `/teacher/students`, `/teacher/notes`, `/teacher/videos`, `/teacher/homework` 경로가 `TeacherRoutes`와 일치 | 정상 |
| 채점 상세 링크가 `/teacher/exams/:examId/grading` 유지 | 정상 |
| 숙제 요약 섹션 유지 | 정상 |
| 오늘 수업 섹션과 출결 상태 뱃지 유지 | 정상 |
| 미채점 시험 섹션 유지 | 정상 |
| 최근 성적 섹션 유지 | 정상 |
| 담당 학생/담당 반 스코프 유지 | 정상 |

## StudentHome QA

| 항목 | 상태 |
|------|------|
| 빠른 이동 `/student/classes`, `/student/homework`, `/student/grades`, `/student/attendance` 경로가 `StudentRoutes`와 일치 | 정상 |
| 빠른 이동 4개 항목이 `grid-cols-2` 2x2 구조 유지 | 정상 |
| 숙제 요약 섹션 유지 | 정상 |
| 티어/SP 섹션 유지 | 정상 |
| 나의 진열장 섹션 유지 | 정상 |
| 최근 성적이 `getPublishedResultsForStudent()` 공개 정책 사용 | 정상 |

## ParentHome QA

| 항목 | 상태 |
|------|------|
| 자녀 선택 섹션 유지 | 정상 |
| 수강 반 섹션 유지 | 정상 |
| 출결 요약이 자녀 소속 반과 `selectedChildId` 기준으로 제한 | 정상 |
| 최근 성적이 `selectedChildId` 기준으로 제한 | 정상 |
| 공개 수업자료가 `parentVisible` 기준으로 조회 | 정상 |
| 숙제 현황이 조회 전용으로 유지 | 정상 |
| 수납 상태 링크 `/parent/finance`가 `ParentRoutes` placeholder와 일치 | 정상 |
| 학부모 홈에 라이벌/경쟁/엠블럼 정보 미노출 | 정상 |

## Content Visibility QA

| 포털 | 조회 방식 | 상태 |
|------|-----------|------|
| 학생 | `StudentClasses.tsx`에서 `getVisibleForClass(classId, 'studentVisible')` 사용 | 정상 |
| 학부모 | `ParentHome.tsx`에서 `getVisibleForClass(classId, 'parentVisible')` 사용 | 정상 |

`ContentContext`의 `VISIBILITY_RANK`는 `teacherOnly = 0`, `studentVisible = 1`, `parentVisible = 2`이며, `getVisibleForClass()`는 요청한 최소 공개 범위 이상의 항목만 반환한다.

## 변경하지 않은 파일

- `src/pages/teacher/TeacherHome.tsx`
- `src/pages/student/StudentHome.tsx`
- `src/pages/parent/ParentHome.tsx`
- `src/pages/teacher/TeacherExamGrading.tsx`
- Context / Layout / Route / Provider 전체
- Admin Back Office 전체

## 보류 유지

- NGD2 연동 없음
- 문제은행 연동 없음
- 시험/성적 엔진 구조 변경 없음
- 숙제 제출/자동채점 없음
- 알림 기능 추가 없음
- Admin Back Office 변경 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.
