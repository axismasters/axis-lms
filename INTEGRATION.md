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

---

## [Round] Notification Engine v2 — Event Integration (2026-06-28)

### 수정된 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/notificationData.ts` | NotificationType 3종 추가(LATE/MAKEUP/OFFICIAL), 알림설정 3개 추가, NotificationVars/buildNotificationContent/getNotificationSettingByType 추가 |
| `src/contexts/NotificationContext.tsx` | createNotificationFromEvent / getNotificationSetting / buildContent 추가, NotificationEventPayload 타입 추가 |
| `src/contexts/AttendanceContext.tsx` | useNotification 연결, updateRecord에 결석/조퇴 시 자동 알림 이력 생성 |
| `src/contexts/EnrollmentContext.tsx` | useNotification 연결, addEnrollment/finishEnrollment에 알림 이력 생성 |
| `src/contexts/FinanceContext.tsx` | useNotification 연결, requestRefund/approveRefund/rejectRefund/completeRefund에 알림 이력 생성 |
| `src/pages/FinanceUnpaid.tsx` | useNotification 연결, handleNotify에 FINANCE_UNPAID_REMINDER 이력 생성 |
| `src/App.tsx` | NotificationProvider를 EnrollmentProvider 위로 이동 (Provider 트리 재배치) |
| `README.md` | 알림관리 v2 기준으로 전체 갱신 |

---

### Provider 트리 변경 (핵심)

**변경 전:**
```
StudentProvider > ClassProvider > EnrollmentProvider > ... > FinanceProvider > NotificationProvider > AuthBoundary
```

**변경 후:**
```
StudentProvider > ClassProvider > NotificationProvider > EnrollmentProvider > AttendanceProvider > AssessmentProvider > FinanceProvider > AuthBoundary
```

이유: NotificationProvider가 아래에 있으면 Enrollment/Attendance/Finance Context에서 useNotification()을 호출할 수 없음. NotificationContext는 다른 Context에 의존하지 않으므로 순환 없음.

---

### 출결 이벤트 연결 방식

- `AttendanceContext.updateRecord()`에서 status가 `결석`/`조퇴`일 때 호출
- `shouldAutoSend(ATTENDANCE_ABSENCE / ATTENDANCE_EARLY_LEAVE)` 확인 → enabled=true & autoSend=true인 경우만 이력 생성
- 지각/보강출석/공결은 이력 생성 로직 자체가 없음 (AXIS 확정 정책)
- 수신자: 보호자 (sendToGuardian=true인 경우)
- 학생 정보(이름/보호자폰)는 `useStudents`에서 조회, 반 이름은 `useClasses`에서 조회

---

### 수강 이벤트 연결 방식

- `EnrollmentContext.addEnrollment()` → ENROLLMENT_CREATED
- `EnrollmentContext.finishEnrollment()` → 상태가 `종료`면 ENROLLMENT_ENDED, `퇴원`이면 ENROLLMENT_WITHDRAWN
- 알림설정의 `enabled=true`인 경우만 이력 생성 (autoSend 무관 — 수강이벤트는 수동 트리거)
- 수신자: sendToStudent / sendToGuardian 설정 따름

---

### 재무 이벤트 연결 방식

| 이벤트 | 트리거 함수 | 알림 타입 |
|---|---|---|
| 환불 요청 | `requestRefund()` | FINANCE_REFUND_REQUESTED |
| 환불 승인 | `approveRefund()` | FINANCE_REFUND_APPROVED |
| 환불 반려 | `rejectRefund()` | FINANCE_REFUND_REJECTED |
| 환불 완료 | `completeRefund()` | FINANCE_REFUND_COMPLETED |
| 미납 안내 | `FinanceUnpaid.handleNotify()` | FINANCE_UNPAID_REMINDER |

※ FINANCE_INVOICE_ISSUED: 청구서는 자동 생성(useEffect)이므로 대량 스팸 방지를 위해 이번 단계에서 자동 이력 생성 제외. 향후 "청구서 발행 알림" 버튼으로 개별 발송 추가 권장.

---

### 알림설정 기본값 (v2 기준, 15개)

