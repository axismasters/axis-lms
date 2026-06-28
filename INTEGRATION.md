# AXIS LMS v1.2 — Integrated QA & Permission Audit v1
# INTEGRATION.md

작업 기준: `axis-lms-v1_2-growth-showcase-v2-buildfix.zip`
작업명: Integrated QA & Permission Audit v1
산출물: `axis-lms-v1.2-integrated-qa-v1.zip`

---

## 이번 QA 작업 내용

### 변경된 파일 (5개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/App.tsx` | PlaceholderPage 구버전 문구 수정, 알림관리 주석 버전 v1→v3 |
| `src/contexts/StudentContext.tsx` | `deleteStudent` 삭제 금지 정책 경고 주석 + console.warn 추가 |
| `src/lib/notificationData.ts` | 파일 헤더 버전 v1→v3 |
| `README.md` | 전체 최신화 (완료 모듈/라우팅/권한표/삭제금지정책) |
| `INTEGRATION.md` | 전체 최신화 (이 파일) |

### 신규 추가 파일

없음 (QA 안정화 작업 — 새 엔진 추가 없음)

---

## 전체 모듈 상태

| 모듈 | 버전 | 데이터 계층 | 컨텍스트 | 주요 페이지 |
|------|------|------------|----------|------------|
| 학생관리 | — | `lib/dummyData.ts` | `StudentContext` | StudentList, StudentNew, StudentDetail |
| 반관리 | — | `lib/classData.ts` | `ClassContext` | ClassList, ClassDetail |
| 수강등록 | Foundation v6 | `lib/enrollmentData.ts` | `EnrollmentContext` | (StudentDetail/ClassDetail 내 탭) |
| 출결관리 | — | `lib/attendanceData.ts` | `AttendanceContext` | AttendanceCheck, AttendanceStatus |
| 재무관리 | Foundation v3 | `lib/financeData.ts` | `FinanceContext` | Finance{Payments/Refunds/Unpaid/Settlements/Statistics} |
| 알림관리 | Foundation v3 | `lib/notificationData.ts` | `NotificationContext` | Notification{History/Templates/Settings} |
| 성적관리 | Assessment Engine v2 | `lib/assessmentData.ts` | `AssessmentContext` | AssessmentList, AssessmentDetail |
| 성장관리 | Foundation v2 | `lib/growthData.ts` | `GrowthContext` | growth/{GrowthOverview/EmblemManagement/RivalManagement} |
| 시스템설정 | — | `lib/rbac.ts` | `AuthContext` | settings/{Academy/Permissions/PasswordReset} |

---

## Provider 트리 순서 (확정)

```
ThemeProvider
└── StudentProvider
    └── ClassProvider
        └── NotificationProvider          ← Finance/Attendance/Assessment 이벤트 수신
            └── EnrollmentProvider
                └── AttendanceProvider
                    └── AssessmentProvider
                        └── FinanceProvider
                            └── GrowthProvider
                                └── AuthBoundary (AuthProvider — useStudents 필요)
                                    └── Router
```

---

## 엔진 간 연결 구조

```
수강등록(EnrollmentContext)
  ├─→ 출결 대상자 공급 (활성 수강생만 출결 대상)
  ├─→ 재무 자동 청구서 생성 (등록/종료/퇴원 시)
  └─→ 알림 이벤트
      - ENROLLMENT_CREATED
      - ENROLLMENT_ENDED
      - ENROLLMENT_WITHDRAWN

재무(FinanceContext)
  └─→ 알림 이벤트 (FINANCE_REFUND_REQUESTED / APPROVED / REJECTED / COMPLETED)

성적관리(AssessmentContext)
  ├─→ 알림 이벤트 (ASSESSMENT_RESULT_PUBLISHED — 학원 전체 시험 공개 시)
  └─→ 성장관리 IF Hook (onIfAnalysisResult) — placeholder 구조 준비 완료, 실제 호출은 다음 단계

성장관리(GrowthContext)
  ├─ SP 이력 (StudentSPLog) — 삭제 없음
  ├─ 엠블럼 (StudentEmblem) — 삭제 없음, 비활성만
  └─ 라이벌 (RivalRelation) — 삭제 없음, 종료(ended)만

출결관리(AttendanceContext)
  └─→ 성장관리 Hook (onAttendanceEvent) — placeholder 구조 준비 완료, 실제 호출은 다음 단계
```

