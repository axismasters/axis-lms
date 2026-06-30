# AXIS LMS v1.2 — Finance MVP Acceptance QA and Permission Freeze v1 buildfix

## 기준 baseline

56. Finance Payments Filter and Settlement Auto Generation v1 buildfix  
GitHub Actions 정상 통과 완료 상태를 기준으로 진행한다.

## 산출물 성격

이번 산출물은 재무관리 MVP의 수납 / 미납 / 정산 흐름을 QA하고, 발견된 최소 회귀 위험만 수정하는 freeze 산출물이다.
대학분석 Phase 5.1은 freeze 상태로 유지하며 변경하지 않는다.

## 원본 zip 검사 결과

| 항목 | 결과 |
|---|---|
| zip wrapper 폴더 | 없음 |
| 실제 코드 파일 포함 | 있음 |
| 문서-only 산출물 여부 | 아님 |
| TypeScript/TSX 큰 문법 위험 | 발견되지 않음 |
| React hooks 위치 | FinancePayments / FinanceUnpaid / FinanceSettlements 모두 early return 이전 유지 |
| 정산 month/id 혼동 | 원본에서 수정 시도됨 |
| 대학분석 freeze 침범 | 코드 변경 없음 |
| buildfix 필요 여부 | 필요 |

## 원본 zip에서 발견한 문제

### 1. `INTEGRATION.md` 문서 오염

원본 `INTEGRATION.md`에 과거 대학분석 TargetGap buildfix 문서와 이전 재무 stability/payments 문서가 함께 섞여 있었다.
이 상태로 업로드하면 baseline 기록이 잘못 누적될 수 있다.

### 2. `src/lib/classData.ts` 전체 덮어쓰기 위험

원본은 담당강사 helper 하나를 추가하기 위해 `src/lib/classData.ts` 전체 파일을 포함했다.
하지만 이번 작업의 핵심 범위는 Finance QA freeze이며, 반 관리 더미 데이터 파일 전체를 덮어쓰면 다른 모듈의 반 데이터/타입 변경을 회귀시킬 위험이 있다.

ChatGPT buildfix에서는 `classData.ts`를 산출물에서 제외하고, `FinancePayments.tsx` 내부에 로컬 `getClassTeacherName(cls: unknown)` helper를 둬서 동일 목적을 달성했다.

### 3. 담당강사 helper 안정성

원본 `classData.ts`의 helper는 실제로 `cls?.teacher`만 읽었다.
이전 buildfix 취지는 `teacher`, `teacherName`, `instructorName`, `mainTeacher` 중 존재하는 값을 안전하게 읽는 것이었다.

ChatGPT buildfix에서는 기존 안전 helper 형태를 유지했다.

```ts
function getClassTeacherName(cls: unknown): string {
  const record = cls as { teacher?: string; teacherName?: string; instructorName?: string; mainTeacher?: string } | null | undefined;
  return record?.teacher ?? record?.teacherName ?? record?.instructorName ?? record?.mainTeacher ?? '';
}
```

## buildfix 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/pages/FinancePayments.tsx` | `classData.ts` import 제거, 로컬 담당강사 helper 유지, hook early return 이전 유지 |
| `src/pages/FinanceUnpaid.tsx` | 원본 QA 수정 유지, hook early return 이전 유지 |
| `src/pages/FinanceSettlements.tsx` | 원본 QA 수정 유지, confirmTarget을 month 기준으로 유지 |
| `INTEGRATION.md` | 이번 Finance QA freeze 전용 문서로 정리 |

## 유지된 Finance QA 항목

### 수납관리

- Enrollment 기준 청구/수납 행 유지
- 학생 1명 복수 수강 시 수강별 청구 구분 유지
- 월 / 반 / 담당강사 / 학생명 / 수납상태 / 수납수단 필터 유지
- 미납관리에서 `/admin/finance/payments?invoiceId=...` 이동 시 수납 등록 모달 자동 오픈 유지
- 완납/취소/잔여 0원 청구서 자동 오픈 방지 유지
- 수납금액 잔여 미납액 초과 방지 유지
- 영수증 발급/보기 흐름 유지

### 미납관리

- `UNPAID`, `PARTIAL` 청구만 표시 유지
- 수강상태 컬럼 유지
- 퇴원/종료 수강 미납 식별 유지
- 수납 등록 버튼은 `canCreatePayment(can)` 권한 기반으로 노출
- 실제 카카오/SMS 발송 없이 mock 알림 placeholder 유지

### 정산관리

- 월별 총 청구액 / 총 수납액 / 총 미납액 / 총 환불액 / 순매출 표시 유지
- Settlement 레코드 없는 월 감지 유지
- 정산 생성 버튼 유지
- 정산 확정 버튼은 원장/최고관리자 권한만 가능
- `confirmTarget`은 settlement id가 아니라 month 기준으로 유지
- 확정된 정산의 수정/삭제 기능 추가 없음

## AXIS LMS v1.2 재무 권한 확인

| 권한 항목 | 상태 |
|---|---|
| 원장/최고관리자 재무 접근 | 유지 |
| 행정 재무 접근 | 유지 |
| 부원장/실장/강사/학생/학부모 재무 접근 차단 | 유지 |
| 행정 수납 등록 가능 | 유지 |
| 행정 환불 요청 가능 | 기존 구조 유지 |
| 행정 영수증 발급 가능 | 유지 |
| 행정 미납 관리/조회 가능 | 유지 |
| 행정 정산 확정 불가 | 유지 |
| 행정 환불 최종 승인 불가 | 기존 구조 유지 |
| 원장/최고관리자 정산 확정 가능 | 유지 |

## 절대 회귀 금지 확인

| 항목 | 상태 |
|---|---|
| `TeacherExamGrading.tsx` scopedExam → visibleExam 타입픽스 | 이번 zip에서 변경 없음 |
| `StudentDetail.tsx` adapterMockSummaries `ReturnType` 타입픽스 | 이번 zip에서 변경 없음 |
| 대학분석 Phase 5.1 API 연동 | 변경 없음 |
| recommendationBand.items UI | 변경 없음 |
| targetGap 상세 UI | 변경 없음 |
| PDF Export | 추가 없음 |
| LMS 내부 대학추천 계산/합격률 계산 | 추가 없음 |
| 실제 PG 결제 연동 | 추가 없음 |
| 실제 카카오/SMS 발송 | 추가 없음 |
| `wouter useSearch` 재도입 | 없음 |
| `cls.teacher` 직접 접근 | 없음 |
| 정산 month/id 혼동 | 없음 |

## GitHub 업로드 여부

필요 있음.

단, 원본 zip이 아니라 ChatGPT buildfix zip을 사용한다.

덮어쓸 파일:

```text
src/pages/FinancePayments.tsx
src/pages/FinanceUnpaid.tsx
src/pages/FinanceSettlements.tsx
INTEGRATION.md
```

업로드 방식:

```text
zip 파일 자체를 GitHub에 올리지 말고,
압축 해제 후 내부 파일을 같은 경로에 덮어쓴다.
```

## 커밋명 후보

```text
재무 MVP 권한 QA 동결 반영
```

## baseline 추가

```text
57. Finance MVP Acceptance QA and Permission Freeze v1 buildfix
```

## 다음 작업 후보

재무관리 MVP는 이번 baseline에서 1차 freeze 처리 가능하다.
다음 단계는 전체 운영 투입 전 QA 또는 권한/RBAC 전역 점검이 적절하다.