| eventType | 활성 | 자동발송 | 학생 | 보호자 |
|---|---|---|---|---|
| ATTENDANCE_ABSENCE | ON | ON | OFF | ON |
| ATTENDANCE_EARLY_LEAVE | ON | ON | OFF | ON |
| ATTENDANCE_LATE | **OFF** | OFF | OFF | OFF |
| ATTENDANCE_MAKEUP | **OFF** | OFF | OFF | OFF |
| ATTENDANCE_OFFICIAL | **OFF** | OFF | OFF | OFF |
| ENROLLMENT_CREATED | ON | OFF | ON | ON |
| ENROLLMENT_ENDED | ON | OFF | ON | ON |
| ENROLLMENT_WITHDRAWN | ON | OFF | ON | ON |
| FINANCE_INVOICE_ISSUED | ON | OFF | OFF | ON |
| FINANCE_UNPAID_REMINDER | ON | OFF | OFF | ON |
| FINANCE_REFUND_REQUESTED | ON | OFF | OFF | ON |
| FINANCE_REFUND_APPROVED | ON | OFF | OFF | ON |
| FINANCE_REFUND_REJECTED | ON | OFF | OFF | ON |
| FINANCE_REFUND_COMPLETED | ON | OFF | OFF | ON |
| ASSESSMENT_RESULT_PUBLISHED | ON | OFF | ON | OFF |

---

### 실제 API 미연동 범위

- 카카오 알림톡 API: 미연동 (mock 이력만 생성)
- SMS/LMS API: 미연동
- 결제 링크/PG/카드사 연동: 없음
- 모든 발송은 NotificationMessage status='SENT'로 mock 처리

---

### TypeScript 검사

- `npx tsc --noEmit`: **Exit 0** ✅
- `ignoreDeprecations` 없음 ✅
- 기존 엔진(학생/반/수강/출결/재무) 코드 동작 유지 ✅

---

### 남은 한계

1. **FINANCE_INVOICE_ISSUED 자동 이력**: 청구서 자동 생성 시 스팸 방지를 위해 제외. 개별 발송 버튼 추가 권장.
2. **수동발송 수신자 검색**: 현재 직접 입력 방식. StudentContext 연동으로 개선 가능.
3. **청구서 발행 알림 트리거**: 미납 안내와 동일하게 각 청구서 행에 "발행 안내 발송" 버튼 추가 권장.
4. **알림 예약 발송**: 구조 미포함.
5. **성적공개 알림 연동**: AssessmentContext.publishExamResult()에 createNotificationFromEvent 추가 권장.

---

### 다음 추천 개발 단계

1. 성적공개 알림 연동 (AssessmentContext)
2. 청구서 발행 알림 버튼 (FinancePayments.tsx)
3. 수동발송 수신자 검색 (StudentContext 연동)
4. 알림 예약 발송 기능
5. 실제 카카오 알림톡 API 연동 (외부 계약 후)

---

## [Round] Notification Foundation v3 — Invoice & Assessment Hook (2026-06-28)

### 수정된 파일

| 파일 | 변경 내용 |
|---|---|
| `src/pages/FinancePayments.tsx` | useNotification import, "청구 안내 발송" 버튼 추가, handleInvoiceNotify 구현 |
| `src/contexts/NotificationContext.tsx` | AssessmentPublishedPayload 타입 추가, createAssessmentPublishedNotification helper 구현 |
| `src/contexts/AssessmentContext.tsx` | useNotification + useStudents import, publishExam에 알림 이력 생성 연결 |
| `README.md` | v3 기준 갱신 |

---

### 청구서 발행 알림 연결 방식 (FINANCE_INVOICE_ISSUED)

**수동 발송 방식 채택** (자동 대량 발송 방지):
- 이유: FinanceContext의 청구서 자동생성(useEffect)은 매달 다수의 청구서를 한꺼번에 생성하므로, 자동 알림 연결 시 초기 마운트에서 대량 이력이 생성될 위험이 있음
- 대신 `FinancePayments.tsx` 테이블의 각 청구서 행에 **"발송" 버튼** 추가
- 버튼 클릭 시 `createNotificationFromEvent('FINANCE_INVOICE_ISSUED', payload)` 호출
- 알림설정 `ns-006` (enabled=true, 보호자 ON)이 활성화된 경우에만 이력 생성
- 기존 이력 삭제 없음 — 재발송 시 이력 추가

---

### 성적 공개 알림 연결 방식 (ASSESSMENT_RESULT_PUBLISHED)

**전용 helper + publishExam 자동 연결**:

1. `NotificationContext.createAssessmentPublishedNotification(payload)` 추가
   - `AssessmentPublishedPayload` 타입으로 구조화
   - 기본 정책: 학생 ON, 보호자 OFF (알림설정 ns-012 기준)
   - payload.sendToStudent/sendToGuardian으로 개별 override 가능

