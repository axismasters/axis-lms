# AXIS LMS v1.2 — Parent Finance Home Bridge v1

## ChatGPT QA 판정

이번 zip은 `INTEGRATION.md`만 있는 QA 기록이 아니라, 학부모 홈의 수납 상태 placeholder를 기존 `FinanceContext` 실데이터로 연결하는 실제 기능 Bridge 단계다.

원본 zip의 코드 변경 범위는 적절하나, 업로드본은 현재 확정 baseline 기준을 명확히 하기 위해 정리된 `INTEGRATION.md`와 변경 파일만 포함한다.

## 현재 확정 baseline

- Teacher Workflow Persistence v1 buildfix
- Student Portal Foundation v1
- TeacherExamGrading scopedExam 타입픽스
- Parent Portal Foundation v1
- Admin Back Office QA Cleanup v1
- Teacher Content Engine v1
- Content Visibility Bridge v1
- Content Persistence v1 buildfix
- Content Detail UX v1
- Homework Foundation v1
- Homework Status / Completion v1
- Homework Detail UX v1
- Homework Home Bridge v1
- Parent Homework Bridge v1
- Homework QA Cleanup v1
- Attendance Home Bridge QA v1
- Assessment Home Bridge QA v1
- Portal Home Regression QA v1
- Student Parent Portal Scope QA v1
- Parent Finance View Foundation v1

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/parent/ParentHome.tsx` | 수납 상태 요약을 placeholder에서 `FinanceContext` 실데이터 조회로 교체 |

## 구현 범위

학부모 홈의 수납 상태 섹션이 선택된 자녀(`selectedChildId`) 기준으로 청구/미납 데이터를 표시한다.

기존 `FinanceContext`의 `getInvoicesByStudent`, `getUnpaidAmount`만 사용하며 새 Provider나 재무 데이터 구조는 추가하지 않는다. 취소 청구서(`CANCELED`)는 요약에서 제외한다.

## QA 확인

| 항목 | 상태 |
|------|------|
| 선택 자녀 `selectedChildId` 기준으로만 수납 요약 조회 | 정상 |
| 취소 청구서 `CANCELED` 제외 | 정상 |
| 청구액/미납액/완납 상태 표시 | 정상 |
| `/parent/finance` 이동 링크 유지 | 정상 |
| 기존 자녀 선택/수강 반/출결/성적/숙제/공개자료 섹션 유지 | 정상 |
| 납부 등록/환불 요청/수정/삭제 버튼 없음 | 정상 |
| 학부모 화면에 라이벌/경쟁/엠블럼 정보 미노출 | 정상 |

## 변경하지 않은 파일

- `src/pages/parent/ParentFinance.tsx`
- `src/routes/ParentRoutes.tsx`
- `src/contexts/FinanceContext.tsx`
- `src/pages/teacher/TeacherExamGrading.tsx`
- Layout / Provider 전체
- Admin Back Office 전체

## 보류 유지

- 실제 결제/PG 연동 없음
- 환불 신청 기능 없음
- 영수증 PDF 출력 없음
- 카카오 알림톡/수납 알림 추가 없음
- NGD2 연동 없음
- 문제은행 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.
