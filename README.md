# AXIS LMS v1.2 — Baseline

> **AXIS LMS v1.2 baseline** — 이 버전은 AXIS LMS의 현재 확정 기준 프로젝트입니다.
> `npm install`, `npm run typecheck`, `npm run build` 정상 통과가 확인된 상태로 고정되었습니다.
> 다음 작업 지시 전까지 이 구조(RBAC, 학생관리, 수업관리, 출결관리, 메뉴 구조)는 변경하지 않습니다.

---

## 기술 스택

- **빌드 도구**: Vite 6
- **프레임워크**: React 18 + TypeScript 5
- **라우팅**: wouter (react-router 미사용)
- **스타일**: Tailwind CSS v4 (`@import "tailwindcss"`, `@theme inline` — CSS-first 설정)
- **토스트**: sonner
- **아이콘**: lucide-react
- **ID 생성**: nanoid

데이터는 전부 React Context 기반 인메모리 더미 데이터로 동작하며, 별도 백엔드/DB 연동은 없습니다.

---

## 디렉터리 구조

```
axis-lms-v1.2/
├── index.html              # Vite 엔트리 HTML
├── package.json
├── vite.config.ts          # @ alias → src/, React + Tailwind v4 플러그인
├── tsconfig.json           # 참조용 루트 (app/node 분리)
├── tsconfig.app.json       # src/ 애플리케이션 코드용 (strict 모드)
├── tsconfig.node.json      # vite.config.ts 전용
└── src/
    ├── main.tsx             # React 엔트리포인트
    ├── App.tsx              # 라우터 + 전역 Provider 조립
    ├── index.css            # Tailwind v4 + AXIS 디자인 토큰(axis-card, axis-sidebar 등)
    ├── global.d.ts          # 타입체크 보조용 선언
    │
    ├── pages/                          # 화면 단위 컴포넌트 (라우트와 1:1 대응)
    │   ├── StudentList.tsx             # 학생 목록
    │   ├── StudentDetail.tsx           # 학생 상세 (기본정보/보호자·가족/수강현황/출결현황/성적조회/재무상태 탭)
    │   ├── StudentNew.tsx              # 학생 등록
    │   ├── ClassList.tsx               # 반 목록 (반 등록 모달 포함)
    │   ├── ClassDetail.tsx             # 반 상세
    │   ├── AttendanceCheck.tsx         # 출결체크
    │   ├── AttendanceStatus.tsx        # 출결현황
    │   ├── AssessmentList.tsx          # 성적 관리: 시험 목록 (시험 등록 모달 포함)
    │   ├── AssessmentDetail.tsx        # 성적 관리: 시험 상세 (기본정보/응시자목록/채점현황/결과분석 4탭)
    │   ├── FinancePayments.tsx         # 재무관리: 수납관리 (기본 화면)
    │   ├── FinanceRefunds.tsx          # 재무관리: 환불관리 (요청→승인/반려→완료)
    │   ├── FinanceUnpaid.tsx           # 재무관리: 미납관리 (조회 전용, 알림 mock)
    │   ├── FinanceSettlements.tsx      # 재무관리: 정산관리 (원장/최고관리자만 확정)
    │   ├── FinanceStatistics.tsx       # 재무관리: 통계 (월별/반별/유형별, 차트 라이브러리 없이 표+바)
    │   ├── NotFound.tsx                # 404
    │   └── settings/
    │       ├── PermissionSettings.tsx          # 직급별 권한설정
    │       ├── PasswordResetManagement.tsx     # 비밀번호 초기화 관리 (1건 단위만 허용)
    │       └── AcademyInfoManagement.tsx       # 학원정보관리
    │
    ├── components/
    │   ├── AdminLayout.tsx       # Back Office 레이아웃 — 사이드바 메뉴, RBAC 메뉴 필터링
    │   ├── ClassFormModal.tsx    # 반 등록/수정 모달
    │   ├── EnrollmentFormModal.tsx # 학생 상세 "반 등록" 모달 (Enrollment 생성)
    │   ├── FinanceSummaryCards.tsx # 재무관리 공용 요약 카드(청구금액/수납완료/미납금액/환불금액)
    │   ├── AssessmentFormModal.tsx # 시험 등록 모달 (기본정보/문항 구성 2탭, 문항 단위 혼합 채점 설정)
    │   ├── StatusBadge.tsx       # 상태 배지 공통 컴포넌트
    │   ├── ErrorBoundary.tsx     # 전역 에러 바운더리
    │   └── ui/                  # shadcn 스타일 최소 UI 프리미티브 (button, input, select, dialog, alert-dialog, sonner, tooltip 등)
    │
    ├── contexts/
    │   ├── AuthContext.tsx        # 인증/권한 컨텍스트 (Account Engine + RBAC Foundation)
    │   ├── StudentContext.tsx     # 학생 데이터 CRUD
    │   ├── ClassContext.tsx       # 반 데이터 CRUD
    │   ├── EnrollmentContext.tsx  # 수강(Enrollment) 데이터 관리 — Finance Engine 준비용 단일 진실 공급원
    │   ├── AttendanceContext.tsx  # 출결 세션/기록 관리
    │   ├── AssessmentContext.tsx  # 시험 생성/채점/공개/정정 관리
    │   ├── FinanceContext.tsx     # 청구/수납/환불/정산/영수증 관리 (Enrollment 기준, 삭제 기능 없음,
    │   │                          #   enrollments 변경 시 매월 청구서 자동 생성, 수납 시 영수증 자동 발급)
    │   └── ThemeContext.tsx       # 테마 Provider (현재 light 고정 패스스루)
    │
    ├── lib/                      # 실제 데이터/타입 모듈 (모든 페이지가 `@/lib/...`로 import)
    │   ├── rbac.ts                # Position / PermissionGroup / PermissionKey / canResetPassword 등 RBAC 핵심
    │   ├── dummyData.ts           # 학생 더미 데이터 + Student/ClassInfo/Guardian 등 타입
    │   ├── classData.ts           # 반 더미 데이터 + ClassRoom 타입
    │   ├── enrollmentData.ts      # 수강(Enrollment) 더미 데이터 + 타입, Finance Engine 연동용 조회 helper
    │   ├── attendanceData.ts      # 출결 더미 데이터 + AttendanceStatus 등 타입
    │   ├── assessmentData.ts      # 시험 더미 데이터 + Exam/ExamSubmission 타입, 채점/공개 판정 파생 함수
    │   ├── financeData.ts         # 청구/수납/환불/정산/영수증 mock 데이터 + 타입, 일할계산 함수
    │   │                          #   (중도등록/중도퇴원), 매월 자동 청구서 생성 함수, 재무 권한 helper
    │   ├── studentDerived.ts      # 학생 화면에서 쓰는 파생 계산(수강현황, 재무, 모의고사 등)
    │   └── utils.ts               # `cn` 헬퍼(clsx + tailwind-merge)
    │
    ├── layouts/
    │   └── AdminLayout.tsx       # `@/components/AdminLayout`를 재노출(re-export)
    │
    └── utils/
        ├── rbac.ts               # `@/lib/rbac`를 재노출
        └── studentDerived.ts     # `@/lib/studentDerived`를 재노출
```