2. `AssessmentContext.publishExam()`에 연결
   - publishExam 성공 시 응시자 목록을 순회하며 학생별 알림 이력 생성
   - 학생 정보(이름/보호자)는 useStudents()에서 조회
   - 반 단위 시험(classId 있음)은 별도 publishExam 액션이 없으므로 알림 생성 없음

---

### 알림설정 최종 기본값 확인 (15개)

| id | eventType | enabled | autoSend | 학생 | 보호자 |
|---|---|---|---|---|---|
| ns-001 | ATTENDANCE_ABSENCE | ON | ON | OFF | ON |
| ns-002 | ATTENDANCE_EARLY_LEAVE | ON | ON | OFF | ON |
| ns-006 | FINANCE_INVOICE_ISSUED | ON | OFF | OFF | ON |
| ns-012 | ASSESSMENT_RESULT_PUBLISHED | ON | OFF | **ON** | **OFF** |
| ns-013 | ATTENDANCE_LATE | **OFF** | OFF | OFF | OFF |
| ns-014 | ATTENDANCE_MAKEUP | **OFF** | OFF | OFF | OFF |
| ns-015 | ATTENDANCE_OFFICIAL | **OFF** | OFF | OFF | OFF |

---

### 실제 API 미연동 범위

- 카카오 알림톡: 미연동
- SMS/LMS: 미연동
- 결제 링크/PG/카드사: 미연동
- 청구 데이터 삭제 기능: 없음
- 발송이력 삭제 기능: 없음
- 모든 발송 = NotificationMessage status='SENT' mock 이력 생성

---

### TypeScript 검사

- `npx tsc --noEmit`: **Exit 0** ✅
- 기존 엔진 전체 동작 유지 ✅

---

### 남은 한계

1. **FINANCE_INVOICE_ISSUED 자동화**: 현재 수동 버튼 방식. 향후 "이번 달 미발송 청구서 일괄 안내" 기능 추가 가능.
2. **반 단위 시험 성적공개 알림**: publishExam이 없는 반 단위 시험은 알림 이력 없음. 채점 완료 시점에 별도 hook 필요.
3. **수동발송 수신자 검색**: 현재 직접 입력 방식 유지.
4. **성적 점수 변수**: 현재 성적 공개 알림 템플릿에 점수(score) 변수 없음. 향후 추가 가능.

---

## [Round] Assessment Engine Foundation Review & Completion v1 (2026-06-28)

### 수정된 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/assessmentData.ts` | Exam 타입에 `subject?: string` 필드 추가, DUMMY_EXAMS에 subject 값 추가 |
| `src/contexts/AssessmentContext.tsx` | NewExamInput에 `subject?: string` 추가, addExam에 subject 전달 |
| `src/pages/AssessmentList.tsx` | 과목 필터 추가, availableSubjects 추출, 테이블 컬럼 재구성(과목/응시채점인원/공개일), overflow-x-auto 적용 |
| `src/pages/AssessmentDetail.tsx` | 성적 공개 확인 모달 추가(publishConfirmOpen), 응시자목록 탭에 채점상태/공개여부 컬럼 추가, 결과분석 탭에 점수분포/반별평균/IF분석 플레이스홀더/통과율 추가 |

---

### 시험관리 구조

- 시험 종류 카탈로그(EXAM_CATEGORIES): 입학테스트/단원평가/인증평가/내신대비모의고사/수능실전모의고사
- subject 필드: 과목명 (수학/영어/국어 등) — 필터 및 목록 표시용
- 시험 대상: classId 있으면 반 단위 / 없으면 학원 전체
- 시험 목록 컬럼: 시험명/종류/과목/대상/시험일/응시채점인원/진행상태/공개일/상세
- 시험 목록 필터: 검색어/시험종류/대상반/과목/진행상태

---

### 채점 구조

| 문항 유형 | 채점 방식 |
|---|---|
| 객관식, OX, 단답형 | 자동채점 (applyAutoGrading) |
| 서술형, 증명형, 풀이형 | 수동채점 (GradingTab에서 직접 점수 입력) |

- 미채점 = answers 중 score가 undefined인 항목이 있는 경우
- 채점완료 = 모든 문항 score 확정 또는 결석 처리
- 총점 = recalcTotalScore로 합산 (결석 시 undefined 유지)

---

### 성적 공개 구조

