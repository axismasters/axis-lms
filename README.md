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
| 성장관리 / 나의 진열장 | Foundation v2 | ✅ 완료 | SP이력/엠블럼/라이벌/Hook 구조 |
| 통합 QA | v1 | ✅ 완료 | 라우팅/권한/엔진 연결 검증 |
| 직원관리 | HR Stabilization v1 | ✅ 완료 | 직원등록/목록/상세/퇴직 처리 |
| 권한관리 | RBAC Stabilization v1 | ✅ 완료 | 11카테고리 매트릭스/복사/이력/복원 |
| **Release Checkpoint** | UI Consistency QA v1 | ✅ 완료 | 메뉴명 통일, 오래된 문구 정리, 문서 최신화 |

## 관리자 메뉴 구조

| 메뉴명 | 경로 | 비고 |
|--------|------|------|
| 학생관리 | `/students` | 학생 등록/목록/상세 |
| 직원관리 | `/employees` | 직원 등록/목록/상세 |
| **반관리** | `/classes` | (이전: 수업관리 → 반관리로 통일) |
| 출결관리 | `/attendance` | 출결체크/현황 |
| **성적관리** | `/scores` | (이전: 성적 관리 → 성적관리로 통일) |
| 재무관리 | `/finance` | 수납/환불/미납/정산/통계 |
| 성장관리 | `/growth` | 성장현황/엠블럼관리/라이벌관리 |
| 알림관리 | `/notifications` | 발송이력/템플릿/설정 |
| 시스템설정 | `/settings` | 학원정보/권한설정/비밀번호 초기화 |

## 라우팅 구조

```
/                          → /students (리다이렉트)

/students                  학생 목록
/students/new              학생 등록
/students/:id              학생 상세 (탭: 기본정보/보호자·가족/수강이력/출결현황/성적조회/재무상태/성장·진열장/운영메모)

/employees                 직원 목록
/employees?new=1           직원 등록 (모달)
/employees/:id             직원 상세

/classes                   반 목록
/classes/:id               반 상세 (현재 수강생 포함)

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
| 수강관리 전체 | ✅ | ✅ | ✅ | 담당 조회만 | ❌ |
| 재무관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 재무 정산 확정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 환불 승인 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 알림관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 성적 공개 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 성장관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 학생 성장/진열장 탭 | ✅ | ✅ | ✅ | ✅ 담당만 | ❌ |
| SP/엠블럼 수동 지급 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 엠블럼 정책 관리 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 권한설정 편집 | ✅ | ❌ | ❌ | ❌ | ❌ |
| SUPER_ADMIN 직원 수정/퇴직 | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin Back Office | ✅ | ✅ | ✅ | ✅ | ❌ 포털 예정 |

## 직원관리 구조

- **직급(인사정보)과 권한(RBAC)은 분리**
- **조교 직급 없음** — 최고관리자/원장/부원장/실장/팀장/강사/행정
- **계정 자동 생성** — 직원 등록 시 휴대폰번호 기반 (현재 mock)
- **계정 생성 메뉴 없음**

## 최고관리자 보호 정책

- SUPER_ADMIN 직급 생성/변경: **SUPER_ADMIN만 가능**
- DIRECTOR가 SUPER_ADMIN 직원 수정/퇴직: **불가** (목록·상세 양쪽)
- SUPER_ADMIN 자기 자신 퇴직: **실수 방지 차단** (목록·상세 양쪽)
- 최고관리자 계정 비밀번호 초기화: **타인 불가**

## 삭제 금지 정책

다음 데이터는 삭제 기능 없음. 상태 변경(soft)·취소·비활성만 허용.

- 수강 이력 / 재무 데이터 / 발송이력 / 엠블럼 / 라이벌 이력 / SP 지급 이력
- 권한 변경 이력 (append-only)
- 성적 공개 후 직접 수정 없음
- 비밀번호 전체/일괄 초기화 없음

## 개발 명령어

```bash
npm install
npm run dev          # 개발 서버 (http://localhost:5173)
npm run build        # 프로덕션 빌드
npx tsc --noEmit     # 타입 검사
```

## DEV 계정 전환 (운영 배포 전 제거 예정)

사이드바 하단 `DEV` 셀렉터:

| 계정 | 직급 | 확인 포인트 |
|------|------|------------|
| 한태준 | 최고관리자 | 전체 권한, 권한설정 편집, 자기 자신 퇴직 차단 |
| 원장님 | 원장 | 정산 확정/성적 공개, SUPER_ADMIN 직원 수정 불가 |
| 행정 담당 | 행정 | 재무 접근 O / 정산·환불승인 X / 성적공개 X |
| 김민준 | 강사 | 재무/알림/성장 메뉴 없음, 담당 학생 성장탭 |
| 학생 데모 | 학생 | BackOfficeGate 차단 |
| 보호자 데모 | 보호자 | BackOfficeGate 차단 |