### `lib/` vs `layouts/`·`utils/`에 대한 참고

모든 페이지·컴포넌트는 실제로 `@/lib/rbac`, `@/lib/studentDerived`, `@/components/AdminLayout` 경로로 import합니다.
`src/layouts/AdminLayout.tsx`와 `src/utils/rbac.ts`, `src/utils/studentDerived.ts`는 그 실제 구현을 가리키는
**재노출(re-export) 전용 파일**이며, 별도의 구현을 갖지 않습니다. 두 위치 중 하나만 수정하면 다른 쪽은 자동으로
최신 상태가 유지됩니다 — 실제 코드를 고칠 때는 `src/lib/`, `src/components/` 쪽의 구현을 수정하세요.

---

## 라우트 구성 (`src/App.tsx`)

| 경로 | 컴포넌트 | 비고 |
|---|---|---|
| `/` | → `/students` 리다이렉트 | |
| `/students` | `StudentList` | |
| `/students/new` | `StudentNew` | |
| `/students/:id` | `StudentDetail` | |
| `/classes` | `ClassList` | `?new=1` 쿼리로 반 등록 모달 자동 오픈 |
| `/classes/new` | → `/classes?new=1` 리다이렉트 | 구버전 URL 호환용 |
| `/classes/:id` | `ClassDetail` | |
| `/attendance/check` | `AttendanceCheck` | |
| `/attendance` | `AttendanceStatus` | |
| `/settings` | → `/settings/academy` 리다이렉트 | |
| `/settings/academy` | `AcademyInfoManagement` | |
| `/settings/permissions` | `PermissionSettings` | |
| `/settings/password-reset` | `PasswordResetManagement` | |
| `/scores` | `AssessmentList` | `?new=1` 쿼리로 시험 등록 모달 자동 오픈 |
| `/scores/new` | → `/scores?new=1` 리다이렉트 | 구버전 URL 호환용 |
| `/scores/:id` | `AssessmentDetail` | 기본정보/응시자목록/채점현황/결과분석 4탭 |
| 그 외 | `NotFound` | |