---

## 권한 기준 (확정)

### AccountType별 Back Office 접근

| AccountType | Admin Back Office | 비고 |
|-------------|:-----------------:|------|
| SUPER_ADMIN | ✅ | 전체 권한 |
| DIRECTOR | ✅ | system.permissionUpdate 제외 |
| STAFF | ✅ | 정산확정/환불승인/성적공개/엠블럼정책 제외 |
| TEACHER | ✅ (제한적) | 재무/알림/성장관리 메뉴 없음, 담당 학생/반만 |
| STUDENT | ❌ | BackOfficeGate 차단, 향후 포털 |
| GUARDIAN | ❌ | BackOfficeGate 차단, 향후 포털 |

### 기능별 권한 세부

| 기능 | SUPER_ADMIN | DIRECTOR | STAFF | TEACHER |
|------|:-----------:|:--------:|:-----:|:-------:|
| 재무관리 메뉴 접근 | ✅ | ✅ | ✅ | ❌ |
| 재무 정산 확정 (`finance.settlementConfirm`) | ✅ | ✅ | ❌ | ❌ |
| 환불 승인 (`finance.refundApprove`) | ✅ | ✅ | ❌ | ❌ |
| 알림관리 메뉴 접근 | ✅ | ✅ | ✅ | ❌ |
| 알림 템플릿 관리 (`notification.templateManage`) | ✅ | ✅ | ❌ | ❌ |
| 성적 공개 (`assessment.publish`) | ✅ | ✅ | ❌ | ❌ |
| 시험 생성 (`assessment.create`) | ✅ | ✅ | ❌ | ❌ |
| 성장관리 메뉴 접근 (`canAccessGrowth`) | ✅ | ✅ | ✅ | ❌ |
| 학생 성장/진열장 탭 (`canViewStudentGrowth`) | ✅ | ✅ | ✅ | ✅ (담당만) |
| SP/엠블럼 수동 지급 | ✅ | ✅ | ✅ | ❌ |
| 엠블럼 정책 관리 (`canManageEmblems`) | ✅ | ✅ | ❌ | ❌ |
| 라이벌 전체 관리 (`canManageRivals`) | ✅ | ✅ | ❌ | ❌ |
| 권한 매트릭스 편집 (`system.permissionUpdate`) | ✅ | ❌ | ❌ | ❌ |

### TEACHER 데이터 범위

- `dataScope: 'ASSIGNED_CLASSES'`
- `assignedClassIds`: 배정된 반 목록
- `assignedStudentIds`: 배정 반 수강생 ∪ 명시 배정 학생 (AuthContext에서 자동 집계)
- 재무/알림/성장관리 메뉴 미노출 (AdminLayout `requiresFn` / `requires` 체크)
- 담당 학생 상세 → 성장/진열장 탭 조회 가능 (수동 지급 버튼 미노출)

---

## 삭제 금지 정책

| 대상 | 구현 방식 | 확인 결과 |
|------|----------|----------|
| 수강 이력 | 종료/퇴원 status 변경만 | ✅ delete 함수 없음 |
| 재무 데이터 (수납/청구서) | 환불/취소 처리만 | ✅ FinanceContext 주석 명시 |
| 발송이력 | 삭제 기능 없음 | ✅ NotificationContext 삭제 없음 |
| 엠블럼 | 비활성(`active=false`)/숨김 토글만 | ✅ `toggleEmblemActive` 만 존재 |
| 라이벌 이력 | 관계 종료(`ended=true`)만 | ✅ 이력 자체 삭제 없음 |
| SP 지급 이력 | 삭제 기능 없음 | ✅ SPLog append-only |
| 성적 공개 후 수정 | 공개 후 채점 수정 불가 | ✅ `resultCorrect` 공개완료 이후 차단 |
| `deleteStudent` | ⚠ 함수 존재하나 UI 미사용 | console.warn 추가, UI 호출 없음 |

