# AXIS LMS v1.2 MVP RC — 수동 QA 실행 결과

> 실행일: 2026-06-30  
> baseline: 58. RBAC Global Permission QA and Freeze v1 buildfix  
> QA 방법: 코드 정적 분석 (네트워크 차단으로 build/브라우저 실행 불가)  
> 범례: ✅ 정적 분석 PASS / ❌ FAIL / ⚠ 수정됨 / ℹ 환경 제약으로 확인 불가
>
> ChatGPT buildfix: 원본 산출물의 단순 hook 이동 대신, 권한 gate wrapper와 통계 계산 inner 컴포넌트로 분리했다.

---

## 1. Route Import 체인 QA

### 1-1. AdminRoutes (Back Office)

| 파일 | 결과 |
|---|---|
| StudentList | ✅ |
| StudentNew | ✅ |
| StudentDetail | ✅ |
| ClassList | ✅ |
| ClassDetail | ✅ |
| AttendanceCheck | ✅ |
| AttendanceStatus | ✅ |
| AssessmentList | ✅ |
| AssessmentDetail | ✅ |
| FinancePayments | ✅ |
| FinanceRefunds | ✅ |
| FinanceUnpaid | ✅ |
| FinanceSettlements | ✅ |
| FinanceStatistics | ✅ |
| NotificationHistory | ✅ |
| NotificationTemplates | ✅ |
| NotificationSettings | ✅ |
| settings/AcademyInfoManagement | ✅ |
| settings/PermissionSettings | ✅ |
| settings/PasswordResetManagement | ✅ |
| growth/GrowthOverview | ✅ |
| growth/EmblemManagement | ✅ |
| growth/RivalManagement | ✅ |
| EmployeeList | ✅ |
| EmployeeDetail | ✅ |
| NotFound | ✅ |

**결과: 26/26 PASS**

### 1-2. TeacherRoutes

| 파일 | 결과 |
|---|---|
| teacher/TeacherHome | ✅ |
| teacher/TeacherClasses | ✅ |
| teacher/TeacherStudents | ✅ |
| teacher/TeacherStudentDetail | ✅ |
| teacher/TeacherAttendance | ✅ |
| teacher/TeacherExams | ✅ |
| teacher/TeacherExamGrading | ✅ |
| teacher/TeacherGrades | ✅ |
| teacher/TeacherVideos | ✅ |
| teacher/TeacherNotes | ✅ |
| teacher/TeacherHomework | ✅ |

**결과: 11/11 PASS**

### 1-3. StudentRoutes / ParentRoutes

| 파일 | 결과 |
|---|---|
| student/StudentHome | ✅ |
| student/StudentClasses | ✅ |
| student/StudentGrades | ✅ |
| student/StudentAttendance | ✅ |
| student/StudentHomework | ✅ |
| student/StudentFinance | ✅ |
| student/StudentMockExams | ✅ |
| student/StudentWeeklyMocks | ✅ |
| parent/ParentHome | ✅ |
| parent/ParentAttendance | ✅ |
| parent/ParentGrades | ✅ |
| parent/ParentFinance | ✅ |
| parent/ParentMockExams | ✅ |
| parent/ParentWeeklyMocks | ✅ |

**결과: 14/14 PASS**

---

## 2. React Hooks Rule QA (Finance 페이지)

| 파일 | 마지막 hook 라인 | early return 라인 | 결과 |
|---|---|---|---|
| FinancePayments.tsx | 132 | 150 | ✅ PASS |
| FinanceRefunds.tsx | 82 | 95 | ✅ PASS |
| FinanceUnpaid.tsx | 58 | 67 | ✅ PASS |
| FinanceSettlements.tsx | 57 | 59 | ✅ PASS |
| FinanceStatistics.tsx | 57 (이전), inner 컴포넌트 내부로 이동 | wrapper 권한 gate 이후 inner 렌더 | ⚠ **buildfix 수정됨** |

> FinanceStatistics.tsx: monthlyStats/classStats/typeStats useMemo 3개가 early return 이후에 있었다.
> buildfix에서는 `FinanceStatistics` wrapper가 권한을 먼저 확인하고, 권한 통과 시에만 `FinanceStatisticsContent`에서 통계 hooks를 실행한다.

---

## 3. 권한 코드 분석 QA

### 3-1. RBAC 권한 매트릭스

| 역할 | accountType | finance.view | settlementConfirm | refundApprove |
|---|---|---|---|---|
| SUPER_ADMIN | SUPER_ADMIN | ✅ | ✅ | ✅ |
| DIRECTOR | DIRECTOR | ✅ | ✅ | ✅ |
| VICE_DIRECTOR | STAFF | ❌ 미보유 | ❌ 미보유 | ❌ 미보유 |
| HEAD_MANAGER | STAFF | ❌ 미보유 | ❌ 미보유 | ❌ 미보유 |
| TEAM_LEAD | STAFF | ❌ 미보유 | ❌ 미보유 | ❌ 미보유 |
| STAFF | STAFF | ✅ | ❌ 미보유 | ❌ 미보유 |
| TEACHER | TEACHER | ❌ 미보유 | ❌ 미보유 | ❌ 미보유 |
| STUDENT | STUDENT | ❌ 미보유 | ❌ 미보유 | ❌ 미보유 |
| GUARDIAN | GUARDIAN | ❌ 미보유 | ❌ 미보유 | ❌ 미보유 |