라우터 전체는 `BackOfficeGate`로 감싸져 있으며, 학생/보호자 계정(`STUDENT`/`GUARDIAN`)은 모든 라우트
대신 접근 제한 안내만 표시됩니다(강사 등 그 외 계정은 Back Office에 들어올 수 있고, 화면/데이터 단위
제한은 각 화면의 `canAccessClass()`/`canAccessExam()`/`can()` 등 RBAC로 처리됩니다).

---

## 메뉴 구조 (`src/components/AdminLayout.tsx`)

| 1차 메뉴 | 하위 메뉴 | 필요 권한 |
|---|---|---|
| 학생관리 | 학생 등록 / 학생 목록 | `student.create` / `student.view` |
| 수업관리 | 반 등록 / 반 목록 | `class.create` / `class.view` |
| 출결관리 | 출결체크 / 출결현황 | `attendance.check` / `attendance.view` |
| 성적 관리 | (단일 메뉴) | `assessment.view` |
| 재무관리 | 수납관리 / 환불관리 / 미납관리 / 정산관리 / 통계 | `finance.view` (모두 동일 — 세부 액션은 화면 내에서 `finance.paymentCreate`/`refundRequest`/`refundApprove`/`receiptIssue`/`settlementConfirm`으로 추가 게이트) |
| 시스템설정 | 학원정보관리 / 권한설정 / 비밀번호 초기화 관리 | `system.logoUpdate` / `system.permissionView` / `system.passwordReset` |

메뉴는 `can()` 결과로 동적 필터링되어, 보유한 권한이 없는 항목은 사이드바에서 보이지 않습니다.

---

## RBAC 구조 (`src/lib/rbac.ts`, `src/contexts/AuthContext.tsx`)

**핵심 원칙**: 직급(`Position`)과 권한(`PermissionKey`)은 분리되어 있습니다. `AccountType`은 로그인 분기와
데이터 범위(`DataScope`) 결정에 쓰이는 "계정의 큰 유형"이고, 실제 권한설정 화면(`PermissionSettings.tsx`)은
`Position` 기준 `PermissionGroup`으로 관리됩니다.

**직급(Position)**: 최고관리자, 원장, 부원장, 실장, 팀장, 강사, 행정, 학생(포털 전용), 보호자(포털 전용)

**권한 키 그룹**: `student.*`, `employee.*`, `class.*`, `attendance.*`, `assessment.*`, `finance.*`, `system.*`

**안전장치 (변경하지 않는 항목)**:
- 시험 생성(`assessment.create`)은 최고관리자·원장만 보유.
- 비밀번호 초기화는 항상 1건 단위로만 동작(전체/일괄 초기화 기능 없음).
- 최고관리자 계정은 누구도 비밀번호를 초기화할 수 없음(`canResetPassword`에서 항상 차단).
- 강사는 본인 담당 학생/반/시험 범위만 조회·관리 가능(`dataScope` + `canAccessStudent`/`canAccessClass`/`canAccessExam`).
- 학생/보호자 계정은 Admin Back Office 자체에 접근할 수 없음(`BackOfficeGate`).
- 반 단위 시험(`classId` 있음)은 전원 채점완료 시 자동으로 학생 성적조회에 반영되고, 학원 전체 시험
  (`classId` 없음)만 명시적 공개(`assessment.publish`) 절차를 거칩니다. 두 경우 모두 미채점 응시자가
  있으면 반영/공개되지 않습니다. 결석 처리된 학생은 성적 계산(평균/최고/최저, 성적조회 반영)에서 제외됩니다.
- 재무관리는 SUPER_ADMIN/DIRECTOR/STAFF만 접근 가능(`finance.view`) — 부원장/실장/팀장/강사/학생/보호자는
  메뉴 자체가 노출되지 않습니다. 정산 확정(`finance.settlementConfirm`)과 환불 승인(`finance.refundApprove`)은
  DIRECTOR/SUPER_ADMIN만 가능하고 STAFF는 보유하지 않습니다. 매출·수납 데이터를 삭제하는 기능은
  존재하지 않습니다(상태 변경만 가능 — `FinanceContext.tsx`에 delete 계열 함수 자체가 없음).

---

## Assessment Engine (성적관리)

시험 종류는 `src/lib/assessmentData.ts`의 `EXAM_CATEGORIES` 배열(카탈로그) 구조로 관리되어 추후 무제한
추가할 수 있습니다(기본값: 입학테스트/단원평가/인증평가/내신대비모의고사/수능실전모의고사). 문항은
객관식·OX·단답형(자동채점)과 서술형·증명형·풀이형(수동채점)을 한 시험 안에 섞어 구성할 수 있습니다
(문항 단위 혼합 채점). 채점현황 탭에서 자동채점 문항은 학생 답안을 입력하면 즉시 정답과 비교해
채점되고, 수동채점 문항은 점수를 직접 입력합니다.