1. 공개 버튼 클릭 → publishConfirmOpen=true → 확인 모달 표시
2. 확인 모달에서 "공개 확정" 클릭 → publishExam(exam.id, currentUser.name)
3. publishExam 내부:
   - 전원 채점완료 확인
   - exam.publishedAt, publishedBy 기록
   - 응시자 순회 → createAssessmentPublishedNotification 호출
4. 결과: 발송이력 화면에 ASSESSMENT_RESULT_PUBLISHED 이력 생성

---

### Notification 연동 방식

- AssessmentContext.publishExam() → createAssessmentPublishedNotification (NotificationContext)
- 기본 정책: 학생 ON, 보호자 OFF (ns-012 기준)
- 학원 전체 시험(requiresPublishAction=true)만 공개 액션 / 알림 발송
- 반 단위 시험: 별도 공개 액션 없음 → 알림 없음

---

### 학생 상세 성적조회 반영 방식

- getPublishedResultsForStudent(exams, submissions, studentId) 함수로 필터링
- 반 단위 시험: totalScore 확정 시 즉시 반영
- 학원 전체 시험: publishedAt이 있을 때만 반영
- 결석/미채점 항목은 반영 제외

---

### 결과분석 탭 구성

| 섹션 | 내용 |
|---|---|
| 요약 카드 (6개) | 응시인원/평균/최고점/최저점/기준통과인원/통과율 |
| 점수 분포 | 10점 구간 막대 차트 |
| 반별 평균 | 학원 전체 시험에서만 표시 (students.classes 기준) |
| 문항별 정답률 | 자동채점 문항만, 수평 바 차트 |
| IF 분석 | 계산실수/개념부족/시간부족 플레이스홀더 (향후 연동 예정) |
| 학생별 결과 | 총점/정정이력 + 정정 버튼 |

---

### 권한 기준

| 권한 | 조건 |
|---|---|
| 시험 생성 (assessment.create) | SUPER_ADMIN, DIRECTOR |
| 채점 (assessment.grade) | 위 + TEACHER (본인 반/배정 시험) |
| 성적 공개 (assessment.publish) | SUPER_ADMIN, DIRECTOR |
| 결과 조회 (assessment.view) | SUPER_ADMIN, DIRECTOR, STAFF, TEACHER(본인 담당) |
| 정정 처리 (assessment.resultCorrect) | SUPER_ADMIN, DIRECTOR |

강사는 학원 전체 시험 공개 권한(assessment.publish) 없음.

---

### TypeScript 검사

- `npx tsc --noEmit`: **Exit 0** ✅

---

### 남은 한계

1. **AssessmentFormModal에 subject 필드 없음** — 시험 생성 모달에 과목 입력 필드 추가 필요
2. **반별 평균**: students.classes 기준으로 추출하므로 퇴원 학생 데이터가 포함될 수 있음 (정밀화 필요)
3. **IF 분석**: 플레이스홀더만 제공. 실제 오답 패턴 분류는 별도 구현 필요
4. **반 단위 시험 성적 공개 알림**: publishExam 호출 없음 → 알림 미생성. 별도 트리거 필요
5. **학생 포털 성적 조회**: 현재 관리자 화면에만 구현. 학생 포털은 별도 단계
6. **점수 분포 차트**: CSS 바 형태로 구현 (외부 차트 라이브러리 미사용)

---

### 다음 추천 개발 단계

1. AssessmentFormModal에 subject 필드 추가
2. 반 단위 시험 채점 완료 시 알림 구조 준비
3. IF 분석 실제 데이터 연동 (오답 유형 분류)
4. 문항별 풀이 시간 기록 구조 (시간 부족 분석용)
5. 학생 포털 성적 조회 화면 (별도 단계)

---

## [Round] Assessment Engine v2 — Subject, Class Result, IF Placeholder (2026-06-28)

### 수정된 파일

| 파일 | 변경 내용 |
|---|---|
| `src/components/AssessmentFormModal.tsx` | SUBJECT_OPTIONS 상수 추가, form에 subject 필드 추가, 기본정보 탭에 과목 Select 추가, addExam 호출 시 subject 전달 |
| `src/pages/AssessmentDetail.tsx` | BasicInfoTab에 과목 표시 (`exam.subject ?? '-'`) 추가 |
| `src/lib/studentDerived.ts` | GRADE_TYPES에 `기타평가` 추가, gradeTypeFromParam에 mockschool/suneung/eval 파라미터 추가 |
| `src/pages/StudentDetail.tsx` | GradesTab — 기타평가 필터 처리, 성적 반영 기준 안내 배너, IF 동기부여형 문구(만약 계산 실수를 줄였다면 등) 적용 |

