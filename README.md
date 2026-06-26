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
    │   ├── NotFound.tsx                # 404
    │   └── settings/
    │       ├── PermissionSettings.tsx          # 직급별 권한설정
    │       ├── PasswordResetManagement.tsx     # 비밀번호 초기화 관리 (1건 단위만 허용)
    │       └── AcademyInfoManagement.tsx       # 학원정보관리
    │
    ├── components/
    │   ├── AdminLayout.tsx       # Back Office 레이아웃 — 사이드바 메뉴, RBAC 메뉴 필터링
    │   ├── ClassFormModal.tsx    # 반 등록/수정 모달
    │   ├── StatusBadge.tsx       # 상태 배지 공통 컴포넌트
    │   ├── ErrorBoundary.tsx     # 전역 에러 바운더리
    │   └── ui/                  # shadcn 스타일 최소 UI 프리미티브 (button, input, select, dialog, alert-dialog, sonner, tooltip 등)
    │
    ├── contexts/
    │   ├── AuthContext.tsx        # 인증/권한 컨텍스트 (Account Engine + RBAC Foundation)
    │   ├── StudentContext.tsx     # 학생 데이터 CRUD
    │   ├── ClassContext.tsx       # 반 데이터 CRUD
    │   ├── AttendanceContext.tsx  # 출결 세션/기록 관리
    │   └── ThemeContext.tsx       # 테마 Provider (현재 light 고정 패스스루)
    │
    ├── lib/                      # 실제 데이터/타입 모듈 (모든 페이지가 `@/lib/...`로 import)
    │   ├── rbac.ts                # Position / PermissionGroup / PermissionKey / canResetPassword 등 RBAC 핵심
    │   ├── dummyData.ts           # 학생 더미 데이터 + Student/ClassInfo/Guardian 등 타입
    │   ├── classData.ts           # 반 더미 데이터 + ClassRoom 타입
    │   ├── attendanceData.ts      # 출결 더미 데이터 + AttendanceStatus 등 타입
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
| `/scores` | 플레이스홀더 | "성적 관리" 미구현 안내 화면 |
| 그 외 | `NotFound` | |

라우터 전체는 `BackOfficeGate`로 감싸져 있으며, `isBackOfficeType(currentUser.accountType)`이 아닌 계정
(학생/보호자)은 모든 라우트 대신 접근 제한 안내만 표시됩니다.

---

## 메뉴 구조 (`src/components/AdminLayout.tsx`)

| 1차 메뉴 | 하위 메뉴 | 필요 권한 |
|---|---|---|
| 학생관리 | 학생 등록 / 학생 목록 | `student.create` / `student.view` |
| 수업관리 | 반 등록 / 반 목록 | `class.create` / `class.view` |
| 출결관리 | 출결체크 / 출결현황 | `attendance.check` / `attendance.view` |
| 성적 관리 | (단일 메뉴) | `assessment.view` |
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

---

## 알려진 제약 / TODO (참고용 — 이번 단계에서 해결 대상 아님)

- `src/components/ui/*`는 Radix 의존성 없는 최소 구현입니다(button, input, select, dialog, alert-dialog 등).
- `classData.ts`의 `ClassRoom`에는 `category` 필드가 없어, `studentDerived.ts`/`StudentDetail.tsx`에서는
  `subject` 값을 그대로 사용합니다.
- 직원(employee) 마스터 데이터 연동, 권한 복사/변경 이력 실제 구현, 학생·보호자 전용 포털 분리는
  아직 진행되지 않았습니다.

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
