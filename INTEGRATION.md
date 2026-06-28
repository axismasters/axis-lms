# AXIS LMS v1.2 — HR & RBAC Management Stabilization v1
# INTEGRATION.md

작업 기준: `axis-lms-v1.2-integrated-qa-v1-buildfix.zip`
작업명: HR & RBAC Management Stabilization v1
산출물: `axis-lms-v1.2-hr-rbac-stabilization-v1.zip`

---

## 이번 작업 내용

### 신규 파일 (5개)

| 파일 | 설명 |
|------|------|
| `src/lib/employeeData.ts` | 직원 타입/더미데이터/권한변경이력 타입/유틸 |
| `src/contexts/EmployeeContext.tsx` | 직원 CRUD + 권한 변경 이력 Context |
| `src/pages/EmployeeList.tsx` | 직원 목록 페이지 (검색/퇴직처리/등록 모달 진입) |
| `src/pages/EmployeeDetail.tsx` | 직원 상세/수정/퇴직 처리 페이지 |
| `src/components/EmployeeFormModal.tsx` | 직원 등록 모달 |

### 수정 파일 (4개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/settings/PermissionSettings.tsx` | 권한 매트릭스 UI 전면 고도화 — 카테고리별 기능명/6열 매트릭스/복사(실제)/이력(실제)/기본값 복원 |
| `src/pages/settings/PasswordResetManagement.tsx` | 직원 계정 소스를 EmployeeContext로 교체 (DEV_USERS 의존 제거) |
| `src/App.tsx` | EmployeeProvider 추가, 직원관리 라우트 추가 |
| `src/components/AdminLayout.tsx` | 직원관리 메뉴 추가, Briefcase 아이콘 |

---

## 전체 모듈 상태

| 모듈 | 버전 | 데이터 계층 | 컨텍스트 | 주요 페이지 |
|------|------|------------|----------|------------|
| 학생관리 | — | `lib/dummyData.ts` | `StudentContext` | StudentList/New/Detail |
| 반관리 | — | `lib/classData.ts` | `ClassContext` | ClassList/Detail |
| 수강등록 | Foundation v6 | `lib/enrollmentData.ts` | `EnrollmentContext` | (StudentDetail/ClassDetail 내) |
| 출결관리 | — | `lib/attendanceData.ts` | `AttendanceContext` | AttendanceCheck/Status |
| 재무관리 | Foundation v3 | `lib/financeData.ts` | `FinanceContext` | Finance{Payments/Refunds/Unpaid/Settlements/Statistics} |
| 알림관리 | Foundation v3 | `lib/notificationData.ts` | `NotificationContext` | Notification{History/Templates/Settings} |
| 성적관리 | Assessment Engine v2 | `lib/assessmentData.ts` | `AssessmentContext` | AssessmentList/Detail |
| 성장관리 | Foundation v2 | `lib/growthData.ts` | `GrowthContext` | growth/{Overview/Emblems/Rivals} |
| **직원관리** | HR Stabilization v1 | `lib/employeeData.ts` | `EmployeeContext` | EmployeeList/Detail |
| 시스템설정 | — | `lib/rbac.ts` | `AuthContext` | settings/{Academy/Permissions/PasswordReset} |

---

## Provider 트리 순서 (확정)

```
ThemeProvider
└── StudentProvider
    └── ClassProvider
        └── NotificationProvider
            └── EmployeeProvider          ← HR Stabilization v1 신규 추가
                └── EnrollmentProvider
                    └── AttendanceProvider
                        └── AssessmentProvider
                            └── FinanceProvider
                                └── GrowthProvider
                                    └── AuthBoundary
                                        └── Router
```

---

## 직원관리 구조

### 직원 필수 정보

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | string | 성명 |
| `phone` | string | 휴대폰번호 (계정 ID) |
| `position` | Position | 직급 |
| `status` | EmployeeStatus | 재직 / 휴직 / 퇴직 |
| `joinDate` | string | 입사일 |
| `accountStatus` | AccountStatus | 계정 활성/비활성/정지 |
| `accountId` | string | Account Engine 연동 ID (현재 mock) |
| `permissionGroupId` | string | 직급 기본 권한그룹 |