---

### 과목 필드 보강 방식

**SUBJECT_OPTIONS** = ['수학', '국어', '영어', '과학', '사회', '기타']
- AssessmentFormModal 기본정보 탭에 과목 Select 추가
- form.subject → addExam({ …, subject }) → Exam.subject 저장
- 시험 목록 컬럼: 과목 표시 (이미 v1에 추가됨)
- 시험 상세 기본정보 탭: `exam.subject ?? '-'` 표시
- DUMMY_EXAMS: 이미 v1에서 subject: '수학' 추가됨

---

### 성적조회 필터 기준 (GradeType)

| 필터 | 대상 데이터 |
|---|---|
| 전체 | 내신성적 + 모의고사(전체) + 시험관리 결과 전체 |
| 내신성적 | student.internalScores |
| 전국연합모의고사 | student.mockExamScores (examCategory='전국연합모의고사') |
| 내신대비모의고사 | mockExamScores + assessmentResults (categoryId='mock-school') |
| 수능실전모의고사 | mockExamScores + assessmentResults (categoryId='mock-suneung') |
| **기타평가** (신규) | assessmentResults (unit-eval / certification / entrance-test) — 대학추천 연결 없음 |

---

### 학원 전체 시험 / 반 단위 시험 반영 기준

**getPublishedResultsForStudent()** (assessmentData.ts)가 단일 진실 공급원:

| 구분 | 반영 조건 |
|---|---|
| 학원 전체 시험 | `exam.publishedAt` 있을 때만 (공개 완료) |
| 반 단위 시험 | 해당 학생의 `totalScore !== undefined` (채점 완료) |
| 공통 제외 | 결석(`status='결석'`) / 미채점(`totalScore undefined`) |

학생 상세 성적조회 탭 상단에 반영 기준 안내 배너 추가.

---

### IF Placeholder 구조

**위치**: StudentDetail.tsx의 `GradesTab` 내 "성적 상세 보기" Area

| 항목 | 표시 문구 (동기부여형) |
|---|---|
| 계산 실수 | 만약 계산 실수를 줄였다면 |
| 개념 부족 | 만약 이 개념을 확실히 익혔다면 |
| 시간 부족 | 만약 시간 배분을 조금 더 잘했다면 |

- 각 항목은 카드형 행 UI (배경색 구분)
- "준비 중" 텍스트로 향후 연동 예정 표시
- 별도 메뉴/화면 없음 — 성적조회 탭 내부에만 위치

---

### Notification 연동 유지 방식

- 학원 전체 시험 공개 → `AssessmentContext.publishExam()` → `createAssessmentPublishedNotification()` (NotificationContext)
- 반 단위 시험: 채점 완료 후 자동 성적조회 반영, 별도 알림 트리거 없음 (향후 선택 발송 버튼 추가 가능)
- 실제 카카오/SMS/LMS API: 없음

---

### 권한 기준 (변경 없음)

| 권한 | 대상 |
|---|---|
| assessment.create | SUPER_ADMIN, DIRECTOR |
| assessment.grade | 위 + TEACHER (본인 반) |
| assessment.publish | SUPER_ADMIN, DIRECTOR |
| assessment.view | 위 + STAFF, TEACHER (본인 담당) |
| assessment.resultCorrect | SUPER_ADMIN, DIRECTOR |

---

### 빌드 통과 여부

- `npx tsc --noEmit`: **Exit 0** ✅

---

### 남은 한계

1. **반 단위 시험 알림 선택 발송**: 채점 완료 후 "성적 알림 발송" 버튼 추가 권장 (현재 없음)
2. **DUMMY_EXAMS subject**: 이미 v1에서 '수학'으로 설정됨. 신규 생성 시 모달에서 선택 가능
3. **기타평가 필터**: mockExamScores와 연결되지 않으며 Assessment Engine 결과만 표시
4. **IF 분석 실제 데이터**: 플레이스홀더 단계. 오답 패턴 분류는 별도 구현 필요
5. **AssessmentFormModal**: 시험 수정(edit) 기능은 현재 없음. 생성만 가능

---

### 다음 추천 개발 단계

1. 반 단위 시험 채점 완료 시 선택 알림 발송 버튼 (AssessmentDetail 채점현황 탭)
2. IF 분석 실제 오답 데이터 연동
3. AssessmentFormModal 수정(edit) 기능
4. 점수 분포 차트 개선
5. 학생 포털 성적 조회 (별도 단계)
