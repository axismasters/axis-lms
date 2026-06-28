# AXIS LMS v1.2 — Admin Back Office

**AXIS** 프리미엄 수학 교육 브랜드의 학원 운영 Back Office 시스템입니다.

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **라우팅**: wouter
- **스타일**: Tailwind CSS v4
- **알림**: sonner
- **아이콘**: lucide-react

## 완료된 모듈

| 모듈 | 상태 | 비고 |
|---|---|---|
| 학생관리 | ✅ 완료 | 등록/상세/퇴원, 수강이력, 성적, 운영메모 |
| 반관리 | ✅ 완료 | 반 등록/상세/수강생 관리 |
| 수강등록 | ✅ 완료 | 수강 등록/종료/퇴원, 3-way 동기화 |
| 출결관리 | ✅ 완료 | 출결 체크, 출결현황, 수강등록 연동 |
| 재무관리 | ✅ 완료 | 수납/환불/미납/정산/통계 (Foundation v3) |
| 알림관리 | ✅ 완료 | Foundation v3 — 전 이벤트 연동 완료 |
| 성적관리 | ✅ 완료 | Assessment Engine v2 — 과목필터/IF분석 플레이스홀더 |
| 성장관리 / 나의 진열장 | ✅ 완료 | Foundation v2 — SP 이력/엠블럼 보강/Hook 준비 |
| 시스템설정 | ✅ 완료 | 학원정보/권한설정/비밀번호 초기화 |

## 성장관리 모듈 구조

- **성장현황** (`/growth/overview`): 학생별 SP/티어/엠블럼/라이벌, 수동 SP/엠블럼 지급, 최근 SP 이력
- **엠블럼관리** (`/growth/emblems`): 엠블럼 추가/수정/활성토글/숨김토글 (삭제 없음)
- **라이벌관리** (`/growth/rivals`): 전체 연결 관계 조회, 승패 mock, 관계 종료
- **학생 상세 성장/진열장 탭**: 티어/SP/엠블럼/SP이력/진행 중 엠블럼/IF힌트

## 권한 요약

| 기능 | SUPER_ADMIN | DIRECTOR | STAFF | TEACHER | STUDENT/GUARDIAN |
|---|---|---|---|---|---|
| 성장관리 메뉴 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 학생 성장/진열장 탭 | ✅ | ✅ | ✅ | ✅(담당만) | ❌ |
| SP/엠블럼 수동 지급 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 엠블럼 정책 관리 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 라이벌 전체 관리 | ✅ | ✅ | ❌ | ❌ | ❌ |

## 개발 명령어

```bash
npm install
npm run dev
npm run build
npx tsc --noEmit
```