### 직급 목록 (조교 없음)

최고관리자 / 원장 / 부원장 / 실장 / 팀장 / 강사 / 행정

### 계정 생성 흐름

```
직원 등록 (EmployeeFormModal)
  → 휴대폰번호 중복 체크
  → Employee 레코드 생성
  → accountId 자동 발급 (mock: u-emp-NNN)
  → permissionGroupId = 직급 기본 권한그룹 (defaultPermissionGroupId)
  → 계정 자동 생성 안내 배너 표시

※ 계정 생성 메뉴 별도 없음. Account Engine 실연동 전 mock.
```

---

## 권한관리 매트릭스 구조

### 화면 구성

- **좌측**: 직급 목록 (클릭 시 해당 직급 매트릭스 표시)
- **우측**: 권한 매트릭스 — 카테고리 × 기능 × 6열(조회/등록/수정/삭제/승인확정/공개발송)

### 6열 의미

| 열 | PermissionKey 매핑 예시 |
|----|------------------------|
| 조회 | `student.view`, `finance.view` |
| 등록 | `student.create`, `finance.paymentCreate` |
| 수정 | `student.update`, `class.assignTeacher` |
| 삭제 | `student.withdraw`, `employee.resign` |
| 승인/확정 | `finance.refundApprove`, `finance.settlementConfirm` |
| 공개/발송 | `assessment.publish`, `notification.send` |

### 권한 카테고리 (11개)

학생관리 / 직원관리 / 반관리 / 수강관리 / 출결관리 / 성적관리 / 재무관리 / 알림관리 / 성장관리 / 시스템설정 / 비밀번호 초기화

### 권한 복사

- 선택 직급의 현재 권한 셋을 다른 직급에 복사 (실제 동작)
- 복사 후 변경 이력 자동 기록 (`sourcePosition` 추적)
- SUPER_ADMIN은 복사 대상/원본 불가

### 변경 이력 (append-only)

```ts
interface PermissionChangeLog {
  id: string;
  targetPosition: Position;
  changedAt: string;        // ISO timestamp
  changedBy: string;        // 변경자 이름
  addedKeys: string[];
  removedKeys: string[];
  note?: string;
  sourcePosition?: Position; // 복사 시 출처
}
```

- 저장 버튼 클릭 시 자동 기록
- 권한 복사 시 자동 기록
- 기본값 복원 시 자동 기록
- **삭제 없음** — append-only

### 기본값 복원

`DEFAULT_PERMISSIONS_BY_POSITION[position]` 기반으로 복원. 복원 이력 자동 기록.

---

## 직급과 권한 분리 기준 (AXIS 확정 원칙)

```
Position (직급)          AccountType (계정유형)
─────────────────        ──────────────────────
SUPER_ADMIN          →   SUPER_ADMIN
DIRECTOR             →   DIRECTOR
VICE_DIRECTOR        →   STAFF
HEAD_MANAGER         →   STAFF
TEAM_LEAD            →   STAFF
TEACHER              →   TEACHER
STAFF                →   STAFF
STUDENT              →   STUDENT  (포털용)
GUARDIAN             →   GUARDIAN (포털용)
```

- **직급(Position)**: 인사 정보. 권한설정 UI의 기준 단위.
- **AccountType**: 계정의 큰 유형. 로그인 분기/dataScope 기본값에 사용.
- **permissionGroupId**: 실제 적용 권한그룹 id. 기본은 `${Position}_DEFAULT`.

---

## 주요 권한 정책

