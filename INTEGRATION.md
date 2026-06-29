# AXIS LMS v1.2 — Mock Exam Result Foundation v1 github upload

## 목적

대학추천 시스템으로 바로 가지 않고, 학생·학부모가 공개된 모의고사/수능 실전모의 결과를 읽기 전용으로 조회할 수 있는 기초 화면을 추가한다.

## 원본 zip 검수 결과

원본 `axis-lms-v1_2-mock-exam-result-foundation-v1.zip`은 기능 방향은 맞았지만,
`src/pages/student/StudentHome.tsx`를 불필요하게 다시 작성하면서 직전 baseline의 학생 홈 수납 카드 표현과 위치가 바뀌는 회귀 위험이 있었다.

이번 github-upload zip에서는 `StudentHome.tsx`를 제외했다.
현재 정상작동 중인 Student Finance Home Bridge v1 + Assessment Publish Stability Bridge v1 buildfix의 학생 홈을 그대로 유지한다.

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/pages/student/StudentMockExams.tsx` | 학생 본인 모의고사 결과 조회 화면 추가 |
| `src/pages/parent/ParentMockExams.tsx` | 학부모 자녀별 모의고사 결과 조회 화면 추가 |
| `src/routes/StudentRoutes.tsx` | `/student/mock-exams` 라우트 추가 |
| `src/routes/ParentRoutes.tsx` | `/parent/mock-exams` 라우트 추가 |
| `src/layouts/StudentLayout.tsx` | 학생 하단 탭에 `모의고사` 추가 |
| `src/layouts/ParentLayout.tsx` | 학부모 하단 탭에 `모의고사` 추가 |
| `src/lib/assessmentData.ts` | 공개완료 모의고사 더미 시험/응시 결과 추가 |

## 구현 내용

- 학생은 `currentUser.assignedStudentIds[0]` 기준 본인 결과만 조회한다.
- 학부모는 `currentUser.assignedStudentIds`로 연결된 자녀 결과만 조회한다.
- 두 화면 모두 `useAssessment().getPublishedResultsForStudent(studentId)` 공개 필터 API를 사용한다.
- `mock-school`, `mock-suneung` 카테고리 결과만 표시한다.
- 미공개, 미채점, 결석 결과는 표시하지 않는다.
- 표시 항목은 시험명, 시험일, 카테고리, 점수/만점, 백분율, 요약 통계로 제한한다.

## 유지 원칙

- 학생/학부모 화면은 조회 전용이다.
- 대학추천, 목표대학 분석, 합격 가능성, PDF 리포트는 구현하지 않았다.
- 등급, 백분위, 표준점수는 데이터 구조에 없으므로 추가하지 않았다.
- 문제은행/NGD2 연동 없음.
- Rival / Emblem / IF 분석 구현 없음.
- Admin Back Office 대규모 변경 없음.
- `src/pages/teacher/TeacherExamGrading.tsx` 변경 없음.
- `src/pages/student/StudentHome.tsx` 변경 없음.

## 검증 메모

- 원본 zip의 `StudentHome.tsx` 회귀 위험을 제거하기 위해 업로드본에서 제외했다.
- 새 화면들은 기존 `AssessmentContext` 공개 필터 API를 전제로 한다.
- 로컬 workspace에는 `node_modules`가 없어 `npm run build`는 실행 환경상 불가하다.
- 이전 확인에서 `npm install`은 registry 403으로 실패했으므로 최종 빌드는 GitHub Actions 기준으로 확인한다.
