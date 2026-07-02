# CHANGES — Phase 3D v3-r12-r2 (Finance/Emblem 액션 방어 가드 보강)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline) — v3-r12 반려분에서 시작

이번에도 새 zip 업로드는 없었다. 반려 사유가 v3-r12 산출물(`...-v3-r12-github-upload.zip`)의
구체적인 함수명(`FinanceContext`, `updateEmblemProgress`, `TeacherStudentDetail` 등)을 정확히
지목하고 있어, 그 산출물을 재추출해 기준선으로 썼다. 시작 전 불변 파일 3종 MD5와 엠블럼
파일 2종 바이트 동일성을 재확인했다(§4 참고).

## 1. 반려 사유 3건 — 원인과 조치

### ① Finance OFF 상태에서 FinanceContext 액션 함수가 직접 실행 가능
v3-r12에서는 재무 관련 라우트 5개만 막았을 뿐, `FinanceContext.tsx` 자체의 액션 함수에는
방어 가드가 없었다. 라우트가 막혀도 Context 함수 자체는 여전히 호출 가능한 상태였다.

### ② Emblem OFF 상태에서 updateEmblemProgress 등이 실행 가능
v3-r12에서는 `awardEmblemMock`/`addRivalWin`/`addRivalLoss`/`endRivalRelation`에만 방어
가드를 넣었고, 엠블럼 "정책 관리" 계열 함수(`updateEmblemProgress`, `addEmblem`,
`updateEmblem`, `toggleEmblemActive`, `toggleEmblemHidden`)는 빠뜨렸다.

### ③ TeacherStudentDetail 자동 상담 문구에 표현이 남을 수 있음
v3-r12에서는 통계 카드·배지만 껐고, `buildTeacherGrowthConsultingNote()`가 만드는 자동
문장 자체는 손대지 않았다(CHANGES_PHASE3D_v3_r12.md §4-1에 이미 한계로 명시해뒀던 지점).

## 2. 조치 — 지시서 그대로 반영 + 추가로 발견한 것 1건

### `src/contexts/FinanceContext.tsx`
- `isFinanceEnabled` import 추가.
- 지시서에 나열된 9개 함수 전부에 `if (!isFinanceEnabled()) return ...;` 방어 가드를
  각 함수 최상단에 추가: `addPayment`, `issueReceipt`, `requestRefund`, `approveRefund`,
  `rejectRefund`, `completeRefund`, `confirmSettlement`, `generateInvoicesForMonth`,
  `generateSettlementForMonth`.
- 반환 타입이 `void`인 함수(`issueReceipt`/`rejectRefund`/`completeRefund`)는 `return;`,
  `{ ok, reason? }` 반환 함수는 `{ ok: false, reason: '현재 재무관리 시스템이 비활성화되어
  있습니다.' }`, `generateInvoicesForMonth`(number)는 `0`을 반환한다.
- `generateSettlementForMonth`는 반환 타입이 `Settlement`(non-null)라 값을 아예 안 줄 수
  없다 — 이 파일에 **이미 존재하던** `STUDENT_SAFE_FINANCE.generateSettlementForMonth`의
  "안전한 더미 Settlement" 패턴(`{ id: 'blocked', month, totalBilled: 0, ... status: 'DRAFT' }`)을
  그대로 재사용해 `{ id: 'finance-disabled', month, totalBilled: 0, totalPaid: 0, totalUnpaid: 0,
  totalRefunded: 0, status: 'DRAFT' }`을 반환하도록 했다(이 값은 저장되지 않는다 — `setSettlements`
  호출 이전에 조기 반환).
- 자동 청구서 생성 `useEffect`(enrollments 변경 트리거)도 최상단에 `if (!isFinanceEnabled())
  return;`을 추가해 OFF 상태에서는 청구서가 자동 생성되지 않는다.

### `src/contexts/GrowthContext.tsx`
- 지시서대로 `updateEmblemProgress`, `addEmblem`, `updateEmblem`, `toggleEmblemActive`,
  `toggleEmblemHidden`에 `isEmblemEnabled()` 방어 가드 추가(반환 타입에 맞춰 `{ ok: false }`
  또는 `{ ok: false, reason: '...' }`).
- (v3-r12에서 이미 가드했던 `awardEmblemMock`/`addRivalWin`/`addRivalLoss`/`endRivalRelation`은
  그대로 유지, 중복 수정 없음)

### `src/pages/teacher/TeacherStudentDetail.tsx`
- 지시서 5)단계 그대로: `buildTeacherGrowthConsultingNote` 호출 시 `emblemEnabled`가
  false면 `achievedEmblemCount: 0`, `recentEmblemName: undefined`, `rivalEnabled`가
  false면 `rivalWins: 0`, `rivalLosses: 0`으로 전달.

### `src/lib/studentBriefingEngine.ts` — **지시서 범위를 살짝 넘어선 추가 조치 1건**
위 조치를 그대로 반영하면서 함수 내부를 다시 읽어보니, 첫 문장이
`` `현재 ${tierLabel} 티어 · 누적 SP ${totalSP}점 · 엠블럼 ${achievedEmblemCount}개.` ``
형태로 **achievedEmblemCount 값과 무관하게 "엠블럼"이라는 단어와 개수를 항상 포함**하고
있었다. 즉 지시서대로 `achievedEmblemCount: 0`을 전달해도 문장에는 여전히 "엠블럼 0개"라는
표현이 남아, 반려 사유 ③("표현이 남을 수 있다")을 완전히 해소하지 못하는 것을 발견했다.