| 기능 | SUPER_ADMIN | DIRECTOR | STAFF | TEACHER |
|------|:-----------:|:--------:|:-----:|:-------:|
| 직원관리 조회 | ✅ | ✅ | ✅ | ❌ |
| 직원 등록/수정 | ✅ | ✅ | ❌ | ❌ |
| 퇴직 처리 | ✅ | ✅ | ❌ | ❌ |
| 재무관리 접근 | ✅ | ✅ | ✅ | ❌ |
| 정산 확정 | ✅ | ✅ | ❌ | ❌ |
| 환불 승인 | ✅ | ✅ | ❌ | ❌ |
| 성적 공개 | ✅ | ✅ | ❌ | ❌ |
| 알림관리 접근 | ✅ | ✅ | ✅ | ❌ |
| 성장관리 메뉴 | ✅ | ✅ | ✅ | ❌ |
| 학생 성장탭 | ✅ | ✅ | ✅ | ✅ (담당만) |
| SP/엠블럼 지급 | ✅ | ✅ | ✅ | ❌ |
| 권한설정 편집 | ✅ | ❌ | ❌ | ❌ |

---

## 비밀번호 초기화 정책

1. 계정 검색 → 단일 계정 선택 → 1건만 초기화
2. 전체/일괄/선택 전체 초기화 **없음**
3. 최고관리자(SUPER_ADMIN) 계정 타인 초기화 **불가**
4. 권한 범위 밖 계정 초기화 불가 (`canResetPassword` 로직)
5. TEACHER → 담당 학생만 초기화 가능 (`canAccessStudent` 연동)
6. 직원 계정 소스: EmployeeContext (DEV_USERS 의존 제거 완료)

---

## 엔진 간 연결 구조

```
수강등록(EnrollmentContext)
  ├─→ 출결 대상자 공급 (활성 수강생)
  ├─→ 재무 자동 청구서 생성
  └─→ 알림 이벤트 (ENROLLMENT_CREATED / ENROLLMENT_ENDED / ENROLLMENT_WITHDRAWN)

재무(FinanceContext)
  └─→ 알림 이벤트 (FINANCE_REFUND_REQUESTED / APPROVED / REJECTED / COMPLETED)

성적관리(AssessmentContext)
  ├─→ 알림 이벤트 (ASSESSMENT_RESULT_PUBLISHED)
  └─→ 성장관리 IF Hook (onIfAnalysisResult) — placeholder

성장관리(GrowthContext)
  ├─ SP 이력 — 삭제 없음
  ├─ 엠블럼 — 비활성만
  └─ 라이벌 — 종료만

직원관리(EmployeeContext)
  └─→ 권한설정(PermissionSettings) 변경 이력 기록
  └─→ 비밀번호 초기화 관리 계정 소스 공급
```

---

## 빌드 통과 여부

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 오류 0개 |
| `npm run build` | ✅ 통과 (chunk size 경고 있음, 기능/빌드 실패 아님) |
| `npx tsc --noEmit` (buildfix 후) | ✅ 오류 0개 |

---

## 현재 Mock 상태 (실제 연동 미완료)

| 영역 | 상태 |
|------|------|
| 직원 계정 (Account Engine) | mock — `accountId: u-emp-NNN` 자동 발급 |
| 권한 저장 | mock — 새로고침 시 초기값 복원 (백엔드 미연동) |
| 알림 발송 | mock 이력 생성 |
| 재무 수납/환불 | mock 처리 |
| 인증/로그인 | DEV 계정 전환 셀렉터 |
| 성장 → 출결 Hook | placeholder 구조만 준비 |
| 성장 → IF Hook | placeholder 구조만 준비 |

---

## 삭제 금지 정책 확인

| 대상 | 구현 결과 |
|------|----------|
| 수강 이력 | ✅ 없음 |
| 재무 데이터 | ✅ 없음 |
| 발송이력 | ✅ 없음 |
| 엠블럼 | ✅ 비활성만 |
| 라이벌 이력 | ✅ 종료만 |
| SP 지급 이력 | ✅ 없음 |
| 권한 변경 이력 | ✅ 없음 (append-only) |
| 성적 공개 후 수정 | ✅ 없음 |
| 직원 하드 삭제 | ✅ 없음 (퇴직 상태 변경만) |


