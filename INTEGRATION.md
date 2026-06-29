# AXIS LMS v1.2 — INTEGRATION.md
## Homework Home Bridge v1

### ChatGPT 보정 메모

Claude 원본 zip은 학생 홈의 나의 진열장/티어/SP 영역과 강사 홈의 오늘 수업/미채점 시험/최근 성적 영역을 덮어써서 baseline 회귀 위험이 있었다.
이번 업로드본은 GitHub Actions 통과 baseline의 `StudentHome.tsx`, `TeacherHome.tsx`를 기준으로 숙제 요약 Bridge만 추가한다.

### 작업 범위
학생 홈(`StudentHome.tsx`)과 강사 홈(`TeacherHome.tsx`)에 숙제 요약/바로가기 섹션 추가.

---

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/student/StudentHome.tsx` | 숙제 Bridge 섹션 추가 (미완료 수, 임박 숙제 최대 3건, 내 숙제 보기 링크) |
| `src/pages/teacher/TeacherHome.tsx` | 숙제 Bridge 섹션 추가 (공개/미공개 수, 최근 등록 최대 3건, 숙제 관리 링크) |

---

### 학생 홈 Bridge

- 학생 식별: `currentUser.assignedStudentIds[0]`
- 수강중 반: `s.classes.filter(c => c.status === '수강중').map(c => c.id)`
- 숙제 조회: `getForStudent(enrolledClassIds)` → published + 수강중 반만
- 미완료: `getStatus(hw.id, myStudentId)?.status !== 'completed'`
- 표시: 미완료 N건 배지 + 임박 숙제 마감일 오름차순 최대 3건
- 링크: `/student/homework`

### 강사 홈 Bridge

- 스코프: `getByTeacher(currentUser.id, assignedClassIds)` — 담당 반 외 접근 없음
- 표시: 공개 N건 / 미공개 N건 배지 + createdAt 역순 최대 3건
- 링크: `/teacher/homework`

---

### 변경하지 않은 파일

- `src/pages/teacher/TeacherExamGrading.tsx` — scopedExam → visibleExam 패턴 유지
- `HomeworkContext`, `HomeworkStatusContext`, `ContentContext` — API 변경 없음
- 라우트 구조, Provider 트리, Layout — 변경 없음
- Admin Back Office, Parent Portal — 변경 없음
- Student Home의 나의 진열장/티어/SP 유지
- Teacher Home의 빠른 실행/오늘 수업/미채점 시험/최근 성적 유지

---

### NGD2 / 문제은행 / 자동채점 미연동

숙제 Bridge는 텍스트 요약 표시 및 페이지 링크만. 제출, 채점, 파일, 알림 없음.
