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
| 시스템설정 | — | ✅ 완료 | 학원정보관리/권한설정/비밀번호 초기화 |

## 라우팅 구조

```
/                          → /students (리다이렉트)
/students                  학생 목록
/students/new              학생 등록
/students/:id              학생 상세 (탭: 기본정보/보호자·가족/수강현황/출결현황/성적조회/재무상태/성장·진열장)

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
| 학생관리 (조회/등록/수정) | ✅ | ✅ | ✅ | 담당만 | ❌ |
| 재무관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 재무 정산 확정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 환불 승인 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 알림관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 성적 공개 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 성장관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 학생 성장/진열장 탭 | ✅ | ✅ | ✅ | ✅ (담당만) | ❌ |
| SP/엠블럼 수동 지급 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 엠블럼 정책 관리 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 라이벌 전체 관리 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Admin Back Office 접근 | ✅ | ✅ | ✅ | ✅ | ❌ (포털 예정) |

## 삭제 금지 정책

다음 데이터는 삭제 기능 자체가 없으며, 상태 변경(soft) 방식으로만 처리합니다.

- 수강 이력 → 종료/퇴원 상태로 변경
- 재무 데이터 (수납/청구서) → 환불/취소 처리
- 발송이력 → 삭제 없음 (영구 보존)
- 엠블럼 → 비활성/숨김 처리
- 라이벌 이력 → 관계 종료 처리
- SP 지급 이력 → 삭제 없음 (영구 보존)
- 성적 공개 후 → 직접 수정 없음

## 개발 명령어

```bash
npm install
npm run dev          # 개발 서버 (http://localhost:5173)
npm run build        # 프로덕션 빌드
npx tsc --noEmit     # 타입 검사
```

## DEV 계정 전환

사이드바 하단 `DEV` 셀렉터로 계정 전환 가능 (운영 배포 전 제거 예정):

| 계정 | 직급 | 비고 |
|------|------|------|
| 한태준 | 최고관리자 | 전체 권한 |
| 원장님 | 원장 | 정산 확정/성적 공개 가능 |
| 행정 담당 | 행정(STAFF) | 재무 정산/환불 승인 불가 |
| 김민준 | 강사 | cls-001, cls-002 담당 |
| 학생 데모 | 학생 | BackOfficeGate 차단 확인용 |
| 보호자 데모 | 보호자 | BackOfficeGate 차단 확인용 |