---

## enrollment.* / growth.* 권한 기준 (buildfix 추가)

### 수강관리 (enrollment)

| PermissionKey | 설명 | 허용 직급 |
|---------------|------|----------|
| `enrollment.view` | 수강 이력 조회 | SUPER_ADMIN/DIRECTOR/STAFF/VICE_DIRECTOR/HEAD_MANAGER/TEAM_LEAD/TEACHER |
| `enrollment.create` | 수강 등록 | SUPER_ADMIN/DIRECTOR/STAFF/VICE_DIRECTOR |
| `enrollment.update` | 수강 정보 수정/메모 | SUPER_ADMIN/DIRECTOR/STAFF/VICE_DIRECTOR/HEAD_MANAGER |
| `enrollment.end` | 수강 종료 | SUPER_ADMIN/DIRECTOR/STAFF/VICE_DIRECTOR |
| `enrollment.withdraw` | 퇴원 처리 | SUPER_ADMIN/DIRECTOR/STAFF |

### 성장관리 (growth)

| PermissionKey | 설명 | 허용 직급 |
|---------------|------|----------|
| `growth.view` | 성장관리 메뉴 전체 조회 | SUPER_ADMIN/DIRECTOR/STAFF/VICE_DIRECTOR |
| `growth.studentView` | 학생 상세 성장/진열장 탭 조회 | + HEAD_MANAGER/TEACHER(담당만) |
| `growth.awardSP` | SP 수동 지급 | SUPER_ADMIN/DIRECTOR/STAFF |
| `growth.awardEmblem` | 엠블럼 수동 지급 | SUPER_ADMIN/DIRECTOR/STAFF |
| `growth.emblemManage` | 엠블럼 정책 관리 | SUPER_ADMIN/DIRECTOR |
| `growth.rivalView` | 라이벌 전체 조회 | SUPER_ADMIN/DIRECTOR/STAFF/VICE_DIRECTOR |
| `growth.rivalManage` | 라이벌 관계/승패 관리 | SUPER_ADMIN/DIRECTOR |

---

## 최고관리자(SUPER_ADMIN) 보호 정책 (buildfix 추가)

| 정책 | 구현 위치 |
|------|----------|
| SUPER_ADMIN 직급 선택은 SUPER_ADMIN만 가능 | `EmployeeFormModal.tsx` — `validPositions` 필터 |
| DIRECTOR가 SUPER_ADMIN 직원 수정/퇴직 불가 | `EmployeeDetail.tsx` — `canProtectedEdit/Resign` |
| DIRECTOR가 직원을 SUPER_ADMIN으로 직급 변경 불가 | `EmployeeDetail.tsx` — 직급 select 필터 |
| SUPER_ADMIN 본인 퇴직 처리 불가 (실수 방지) | `EmployeeDetail.tsx` — `isSelfSuperAdmin` 체크 |
| 최고관리자 계정 비밀번호 초기화 타인 불가 | `AuthContext.canResetPassword` — SUPER_ADMIN target 차단 |
| 권한 매트릭스에서 SUPER_ADMIN 항목 편집 불가 | `PermissionSettings.tsx` — `isLocked('SUPER_ADMIN')` |

---

## 다음 추천 개발 단계

1. **Growth v3 — 출결 실제 연동**: `AttendanceContext` → `onAttendanceEvent` 자동 호출
2. **Growth v3 — IF 실제 연동**: `AssessmentContext` → `onIfAnalysisResult` 자동 호출
3. **Growth v3 — SP 임계값 엠블럼 자동 지급**: totalSP 500/2000 달성 시 자동 지급
4. **권한 저장 실연동**: 백엔드 API 연동으로 권한 영구 저장
5. **직원 계정 실연동**: Account Engine 실제 연동 (계정 ID/인증)
6. **학생/보호자 포털 (별도 앱)**: BackOfficeGate 차단 → 포털로 분리
7. **실제 인증**: DEV 전환 UI 제거, 세션 기반 로그인
