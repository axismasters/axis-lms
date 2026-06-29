# AXIS LMS v1.2 — INTEGRATION.md
## Content Visibility Bridge v1

현재 최종 섹션: `Content Visibility Bridge v1`
기반 baseline: `Teacher Content Engine v1` GitHub Actions 통과 상태

---

## 1. 이번 작업 범위 요약

**작업명**: 강사 포털 Foundation v1
**기반**: 빌드 캐시 파일 정리 및 역할별 라우팅 QA v1 buildfix 완료 상태
**목표**: /teacher 강사 전용 포털의 1차 Foundation 구조 확립

### 절대 하지 않은 것
- 관리자 Back Office 기능 수정/삭제 없음
- 새로운 타입/데이터 모델 추가 없음 (기존 타입 그대로 사용)
- 재무/직원/권한/시스템 설정 메뉴 강사 화면 노출 없음
- 대시보드 독립 엔진 없음, 상담관리 독립 엔진 없음
- Student 타입에 grade 필드 추가 없음
- 고정 세로 사이드바 구조 없음

---

## 2. 신규 파일 목록

| 파일 | 역할 |
|------|------|
| `src/pages/teacher/TeacherClasses.tsx` | 담당 반 목록 화면 |
| `src/pages/teacher/TeacherStudents.tsx` | 담당 학생 목록 화면 |
| `src/pages/teacher/TeacherExams.tsx` | 내 시험 / 미채점 시험 화면 |
| `src/pages/teacher/TeacherGrades.tsx` | 담당 학생 성적 확인 화면 |
| `src/pages/teacher/TeacherVideos.tsx` | 내 수업영상 (Foundation 구조) |
| `src/pages/teacher/TeacherNotes.tsx` | 내 수업노트 (Foundation 구조) |

---

## 3. 수정 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/layouts/TeacherLayout.tsx` | Bottom Nav 5탭으로 확장 (홈/담당반/학생/채점/자료), Link에 `flex: 1` 적용 |
| `src/pages/teacher/TeacherHome.tsx` | 담당 반 섹션 추가, 최근 성적 섹션 추가, 수업 콘텐츠 2버튼(영상/노트) 개선 |
| `src/routes/TeacherRoutes.tsx` | 6개 신규 라우트 추가, 구 경로 리다이렉트 추가 |

---

## 4. 강사 포털 경로 (Foundation v1)

| 경로 | 화면 | 컴포넌트 |
|------|------|----------|
| `/teacher` | 강사 홈 | TeacherHome |
| `/teacher/classes` | 담당 반 | TeacherClasses |
| `/teacher/students` | 담당 학생 | TeacherStudents |
| `/teacher/exams` | 내 시험/채점 | TeacherExams |
| `/teacher/grades` | 성적 확인 | TeacherGrades |
| `/teacher/videos` | 수업영상 | TeacherVideos |
| `/teacher/notes` | 수업노트 | TeacherNotes |

구 경로 리다이렉트:
- `/teacher/attendance` → `/teacher` (홈)
- `/teacher/scores` → `/teacher/grades`

---

## 5. 역할별 접근 정책

| 역할 | /teacher 접근 | /admin 접근 |
|------|--------------|------------|
| TEACHER | ✅ 허용 | ❌ 차단 → /teacher 리다이렉트 |
| STAFF / DIRECTOR / SUPER_ADMIN | ❌ 차단 → /admin 리다이렉트 | ✅ 허용 |
| STUDENT | ❌ 차단 → /student 리다이렉트 | ❌ 차단 |
| GUARDIAN | ❌ 차단 → /parent 리다이렉트 | ❌ 차단 |

---

## 6. TeacherLayout Bottom Navigation

5탭 구성:
```
홈(/teacher)  담당반(/teacher/classes)  학생(/teacher/students)  채점(/teacher/exams)  자료(/teacher/videos)
```

- 고정 세로 사이드바 없음 (AXIS 헌법 준수)
- Bottom Navigation 모바일 친화 구조
- `Link` 컴포넌트에 `style={{ flex: 1, display: 'flex' }}` 적용 → 5등분 균등 배치

---

## 7. 강사 화면 "담당" 기준 원칙

- 모든 데이터는 `currentUser.assignedClassIds` / `currentUser.assignedStudentIds` 기준 필터링
- "전체 학생" "전체 반" 표현 없음 → "담당 반" "담당 학생" "내 시험" "채점할 시험"
- 재무/직원/권한/시스템 정보 일체 노출 없음

---

## 8. 강사 화면에서 제외한 관리자 기능

- 전체 학생 조회 (ADMIN 전용)
- 다른 강사의 학생/반 조회
- 학생 신규 등록 (/admin/students/new)
- 재무관리 (결제/환불/미납/정산/통계)
- 직원관리
- 권한설정
- 시스템설정
- 알림 템플릿/발송 설정
- 성장관리 (엠블럼/라이벌)
- 관리자 운영메모 전체 조회

---

## 9. 관리자 기능 보존 확인

아래 경로 모두 AdminRoutes.tsx 내 보존 확인:
`/admin/students` `/admin/students/new` `/admin/classes` `/admin/classes/new`
`/admin/attendance/check` `/admin/attendance` `/admin/scores`
`/admin/finance/payments` `/admin/finance/refunds` `/admin/finance/unpaid`
`/admin/finance/settlements` `/admin/finance/statistics`
`/admin/notifications/history` `/admin/notifications/templates` `/admin/notifications/settings`
`/admin/growth/overview` `/admin/growth/emblems` `/admin/growth/rivals`
`/admin/employees` `/admin/settings/academy` `/admin/settings/permissions` `/admin/settings/password-reset`

---

## 10. 다음 작업 권장 방향

