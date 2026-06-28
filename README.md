# AXIS LMS v1.2 — Admin Back Office

**AXIS** 프리미엄 수학 교육 브랜드의 학원 운영 Back Office 시스템입니다.

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **라우팅**: wouter (hash-based)
- **스타일**: Tailwind CSS v4
- **알림 토스트**: sonner
- **아이콘**: lucide-react

## 완료된 모듈

| 모듈 | 버전 | 상태 | 비고 |
|------|------|------|------|
| 학생관리 | — | ✅ 완료 | 등록/목록/상세/퇴원, 운영메모 |
| 반관리 | — | ✅ 완료 | 반 등록/목록/상세, 수강생 관리 |
| 수강등록 | Foundation v6 | ✅ 완료 | 등록/종료/퇴원, 3-way 동기화 |
| 출결관리 | — | ✅ 완료 | 출결체크, 출결현황, 수강등록 연동 |
| 재무관리 | Foundation v3 | ✅ 완료 | 수납/환불/미납/정산/통계 |
| 알림관리 | Foundation v3 | ✅ 완료 | 전 이벤트 연동, 발송이력/템플릿/설정 |
| 성적관리 | Assessment Engine v2 | ✅ 완료 | 과목필터, 반별/전체 시험, IF분석 placeholder |
| 성장관리 / 나의 진열장 | Foundation v2 | ✅ 완료 | SP이력/엠블럼 보강/Hook 구조 |
| 통합 QA | v1 | ✅ 완료 | 라우팅/권한/엔진 연결 검증 |
| **직원관리** | HR Stabilization v1 | ✅ 완료 | 직원등록/목록/상세/퇴직 처리, SUPER_ADMIN 보호 |
| **권한관리** | RBAC Stabilization v1 buildfix | ✅ 완료 | 11카테고리 매트릭스(수강관리/성장관리 추가)/복사/이력/복원 |
| 시스템설정 | — | ✅ 완료 | 학원정보관리/권한설정/비밀번호 초기화 |

## 라우팅 구조

```
/                          → /students (리다이렉트)

/students                  학생 목록
/students/new              학생 등록
/students/:id              학생 상세

/employees                 직원 목록
/employees?new=1           직원 등록 (모달)
/employees/:id             직원 상세

/classes                   반 목록
/classes/:id               반 상세

/attendance/check          출결체크
/attendance                출결현황

/scores                    시험 목록
/scores/:id                시험 상세 (채점/공개)

/finance/payments          수납관리
/finance/refunds           환불관리
/finance/unpaid            미납관리
/finance/settlements       정산관리
/finance/statistics        통계

/notifications/history     발송이력
/notifications/templates   템플릿관리
/notifications/settings    알림설정

/growth/overview           성장현황
/growth/emblems            엠블럼관리
/growth/rivals             라이벌관리

/settings/academy          학원정보관리
/settings/permissions      권한설정
/settings/password-reset   비밀번호 초기화 관리
```

## 권한 매트릭스 요약

| 기능 | SUPER_ADMIN | DIRECTOR | STAFF | TEACHER | STUDENT/GUARDIAN |
|------|:-----------:|:--------:|:-----:|:-------:|:----------------:|
| 직원관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 직원 등록/수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 수강관리 조회 | ✅ | ✅ | ✅ | ✅ (담당) | ❌ |
| 수강 등록/종료 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 재무관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 재무 정산 확정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 환불 승인 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 알림관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 성적 공개 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 성장관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 학생 성장/진열장 탭 | ✅ | ✅ | ✅ | ✅ (담당만) | ❌ |
| SP/엠블럼 수동 지급 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 엠블럼 정책 관리 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 권한설정 편집 | ✅ | ❌ | ❌ | ❌ | ❌ |
| SUPER_ADMIN 직원 수정/퇴직 | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin Back Office | ✅ | ✅ | ✅ | ✅ | ❌ (포털 예정) |

## 직원관리 구조

- **AXIS 확정 원칙**: 직급(인사정보)과 권한(RBAC)은 분리
- **조교 직급 없음** — 최고관리자/원장/부원장/실장/팀장/강사/행정만 사용
- **계정 자동 생성**: 직원 등록 시 휴대폰번호 기반 계정 자동 생성 (Account Engine, 현재 mock)
- **계정 생성 메뉴 없음**: 직원관리 > 직원 등록을 통해서만 진행

## 최고관리자 보호 정책

- SUPER_ADMIN 직급 생성/변경: **SUPER_ADMIN만 가능** (DIRECTOR 불가)
- DIRECTOR가 기존 SUPER_ADMIN 직원 수정/퇴직 처리: **불가** (목록·상세 양쪽 적용)
- SUPER_ADMIN 본인 퇴직 처리: **실수 방지 차단** (목록·상세 양쪽)
- 목록 화면(`EmployeeList`) `canResignEmployee()` + 상세 화면(`EmployeeDetail`) `canProtectedResign` 이중 방어
- 최고관리자 계정 비밀번호 초기화 타인 불가: `canResetPassword` 로직

## 삭제 금지 정책

- 수강 이력, 재무 데이터, 발송이력, 엠블럼, 라이벌 이력, SP 지급 이력 — 삭제 없음
- 권한 변경 이력 — 삭제 없음 (append-only)
- 성적 공개 후 직접 수정 없음
- 직원 퇴직 처리 — 상태 변경만 (하드 삭제 없음)

## 개발 명령어

```bash
npm install
npm run dev          # 개발 서버 (http://localhost:5173)
npm run build        # 프로덕션 빌드
npx tsc --noEmit     # 타입 검사
```

## DEV 계정 전환

사이드바 하단 `DEV` 셀렉터 (운영 배포 전 제거 예정):

| 계정 | 직급 | 주요 확인 포인트 |
|------|------|----------------|
| 한태준 | 최고관리자 | 전체 권한, 권한설정 편집 |
| 원장님 | 원장 | 정산 확정/성적 공개/환불 승인 |
| 행정 담당 | 행정 | 재무 접근 O, 정산 확정/환불 승인 X |
| 김민준 | 강사 | 재무/알림/성장관리 메뉴 없음, 담당 학생 성장 탭 |
| 학생 데모 | 학생 | BackOfficeGate 차단 |
| 보호자 데모 | 보호자 | BackOfficeGate 차단 |
