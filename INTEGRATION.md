# AXIS LMS v1.2 — Release Checkpoint & UI Consistency QA v1
# INTEGRATION.md

작업 기준: `axis-lms-main.zip` (GitHub main 브랜치)
작업명: Release Checkpoint & UI Consistency QA v1
산출물: `axis-lms-v1.2-release-checkpoint-ui-qa-v1.zip`

---

## 이번 작업 내용 (QA 전용 — 신규 기능 없음)

### 소스 코드 수정 (정합성)

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/AdminLayout.tsx` | 메뉴명 `수업관리` → `반관리`, `성적 관리` → `성적관리` |
| `src/App.tsx` | 관련 주석 통일 |
| `src/pages/ClassList.tsx` | breadcrumb `수업관리` → `반관리` |
| `src/pages/ClassDetail.tsx` | breadcrumb `수업관리` → `반관리` |
| `src/pages/AssessmentList.tsx` | 화면 텍스트 `성적 관리` → `성적관리` |
| `src/pages/AssessmentDetail.tsx` | breadcrumb/텍스트 `성적 관리` → `성적관리` |
| `src/lib/rbac.ts` | 주석 `Growth Showcase Foundation v1` → `v2` |
| `src/pages/growth/*.tsx` | 파일 헤더 `v1` → `v2` |
| `src/pages/StudentDetail.tsx` | 섹션 주석 `v1` → `v2` |
| `README.md` | 전체 최신화 |
| `INTEGRATION.md` | 전체 최신화 (이 파일) |

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
| 직원관리 | HR Stabilization v1 | `lib/employeeData.ts` | `EmployeeContext` | EmployeeList/Detail |
| 시스템설정 | — | `lib/rbac.ts` | `AuthContext` | settings/{Academy/Permissions/PasswordReset} |

---

## 관리자 메뉴 구조 (확정)

```
학생관리
  ├── 학생 등록    /students/new
  └── 학생 목록    /students

직원관리
  ├── 직원 등록    /employees?new=1   (모달)
  └── 직원 목록    /employees

반관리                              ← (이전: '수업관리' → 'v1 QA에서 '반관리'로 통일)
  ├── 반 등록      /classes?new=1     (모달)
  └── 반 목록      /classes

출결관리
  ├── 출결체크     /attendance/check
  └── 출결현황     /attendance

성적관리                            ← (이전: '성적 관리' → 'v1 QA에서 '성적관리'로 통일)
  └── (하위 메뉴 없음) /scores

재무관리
  ├── 수납관리     /finance/payments
  ├── 환불관리     /finance/refunds
  ├── 미납관리     /finance/unpaid
  ├── 정산관리     /finance/settlements
  └── 통계         /finance/statistics

성장관리
  ├── 성장현황     /growth/overview
  ├── 엠블럼관리   /growth/emblems
  └── 라이벌관리   /growth/rivals

알림관리
  ├── 발송이력     /notifications/history
  ├── 템플릿관리   /notifications/templates
  └── 알림설정     /notifications/settings

시스템설정
  ├── 학원정보관리 /settings/academy
  ├── 권한설정     /settings/permissions
  └── 비밀번호 초기화 관리  /settings/password-reset
```

---

## Provider 트리 순서 (확정)

```
ThemeProvider
└── StudentProvider
    └── ClassProvider
        └── NotificationProvider
            └── EmployeeProvider
                └── EnrollmentProvider
                    └── AttendanceProvider
                        └── AssessmentProvider
                            └── FinanceProvider
                                └── GrowthProvider
                                    └── AuthBoundary
                                        └── Router
```

---

## 엔진 간 연결 구조

```
수강등록(EnrollmentContext)
  ├─→ 출결 대상자 공급 (활성 수강생만)
  ├─→ 재무 자동 청구서 생성
  └─→ 알림 이벤트
      - ENROLLMENT_CREATED
      - ENROLLMENT_ENDED
      - ENROLLMENT_WITHDRAWN

재무(FinanceContext)
  └─→ 알림 이벤트
      - FINANCE_REFUND_REQUESTED
      - FINANCE_REFUND_APPROVED
      - FINANCE_REFUND_REJECTED
      - FINANCE_REFUND_COMPLETED

성적관리(AssessmentContext)
  ├─→ 알림 이벤트 (ASSESSMENT_RESULT_PUBLISHED)
  └─→ 성장관리 IF Hook (onIfAnalysisResult) — placeholder

성장관리(GrowthContext)
  ├─ SP 이력 — 삭제 없음
  ├─ 엠블럼 — 비활성만
  └─ 라이벌 — 종료만

직원관리(EmployeeContext)
  ├─→ 권한설정(PermissionSettings) 변경 이력 기록
  └─→ 비밀번호 초기화 관리 계정 소스 공급
```

---

## 권한 기준 (확정)

### AccountType별 Back Office 접근

| AccountType | Admin Back Office | 비고 |
|-------------|:-----------------:|------|
| SUPER_ADMIN | ✅ | 전체 권한 |
| DIRECTOR | ✅ | permissionUpdate 제외 |
| STAFF | ✅ | 정산확정/환불승인/성적공개/엠블럼정책 제외 |
| TEACHER | ✅ 제한적 | 재무/알림/성장관리 메뉴 없음, 담당 학생/반만 |
| STUDENT | ❌ | BackOfficeGate 차단 |
| GUARDIAN | ❌ | BackOfficeGate 차단 |

### 기능별 권한 세부

| 기능 | SUPER_ADMIN | DIRECTOR | STAFF | TEACHER |
|------|:-----------:|:--------:|:-----:|:-------:|
| 직원 등록/수정 | ✅ | ✅ | ❌ | ❌ |
| 수강관리 전체 | ✅ | ✅ | ✅ | 담당 조회만 |
| 재무관리 접근 | ✅ | ✅ | ✅ | ❌ |
| 정산 확정 | ✅ | ✅ | ❌ | ❌ |
| 환불 승인 | ✅ | ✅ | ❌ | ❌ |
| 성적 공개 | ✅ | ✅ | ❌ | ❌ |
| 알림관리 접근 | ✅ | ✅ | ✅ | ❌ |
| 성장관리 메뉴 | ✅ | ✅ | ✅ | ❌ |
| 학생 성장탭 | ✅ | ✅ | ✅ | ✅ 담당만 |
| SP/엠블럼 지급 | ✅ | ✅ | ✅ | ❌ |
| 엠블럼 정책 | ✅ | ✅ | ❌ | ❌ |
| 권한설정 편집 | ✅ | ❌ | ❌ | ❌ |

---

## SUPER_ADMIN 보호 정책

| 정책 | 적용 파일 |
|------|----------|
| SUPER_ADMIN 직급 등록은 SUPER_ADMIN만 | `EmployeeFormModal.tsx` — validPositions 필터 |
| DIRECTOR가 SUPER_ADMIN 직원 수정 불가 | `EmployeeDetail.tsx` — canProtectedEdit |
| 목록에서 SUPER_ADMIN 직원 퇴직 버튼 미노출 | `EmployeeList.tsx` — canResignEmployee() |
| 상세에서 SUPER_ADMIN 직원 퇴직 버튼 미노출 | `EmployeeDetail.tsx` — canProtectedResign |
| SUPER_ADMIN 자기 자신 퇴직 방지 (양쪽) | emp.accountId === currentUser.id 비교 |
| doResign 내부 방어 코드 | `EmployeeDetail.tsx` — canProtectedResign 재검증 |
| 최고관리자 계정 비밀번호 초기화 타인 불가 | `AuthContext.canResetPassword` |
| 권한 매트릭스 편집 불가 | `PermissionSettings.tsx` — isLocked('SUPER_ADMIN') |

---

## 권한 카테고리 (11개 — 권한설정 화면)

학생관리 / 직원관리 / 반관리 / 수강관리 / 출결관리 / 성적관리 / 재무관리 / 알림관리 / 성장관리 / 시스템설정 / 비밀번호 초기화

---

## 삭제 금지 정책

| 대상 | 처리 방식 |
|------|----------|
| 수강 이력 | 종료/퇴원 status 변경만 |
| 재무 데이터 | 환불/취소 처리만 |
| 발송이력 | 영구 보존 |
| 엠블럼 | 비활성/숨김 토글만 |
| 라이벌 이력 | 관계 종료(ended=true)만 |
| SP 지급 이력 | 영구 보존 |
| 권한 변경 이력 | append-only |
| 성적 공개 후 | 직접 수정 없음 |
| 직원 | 퇴직 상태 변경만 |
| 비밀번호 초기화 | 1건씩만, 전체/일괄 없음 |

---

## 빌드 통과 여부

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 오류 0개 |
| `npm run build` | ✅ 통과 (chunk size 경고 있음, 기능 실패 아님) |

---

## 현재 Mock 상태

| 영역 | 상태 |
|------|------|
| 인증/로그인 | DEV 계정 전환 셀렉터 (운영 배포 전 제거 예정) |
| 직원 계정 | mock — accountId 자동 발급 |
| 권한 저장 | mock — 새로고침 시 초기값 복원 |
| 알림 발송 | mock 이력 생성 (카카오/SMS 미연동) |
| 재무 수납/환불 | mock 처리 (결제 API 미연동) |
| 성장 → 출결 Hook | placeholder 구조만 준비 |
| 성장 → IF Hook | placeholder 구조만 준비 |

---

## 모바일/앱 최적화 전 고려사항

현재 Admin Back Office는 데스크톱 사이드바 기반 레이아웃입니다.
향후 모바일/앱 전환 시 아래 항목을 개선해야 합니다.

| 항목 | 현재 상태 | 향후 개선 방향 |
|------|----------|--------------|
| 사이드바 | 고정 세로 사이드바 | 모바일: bottom navigation 또는 top tab으로 교체 |
| 학생 상세 탭 | 다중 탭 (7개) | 모바일: 스크롤 섹션 또는 탭 축소 |
| 권한 매트릭스 | 대형 테이블 | 모바일: 카테고리별 접기/펼치기 구조 |
| 성장관리 차트 | 인라인 테이블 | 모바일: 카드형 변환 고려 |
| DEV 셀렉터 | 사이드바 하단 | 운영 배포 전 제거 |

**이번 단계에서 모바일 앱은 만들지 않음** — 위 항목은 향후 개선 기록 목적.

---

## 학생 상세 탭 구조 (확정)

| 탭 | 접근 권한 | 비고 |
|----|---------|------|
| 기본정보 | 전체 Back Office | |
| 보호자·가족정보 | 전체 Back Office | |
| 수강이력 | 전체 Back Office | |
| 출결현황 | 전체 Back Office | |
| 성적조회 | `assessment.resultView` | 공개/채점완료 기준만 표시 |
| 재무상태 | `finance.view` | |
| 성장/진열장 | `canViewStudentGrowth` | TEACHER: 담당 학생만 / 보호자 노출 금지 |
| 운영메모 | Back Office 운영직(`isBackOfficeType`) | |

---

## 다음 추천 개발 단계

1. **Growth v3 — 출결 실제 연동**
   - `AttendanceContext.checkAttendance()` → `onAttendanceEvent()` 자동 호출
   - 월 개근, 연속 개근, 누적 출석 엠블럼 자동 진행

2. **Growth v3 — IF 실제 연동**
   - `AssessmentContext.gradeSubmission()` 완료 후 `onIfAnalysisResult()` 자동 호출

3. **Growth v3 — SP 임계값 엠블럼 자동 지급**
   - totalSP 500/2000 달성 시 자동 지급 트리거

4. **권한 저장 실연동**
   - 백엔드 API 연동으로 권한 영구 저장

5. **직원 계정 실연동**
   - Account Engine 실제 연동

6. **학생/보호자 포털 (별도 앱)**
   - BackOfficeGate 차단 → 포털 분리
   - 나의 진열장, 성적 조회, 출결 확인

7. **실제 인증**
   - DEV 전환 UI 제거, 세션 기반 로그인

8. **모바일/앱 최적화**
   - Bottom Navigation 도입, 카드형 레이아웃 전환

---

## QA 체크리스트 (Release Checkpoint v1 기준)

| 항목 | 결과 |
|------|------|
| `tsc --noEmit` 오류 0개 | ✅ |
| `npm run build` 통과 | ✅ |
| 메뉴명 '반관리' 통일 (수업관리 제거) | ✅ |
| 메뉴명 '성적관리' 통일 (성적 관리 제거) | ✅ |
| 전체 라우팅 정상 | ✅ |
| TEACHER 재무/알림/성장 메뉴 차단 | ✅ |
| TEACHER 담당 학생 성장탭 조회 | ✅ |
| STAFF 재무 정산 확정 불가 | ✅ |
| STAFF SP/엠블럼 지급 가능 | ✅ |
| SUPER_ADMIN 자기 자신 퇴직 방지 | ✅ |
| DIRECTOR SUPER_ADMIN 수정/퇴직 차단 | ✅ |
| 성적 공개 알림 mock 이력 | ✅ |
| 재무 환불/미납 알림 mock 이력 | ✅ |
| 삭제 금지 정책 위반 없음 | ✅ |
| Growth Showcase Foundation v1 문구 제거 | ✅ |
| README 최신화 | ✅ |
| INTEGRATION.md 최신화 | ✅ |