- 강사 포털 콘텐츠 엔진 v1: TeacherVideos / TeacherNotes 실제 업로드/작성 기능
- 학생 포털 Foundation v1: /student/** 화면 확장
- 보호자 포털 Foundation v1: /parent/** 화면 확장

---

## 11. Provider Tree (변경 없음)

```
StudentProvider
 └─ ClassProvider
     └─ NotificationProvider
         └─ EmployeeProvider
             └─ EnrollmentProvider
                 └─ AttendanceProvider
                     └─ AssessmentProvider
                         └─ FinanceProvider
                             └─ GrowthProvider
                                 └─ AuthBoundary
                                     └─ Router
```

---

## 12. AXIS LMS 헌법 준수 체크리스트

- [x] 메뉴는 적게, 기능은 깊게
- [x] 로그인은 휴대폰번호 기반 (AuthContext 변경 없음)
- [x] 계정 생성 메뉴 없음
- [x] 직급과 권한 분리 유지
- [x] 학년 ≠ 과정 ≠ 반 (Student.grade 추가 없음)
- [x] 가족은 UI가 아니라 Family Engine
- [x] 보호자 화면 라이벌/엠블럼 노출 금지 (변경 없음)
- [x] 학생 화면 중심 "나의 진열장" (변경 없음)
- [x] 관리자 화면 학원 운영 Back Office (삭제/축소 없음)
- [x] 강사 화면 담당 수업/담당 학생/채점/콘텐츠 중심
- [x] 강사/학생/보호자 고정 세로 사이드바 의존 금지
- [x] 대시보드 독립 엔진 추가 금지
- [x] 상담관리 독립 엔진 추가 금지

---

## Teacher Foundation v1 Scope Guard Fix

**작업명**: Teacher Foundation v1 Scope Guard Fix
**기반**: 강사 포털 Foundation v1

### 수정 파일
| 파일 | 핵심 변경 |
|------|-----------|
| `src/layouts/TeacherLayout.tsx` | 자료 탭 active 조건: `/teacher/videos` OR `/teacher/notes` |
| `src/pages/teacher/TeacherHome.tsx` | 미채점 시험 수·최근 성적·평균 → 담당 학생 submissions 기준으로 변경 |
| `src/pages/teacher/TeacherExams.tsx` | 모든 counts → 담당 학생 기준. `exam.status` 노출 금지 → 강사 친화적 표현(미채점/성적 확인 가능/진행 전/준비 중) |
| `src/pages/teacher/TeacherGrades.tsx` | 평균·최고점·최저점·바 차트 → 담당 학생 submissions 기준으로 수정. 담당 학생 데이터 없는 시험은 목록에서 제외 |

### 담당 학생 기준 필터링 적용 위치
모든 시험/성적/통계 계산에 공통 패턴 적용:
```tsx
const myStudentIds = new Set(currentUser.assignedStudentIds ?? []);
const mySubmissions = submissions.filter(s => myStudentIds.has(s.studentId));
```

1. **TeacherHome**: `ungradedExams` - `mySubmissions.some(s.status === '채점중')` 기준. 최근 성적 평균 - `mySubmissions` 기준.
2. **TeacherExams**: `ungradedExams` - 담당 학생 채점중 기준. `allMyExams` - 학원 전체 시험은 담당 학생 데이터 있을 때만. 배지 표시 - `getExamBadge()` 함수가 `mySubmissions` 기준으로 판정.
3. **TeacherGrades**: `gradedExams` - `mySubmissions.some(s.status === '채점완료')` 기준. stats(avg/max/min) - `mySubmissions` 필터 후 계산.

### classId 없는 학원 전체 시험 처리 원칙
- **TeacherExams 전체 탭**: `classId` 있는 담당 반 시험은 항상 표시. `classId` 없는 학원 전체 시험은 `mySubmissions`가 있을 때만 표시.
- **TeacherGrades**: `mySubmissions` 중 `채점완료` 있는 경우만 표시. 전체 학원 응시자 수·평균은 절대 표시하지 않음.

### TeacherExams 상태 표현 단순화
강사 화면에서 내부 상태값(`준비중/응시중/채점중/공개완료`) 제거:
| 조건 | 강사 화면 표현 |
|------|--------------|
| 담당 학생 submissions 없음 | 진행 전 |
| 담당 학생 중 채점중 있음 | 미채점 |
| 담당 학생 전원 채점완료 | 성적 확인 가능 |
| 기타 | 준비 중 |

### 관리자 Back Office 영향
없음. 수정된 파일은 `src/pages/teacher/`, `src/layouts/TeacherLayout.tsx` 에 한정.
관리자, 학생, 학부모 포털 코드 일체 변경 없음.

### npm run build 결과
환경 egress 차단으로 `npm install` 불가. 글로벌 tsc 검증: 신규 수정 파일 4개 타입 오류 0건.
로컬에서 `npm install && npm run build` 통과 예상.

---

## Teacher Portal Workflow Foundation v1

**작업명**: Teacher Portal Workflow Foundation v1
**기반**: Teacher Foundation v1 Scope Guard Fix

### 신규 파일
| 파일 | 역할 |
|------|------|
| `src/pages/teacher/TeacherAttendance.tsx` | 출결 체크 화면 (`/teacher/attendance`) |
| `src/pages/teacher/TeacherExamGrading.tsx` | 채점 상세 화면 (`/teacher/exams/:examId/grading`) |
| `src/pages/teacher/TeacherStudentDetail.tsx` | 담당 학생 상세 (`/teacher/students/:studentId`) |

### 수정 파일
| 파일 | 주요 변경 |
|------|-----------|
| `src/layouts/TeacherLayout.tsx` | 채점 탭 active 조건: `/teacher/exams` OR `/teacher/grades` 추가 |
| `src/routes/TeacherRoutes.tsx` | 신규 3개 라우트 추가, `/teacher/attendance` 리다이렉트 제거 |
| `src/pages/teacher/TeacherHome.tsx` | 빠른 실행 5카드(출결/채점/학생/노트/자료) 추가, 미채점 시험 카드에 채점 링크 |
| `src/pages/teacher/TeacherNotes.tsx` | 수업노트 작성 폼(반/날짜/주제/내용/과제) + local state 목록 추가 |
| `src/pages/teacher/TeacherStudents.tsx` | 각 학생 행 → `/teacher/students/:studentId` 링크 연결, ChevronRight 추가 |
| `src/pages/teacher/TeacherExams.tsx` | 미채점 항목에 "채점하기 →" 링크(`/teacher/exams/:examId/grading`) 추가 |

### 강사 포털 전체 라우트 (Workflow Foundation v1 기준)
```
/teacher               → 홈 (빠른 실행 5카드)
/teacher/classes       → 담당 반 목록
/teacher/attendance    → 출결 체크 (담당 반/담당 학생 기준)
/teacher/students      → 담당 학생 목록 (각 항목 → 상세 링크)
/teacher/students/:id  → 담당 학생 상세 (읽기 전용, 범위 가드)
/teacher/exams         → 내 시험/미채점 (채점하기 링크)
/teacher/exams/:id/grading → 채점 상세 (담당 학생 기준)
/teacher/grades        → 성적 확인
/teacher/videos        → 수업영상
/teacher/notes         → 수업노트 (작성 폼 + 목록)
```

### TeacherLayout Bottom Nav active 조건 (최종)
| 탭 | active 경로 |
|----|------------|
| 홈 | `/teacher` (exact) |
| 담당반 | `/teacher/classes/*` |
| 학생 | `/teacher/students/*` |
| 채점 | `/teacher/exams/*` OR `/teacher/grades/*` |
| 자료 | `/teacher/videos/*` OR `/teacher/notes/*` |

### 담당 범위 제한 유지
- TeacherAttendance: 담당 반 + 담당 학생만 출결 체크 가능
- TeacherExamGrading: `myStudentIds.has(s.studentId)` 필터로 담당 학생 submissions만
- TeacherStudentDetail: `myStudentIds.has(studentId)` 검사 후 미허가 시 접근 불가 화면
- TeacherHome/Exams/Grades: 기존 scope guard 유지

### 관리자 Back Office 영향
없음. 신규/수정 파일 모두 `src/pages/teacher/` 및 `src/layouts/TeacherLayout.tsx`, `src/routes/TeacherRoutes.tsx`에 한정.

### npm run build 결과
환경 egress 차단으로 `npm install` 불가. 글로벌 tsc 검증: 신규/수정 teacher 파일 전체 타입 오류 0건 (ClassList.tsx pre-existing 오류 2건 제외). 로컬 `npm install && npm run build` 통과 예상.

---

## Teacher Workflow Foundation v1 QA Fix

**작업명**: Teacher Workflow Foundation v1 QA Fix
**기반**: Teacher Portal Workflow Foundation v1

### 수정 파일
| 파일 | 내용 |
|------|------|
| `src/utils/dateUtils.ts` | **(신규)** `getLocalDateStr()` 헬퍼 — 한국 로컬 기준 YYYY-MM-DD 반환 |
| `src/pages/teacher/TeacherAttendance.tsx` | 결석 사유 필수 검증 + 저장 차단 + 오류 안내 문구 / `getLocalDateStr()` 적용 |
| `src/pages/teacher/TeacherNotes.tsx` | `getLocalDateStr()` 적용 (toISOString 제거) |
| `src/pages/teacher/TeacherExamGrading.tsx` | Scope 강화 (classId 있는 시험↔없는 시험 분리 검증) / local 저장 후 "채점 대기" → "채점 완료" 즉시 이동 UX |

### 항목별 수정 내용

**1. 결석 사유 필수 검증 (TeacherAttendance)**
- `REASON_MANDATORY = ['결석']` 상수 정의
- `handleSave()` 내 결석 사유 미입력자 필터 → 저장 차단
- `saveError` 상태로 오류 안내 문구 표시 (이름 열거)
- 사유 입력란 테두리 강조 (빨간색)
- 지각/조퇴/공결은 사유 입력란 노출, 필수 아님

**2. 날짜 처리 표준화**
- `new Date().toISOString().slice(0, 10)` → `getLocalDateStr()` 로 대체
- `src/utils/dateUtils.ts` 에 `formatLocalDate` (attendanceData.ts)와 동일한 구현
- TeacherAttendance, TeacherNotes 모두 적용

**3. TeacherExamGrading scope 강화**
- 시험 찾기 로직을 두 단계로 분리:
  - rawExam: ID만 매칭 (unfiltered)
  - exam: scope 확인 후 `undefined` 반환 가능
- classId 있는 시험: `assignedClassIds.includes(rawExam.classId)` 만족 시만 허용
- classId 없는 학원 전체 시험: `mySubmissions.length > 0` 만족 시만 허용
- 접근 불가 시: `NotFoundScreen` 컴포넌트로 일관된 에러 화면 표시

**4. TeacherExamGrading mock UX 개선**
- `ungradedSubs`: `!grades[s.studentId]?.saved` 필터 추가 → 로컬 저장 즉시 제외
- `locallyGradedSubs`: 로컬 저장된 항목 별도 추적
- header counts: `pendingCount = ungradedSubs.length`, `completedCount = realGraded + locallyGraded`
- "채점 완료" 섹션에 로컬 저장 항목 "저장됨" 뱃지와 함께 즉시 표시

### mock/local state 범위 (명확히 기록)
다음 기능은 현재 local React state 수준이며 실제 DB/API 연동 시 교체 필요:
- `TeacherAttendance`: 출결 저장 (AssessmentContext/AttendanceContext 미연동)
- `TeacherExamGrading`: 채점 저장 (AssessmentContext mutations 미연동)
- `TeacherNotes`: 수업노트 저장 (별도 NoteContext/DB 미연동)
- 위 데이터는 페이지 새로고침 시 초기화됨

### npm run typecheck / npm run build
- typecheck: 신규/수정 파일 타입 오류 0건 (ClassList.tsx pre-existing 2건 제외)
- build: 로컬 `npm install && npm run build` 통과 예상 (환경 egress 차단으로 직접 실행 불가)

### 관리자 Back Office 영향
없음. 수정 범위: `src/utils/dateUtils.ts`, `src/pages/teacher/` 3개 파일.

### 다음 단계 제안
- **Teacher Workflow Persistence v1**: AssessmentContext에 강사용 채점 mutation 추가, 출결 저장 AttendanceContext 연동
- **Teacher Content Engine v1**: TeacherVideos/TeacherNotes 실제 업로드/저장 기능, ContentContext 구현

---

## Teacher Workflow Persistence v1

**작업명**: Teacher Workflow Persistence v1
**기반**: Teacher Workflow Foundation v1 QA Fix

### 목표
강사 화면의 mock/local state 저장을 기존 React Context 내 mutation으로 연결.
실제 DB/API 서버 없이, 현재 Context state 안에서 세션 간 데이터 유지.

### 수정 파일

| 파일 | 내용 |
|------|------|
| `src/lib/assessmentData.ts` | `ExamSubmission`에 `teacherNote?: string` 필드 추가 |
| `src/contexts/AttendanceContext.tsx` | `saveTeacherAttendance` mutation 추가 (interface + 구현 + Provider value) |
| `src/contexts/AssessmentContext.tsx` | `gradeSubmissionByTeacher` mutation 추가 (interface + 구현 + Provider value) |
| `src/pages/teacher/TeacherAttendance.tsx` | `saveTeacherAttendance` 호출로 교체, 날짜/반 변경 시 Context 세션 데이터 초기화 |
| `src/pages/teacher/TeacherExamGrading.tsx` | `gradeSubmissionByTeacher` 호출로 교체, local grades state 제거, Context 기반 UI 파생 |

### 신규 Mutation 상세

**AttendanceContext.saveTeacherAttendance**
- 파라미터: `classId, date, studentIds, recordMap, by`
- 1차 검증: 결석 사유 누락 → `{ ok: false }`
- 2차 검증: 세션 잠금 확인 → `{ ok: false }`
- 동작: 기존 세션이 있으면 레코드 업데이트, 없으면 신규 세션 생성 (전체 출석 기본값 + override 적용)
- 결석/조퇴 알림: 기존 `updateRecord` 패턴과 동일하게 `createNotificationFromEvent` 호출

**AssessmentContext.gradeSubmissionByTeacher**
- 파라미터: `examId, studentId, totalScore, gradedBy, note?`
- 검증: 시험 존재, 제출 기록 존재, 결석 학생 보호, 점수 0~totalScore clamping
- 동작: `totalScore` 직접 지정, `status = '채점완료'` 전환, `teacherNote` 저장
- 문항별 breakdown 없이 총점만 저장하는 강사 채점 경로

### Persistence 범위

**Context 내 유지 (이번 단계 달성):**
- TeacherAttendance 저장 → `AttendanceContext.sessions` 업데이트 → 날짜/반 재선택 시 기존 데이터 로드
- TeacherExamGrading 채점 → `AssessmentContext.submissions` 업데이트 → 즉시 채점완료 섹션 반영
- TeacherGrades 화면에도 자동 반영 (같은 Context 읽음)
- TeacherStudentDetail 출결 요약도 자동 반영

**아직 mock/context state 수준 (새로고침 시 초기화):**
- 모든 Context 데이터는 DUMMY_* 초기값에서 시작하며 브라우저 새로고침 시 초기화됨
- TeacherNotes 수업노트 (별도 Context 미구현)
- DB/API 연동은 다음 단계에서 진행

### 관리자 Back Office 영향
없음. AttendanceContext/AssessmentContext 기존 함수 일체 변경 없음 (인터페이스 확장만).

### npm run typecheck / npm run build
- typecheck: 신규/수정 파일 타입 오류 0건 (ClassList.tsx pre-existing 2건 제외)
- build: 환경 egress 차단으로 `npm install` 불가. 로컬 `npm install && npm run build` 통과 예상.

### 다음 단계 제안
- **Teacher Content Engine v1**: TeacherVideos/TeacherNotes 실제 ContentContext 구현
- **Persistence v1 DB 연결**: Context mutation을 REST API 호출로 교체, 새로고침 영속성 구현

---

## Teacher Workflow Persistence v1 buildfix

**작업명**: Teacher Workflow Persistence v1 buildfix
**기반**: Teacher Workflow Persistence v1

### 수정 사유
강사 총점 직접 채점(`gradeSubmissionByTeacher`)이 기존 `isSubmissionGraded`/`canPublishExam` 판정과 불일치.

| 문제 | 원인 | 증상 |
|------|------|------|
| 채점완료 미인식 | `isSubmissionGraded`가 `answers.every(a.score !== undefined)` 만 확인 | 강사가 총점 입력해도 `채점중`으로 남음 |
| totalScore 덮어쓰기 | `recalcTotalScore`가 `isSubmissionGraded=true` 진입 후 answers 합산(=0) 반환 | 채점 완료 후 다른 mutation 호출 시 총점 0으로 초기화 |
| 점수 범위 silent clamp | `Math.max(0, Math.min(...))` 사용 | 범위 초과 입력 시 오류 없이 최대값으로 저장 |

### 수정 파일

| 파일 | 내용 |
|------|------|
| `src/lib/assessmentData.ts` | `isSubmissionGraded` — 강사 직접 채점 경로 추가 조건 |
| `src/lib/assessmentData.ts` | `recalcTotalScore` — 강사 직접 채점 totalScore 보존 경로 추가 |
| `src/contexts/AssessmentContext.tsx` | `gradeSubmissionByTeacher` — silent clamp 제거, 명시적 범위 오류 반환 |

### 수정 상세

**`isSubmissionGraded` 변경점**
```
기존: status=결석 → true; answers all scored → true; else false
변경: status=결석 → true; status=채점완료 && totalScore !== undefined → true; answers all scored → true; else false
```
강사 직접 채점 경로를 명시적으로 인식. 기존 문항별 채점 흐름은 unchanged.

**`recalcTotalScore` 변경점**
- `allAnswersGraded = answers.length > 0 && answers.every(a.score !== undefined)` 를 먼저 체크
- `!allAnswersGraded && status='채점완료' && totalScore !== undefined` → 강사 직접 채점 경로 → `return sub` (totalScore 보존)
- 위 조건 불만족 시 기존 로직 동일 (결석처리, isSubmissionGraded, answers 합산)
- 모든 answers가 문항별로 채점 완료되면 regular path에서 answers 합산으로 자연히 교체됨 (올바른 동작)

**`gradeSubmissionByTeacher` 변경점**
```
기존: const clamped = Math.max(0, Math.min(totalScore, exam.totalScore)) → silent 저장
변경: if (totalScore < 0 || totalScore > exam.totalScore) return { ok:false, reason }
```
UI 1차 검증(TeacherExamGrading) + Context 2차 검증 일치.

### 수정하지 않은 파일
- `TeacherExamGrading.tsx`: 기존 UI 범위 검증 + Context 오류 표시 유지, 변경 없음
- `AttendanceContext.tsx`: 이번 buildfix 범위 아님

### 다음 개선점 기록
- **동일 출결 저장 시 결석/조퇴 알림 중복 발송 방지**: `saveTeacherAttendance` 호출 시 기존 세션에 이미 결석/조퇴로 저장된 학생은 알림을 재발송하지 않아야 함. 현재는 매 저장마다 조건 충족 시 알림이 발송됨.
- **세션 이미 잠긴 경우 UI 안내**: `isLocked=true` 세션의 날짜/반 선택 시 편집 불가 안내 필요.
- **DB/API 연동**: 현재 모든 Context 데이터는 새로고침 시 초기화. 실제 영속성은 다음 단계.

### npm run typecheck / npm run build
- typecheck: 수정 파일 타입 오류 0건 (ClassList.tsx pre-existing 2건 제외)
- build: 환경 egress 차단으로 `npm install` 불가. 로컬 `npm install && npm run build` 통과 예상.

---

## Student Portal Foundation v1 + buildfix/integration 정리

**작업명**: Student Portal Foundation v1 + buildfix/integration  
**기반**: Teacher Workflow Persistence v1 buildfix

### 수정 파일 (Student Portal)

| 파일 | 종류 | 내용 |
|------|------|------|
| `src/layouts/StudentLayout.tsx` | 수정 | Bottom Nav: 홈/내 반/성적/출결 4탭. `성장` 탭 제거, `flex:1` 균등 배치 |
| `src/pages/student/StudentHome.tsx` | 수정 | 빠른 이동 3카드 추가, 최근 성적 → `getPublishedResultsForStudent` 정책 적용 |
| `src/pages/student/StudentClasses.tsx` | **신규** | 내 반/수업 조회 (`/student/classes`) |
| `src/pages/student/StudentGrades.tsx` | **신규** | 성적 조회 (`/student/grades`) — 공개/반영 결과만 |
| `src/pages/student/StudentAttendance.tsx` | **신규** | 출결 조회 (`/student/attendance`) |
| `src/routes/StudentRoutes.tsx` | 수정 | 신규 3개 라우트 등록, `/student/scores → /student/grades` 리다이렉트 |

### buildfix/integration 정리

| 파일 | 변경 | 이유 |
|------|------|------|
| `src/pages/teacher/TeacherExamGrading.tsx` | `scopedExam`으로 scope 결과를 받은 뒤 guard 후 `visibleExam` 확정 | GitHub Actions 통과 baseline의 타입픽스. `handleGrade` 같은 내부 함수에서도 `visibleExam`이 undefined가 아님을 TypeScript가 인식하도록 유지 |

### 학생 포털 설계 원칙 확인

| 원칙 | 구현 방식 |
|------|-----------|
| 조회 전용 | 수정/등록/삭제 UI 없음 |
| 본인 데이터만 | `currentUser.assignedStudentIds[0]` 기준 필터 |
| 성적 공개 정책 | `getPublishedResultsForStudent()` 단일 호출 |
| 반 단위 시험 | `totalScore !== undefined` 시 노출 (채점완료) |
| 학원 전체 시험 | `publishedAt` 있을 때만 노출 |
| 결석/미채점 | 자동 제외 (visibility 함수 내부 처리) |
| 문제은행/NGD2 | 미포함 |
| 관리자/강사/학부모 | 변경 없음 |

### 학생 포털 라우트 최종 구조

```
/student            → StudentHome (홈 + 진열장 + 최근 성적)
/student/classes    → StudentClasses (내 반/수업 조회)
/student/grades     → StudentGrades (성적 조회)
/student/attendance → StudentAttendance (출결 조회)
/student/growth     → placeholder (성장 진열장, 다음 단계)
/student/scores     → redirect → /student/grades (하위호환)
```

### npm run typecheck / npm run build
- typecheck: 신규/수정 파일 타입 오류 0건 (ClassList.tsx pre-existing 2건 제외)
- TeacherExamGrading.tsx scopedExam → visibleExam 확정 패턴 적용 후 타입 오류 없음 확인
- build: 환경 egress 차단으로 `npm install` 불가. 로컬 `npm install && npm run build` 통과 예상.

### 관리자 Back Office 영향
없음. 수정 파일: `src/pages/student/`, `src/layouts/StudentLayout.tsx`, `src/routes/StudentRoutes.tsx`, `src/pages/teacher/TeacherExamGrading.tsx` (scope guard 타입픽스).

---

## Parent Portal Foundation v1

**작업명**: Parent Portal Foundation v1
**기반**: Student Portal Foundation v1 + buildfix/integration

### 수정 파일

| 파일 | 종류 | 내용 |
|------|------|------|
| `src/layouts/ParentLayout.tsx` | 수정 | Bottom Nav: 홈/출결/성적/수납 4탭 (알림→성적 교체). Link `flex:1` 균등 배치 |
| `src/pages/parent/ParentHome.tsx` | 수정 | 출결 필터 개선 (자녀 소속 반만), 성적 `getPublishedResultsForStudent` 적용, 수강반 섹션 추가, 수납 링크 |
| `src/pages/parent/ParentAttendance.tsx` | **신규** | 자녀 출결 상세 조회 (`/parent/attendance`) |
| `src/pages/parent/ParentGrades.tsx` | **신규** | 자녀 성적 상세 조회 (`/parent/grades`) |
| `src/routes/ParentRoutes.tsx` | 수정 | ParentAttendance / ParentGrades 라우트 등록, `/parent/finance` placeholder 유지 |

### 학부모 포털 설계 원칙 확인

| 원칙 | 구현 |
|------|------|
| 조회 전용 | 수정/등록/삭제 UI 없음 |
| 자녀 데이터만 | `currentUser.assignedStudentIds` 포함 여부 필터 |
| 자녀 선택/전환 | 복수 자녀 시 select UI, 단일 자녀 시 표시만 |
| 출결 스코프 | 자녀 소속 반 세션만 (`child.classes`로 classId 집합 생성 후 필터) |
| 성적 공개 정책 | `getPublishedResultsForStudent()` — 반단위 채점완료 + 전체시험 publishedAt |
| 결석/미채점 | 자동 제외 (visibility 함수 내부) |
| 라이벌/엠블럼 | 노출 없음 |
| 상담관리 | 독립 메뉴 없음 |
| 재무 상세 | placeholder (이번 단계 미구현) |
| 문제은행/NGD2 | 미포함 |

### 학부모 포털 라우트 최종 구조

```
/parent            → ParentHome (자녀 선택 + 요약)
/parent/attendance → ParentAttendance (출결 상세)
/parent/grades     → ParentGrades (성적 상세)
/parent/finance    → placeholder (수납 — 다음 단계)
```

### 기존 baseline 회귀 여부

| 파일 | 상태 |
|------|------|
| TeacherExamGrading.tsx `scopedExam → visibleExam` 타입픽스 | ✅ 유지 |
| Student Portal 파일 | ✅ 변경 없음 |
| Admin Back Office | ✅ 변경 없음 |
| Teacher Portal | ✅ 변경 없음 |
| assessmentData isSubmissionGraded buildfix | ✅ 유지 |

### npm run typecheck / npm run build
- typecheck: 신규/수정 파일 타입 오류 0건 (ClassList.tsx pre-existing 2건 제외)
- build: 환경 egress 차단으로 `npm install` 불가. 로컬 `npm install && npm run build` 통과 예상.

---

## Parent Portal Foundation v1 — scopedExam Typefix (GitHub Actions 통과 baseline)

**작업명**: Parent Portal Foundation v1 scopedExam typefix  
**사유**: `const visibleExam = (() => {...})()` 패턴에서 TypeScript가 `handleGrade` 클로저 내 `visibleExam`을 `Exam | undefined`로 추론 → GitHub Actions 실패

### 수정 파일

| 파일 | 변경 |
|------|------|
| `src/pages/teacher/TeacherExamGrading.tsx` | `const visibleExam = (() => ...)()` → `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 2단계 패턴 |

### 확정 코드 구조 (이후 절대 되돌리지 않음)

```tsx
const scopedExam = (() => {
  if (!rawExam) return undefined;
  if (rawExam.classId) {
    return assignedClassIds.includes(rawExam.classId) ? rawExam : undefined;
  }
  return mySubmissions.length > 0 ? rawExam : undefined;
})();
if (!scopedExam) return <NotFoundScreen />;
const visibleExam = scopedExam;   // visibleExam: Exam — 클로저에서도 undefined 없음
```

**왜 이 방식인가:**
- IIFE 결과 `scopedExam: Exam | undefined`를 조기 반환으로 narrowing
- `visibleExam = scopedExam` 시점에서 TypeScript가 `visibleExam: Exam`을 확정 추론
- `handleGrade` 등 내부 클로저에서도 `visibleExam.totalScore` 등 접근 시 possibly undefined 오류 없음
- `const visibleExam = (() => ...)()` 방식은 클로저에서 narrowing이 전파되지 않아 실패

### 최종 회귀 검증

| 파일 | 상태 |
|------|------|
| TeacherExamGrading scopedExam 패턴 | ✅ 적용 완료 |
| Student Portal 4개 파일 | ✅ 변경 없음 |
| Parent Portal 5개 파일 | ✅ 유지 |
| Admin Back Office | ✅ 변경 없음 |
| isSubmissionGraded / recalcTotalScore buildfix | ✅ 유지 |

### npm run typecheck
- 수정 후 타입 오류 0건 (ClassList.tsx pre-existing 2건 제외)

---

## Admin Back Office QA Cleanup v1

**작업명**: Admin Back Office QA Cleanup v1

### 점검 결과 요약

| 항목 | 결과 |
|------|------|
| 대시보드 독립 메뉴 | ✅ 없음 (AdminLayout NAV_ITEMS에 미포함) |
| 상담관리 독립 메뉴 | ✅ 없음 (StudentDetail 내부 운영메모 구조로만 유지) |
| 조교 직급 | ✅ 없음 (Position 타입 및 POSITION_LABEL에 미포함) |
| 재무 접근 정책 | ✅ SUPER_ADMIN/DIRECTOR/STAFF만 `finance.view` 보유. 부원장/실장/팀장/강사 미포함 — 원장·행정 기준 충돌 없음 |
| 내신성적 조회 | ✅ StudentList.tsx 빠른 조회에 유지 (`?tab=grades&gradeType=naesin`) |
| 모의고사 성적 조회 | ✅ StudentList.tsx 빠른 조회에 유지 (`?tab=grades&gradeType=mock`) |
| 죽은 라우트/링크 | ✅ 없음 — AdminRoutes 전 경로 정상 연결 |
| AdminLayout 미사용 import | ✅ 없음 |

### 수정한 파일

| 파일 | 수정 내용 |
|------|-----------|
| `src/pages/ClassList.tsx` | `subjectList`/`levelList` 에 `string[]` 명시적 타입 추가 → **pre-existing 타입 오류 2건 완전 해소** |
| `src/routes/AdminRoutes.tsx` | 미사용 `import NotFound from '@/pages/NotFound'` 제거 (`NotFound`는 `App.tsx`에서만 사용) |

### 수정 상세

**ClassList.tsx**  
`SubjectType`는 string literal union인데, `Array.from(new Set(...))` 추론 결과가 `SelectItem`의 `value: string` 요구와 충돌해 `unknown` 오류 발생.
```ts
// 수정 전 (오류)
const subjectList = Array.from(new Set(visibleClasses.map(c => c.subject)));
const levelList   = Array.from(new Set(visibleClasses.map(c => c.level)));

// 수정 후 (clean)
const subjectList: string[] = Array.from(new Set(visibleClasses.map((c) => c.subject as string)));
const levelList: string[]   = Array.from(new Set(visibleClasses.map((c) => c.level)));
```

**AdminRoutes.tsx**  
`NotFound`는 `App.tsx` root에서만 사용. `AdminRoutes.tsx`에서는 미사용 → import 제거.

### 점검했으나 변경 없는 항목

- `AdminLayout.tsx` NAV_ITEMS — 대시보드/상담관리 독립 메뉴 없음 확인. 변경 불필요.
- `rbac.ts` POSITIONS — 조교 없음 확인. 변경 불필요.
- `financeData.ts` `canManageFinance` — SUPER_ADMIN/DIRECTOR/STAFF 기준 충돌 없음.
- `StudentDetail.tsx` 주석 — "상담기록 독립 탭은 두지 않는다" 확인. 변경 불필요.
- `PermissionSettings.tsx` 주석 — "조교 직급 없음" 확인. 변경 불필요.

### typecheck 결과
- 수정 전: `ClassList.tsx(219,57)`, `(233,55)` 타입 오류 2건 (pre-existing)
- 수정 후: **위 2건 완전 제거**. 잔여 오류는 전부 `Cannot find module` (node_modules 미설치)

### scopedExam baseline 유지
- `TeacherExamGrading.tsx` — `scopedExam → visibleExam` 패턴 ✅ 유지
- Student/Parent Portal 파일 — ✅ 변경 없음

---

## Teacher Content Engine v1

**작업명**: Teacher Content Engine v1

### 신규/수정 파일

| 파일 | 종류 | 내용 |
|------|------|------|
| `src/lib/contentData.ts` | **신규** | ContentItem 타입, ContentType, ContentVisibility, AddContentInput, INITIAL_CONTENT |
| `src/contexts/ContentContext.tsx` | **신규** | ContentProvider, useContent hook — CRUD + getByTeacher + getVisibleForClass |
| `src/App.tsx` | 수정 | ContentProvider import 추가, GrowthProvider 내부 / AuthBoundary 외부에 ContentProvider 삽입 |
| `src/pages/teacher/TeacherNotes.tsx` | 수정 | local useState 제거 → useContent().addContent/deleteContent/getByTeacher 전환 |
| `src/pages/teacher/TeacherVideos.tsx` | 수정 | placeholder 제거 → ContentContext 기반 video/material 등록·목록 화면 |

### ContentContext 구조

```typescript
interface ContentContextType {
  items: ContentItem[];
  addContent(input: AddContentInput): ContentItem;
  updateContent(id: string, patch: UpdateContentInput): void;
  deleteContent(id: string): void;
  // 강사 본인 콘텐츠 조회 (teacherId + classIds + type 필터)
  getByTeacher(teacherId, classIds?, type?): ContentItem[];
  // 학생·학부모 포털용 공개 콘텐츠 조회 (v1 미사용, visibility 구조 준비)
  getVisibleForClass(classId, minVisibility): ContentItem[];
}
```

### ContentItem 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 자동 생성 |
| `type` | `'note' \| 'video' \| 'material'` | 콘텐츠 종류 |
| `classId` | `string` | 담당 반 ID |
| `teacherId` | `string` | 강사 ID |
| `title` | `string` | 제목/주제 |
| `content` | `string?` | 노트 본문 |
| `homework` | `string?` | 과제/다음수업 안내 (노트용) |
| `url` | `string?` | 외부 링크 (영상/자료용) |
| `date` | `string` | 수업 날짜 (YYYY-MM-DD) |
| `visibility` | `ContentVisibility` | 공개 범위 |
| `createdAt` | `string` | ISO datetime |
| `updatedAt` | `string` | ISO datetime |

### 스코프 가드 원칙
- `addContent` 호출 전 `assignedClassIds.includes(form.classId)` 확인 (페이지 레벨)
- `getByTeacher(currentUser.id, assignedClassIds, type)` — 자기 반 + 자기 콘텐츠만 노출

### Provider 트리 위치
```
GrowthProvider
  └── ContentProvider    ← 추가
        └── AuthBoundary
```

### 학생·학부모 포털 미노출 (v1)
- visibility 기본값: `teacherOnly`
- `getVisibleForClass` 함수는 구현 완료 — 다음 단계 포털 연동 시 사용
- 학생/학부모 포털 파일 변경 없음

### typecheck 결과
- 실제 타입 오류 0건 (Cannot find module = node_modules 미설치만 잔존)
- TeacherExamGrading.tsx scopedExam 패턴 유지 확인

### 다음 개선점
- ContentContext state → DB/Supabase 영속화
- 학생 포털: `getVisibleForClass(classId, 'studentVisible')` 연동
- 학부모 포털: `getVisibleForClass(classId, 'parentVisible')` 연동

---

## Content Visibility Bridge v1

**작업명**: Content Visibility Bridge v1  
**기반**: Teacher Content Engine v1

### 수정 파일 (4개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/teacher/TeacherNotes.tsx` | 폼에 공개 범위 select 추가 (teacherOnly/studentVisible/parentVisible), `visibility: form.visibility`로 저장 |
| `src/pages/teacher/TeacherVideos.tsx` | 동일 — 공개 범위 select 추가 |
| `src/pages/student/StudentClasses.tsx` | 수강중 반별 `getVisibleForClass(classId, 'studentVisible')` 콘텐츠 섹션 추가 |
| `src/pages/parent/ParentHome.tsx` | 선택 자녀 수강반의 `getVisibleForClass(classId, 'parentVisible')` 콘텐츠 섹션 추가 |

### 공개 범위 정책

| 역할 | 호출 | 조회 범위 |
|------|------|-----------|
| 강사 | `getByTeacher(teacherId, assignedClassIds)` | 본인 전체 (teacherOnly 포함) |
| 학생 | `getVisibleForClass(classId, 'studentVisible')` | `studentVisible` + `parentVisible` |
| 학부모 | `getVisibleForClass(classId, 'parentVisible')` | `parentVisible` 만 |

**설계 이유:**  
학생은 수업 자료 전체(studentVisible 이상)를 볼 수 있고, 학부모는 명시적으로 부모 공개 처리된 자료만 본다. studentVisible 자료(예: 연습 문제, 수업 노트)가 학부모 포털에 자동 노출되지 않도록 분리.

```
teacherOnly  (rank 0) → 강사만
studentVisible (rank 1) → 강사 + 학생
parentVisible  (rank 2) → 강사 + 학생 + 학부모
```

### 학생 포털 — StudentClasses.tsx
- 수강중인 반마다 카드 하단에 "수업자료 (N건)" 섹션 표시
- `getVisibleForClass(ci.id, 'studentVisible')` 호출
- 최대 5건 표시, 초과 시 "외 N건" 표시
- note: 제목 + 내용(2줄) / video/material: 제목 + 날짜 + 링크 열기
- 조회 전용

### 학부모 포털 — ParentHome.tsx
- 선택 자녀의 수강 반 전체에서 parentVisible 콘텐츠 수집 후 날짜 역순 최대 5건
- 자녀 선택 변경 시 자동 갱신 (selectedChildId state 기반)
- 성적 요약과 수납 상태 사이에 "공개 수업자료" 섹션 삽입
- 콘텐츠가 없으면 섹션 자체 미표시
- 수납 placeholder 변경 없음

### 강사 visibility UI (최소)
- 기본값 `teacherOnly` 유지
- `<select>` 1개로 teacherOnly / studentVisible / parentVisible 선택
- TeacherNotes / TeacherVideos 폼 하단, 버튼 바로 위에 위치

### 변경하지 않은 파일
- TeacherExamGrading.tsx — scopedExam 패턴 유지
- Admin Back Office 파일 — 변경 없음
- ParentAttendance.tsx, ParentGrades.tsx — 변경 없음
- StudentGrades.tsx, StudentAttendance.tsx, StudentHome.tsx — 변경 없음
- ContentContext.tsx — 변경 없음 (getVisibleForClass 기존 구현 사용)

### typecheck 결과
- 실제 타입 오류 0건 (node_modules 미설치 오류만 잔존)
- scopedExam baseline 유지 확인

---

## Content Persistence v1 buildfix

**작업명**: Content Persistence v1 buildfix  
**목표**: 강사 수업노트/수업영상/학습자료가 새로고침 후에도 유지되도록 기존 ContentContext에 localStorage persistence만 최소 추가

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/contentData.ts` | `CONTENT_STORAGE_KEY` 추가. 기존 `ContentItem`, `AddContentInput`, `UpdateContentInput`, `INITIAL_CONTENT = []` 구조 유지 |
| `src/lib/contentPersistence.ts` | 신규. `ContentItem[]` 전체를 `axis_lms_content_items_v1` localStorage key로 저장/복원 |
| `src/contexts/ContentContext.tsx` | 기존 API 유지. 초기값을 `loadContentItems()`로 로드하고 `addContent/updateContent/deleteContent` 후 `saveContentItems(updated)` 호출 |

### 유지 사항

- 기존 ContentContext API 유지:
  - `items`
  - `addContent(input): ContentItem`
  - `updateContent(id, patch): void`
  - `deleteContent(id): void`
  - `getByTeacher(teacherId, classIds?, type?): ContentItem[]`
  - `getVisibleForClass(classId, minVisibility): ContentItem[]`
- `getByTeacher` 최신순 정렬 유지
- `getVisibleForClass` 최신순 정렬 유지
- `teacherOnly`는 학생/학부모 포털에 노출되지 않음
- 학생 포털은 `getVisibleForClass(classId, 'studentVisible')` 호출 유지
- 학부모 포털은 `getVisibleForClass(classId, 'parentVisible')` 호출 유지
- TeacherNotes/TeacherVideos UI, `TeacherLayout`, `assignedClassIds` 스코프 가드, 삭제 기능 변경 없음
- Admin Back Office 변경 없음
- 문제은행/NGD2 연동 없음
- 파일 업로드 기능 없음
- 외부 영상 API 연동 없음

### scopedExam baseline 유지

- `src/pages/teacher/TeacherExamGrading.tsx` 변경 없음
- `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 타입픽스 유지

---

## Homework Status / Completion v1

**작업명**: Homework Status / Completion v1  
**목표**: 학생별 숙제 확인/완료 상태와 강사용 완료 현황을 추가

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/homeworkStatusData.ts` | 학생별 숙제 상태 타입 추가 (`assigned`, `seen`, `completed`) |
| `src/lib/homeworkStatusPersistence.ts` | 숙제 상태 localStorage 저장/복원 helper 추가 |
| `src/contexts/HomeworkStatusContext.tsx` | 학생별 상태 조회/갱신 및 강사용 숙제별 상태 조회 Context 추가 |
| `src/App.tsx` | `HomeworkStatusProvider` 연결 |
| `src/pages/student/StudentHomework.tsx` | 숙제 확인 자동 표시, 완료 버튼, 상태 배지 추가 |
| `src/pages/teacher/TeacherHomework.tsx` | 숙제별 완료/확인/대상 학생 수 현황 추가 |

### 학생 숙제 상태 흐름

- 학생 식별은 기존 `currentUser.assignedStudentIds[0]` 기준 유지
- 학생의 `classes` 중 `status === '수강중'`인 반 ID만 숙제 조회에 사용
- 화면 진입 시 해당 숙제가 `assigned` 또는 미기록이면 `seen`으로 기록
- 학생은 각 숙제를 `completed`로 표시 가능
- 상태 강등은 불가

### 강사 완료 현황 흐름

- 강사는 기존 `assignedClassIds` 스코프 기준으로 본인 숙제만 조회
- 저장 직전 `assignedClassIds.includes(form.classId)` 재확인 유지
- 대상 학생은 해당 반을 `수강중`으로 가진 학생 기준
- 공개 숙제 카드에 `완료 n명 / 확인 n명 / 대상 n명` 표시

### 유지 사항

- Homework Foundation v1의 등록/조회 흐름 유지
- 기존 TeacherLayout / StudentLayout 변경 없음
- 기존 RoleRoute 구조 변경 없음
- Parent Portal 변경 없음
- Admin Back Office 변경 없음
- ContentContext API 변경 없음
- Content Visibility / Persistence / Detail UX 변경 없음
- 문제은행/NGD2 연동 없음
- 검증 시험지 불러오기 없음
- 파일 업로드 기능 없음
- 자동채점 기능 없음
- 알림 발송 기능 없음

### scopedExam baseline 유지

- `src/pages/teacher/TeacherExamGrading.tsx` 변경 없음
- `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 타입픽스 유지

---

## Homework Foundation v1

**작업명**: Homework Foundation v1  
**목표**: AXIS LMS 내부에서 강사가 담당 반에 숙제를 등록하고, 학생이 수강 중인 반의 공개 숙제를 조회하는 최소 흐름 구성

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/homeworkData.ts` | 숙제 타입, 입력 타입, localStorage key 추가 |
| `src/lib/homeworkPersistence.ts` | `Homework[]` 저장/복원 helper 추가 |
| `src/contexts/HomeworkContext.tsx` | 숙제 CRUD, 강사 조회, 학생 조회 Context 추가 |
| `src/App.tsx` | `HomeworkProvider` 연결 |
| `src/routes/TeacherRoutes.tsx` | `/teacher/homework` 라우트 추가. 기존 RoleRoute 유지 |
| `src/routes/StudentRoutes.tsx` | `/student/homework` 라우트 추가. 기존 RoleRoute 유지 |
| `src/pages/teacher/TeacherHomework.tsx` | 강사 숙제 등록/공개 전환/삭제 화면 추가 |
| `src/pages/student/StudentHomework.tsx` | 학생 공개 숙제 조회 화면 추가 |
| `src/pages/teacher/TeacherHome.tsx` | 빠른 실행에 숙제 관리 진입 추가 |
| `src/pages/student/StudentHome.tsx` | 빠른 이동에 숙제 진입 추가 |

### 강사 숙제 등록 흐름

- 강사는 `currentUser.assignedClassIds`에 포함된 운영중 반만 선택 가능
- 저장 직전에도 `assignedClassIds.includes(form.classId)`로 스코프 재확인
- 숙제 필드: `id`, `classId`, `teacherId`, `title`, `description`, `dueDate`, `status`, `createdAt`, `updatedAt`
- 상태는 `published` / `draft`
- 강사는 본인이 등록한 숙제만 조회

### 학생 숙제 조회 흐름

- 학생 식별은 기존 `currentUser.assignedStudentIds[0]` 기준 유지
- 학생의 `classes` 중 `status === '수강중'`인 반 ID만 조회 기준으로 사용
- `published` 숙제만 학생에게 표시
- `draft` 또는 미수강 반 숙제는 노출되지 않음

### 유지 사항

- 기존 `TeacherLayout`, `StudentLayout` 변경 없음
- 기존 RoleRoute 구조 유지
- ContentContext API 변경 없음
- Content Visibility / Persistence / Detail UX 변경 없음
- Parent Portal 변경 없음
- Admin Back Office 변경 없음
- 문제은행/NGD2 연동 없음
- 검증 시험지 불러오기 없음
- 파일 업로드 기능 없음
- 자동채점 기능 없음
- 알림 발송 기능 없음

### scopedExam baseline 유지

- `src/pages/teacher/TeacherExamGrading.tsx` 변경 없음
- `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 타입픽스 유지

---

## Content Detail UX v1

**작업명**: Content Detail UX v1  
**목표**: 학생/학부모 포털의 공개 수업자료 목록에서 항목 클릭 시 간단 상세 모달 제공

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/student/StudentClasses.tsx` | 기존 학생 수강반 조회 흐름 유지. `getVisibleForClass(classId, 'studentVisible')` 결과 항목 클릭 시 상세 모달 표시 |
| `src/pages/parent/ParentHome.tsx` | 기존 자녀 선택/출결/성적/수납 흐름 유지. `getVisibleForClass(classId, 'parentVisible')` 결과 항목 클릭 시 상세 모달 표시 |

### 유지 사항

- ContentContext API 변경 없음
- 학생 포털은 `studentVisible` 이상 공개 자료만 사용
- 학부모 포털은 `parentVisible` 공개 자료만 사용
- `teacherOnly` 자료는 학생/학부모 포털에 노출되지 않음
- 학생 식별은 기존 `currentUser.assignedStudentIds[0]` 방식 유지
- 학부모 자녀 식별은 기존 `currentUser.assignedStudentIds` 방식 유지
- 학부모 출결/성적/수납 섹션 유지
- 강사 화면 변경 없음
- Admin Back Office 변경 없음
- 문제은행/NGD2 연동 없음
- 파일 업로드 기능 없음
- 외부 영상 API 연동 없음

### scopedExam baseline 유지

- `src/pages/teacher/TeacherExamGrading.tsx` 변경 없음
- `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 타입픽스 유지
