# AXIS LMS v1.2 — INTEGRATION.md
## 강사 포털 Foundation v1

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
| `src/pages/teacher/TeacherExamGrading.tsx` | `exam` → `visibleExam` 전체 rename | GitHub Actions 통과 baseline의 타입픽스 복원. `const visibleExam = (() => ...)(); if (!visibleExam) return <NotFoundScreen />` 패턴으로 undefined 조기 탈출 후 타입 안전성 명시 |

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
- TeacherExamGrading.tsx visibleExam rename 후 타입 오류 없음 확인
- build: 환경 egress 차단으로 `npm install` 불가. 로컬 `npm install && npm run build` 통과 예상.

### 관리자 Back Office 영향
없음. 수정 파일: `src/pages/student/`, `src/layouts/StudentLayout.tsx`, `src/routes/StudentRoutes.tsx`, `src/pages/teacher/TeacherExamGrading.tsx` (rename only).

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
| TeacherExamGrading.tsx `visibleExam` | ✅ 유지 (11곳 확인) |
| Student Portal 파일 | ✅ 변경 없음 |
| Admin Back Office | ✅ 변경 없음 |
| Teacher Portal | ✅ 변경 없음 |
| assessmentData isSubmissionGraded buildfix | ✅ 유지 |

### npm run typecheck / npm run build
- typecheck: 신규/수정 파일 타입 오류 0건 (ClassList.tsx pre-existing 2건 제외)
- build: 환경 egress 차단으로 `npm install` 불가. 로컬 `npm install && npm run build` 통과 예상.
