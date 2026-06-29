# AXIS LMS v1.2 — INTEGRATION.md
## Parent Homework Bridge v1

### ChatGPT 보정 메모

Claude 원본 zip은 최신 baseline의 학부모 홈에서 출결 요약, 수납 링크, 기존 `useAssessment`/`assessmentData` 기반 성적 흐름을 크게 바꿔 회귀 위험이 있었다.
이번 업로드본은 GitHub Actions 통과 baseline의 `ParentHome.tsx`를 기준으로 숙제 현황 조회 섹션만 추가한다.

### 작업 범위
학부모 홈(`ParentHome.tsx`)에 자녀별 숙제 현황 조회 Bridge 추가.

---

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/parent/ParentHome.tsx` | 숙제 현황 섹션 추가 (조회 전용) |

---

### 숙제 Bridge 동작

- 자녀 식별: `currentUser.assignedStudentIds` → `students.filter(s => childIds.includes(s.id))`
- 선택 자녀 수강중 반: `child.classes.filter(c => c.status === '수강중').map(c => c.id)`
- 숙제 조회: `getForStudent(childEnrolledClassIds)` → published + 수강중 반만
- 미완료 계산: `getStatus(hw.id, selectedChildId)?.status !== 'completed'`
- 표시: 미완료 N건 배지 + dueDate 오름차순 임박 숙제 최대 3건
- 각 숙제 행: 제목, 반명, 마감일, **자녀 상태 텍스트** (확인함/미확인/완료)
- **완료 버튼 없음** — 학부모는 조회만 가능

### 기존 섹션 유지

| 섹션 | 상태 |
|------|------|
| 자녀 선택 (selectedChildId state) | ✅ 유지 |
| 수강 반 요약 | ✅ 유지 |
| 출결 요약 | ✅ 유지 |
| 성적 (getPublishedResultsForStudent) | ✅ 유지 |
| 공개 수업자료 (parentVisible, ContentDetailModal) | ✅ 유지 |
| 수납 상태 placeholder | ✅ 유지 |

---

### 변경하지 않은 파일

- `src/pages/teacher/TeacherExamGrading.tsx` — scopedExam → visibleExam 패턴 유지
- `HomeworkContext`, `HomeworkStatusContext`, `ContentContext` — API 변경 없음
- 강사/학생 포털 — 변경 없음
- Admin Back Office — 변경 없음
- 라우트, Provider 트리 — 변경 없음

---

### NGD2 / 문제은행 / 자동채점 미연동

숙제 현황 Bridge는 텍스트 표시 및 상태 조회만. 완료 처리, 제출, 채점, 파일, 알림 없음.
