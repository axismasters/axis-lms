# AXIS LMS v1.2 — Admin Back Office

**AXIS** 프리미엄 수학 교육 브랜드의 학원 운영 Back Office 시스템입니다.

## 기술 스택

- **Frontend**: React + TypeScript + Vite
- **라우팅**: wouter
- **스타일**: Tailwind CSS v4
- **아이콘**: lucide-react

## 완료된 모듈

| 모듈 | 상태 | 비고 |
|---|---|---|
| 학생관리 | ✅ 완료 | 등록/상세/퇴원, 수강이력, 성적, 운영메모 |
| 반관리 | ✅ 완료 | 반 등록/상세/수강생 관리 |
| 수강등록 | ✅ 완료 | 수강 등록/종료/퇴원, 3-way 동기화 |
| 출결관리 | ✅ 완료 | 출결 체크, 출결현황, 수강등록 연동 |
| 재무관리 | ✅ 완료 | 수납/환불/미납/정산/통계 (Foundation v3) |
| 성적관리 | ✅ 완료 | 시험 등록/성적 입력/공개 |
| 알림관리 | ✅ 완료 | Foundation v3 — 전 이벤트 연동 완료 |
| 시스템설정 | ✅ 완료 | 학원정보/권한설정/비밀번호 초기화 |

## 알림관리 이벤트 연동 현황 (v3)

| 이벤트 | 연동 방식 | 상태 |
|---|---|---|
| 결석 알림 | AttendanceContext.updateRecord | ✅ 자동 |
| 조퇴 알림 | AttendanceContext.updateRecord | ✅ 자동 |
| 수강 등록/종료/퇴원 | EnrollmentContext | ✅ 자동 |
| 환불 요청/승인/반려/완료 | FinanceContext | ✅ 자동 |
| 미납 안내 | FinanceUnpaid 수동 버튼 | ✅ 수동 |
| 청구서 발행 안내 | FinancePayments 수동 버튼 | ✅ 수동 |
| 성적 공개 알림 | AssessmentContext.publishExam | ✅ 자동 |

## 권한 체계 (RBAC)

7-직급 체계: 최고관리자 / 원장 / 부원장 / 실장 / 팀장 / 강사 / 행정

알림관리 접근: SUPER_ADMIN, DIRECTOR, STAFF만 가능

## 개발 명령어

```bash
npm install
npm run dev
npm run build
npx tsc --noEmit
```