시험 진행 상태는 "준비중/응시중/채점중" 같은 사용자 운영 상태로 노출하지 않고, 공개 여부
(`publishedAt`)와 채점 완료 여부만으로 판단한 파생 단계(`getExamPhase` → `미채점 있음`/`채점 완료`/
`공개 완료`)로 화면에 표시합니다.

공개(또는 반영)된 시험 결과는 학생 상세의 성적조회 탭에 자동으로 나타납니다(`getPublishedResultsForStudent`).
성적 종류에 따라 내신대비모의고사/수능실전모의고사 필터와 연동되고, 단원평가·인증평가·입학테스트는
별도 "교내 평가" 영역에 표시되며 대학추천 데이터 판단(`getUnivDataStatus`)에는 사용되지 않습니다.
공개완료(또는 반영) 이후의 점수 변경은 채점현황에서 직접 수정할 수 없고, 결과분석 탭의 "정정" 절차
(사유 필수, 이력 기록)를 통해서만 가능합니다.

---

## 알려진 제약 / TODO (참고용 — 이번 단계에서 해결 대상 아님)

- `src/components/ui/*`는 Radix 의존성 없는 최소 구현입니다(button, input, select, dialog, alert-dialog 등).
- `classData.ts`의 `ClassRoom`에는 `category` 필드가 없어, `studentDerived.ts`/`StudentDetail.tsx`에서는
  `subject` 값을 그대로 사용합니다.
- 직원(employee) 마스터 데이터 연동, 권한 복사/변경 이력 실제 구현, 학생·보호자 전용 포털 분리는
  아직 진행되지 않았습니다.
- Assessment Engine은 관리자/강사용 답안 입력 MVP 수준입니다. 문제은행 연동, OMR, 학생 제출 포털,
  실제 AI 분석, 대학추천 실제 계산, Rival/Emblem/IF 분석 본구현, Notification Engine 실제 API 연동,
  재무관리 연결은 포함하지 않았습니다.
- 학생 성적조회 탭에 반영되는 Assessment Engine 결과는 시험명·시험일·총점만 표시합니다(`MockExamScore`
  처럼 과목별 등급·백분위 세부 분석은 제공하지 않습니다 — 시험관리 엔진은 문항 단위 총점 중심입니다).
- Enrollment Foundation 도입 후 학생-반 연결은 세 곳에 동기적으로 존재합니다: `EnrollmentContext`
  (신규, Finance Engine 단일 진실 공급원이자 Attendance Engine의 출결 대상자 산출 기준),
  `ClassContext.studentClassMap`(Assessment Engine의 시험 응시 대상자 산출이 참조), `Student.classes`
  (StudentList 필터/배지, 재무탭, 강사 권한범위 계산이 참조). `EnrollmentContext`의 등록/종료/퇴원
  함수가 세 곳을 함께 갱신해 동기화를 보장하지만, 완전한 단일화는 Finance Engine 본체 단계에서
  검토할 수 있습니다. (Attendance × Enrollment Integration v1부터 `AttendanceCheck.tsx`는
  `getActiveEnrollmentsByClass()`를 직접 사용하도록 전환되었습니다 — `studentClassMap`을 거치지 않습니다.)
- `AssessmentEngine`의 더미 시험(`exam-001`, cls-001 대상)의 응시자 더미(stu-001/002/003)와 이번에
  정리한 `CLASS_STUDENT_MAP`/`Enrollment` 더미(cls-001 수강생: stu-001/002)가 완전히 일치하지는 않습니다
  (stu-003은 Enrollment 상 cls-001 수강 이력이 없는데 그 반 시험에는 응시자로 들어가 있음). 서로 다른
  라운드에서 독립적으로 만들어진 시드 데이터의 디테일 차이이며, 핵심 기능 동작에는 영향이 없습니다.

---

## 디자인 참고 (현재 구현에는 반영되지 않음)

이전에 만든 GitHub Pages 정적 사이트(`css`/`images`/`js`/`index.html` 구조, `axis-lab.xyz`)는
**디자인 무드보드 참고용**입니다. 로고, 이미지, 색감, 첫 화면 분위기, 브랜드 톤을 참고할 때만 사용하며,
이 Vite + React + TypeScript 프로젝트의 구조나 코드를 그 정적 사이트 구조로 되돌리거나 덮어쓰지 않습니다.

---

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build
npm run preview    # 빌드 결과 미리보기
```