**결과: 권한 매트릭스 AXIS LMS v1.2 원칙과 일치 ✅**

### 3-2. 포털 격리 (RoleRoute)

| Route | allow |
|---|---|
| AdminRoutes (/admin/**) | ['SUPER_ADMIN', 'DIRECTOR', 'STAFF'] |
| TeacherRoutes (/teacher/**) | ['TEACHER'] |
| StudentRoutes (/student/**) | ['STUDENT'] |
| ParentRoutes (/parent/**) | ['GUARDIAN'] |

**결과: 포털 격리 정상 ✅**

> TEACHER/STUDENT/GUARDIAN은 Admin Back Office(/admin/**)에 접근 불가.  
> 직접 URL 접근 시 RoleRoute가 역할 홈으로 리다이렉트.

---

## 4. Finance Freeze QA

| 항목 | 확인 방법 | 결과 |
|---|---|---|
| Enrollment 기준 청구/수납 | Invoice/Payment 타입에 enrollmentId 필드 확인 | ✅ |
| 수납관리 필터 (담당강사 포함) | FinancePayments.tsx getTeacherName(cls: unknown) | ✅ |
| 미납 → 수납 등록 연결 | FinanceUnpaid navigate + FinancePayments preselect | ✅ |
| 퇴원 20일 초과 환불 차단 | isRefundBlocked, saveRequest 이중 검증 | ✅ |
| 환불 직접 입력 우회 불가 | isRefundBlocked=true 시 금액 입력란 미표시 | ✅ |
| 정산 month/id 기준 통일 | setConfirmTarget(month), settlementMap.get(month) | ✅ |
| Settlement 자동 생성 | generateSettlementForMonth in FinanceContext | ✅ |
| 행정 정산 확정 불가 | STAFF_PERMS에 finance.settlementConfirm 없음 | ✅ |
| 행정 환불 승인 불가 | STAFF_PERMS에 finance.refundApprove 없음 | ✅ |
| 부원장/실장 재무 접근 불가 | VICE_DIRECTOR_PERMS/HEAD_MANAGER_PERMS에 finance.* 없음 | ✅ |
| 강사 재무 접근 불가 | TEACHER_PERMS에 finance.* 없음 | ✅ |
| 실제 PG 결제 연동 없음 | mock 등록만, PG 코드 없음 | ✅ |
| 실제 카카오/SMS 발송 없음 | NotificationContext mock/toast만 | ✅ |

**결과: Finance freeze 전 항목 PASS ✅**

---

## 5. 대학분석 Freeze QA

| 항목 | 결과 |
|---|---|
| universityAnalysisAdapter.ts 불변 (md5: 1eddaef5) | ✅ |
| universityAnalysisClient.ts Phase51 API 호출 구조 유지 | ✅ |
| LMS 내부 추천/합격률 계산 없음 | ✅ (grep 결과 없음) |
| PDF Export 없음 | ✅ |
| 문제은행/NGD/OCR 없음 | ✅ |

**결과: 대학분석 freeze 전 항목 PASS ✅**

---

## 6. 회귀 방지 필수 항목

| 항목 | 결과 |
|---|---|
| TeacherExamGrading scopedExam → visibleExam 패턴 | ✅ 확인 (md5: 3429a4ba) |
| StudentDetail `const list: ReturnType<typeof adaptMockSummaryFromLms>[] = []` | ✅ line 950 확인 |
| FinancePayments `getTeacherName(cls: unknown)` 안전 helper | ✅ line 43 확인 |
| classData.ts 전체 덮어쓰기 없음 (md5: 126d9e5e) | ✅ 원본 동일 |
| App.tsx 불변 (md5: 387bbf48) | ✅ |
| AdminRoutes.tsx 불변 (md5: 39126572) | ✅ |

---

## 7. Go / No-Go 판단

### 코드 정적 분석 기준 결과

**발견된 이슈:** FinanceStatistics.tsx hooks rule 위반 → buildfix에서 wrapper/inner 구조로 수정됨

**수정 후 판단:**

| 기준 | 판단 |
|---|---|
| 주요 route import/export 오류 없음 | ✅ |
| 권한 없는 사용자의 재무 접근 가능 | ❌ 불가 ✅ |
| 행정이 정산 확정/환불 승인 가능 | ❌ 불가 ✅ |
| 강사가 재무 접근 가능 | ❌ 불가 ✅ |
| 학생/학부모가 Admin Back Office 접근 가능 | ❌ 불가 ✅ |
| 대학추천 합격률/확률 LMS 내부 계산 | ❌ 없음 ✅ |
| 20일 초과 환불 직접 입력 우회 | ❌ 불가 ✅ |
| TeacherExamGrading 타입픽스 회귀 | ❌ 없음 ✅ |
| StudentDetail adapterMockSummaries 타입픽스 회귀 | ❌ 없음 ✅ |

**코드 정적 분석 기준 — Go 가능 (단, 실제 build 및 브라우저 QA 별도 수행 필요)**

### 확인하지 못한 항목 (별도 수동 QA 필요)

- `npm run build` 실제 실행 결과
- 브라우저에서 각 화면 실제 렌더링
- DEV 역할 전환 후 화면별 동작
- 강사/학생/학부모 포털 내부 기능 동작
- 알림 mock 발송 toast 표시
- `VITE_PHASE51_API_URL` 환경변수 설정 후 대학분석 API 호출 동작
