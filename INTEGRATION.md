# AXIS LMS v1.2 — MVP RC Manual QA Execution v1 buildfix

## 작업 개요

baseline 58 기준 코드 상태에서 실제 QA를 실행하고, 발견된 hooks rule 위반을 수정한다.

ChatGPT buildfix에서는 원본 산출물의 단순 hook 이동을 보강했다.
권한 없는 사용자가 재무 통계 계산 hooks를 실행하지 않도록 `FinanceStatistics`를 권한 gate wrapper와
`FinanceStatisticsContent` inner 컴포넌트로 분리했다.

## 현재 기준 baseline

```
58. RBAC Global Permission QA and Freeze v1 buildfix
```

Global MVP Smoke QA / MVP RC Handoff는 baseline에 반영하지 않았다.

## 실행한 명령 및 환경

| 명령 | 결과 |
|---|---|
| `node --version` | v22.22.2 |
| `npm --version` | 10.9.7 |
| `npm install` | **실행 불가** — npmjs.org 네트워크 차단 (egress allowlist 미설정) |
| `npx tsc -b --noEmit` | **실행 불가** — node_modules 없음 |
| `npm run build` | **실행 불가** — node_modules 없음 |

> build/typecheck를 실행할 수 없었다. 대신 파일 정적 분석(grep, diff, md5)으로 검증했다.  
> 실제 브라우저 실행 및 UI 동작 확인은 이 환경에서 불가하다.

## 발견된 실패 항목

### FAIL: FinanceStatistics.tsx — React hooks rule 위반

```
파일: src/pages/FinanceStatistics.tsx
위반 라인:
  24: if (!canManageFinance(can)) { return (...) }   ← early return
  35: const monthlyStats = useMemo(...)               ← hooks rule 위반
  43: const classStats = useMemo(...)                 ← hooks rule 위반
  57: const typeStats = useMemo(...)                  ← hooks rule 위반
```

3개의 useMemo가 canManageFinance early return 이후에 위치해 React hooks rule을 위반했다.

**원본 수정:** 3개 useMemo를 early return 이전으로 이동.

**ChatGPT buildfix 수정:** 권한 gate를 wrapper 컴포넌트에 두고, `monthlyStats/classStats/typeStats` useMemo는
권한 통과 후 렌더링되는 `FinanceStatisticsContent`에서만 실행하도록 변경.

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `src/pages/FinanceStatistics.tsx` | hooks 위치 수정 | 권한 gate wrapper + 통계 계산 inner 컴포넌트로 분리 |
| `INTEGRATION.md` | 신규 | 이번 QA 결과 문서 |
| `docs/MVP_RC_MANUAL_QA_RESULT.md` | 신규 | 역할별/route별/freeze QA 결과표 |

## GitHub 업로드 여부

**코드 수정이 있으므로 필요하다.**

원본 zip 대신 buildfix zip을 압축 해제 후 같은 경로로 덮어쓴다:
- `src/pages/FinanceStatistics.tsx`

## 코드 정적 분석 결과 요약

| 항목 | 결과 |
|---|---|
| AdminRoutes — 모든 import 파일 존재 | PASS (26개 전체) |
| TeacherRoutes — 모든 import 파일 존재 | PASS (11개 전체) |
| StudentRoutes — 모든 import 파일 존재 | PASS (8개 전체) |
| ParentRoutes — 모든 import 파일 존재 | PASS (6개 전체) |
| FinancePayments hooks 위치 | PASS — 마지막 hook(132) < early return(150) |
| FinanceRefunds hooks 위치 | PASS — 마지막 hook(82) < early return(95) |
| FinanceUnpaid hooks 위치 | PASS — 마지막 hook(58) < early return(67) |
| FinanceSettlements hooks 위치 | PASS — 마지막 hook(57) < early return(59) |
| FinanceStatistics hooks 위치 | **FAIL → buildfix 수정 완료** |
| classData.ts 원본 유지 | PASS (md5: 126d9e5e314de186bf1df0a63b3abf82) |
| universityAnalysisAdapter.ts 불변 | PASS (md5: 1eddaef5cf427e00666be685ea16f32f) |
| App.tsx 불변 | PASS (md5: 387bbf48a3d87ff63ce10d6dbc8bf33c) |
| AdminRoutes.tsx 불변 | PASS (md5: 39126572dd124fc12ff9309dff81aa15) |

## 확인하지 못한 범위

- npm run build 실제 실행 결과
- 브라우저에서의 실제 렌더링
- DEV 역할 전환 UI 동작
- 각 페이지 내부 UI 요소별 동작
- NotificationContext mock 발송 동작

## 커밋명 후보

```text
FinanceStatistics useMemo hooks 위치 수정
```
