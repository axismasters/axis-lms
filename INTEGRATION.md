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
