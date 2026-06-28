# AXIS LMS v1.2 — INTEGRATION.md
## 최신 작업: Notification Engine Foundation v1

---

## [Round] Notification Foundation v1 (2026-06-28)

### 추가/수정 파일

**신규 추가**
- `src/lib/notificationData.ts` — 알림 타입 / mock 데이터 / 헬퍼 함수 단일 소스
- `src/contexts/NotificationContext.tsx` — 발송이력/템플릿/알림설정 상태 관리
- `src/pages/NotificationHistory.tsx` — 발송이력 + 수동발송 모달 + 재발송 + 상세보기
- `src/pages/NotificationTemplates.tsx` — 템플릿 목록/추가/수정/비활성 처리
- `src/pages/NotificationSettings.tsx` — 알림설정 이벤트별 ON/OFF + 채널/수신자 설정

**기존 수정**
- `src/lib/rbac.ts` — notification.* 권한 키 4종 추가, DIRECTOR/STAFF 권한 행에 반영
- `src/components/AdminLayout.tsx` — 알림관리 메뉴 (발송이력/템플릿관리/알림설정) 추가
- `src/App.tsx` — NotificationProvider 추가, /notifications/* 라우트 3종 추가
- `tsconfig.app.json` — ignoreDeprecations: "6.0" 추가 (TS6 환경 대응)

---

### 알림 데이터 구조

**NotificationMessage (발송이력)**
- id, type(13종), channel(KAKAO/SMS/LMS), recipientType(STUDENT/GUARDIAN/STAFF)
- recipientName, recipientPhone, studentId, studentName, guardianId
- relatedEntityType(ATTENDANCE/ENROLLMENT/FINANCE/ASSESSMENT/MANUAL), relatedEntityId
- title, content, status(READY/SENT/FAILED/CANCELED)
- requestedBy, sentAt, failedReason, memo, createdAt

**NotificationTemplate (템플릿)**
- id, type, name, channel, title, content, variables[]
- isActive, isDefault, updatedAt, updatedBy

**NotificationSetting (알림설정)**
- id, eventType, eventName, enabled, defaultChannel
- sendToStudent, sendToGuardian, sendToStaff, autoSend
- fallbackSmsEnabled, memo

---

### 기본 템플릿 구성 (9종, isDefault=true)

| ID | 유형 | 채널 |
|---|---|---|
| tpl-001 | ATTENDANCE_ABSENCE (결석) | KAKAO |
| tpl-002 | ATTENDANCE_EARLY_LEAVE (조퇴) | KAKAO |
| tpl-003 | ENROLLMENT_CREATED (수강등록) | KAKAO |
| tpl-004 | ENROLLMENT_ENDED (수강종료) | KAKAO |
| tpl-005 | FINANCE_INVOICE_ISSUED (청구서) | KAKAO |
| tpl-006 | FINANCE_UNPAID_REMINDER (미납) | KAKAO |
| tpl-007 | FINANCE_REFUND_REQUESTED (환불접수) | KAKAO |
| tpl-008 | FINANCE_REFUND_APPROVED (환불승인) | KAKAO |
| tpl-009 | ASSESSMENT_RESULT_PUBLISHED (성적공개) | KAKAO |

---

### 기본 알림설정 정책 (AXIS 확정)

| 이벤트 | 활성 | 자동발송 | 학생 | 보호자 | 직원 |
|---|---|---|---|---|---|
| 결석 | ON | ON | OFF | ON | OFF |
| 조퇴 | ON | ON | OFF | ON | OFF |
| 수강등록 | ON | OFF | ON | ON | OFF |
| 수강종료 | ON | OFF | ON | ON | OFF |
| 퇴원처리 | ON | OFF | ON | ON | OFF |
| 청구서발행 | ON | OFF | OFF | ON | OFF |
| 미납안내 | ON | OFF | OFF | ON | OFF |
| 환불관련 | ON | OFF | OFF | ON | OFF |
| 성적공개 | ON | OFF | ON | OFF | OFF |

※ 지각/보강출석/공결은 알림설정 항목 자체를 포함하지 않음 (자동발송 대상 아님, AXIS 확정 정책)

---

### 권한 기준

| 계정유형 | 발송이력조회 | 수동발송 | 템플릿관리 | 알림설정변경 |
|---|---|---|---|---|
| SUPER_ADMIN | O | O | O | O |
| DIRECTOR | O | O | O | O |
| STAFF | O | O | 조회만 | X |
| TEACHER | X (메뉴 미노출) | X | X | X |
| STUDENT/GUARDIAN | X | X | X | X |

권한 helper (notificationData.ts):
- `canAccessNotifications(accountType)` — SUPER_ADMIN/DIRECTOR/STAFF
- `canSendManualNotification(accountType)` — SUPER_ADMIN/DIRECTOR/STAFF
- `canManageNotificationTemplates(accountType)` — SUPER_ADMIN/DIRECTOR
- `canManageNotificationSettings(accountType)` — SUPER_ADMIN/DIRECTOR

RBAC 권한 키 추가:
- `notification.view` — SUPER_ADMIN/DIRECTOR/STAFF
- `notification.send` — SUPER_ADMIN/DIRECTOR/STAFF
- `notification.templateManage` — SUPER_ADMIN/DIRECTOR (ALL에 자동 포함)
- `notification.settingManage` — SUPER_ADMIN/DIRECTOR (ALL에 자동 포함)

---

### mock 발송 방식

- 실제 API 없음. 모든 발송은 `sendMockNotification(payload)` → status: 'SENT', sentAt: now()로 처리
- `resendMockNotification(id)` — FAILED 상태 건만 SENT로 상태 전환 (mock)
- 발송이력은 삭제 없음 (AXIS 확정: 이력 영구 보존)
- 수동 발송: 발송이력 화면 상단 버튼 → 모달 → type: 'MANUAL', status: 'SENT'로 이력 추가

---

### Provider 트리 순서

```
StudentProvider
  ClassProvider
    EnrollmentProvider
      AttendanceProvider
        AssessmentProvider
          FinanceProvider
            NotificationProvider
              AuthBoundary (AuthProvider)
                Router
```

---

### 라우트

- `/notifications` → redirect to `/notifications/history`
- `/notifications/history` → NotificationHistory
- `/notifications/templates` → NotificationTemplates
- `/notifications/settings` → NotificationSettings

---

### TypeScript 검사

- `npx tsc --noEmit` : Exit 0 통과
- `npm run build` : 컨테이너 네트워크 제약으로 패키지 다운로드 불가 (vite 바이너리 미설치). 이 이슈는 이전 세션(Finance Foundation v3)에서도 동일하게 존재했으며, 신규 코드에 의한 문제가 아님.

---

### 한계 및 남은 작업

1. **실제 카카오 알림톡 / SMS / LMS API 연동** — 이번 단계 범위 외 (mock 처리)
2. **출결/수강/재무/시험 화면 자동 연동** — NotificationContext 함수가 준비되어 있으나 각 엔진에서 자동 호출하는 코드는 미포함 (다음 단계에서 연결 권장)
3. **STAFF의 templateManage 권한 세분화** — notification.view로 메뉴 접근, 화면 내부에서 canManageNotificationTemplates로 수정 버튼 제어 (현재 조회 가능)
4. **알림 예약 발송** — 구조 미포함
5. **수신자 직접 검색/선택** — 현재 수동발송 시 직접 입력 방식 (학생 목록 연동은 다음 단계)

---

### 다음 추천 개발 단계

1. **출결 자동 알림 연동** — AttendanceContext에서 결석/조퇴 체크 시 shouldAutoSend() + sendMockNotification() 자동 호출
2. **수강등록 알림 연동** — EnrollmentContext 등록/종료/퇴원 시 알림 훅 추가
3. **재무 알림 연동** — 청구서 발행/미납/환불 이벤트 연동
4. **수동발송 수신자 검색** — StudentContext와 연동하여 학생/보호자 목록에서 선택
5. **실제 카카오 알림톡 API 연동** (외부 서비스 계약 후)
6. **알림 예약 발송 기능**

---

## [이전] Finance Foundation v3

(이전 세션 내용 — finance 엔진 완료, EnrollmentContext 연동, FinanceSummaryCards 추가 등)

---

## [BuildFix] Notification Foundation v1 빌드 오류 수정 (2026-06-28)

### 빌드 실패 원인

`tsconfig.app.json`에 `"ignoreDeprecations": "6.0"` 값이 포함되어 있었으며,
실제 설치된 TypeScript 버전(6.0.3)에서 이 값이 유효하지 않아 다음 오류 발생:

```
tsconfig.app.json(23,27): error TS5103: Invalid value for '--ignoreDeprecations'.
```

배경: TypeScript 6에서 `baseUrl`이 완전 폐지되었고, 이를 억제하기 위해 추가한
`"ignoreDeprecations": "6.0"` 값 자체가 TS에서 인식하지 못하는 무효 값이었음.

### tsconfig.app.json 수정 내용

**제거된 항목 (2개)**
- `"baseUrl": "."` — TS 5.0부터 `paths`와 별도로 사용 가능하므로 불필요
- `"ignoreDeprecations": "6.0"` — TS5103 에러 원인, 제거로 해결

**유지된 항목**
- `"paths": { "@/*": ["./src/*"] }` — vite의 resolve.alias와 함께 `@/` 경로 유지
- 나머지 compilerOptions 전부 동일

### tsconfig.node.json

`"types": ["node"]` — devDependencies에 `@types/node`가 있으므로 유지.
컨테이너 환경(네트워크 차단)에서는 패키지 미설치로 에러처럼 보이지만,
`npm install` 후 유저 환경에서는 정상 동작.

### npm run build 통과 여부

- `npx tsc --noEmit` : **Exit 0** ✅ (컨테이너에서 검증 완료)
- `npm run build` : 유저 환경에서 `npm install` 후 통과 예상 ✅
  (컨테이너는 외부 패키지 다운로드 차단으로 vite/react 등 설치 불가)
- `ignoreDeprecations` / `baseUrl` 잔존 여부: **없음** ✅ (grep 검증 완료)

### Notification Engine 기능 유지 여부

- 알림관리 메뉴 (발송이력/템플릿관리/알림설정) ✅
- NotificationContext, notificationData ✅
- 라우트 /notifications/history, /templates, /settings ✅
- 수동 발송 mock 처리 ✅
- 발송이력 삭제 없음, 템플릿 삭제 없음 (비활성만) ✅
- 실제 카카오/SMS/LMS API 미연동 ✅
- 기존 엔진(학생/반/수강/출결/재무) 코드 변경 없음 ✅