---

## 빌드 통과 여부

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 오류 0개 |
| `npm run build` | ✅ 통과 (chunk size 경고 있음, 기능/빌드 실패 아님) |
| 이전 buildfix 기준 빌드 통과 상태 | ✅ 유지 (신규 코드 없음, 주석/문자열만 수정) |

---

## 현재 Mock 상태 (실제 연동 미완료)

| 영역 | Mock 상태 | 실제 연동 시 교체 대상 |
|------|----------|----------------------|
| 인증/로그인 | DEV 계정 전환 셀렉터 | 실제 세션 기반 로그인 |
| 재무 | mock 수납/청구/환불 데이터 | 실제 결제 API |
| 알림 발송 | mock 발송이력 생성 | 카카오/SMS/LMS API |
| 성장 → 출결 Hook | `onAttendanceEvent` 구조만 준비 | AttendanceContext 연결 |
| 성장 → IF Hook | `onIfAnalysisResult` 구조만 준비 | AssessmentContext 연결 |
| SP 임계값 엠블럼 자동 지급 | 구조 없음 (다음 단계) | GrowthContext 내 trigger 추가 |

---

## 다음 추천 개발 단계

1. **Growth v3 — 출결 실제 연동**
   - `AttendanceContext.checkAttendance()` 내에서 `useGrowth().onAttendanceEvent()` 자동 호출
   - 월 개근, 연속 개근, 누적 출석 엠블럼 자동 진행

2. **Growth v3 — IF 실제 연동**
   - `AssessmentContext.gradeSubmission()` 완료 후 `onIfAnalysisResult()` 자동 호출
   - IF 분석 결과 기반 엠블럼 progress 자동 증가

3. **Growth v3 — SP 임계값 엠블럼 자동 지급**
   - `addStudentSP()` 호출 후 totalSP 500/2000 달성 시 자동 지급 트리거

4. **Growth v4 — 시즌 관리**
   - 시즌 시작/리셋, seasonSP 초기화, 시즌 아카이브

5. **학생/보호자 포털 (별도 앱)**
   - `BackOfficeGate`에서 차단 중인 STUDENT/GUARDIAN 계정용 별도 포털
   - 나의 진열장, 성적 조회, 출결 확인

6. **실제 인증 연동**
   - DEV 계정 전환 UI 제거, 세션 기반 로그인 구현

---

## QA 체크리스트 (Integrated QA v1 기준)

| 항목 | 결과 |
|------|------|
| `tsc --noEmit` 오류 0개 | ✅ |
| 전체 라우팅 정상 (21개 경로) | ✅ |
| SUPER_ADMIN 전체 권한 | ✅ |
| DIRECTOR 정산 확정/성적 공개 가능 | ✅ |
| STAFF 재무 정산 확정 불가 | ✅ |
| STAFF 환불 승인 불가 | ✅ |
| STAFF SP/엠블럼 수동 지급 가능 | ✅ |
| TEACHER 재무/알림 메뉴 차단 | ✅ |
| TEACHER 성장관리 전체 메뉴 차단 | ✅ |
| TEACHER 담당 학생 성장/진열장 탭 조회 가능 | ✅ |
| TEACHER SP/엠블럼 수동 지급 버튼 미노출 | ✅ |
| STUDENT/GUARDIAN Admin 접근 차단 | ✅ |
| 보호자 라이벌/엠블럼 노출 없음 | ✅ |
| 성적 공개 알림 mock 이력 | ✅ |
| 재무 환불/미납 알림 mock 이력 | ✅ |
| SP 지급 이력 삭제 없음 | ✅ |
| 엠블럼 삭제 없음 | ✅ |
| 라이벌 이력 삭제 없음 | ✅ |
| 발송이력 삭제 없음 | ✅ |
| 성적 공개 후 직접 수정 없음 | ✅ |
| PlaceholderPage 문구 최신화 | ✅ |
| notificationData.ts 버전 헤더 최신화 | ✅ |
| deleteStudent 정책 경고 추가 | ✅ |
| README 최신화 | ✅ |
| INTEGRATION.md 최신화 | ✅ |