그래서 `TeacherGrowthConsultingInput`에 `showEmblemCount?: boolean`(생략 시 `true`, 기존과
동일하게 항상 포함 — **기존 동작 변경 없음**)을 추가하고, `false`일 때만 그 절 자체를 문장에서
제외하도록 했다. 이 함수의 호출부는 `TeacherStudentDetail.tsx` 한 곳뿐임을 `grep`으로 확인한
뒤(`showEmblemCount: emblemEnabled`), 영향 범위가 이 한 파일로 한정됨을 확인하고 반영했다.
(Rival 절은 원래부터 `rivalWins + rivalLosses > 0`일 때만 붙는 구조라 `0, 0`을 전달하는 것만으로
이미 완전히 사라진다 — Rival 쪽은 추가 조치가 필요 없었다.)

## 3. 검토했지만 손대지 않은 지점

- **`StudentDetail.tsx`(관리자 학생상세 성장/진열장 탭)는 이번에 다시 손대지 않았다.** v3-r12에서
  이미 `awardEmblemMock`/`addRivalWin`/`addRivalLoss`/`endRivalRelation` 호출부(버튼)와 화면
  표시를 전부 게이트해뒀고, 이번 반려 사유는 정확히 "Context 함수 자체"를 지목했으므로 Context
  계층(GrowthContext.tsx)만 보강하면 이 화면도 자동으로 이중 방어된다.
- **`FinanceContext.tsx`의 `useFinance()` 훅에 있는 기존 `STUDENT_SAFE_FINANCE` 패턴(학생 role
  차단)은 그대로 뒀다.** 지시서가 개별 함수에 가드를 추가하라고 명시했으므로 그 방식을 따랐고,
  "financeEnabled에도 이 hook-level 패턴을 쓸지"는 §5 의견에 별도로 남긴다.

## 4. 불변/엠블럼 파일 재검증

| 파일 | 결과 |
|------|------|
| `src/lib/universityAnalysisAdapter.ts` | MD5 일치 |
| `src/App.tsx` | MD5 일치 |
| `src/lib/classData.ts` | MD5 일치 |
| `src/components/brand/AxisEmblemBadge.tsx` | 바이트 동일 |
| `src/components/brand/AxisTierMedallion.tsx` | 바이트 동일 |
| `AxisEmblemPlaque.tsx` | 존재하지 않음(정상) |

## 5. 빌드 검증

사용자가 "빌드는 통과했지만 반려"라고 명시했으므로, 이번 반려는 코드 컴파일 문제가 아니라
런타임 방어 로직의 누락이었다. 이번에도 이 샌드박스에서 실제 `npm install`을 재시도했다
(2026-07-02 06:14 UTC) — 결과는 이전과 동일하게 `E403 host_not_allowed`(이 세션의 네트워크
정책, 코드와 무관).

오프라인 스텁 tsc 하네스로 **v3-r12(반려된 산출물) 대비** 비교한 결과:

| 항목 | 결과 |
|------|------|
| 기준선(v3-r12) 오류 수 | 386건 |
| 이번 변경 후 오류 수 | 386건(변동 없음) |
| 파일별 오류 수(터치한 4개 파일) | `FinanceContext.tsx` 2→2, `GrowthContext.tsx` 2→2, `studentBriefingEngine.ts` 0→0, `TeacherStudentDetail.tsx` 5→5 |
| diff 상 "신규" 2건 | 가드 코드 추가로 인한 순수 줄-번호 이동(TS2875, react/jsx-runtime 스텁 한계) — 사라진 2건과 파일·내용 1:1 대응 확인, 실질적 신규 오류 0건 |

## 6. §GPT(개발 총괄)에게 전달할 의견

1. **`studentBriefingEngine.ts`를 지시서 범위보다 한 단계 더 수정했다(§2 마지막 항목).** 이유는
   실제로 열어보니 achievedEmblemCount를 0으로 줘도 "엠블럼"이라는 단어 자체가 문장에 남는
   구조였기 때문이다. `showEmblemCount` 플래그는 옵셔널이라 기존 동작(생략 시 true)을 바꾸지
   않는다. 원치 않으면 `TeacherStudentDetail.tsx`의 `showEmblemCount: emblemEnabled` 한 줄만
   제거하면 이전 상태(achievedEmblemCount만 0으로 전달)로 되돌아간다.
2. **`FinanceContext.tsx`에는 이미 `useFinance()` 훅에서 role 기준으로 통째로 안전한 값을
   반환하는 `STUDENT_SAFE_FINANCE` 패턴이 있었다.** 이번엔 지시서대로 함수별 개별 가드를
   추가했지만, 동일한 hook-level 패턴(`if (!isFinanceEnabled()) return FINANCE_DISABLED_SAFE;`)을
   Rival/Emblem/Finance 전체에 일괄 적용하는 것도 가능하다 — 더 중앙집중적이라 함수가 늘어나도
   가드를 놓칠 위험이 없어진다. 다음 리팩터링 단계에서 고려해달라(이번엔 지시서를 그대로
   따르는 쪽을 택했다).
3. **이번 산출물은 v3-r12 대비 정확히 4개 파일 변경이 전부다** — `FinanceContext.tsx`,
   `GrowthContext.tsx`, `studentBriefingEngine.ts`, `TeacherStudentDetail.tsx`. `diff -rq`
   전수 비교로 확인했다.
