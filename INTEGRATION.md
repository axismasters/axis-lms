# AXIS LMS v1.2 — Finance Engine Monthly Settlement Refund Delinquency Stability v1 buildfix

## 검사 결과

Claude 원본 zip(`axis-lms-v1_2-finance-monthly-settlement-refund-delinquency-stability-v1.zip`)은 repo 루트 기준 경로 구조는 정상이나, AXIS LMS v1.2 재무 원칙과 일부 충돌 및 회귀 위험이 있어 ChatGPT buildfix를 생성했다.

## 원본 zip 포함 파일

- `src/lib/financeData.ts`
- `src/pages/FinanceRefunds.tsx`
- `src/pages/FinanceUnpaid.tsx`
- `INTEGRATION.md`

## 원본 문제점

1. `퇴원 20일 이내만 일할 환불` 원칙을 `자동 제안 20일 이내 / 20일 초과 직접 입력 허용`으로 해석했다.
   - AXIS LMS v1.2 원칙은 20일 초과 시 일할 환불 불가 또는 제한 안내다.
   - 따라서 20일 초과 퇴원 건은 이번 MVP에서 환불 요청 등록을 막도록 수정했다.
2. `FinanceRefunds.tsx`, `FinanceUnpaid.tsx`에서 일부 hook이 권한 early return 뒤에 있어 React hooks rule/lint 회귀 위험이 있었다.
   - hook 호출을 모두 권한 return 이전으로 이동했다.
3. `INTEGRATION.md` 상단에 이전 대학분석 buildfix 문서가 섞여 있어 baseline 기록 혼동 위험이 있었다.
   - finance buildfix 전용 문서로 정리했다.

## 기준 baseline

`54. University Analysis Phase51 TargetGap Detail UI v1 buildfix`

## buildfix 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/financeData.ts` | 퇴원 20일 초과 시 일할 환불 요청 제한 정책 문구 정정 |
| `src/pages/FinanceRefunds.tsx` | 20일 초과 퇴원 건 환불 요청 등록 차단, 입력 비활성화, 제한 안내 문구 적용, hook 순서 안정화 |
| `src/pages/FinanceUnpaid.tsx` | 권한 early return 이전으로 hook 호출 이동 |
| `INTEGRATION.md` | finance buildfix 전용 문서로 정리 |

## 구현/정책 확인

| 항목 | 상태 |
|---|---|
| zip wrapper 폴더 없음 | ✅ |
| repo 루트 기준 덮어쓰기 가능 | ✅ |
| 재무는 Enrollment 기준 | ✅ |
| 퇴원 20일 이내 일할 환불 정책 | ✅ |
| 20일 초과 퇴원 건 제한 안내 및 요청 등록 차단 | ✅ |
| 환불 승인/반려는 canApproveRefund 기준 | ✅ |
| 미납관리 수강상태 컬럼 표시 | ✅ |
| Notification 직접 발송 없음, mock 이벤트 수준 | ✅ |
| 대학분석 freeze 범위 변경 없음 | ✅ |
| PDF Export 없음 | ✅ |
| 문제은행/NGD/OCR 없음 | ✅ |
| 신규 route / Provider 없음 | ✅ |
| TeacherExamGrading 타입픽스 영향 없음 | ✅ |
| StudentDetail adapterMockSummaries 타입픽스 영향 없음 | ✅ |

## GitHub 업로드 여부

필요 있음.

원본 zip이 아니라 이 buildfix zip을 압축 해제해서 내부 파일을 같은 경로에 덮어쓴다.

## 커밋명 후보

```text
재무 월별정산 환불 미납 안정화 반영
```

## baseline 추가

```text
55. Finance Engine Monthly Settlement Refund Delinquency Stability v1 buildfix
```

## 다음 작업 후보

1. Finance Payments 필터 안정화
2. 정산관리 Settlement 자동 생성
3. 미납 알림 mock → Notification Engine 정책 정합성 QA
