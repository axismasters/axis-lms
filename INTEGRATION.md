# AXIS LMS v1.2 — Student Finance Home Bridge v1

## 목적

학생 홈에서 수납 상태를 `FinanceContext` 실데이터와 연결하고, 학생 수납 조회 화면(`/student/finance`)로 이동할 수 있게 한다.

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/pages/student/StudentHome.tsx` | 수납 상태 섹션 추가, `FinanceContext` 조회 함수 연결, `/student/finance` 링크 추가 |

## 구현 내용

- `useFinance()`의 기존 조회 함수만 사용한다.
- `currentUser.assignedStudentIds[0]` 기준으로 학생 본인 수납 내역만 조회한다.
- `CANCELED` 청구서는 학생 홈 요약에서 제외한다.
- 총 청구액과 미납액을 계산해 표시한다.
- 수납 내역이 없으면 빈 상태 문구를 표시한다.
- 미납액이 있으면 `미납 있음`, 없으면 `완납` 배지를 표시한다.
- 카드 클릭 시 `/student/finance`로 이동한다.

## 유지 원칙

- 학생 화면은 조회 전용이다.
- 납부 등록, 환불 신청, 수정, 삭제, 영수증 발급 기능을 추가하지 않았다.
- 학부모 홈, 학부모 수납 화면, 관리자 재무 화면은 변경하지 않았다.
- 실제 결제/PG, 카카오 알림, 영수증 PDF는 구현하지 않았다.
- 문제은행/NGD2, Rival/Emblem/IF는 연결하지 않았다.
- `src/pages/teacher/TeacherExamGrading.tsx`는 변경하지 않았다.

## 검증 메모

- 원본 zip에는 실제 코드 변경이 포함되어 있었으나, `INTEGRATION.md`의 이전 마일스톤 요약에 업로드 제외 항목이 섞여 있어 업로드용 문서를 정리했다.
- `FinanceContext`에 `getInvoicesByStudent`, `getUnpaidAmount`가 존재함을 확인했다.
- `/student/finance`는 Student Finance View Foundation v1에서 이미 연결된 라우트를 사용한다.
- 로컬 workspace에 의존성(`node_modules`)이 없어 `npm run build`는 `tsc: not found`로 실행되지 않았다.
- `npm install`은 registry 403으로 실패해 GitHub Actions 빌드 확인이 필요하다.
