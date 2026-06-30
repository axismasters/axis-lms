# AXIS LMS v1.2 — RBAC Global Permission QA and Freeze v1 buildfix

## 작업 개요

Finance MVP freeze 이후 전체 RBAC/권한 구조 QA 산출물을 검사했고, 업로드 전 회귀 위험 1건을 보정했다.
이번 buildfix는 대규모 권한 구조 변경이 아니라 `FinancePayments.tsx`의 담당강사 helper 회귀 위험 제거와 문서 정리 목적이다.

## ChatGPT buildfix 반영 내역

| # | 원본 산출물 문제 | buildfix 수정 |
|---|---|---|
| 1 | `FinancePayments.tsx`가 `ClassRoom` 타입을 `classData.ts`에서 직접 import하고 `cls?.teacher`만 읽도록 변경됨 | `classData.ts` import 제거, 이전 buildfix의 unknown 안전 helper 복원 |
| 2 | 이전 Claude 명령에서 “ClassRoom.teacher 직접 접근으로 되돌리지 말라”고 했는데, 원본은 helper 내부에서 단일 `teacher` 필드에 다시 의존 | `teacher / teacherName / instructorName / mainTeacher` fallback 유지 |
| 3 | 원본 문서는 실제 검사 여부를 확정하기 어려운 RBAC 파일 md5/QA 내용을 강하게 단정 | 이번 buildfix 문서에서는 산출물 기준으로 확인 가능한 변경과 정책 검토 결과만 정리 |

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `src/pages/FinancePayments.tsx` | 수정 | `ClassRoom` import 제거, 로컬 `getTeacherName(cls: unknown)` 안전 helper 유지 |
| `INTEGRATION.md` | 수정 | 이번 작업 전용 buildfix 문서로 정리 |

## 변경 상세

### `src/pages/FinancePayments.tsx`

유지해야 하는 helper 구조:

```typescript
function getTeacherName(cls: unknown): string {
  const record = cls as { teacher?: string; teacherName?: string; instructorName?: string; mainTeacher?: string } | null | undefined;
  return record?.teacher ?? record?.teacherName ?? record?.instructorName ?? record?.mainTeacher ?? '';
}
```

의도:

- 작은 helper 추가를 위해 `src/lib/classData.ts` 전체 파일을 덮어쓰지 않는다.
- `ClassRoom` 타입 export/필드명 변화로 인한 build 회귀 위험을 줄인다.
- 담당강사 표시/필터 기능은 유지한다.

## 산출물 기준 QA 결과

| 항목 | 결과 |
|---|---|
| zip 래퍼 폴더 | 없음 |
| 포함 파일 | `src/pages/FinancePayments.tsx`, `INTEGRATION.md` |
| TypeScript TSX transpile 검사 | 통과 |
| React hook 위치 | `canManageFinance` early return 이전 유지 |
| wouter `useSearch` import | 없음 |
| `classData.ts` 전체 덮어쓰기 | 없음 |
| 대학분석 파일 변경 | 없음 |
| 재무 환불/미납/정산 freeze 파일 변경 | 없음 |

## RBAC 정책 검토 결과

이번 zip 자체에는 RBAC 핵심 파일(`src/lib/rbac.ts`, `AdminLayout`, route 파일 등)이 포함되어 있지 않으므로, 해당 파일들의 실제 내용 변경 여부는 이 산출물만으로는 재검증할 수 없다.
다만 이번 산출물이 직접 변경하는 `FinancePayments.tsx`는 기존 `canManageFinance`, `canCreatePayment`, `canIssueReceipt` 권한 게이트 구조를 유지한다.

유지해야 하는 AXIS LMS v1.2 권한 원칙:

- 재무 접근 가능: 원장, 행정
- 재무 접근 불가: 부원장, 실장, 강사, 학생, 학부모
- 행정 가능: 수납 등록, 환불 요청, 영수증 발급, 미납 관리, 조회
- 행정 불가: 매출 삭제, 정산 확정, 재무 설정 변경, 환불 최종 승인
- 원장 가능: 전체 조회, 정산 확정, 환불 승인, 재무 설정 관리

## GitHub 업로드 여부

필요 있음.

단, 원본 zip이 아니라 buildfix zip을 압축 해제해 같은 경로에 덮어쓴다.

덮어쓸 파일:

```text
src/pages/FinancePayments.tsx
INTEGRATION.md
```

## 커밋명

```text
RBAC 전역 권한 QA 동결 반영
```

## baseline 추가

```text
58. RBAC Global Permission QA and Freeze v1 buildfix
```

## 회귀 방지 메모

다음 작업에서도 아래 사항을 유지한다.

1. `classData.ts` 전체 덮어쓰기 금지
2. 작은 helper 추가를 위해 공용 데이터 파일 수정 금지
3. `ClassRoom.teacher` 단일 필드 직접 의존으로 되돌리지 말 것
4. React hook을 조건부 return 뒤에 두지 말 것
5. wouter `useSearch` 재추가 금지
6. 대학분석 freeze 범위 수정 금지
7. 재무 freeze 범위 수정 금지
