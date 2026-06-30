# AXIS LMS v1.2 — Finance Payments Filter and Settlement Auto Generation v1 buildfix

## 검사 결론

원본 `axis-lms-v1_2-finance-payments-filter-settlement-auto-generation-v1.zip`은 repo 루트 기준 경로 구조는 정상이지만, 그대로 GitHub에 업로드하면 React hooks rule 및 정산 확정 로직 회귀 위험이 있다.

ChatGPT buildfix에서 아래 문제를 수정했다.

## 기준 baseline

`55. Finance Engine Monthly Settlement Refund Delinquency Stability v1 buildfix` 이후 기준.

## 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/contexts/FinanceContext.tsx` | Claude 원본 유지. `generateSettlementForMonth` 추가 구조 유지 |
| `src/pages/FinancePayments.tsx` | hooks 위치 수정, wouter `useSearch` 의존 제거, 담당강사 필드 접근 안전화 |
| `src/pages/FinanceRefunds.tsx` | Claude 원본 유지. 20일 초과 환불 차단 및 hooks 위치 정상 |
| `src/pages/FinanceSettlements.tsx` | 정산 확정 시 month/id 혼동 수정 |
| `src/pages/FinanceUnpaid.tsx` | hooks 위치 수정 |
| `INTEGRATION.md` | finance buildfix 전용 문서로 정리 |

## 원본 zip 문제 및 buildfix 내용

### 1. `FinancePayments.tsx` hooks 위치 회귀 수정

원본은 `canManageFinance(can)` 권한 early return 뒤에 `filtered`, `summary` `useMemo`가 있었다.

React hooks rule 회귀 위험이 있으므로 모든 `useState`, `useMemo`, `useEffect`가 권한 return 이전에 호출되도록 이동했다.

### 2. `FinanceUnpaid.tsx` hooks 위치 회귀 수정

원본은 권한 early return 뒤에 `unpaidList`, `summary` `useMemo`가 있었다.

buildfix에서 두 `useMemo`를 early return 이전으로 이동했다.

### 3. `FinanceSettlements.tsx` 정산 확정 month/id 혼동 수정

원본 `handleConfirm`은 `confirmTarget`에 settlement id를 넣어두고, `settlementMap.has(confirmTarget)`을 검사했다.

그러나 `settlementMap`은 month 기준 Map이므로, DRAFT 정산 확정 시 다음과 같은 잘못된 흐름이 발생할 수 있었다.

```text
confirmTarget = settlement.id
settlementMap.has(settlement.id) = false
generateSettlementForMonth(settlement.id) 호출
```

즉 `stl-auto-${id}` 형태의 잘못된 월 정산 레코드가 생성될 위험이 있었다.

buildfix에서는 `confirmTarget`을 settlement id가 아니라 month로 통일했다.

```text
setConfirmTarget(month)
settlementMap.get(confirmTarget)
confirmSettlement(settlement.id, currentUser.name)
```

레코드가 없는 달은 먼저 `generateSettlementForMonth(month)`로 생성하고, 재렌더 후 확정하도록 처리했다.

### 4. `FinancePayments.tsx` `useSearch` 의존 제거

원본은 `wouter`의 `useSearch`를 사용했다.

프로젝트 wouter 버전에 따라 export 여부가 다를 수 있어 build risk가 있으므로, buildfix에서는 `window.location.search`를 안전 가드와 함께 사용했다.

```typescript
const searchStr = typeof window !== 'undefined' ? window.location.search : '';
```

신규 route는 추가하지 않았고, 기존 `/admin/finance/payments?invoiceId=...` 흐름은 유지했다.

### 5. 담당강사 필드 접근 안전화

원본은 `ClassRoom.teacher` 직접 접근을 사용했다.

현재 repo의 ClassRoom 타입이 `teacher`, `teacherName`, `instructorName`, `mainTeacher` 중 어느 필드를 쓰는지 확정되지 않은 상태에서 직접 접근하면 타입 오류 위험이 있다.

buildfix에서는 helper로 안전화했다.

```typescript
function getClassTeacherName(cls: unknown): string {
  const record = cls as { teacher?: string; teacherName?: string; instructorName?: string; mainTeacher?: string } | null | undefined;
  return record?.teacher ?? record?.teacherName ?? record?.instructorName ?? record?.mainTeacher ?? '';
}
```

## AXIS LMS v1.2 재무 원칙 준수 확인

| 원칙 | 상태 |
|---|---|
| 재무는 Enrollment 기준 | 유지 |
| 학생 1명 복수 수강 시 수강별 청구 구분 | 유지 |
| 미납 → 수납 등록 연결 | 유지 |
| 월별 Settlement 누락 감지 및 생성 | 유지 |
| 정산 확정은 원장/최고관리자만 | 유지 |
| 행정은 정산 확정 불가 | 유지 |
| 퇴원 20일 초과 환불 요청 차단 | 유지 |
| 알림/카카오 실제 연동 없음 | 유지 |
| 신규 route 추가 없음 | 유지 |
| PDF Export 없음 | 유지 |

## 회귀 방지 확인

| 항목 | 상태 |
|---|---|
| `src/pages/teacher/TeacherExamGrading.tsx` 미포함/미변경 | 유지 |
| `src/pages/StudentDetail.tsx` 미포함/미변경 | 유지 |
| 대학분석 Phase 5.1 파일 미포함/미변경 | 유지 |
| `FinanceRefunds.tsx` 20일 초과 직접 입력 우회 없음 | 유지 |
| `FinancePayments.tsx` hooks early return 전 위치 | 수정 완료 |
| `FinanceUnpaid.tsx` hooks early return 전 위치 | 수정 완료 |
| `FinanceSettlements.tsx` id/month 혼동 제거 | 수정 완료 |

## 자체 검사

- zip wrapper 폴더 없음
- repo 루트 기준 경로 정상
- TypeScript `transpileModule` 문법 검사 통과
- hooks 위치 정적 점검 통과
- 전체 `npm run build`는 전체 repo가 없어 실행 불가

## GitHub 업로드 여부

필요 있음.

원본 zip이 아니라 buildfix zip을 압축 해제한 뒤 내부 파일을 같은 경로에 덮어쓴다.

업로드 대상 파일:

```text
src/contexts/FinanceContext.tsx
src/pages/FinancePayments.tsx
src/pages/FinanceRefunds.tsx
src/pages/FinanceSettlements.tsx
src/pages/FinanceUnpaid.tsx
INTEGRATION.md
```

## 커밋명 후보

```text
수납관리 필터 정산 자동생성 반영
```

## baseline 추가

```text
56. Finance Payments Filter and Settlement Auto Generation v1 buildfix
```
