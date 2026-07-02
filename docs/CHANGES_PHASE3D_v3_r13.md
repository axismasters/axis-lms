# CHANGES — Phase 3D v3-r13 (Feature Toggle Hardening & Access Guard Audit)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline) — 새 zip 업로드 없이 v3-r12-r2 산출물에서 시작

이번에도 새 zip 업로드는 없었다. 지시서 §2 항목이 이 세션이 직접 만든
`...-v3-r12-r2-github-upload.zip`과 정확히 일치해 그 산출물을 재추출해 기준선으로 썼다.
시작 전 불변 파일 3종 MD5, 엠블럼 파일 2종 바이트 동일성을 재확인했다(§6 참고).

이번 Phase는 "기능 추가 금지, 안정화 중심"이 명시적 목표라, 새 기능은 하나도 추가하지
않았고 전부 기존 온/오프 구조의 누락을 찾아 메우는 작업만 했다.

## 1. 개발 순서 1) — 기존 구조 재확인

지시서가 나열한 파일(`systemFeatureFlags.ts`, `FeatureDisabledNotice.tsx`, `AdminRoutes.tsx`,
`StudentRoutes.tsx`, `ParentRoutes.tsx`, `FinanceContext.tsx`, `GrowthContext.tsx`, 관련
Layout/Menu 파일)을 전부 다시 읽었다. 구조 자체(로컬스토리지 plain 함수 + 라우트 가드 래퍼
+ RBAC `requiresFn` 재사용)는 그대로 유지하고, 이번엔 "빠진 지점 찾기"에 집중했다.

## 2. 직접 URL 접근 누락 점검 — 실제로 1건 발견

지시서 §2가 나열한 경로를 전부 코드로 재확인했다. 대부분 이미 정상 게이트되어 있었으나,
**`/admin/finance/anything`처럼 5개 명시 경로 외의 미등록 하위 경로**는 어떤 라우트에도
매칭되지 않아 `AdminRoutes.tsx` 맨 끝의 일반 404(`AdminPlaceholder`)로 빠지고 있었다 —
financeEnabled가 OFF여도 그냥 404였다(지시서가 요구한 "OFF 시 404가 아니라 공통 비활성
안내"를 만족하지 못함).

### 조치 — `src/routes/AdminRoutes.tsx`
기존 5개 명시 라우트 바로 뒤에 `/admin/finance/*` 와일드카드 라우트를 추가했다(이 프로젝트가
이미 쓰던 glob 와일드카드 문법 — `App.tsx`의 `/admin/*` 패턴과 동일하게 통일). 동작:
- **OFF**: 어떤 하위 경로든 공통 `FeatureDisabledNotice`를 보여준다(실제로 그 경로가 존재하는
  페이지인지 여부를 노출하지 않기 위해, 존재 여부와 무관하게 동일한 안내).
- **ON**: 5개 명시 라우트 중 하나도 아니면 실제로 없는 페이지이므로 기존과 동일하게
  일반 404(`AdminPlaceholder`)로 보낸다.

나머지 경로(`/student/rival`, `/admin/growth/rivals`, `/admin/growth/rival-seasons`,
`/admin/growth/emblems`, `/parent/finance`, `/student/finance`)는 전부 재확인 결과 이미
정상 게이트되어 있었다(변경 없음). `App.tsx`(불변)에 남아있는 구 경로 리다이렉트
(`/growth/emblems`→`/admin/growth/emblems`, `/growth/rivals`→`/admin/growth/rivals` 등)도
전부 이미 게이트된 목적지로만 연결되므로 별도 조치가 필요 없음을 확인했다.

## 3. Finance hook-level 안전 반환 구조 — 신규 추가

### 조치 — `src/contexts/FinanceContext.tsx`
기존에 이미 있던 `STUDENT_SAFE_FINANCE`/`useFinance()`의 role 기반 훅 레벨 차단 패턴을
그대로 재사용해, **동일한 형태**의 `FINANCE_DISABLED_SAFE` 객체를 추가하고 `useFinance()`에
`financeEnabled` 체크를 별도 조건으로 추가했다.

```
학생 role 체크(항상 우선 적용, financeEnabled와 무관)
  → financeEnabled 체크(role과 무관하게 독립 적용)
  → 둘 다 아니면 실제 Context
```

- 지시서 요구사항 "Finance OFF는 학생 role 차단과 별개로 작동" — 위 순서대로 두 체크가
  서로 다른 조건이라 완전히 독립적으로 작동한다(관리자/원장이라도 OFF면 안전 객체를 받고,
  학생은 financeEnabled 값과 무관하게 항상 안전 객체를 받는다).
- 조회 함수(`getInvoicesByStudent` 등)는 전부 빈 배열/0을 반환하므로 **Provider의 실제
  state(`invoices`/`payments`/...)는 그대로 보존된다** — 이 훅을 거치는 화면에만 빈 값이
  보일 뿐, 데이터 자체는 삭제되지 않는다.
- v3-r12-r2에서 넣은 함수별 개별 가드(`addPayment` 등 9개 함수 내부의 `isFinanceEnabled()`
  체크)는 그대로 뒀다 — 이제 이중 방어(훅 레벨 + 함수 레벨)가 된다.

## 4. Emblem/Rival 노출 재점검 — 실제로 3곳 발견

지시서 §4가 나열한 문구 목록으로 `src/` 전체를 재검색했다. 이미 게이트된 화면(StudentHome,
StudentMyPage, StudentGrowthShowcase, TeacherStudentDetail, ParentHome, 각 라우트)은 전부
정상이었으나, 아래 3곳에서 실제 누락을 발견해 조치했다.

### ① `src/pages/growth/GrowthOverview.tsx` — 관리자 성장현황 테이블/요약카드
v3-r12에서 "성장현황 화면 자체는 게이트하지 않는다"고 판단했었는데, 다시 보니 **테이블
컬럼 3개(대표 엠블럼/현재 라이벌/보유 엠블럼)와 요약 카드 3개(총 발급 엠블럼/활성 라이벌
수/숨겨진 엠블럼)가 실제 데이터를 그대로 노출**하고 있었다 — "화면을 막을지"와 "화면 안의
특정 항목을 뺄지"는 다른 문제였는데 후자를 놓쳤다. 조치: 테이블 헤더/각 행의 해당 3개 컬럼,
요약 카드 5개 중 엠블럼 2개·라이벌 1개를 각각 `emblemEnabled`/`rivalEnabled`에 따라
배열에서 제외했다(정적 grid 컬럼 수는 그대로 두고 항목만 줄여, Tailwind 동적 클래스 문제를
피했다). 빈 상태 행의 `colSpan`도 남은 컬럼 수에 맞춰 동적으로 계산하도록 고쳤다.

### ② `src/pages/teacher/TeacherStudentGrowth.tsx` — GrowthCard
v3-r12에서 "Rival 승" 지표만 게이트했는데, **같은 카드 헤더의 "· 엠블럼 N개" 텍스트와
"최근 엠블럼" 배지 목록은 emblemEnabled 체크 없이 그대로 있었다**. 둘 다
`isEmblemEnabled()` 게이트를 추가했다.

### ③ `src/pages/StudentDetail.tsx` — 관리자 학생상세, 두 지점
- `GradesTab`(성적조회 탭, "IF 분석 / 엠블럼" 안내 2줄) — emblemEnabled가 false면 숨김.
  **이 탭은 메모리에 기록된 대로 "University Analysis Phase 5.1"(추천 리스트 UI, fetch
  timeout) 작업이 진행 중인 함수라 극도로 주의했다** — 이 2줄짜리 정적 안내 문구 블록만
  독립적으로 조건부 렌더 처리했고, 그 외 `GradesTab`의 어떤 부분도 건드리지 않았다(추천
  리스트/fetch 로직 근처는 전혀 손대지 않음).
- `GrowthShowcaseTab`(성장/진열장 탭)의 "IF 성장 힌트 placeholder" — "엠블럼"이 5회 등장하는
  안내 블록 전체를 emblemEnabled 게이트로 감쌌다(이 탭은 이미 이번 시리즈에서 여러 번 수정한
  영역이라 안전하게 처리 가능했다).

## 5. 검토했지만 손대지 않은 지점

- **`src/pages/growth/ShowcasePolicyManagement.tsx`("진열장 노출 정책")**: `showEmblems`
  ("엠블럼 표시") 토글이 있지만, 이건 "엠블럼이 켜져 있을 때 진열장에 보일지"를 정하는
  하위 정책 설정이라 이번 지시서의 URL 목록에도 없고, 성격이 다르다고 판단했다(Emblem
  자체가 OFF면 이 정책 값과 무관하게 이미 아무것도 안 보인다 — 무해한 중복 설정). 게이트하지
  않았다.
- **`src/pages/settings/PermissionSettings.tsx`("엠블럼 지급" 권한 라벨)**: RBAC 권한
  매트릭스에서 "이 역할이 엠블럼 지급 권한을 가질지" 자체를 정의하는 화면이라, 실제 기능
  노출이 아니라 정적 설정 항목 이름이다. 손대지 않았다.
- **`buildTeacherGrowthConsultingNote`(자동 상담 문구)**: v3-r12-r2에서 이미 `showEmblemCount`
  플래그로 처리했고, 이번에 다시 확인한 결과 emblemEnabled/rivalEnabled OFF 시 두 표현
  모두 정상적으로 사라짐을 재확인했다(회귀 없음).

## 6. 불변/엠블럼 파일 및 기존 데이터 보존 재확인

| 항목 | 결과 |
|------|------|
| 불변 파일 3종 MD5 | 전부 일치 |
| 엠블럼 컴포넌트 2종 | 바이트 단위 동일 |
| `AxisEmblemPlaque.tsx` | 존재하지 않음 |
| 엠블럼 이미지 에셋 적용 | 하지 않음(금지 항목 준수) |
| 기존 데이터 삭제 여부 | 이번 변경은 전부 "표시 여부"만 제어 — `GrowthContext`/`FinanceContext`의 실제 state 배열을 변형하는 코드는 0줄 |

## 7. 학부모/학생 화면 헌법 재검수 — 위반 0건

`src/pages/parent/` 전체와 `src/layouts/ParentLayout.tsx`를 Rival/Emblem/SP/Tier 키워드로
재검색한 결과, 실제 코드에는 0건이고 전부 금지 원칙을 기록한 주석뿐이었다. 총액 과시형 UI도
없음(미납 있음/없음 배지만 노출, 기존 v2부터 유지). 내부 상담 기록 원문도 노출 없음(별도
"학부모 공개 코멘트" 시스템만 사용). `src/pages/student/`도 재무/수납/청구/미납/환불/영수증
키워드로 재검색해 실제 노출 0건, `/student/finance` 차단 리다이렉트 유지 확인.

## 8. 빌드 검증

이 샌드박스에서 실제 `npm install`을 다시 시도했다(2026-07-02 06:31 UTC) — 이번에도
`E403 host_not_allowed`(네트워크 정책, 코드 무관, 이전 세션들과 동일).

오프라인 스텁 tsc 하네스로 **v3-r12-r2(직전 산출물) 대비** 비교:

| 항목 | 결과 |
|------|------|
| 기준선 오류 수 | 386건 |
| 변경 후 오류 수 | 386건(변동 없음) |
| diff 상 차이 | 1건 추가/1건 삭제 — `GrowthOverview.tsx`에 import 1줄이 늘어 기존 오류의 줄 번호만 33→34로 이동(동일 내용, TS2875). 그 외 완전히 동일. |

**"npm run build 통과"를 주장하지 않는다.** GitHub Actions에서 최종 확인 필요.

## 9. §GPT(개발 총괄)에게 전달할 의견

1. **`GrowthOverview.tsx`는 v3-r12에서 "화면 자체는 게이트 안 함"이라고 결정했던 지점이다.**
   이번에 안을 들여다보니 그 결정이 "화면 전체를 막을지"에는 맞았지만 "화면 안의 개별 컬럼/
   카드까지 안전한지"는 별개 문제였다. 앞으로 유사한 "게이트 안 함" 결정을 내릴 때는 화면
   내부에 대상 데이터 컬럼이 있는지도 함께 확인하겠다.
2. **`ShowcasePolicyManagement.tsx`/`PermissionSettings.tsx`는 의도적으로 손대지 않았다(§5).**
   필요하면 다음 지시서에 명시해달라.
3. **Finance 훅 레벨 안전 반환(§3)은 GrowthContext에는 적용하지 않았다.** 지시서가 Finance만
   명시적으로 요청했고, GrowthContext는 이미 함수별 가드가 촘촘히 되어 있어(v3-r12/r12-r2)
   급하지 않다고 판단했다 — 다음 단계에서 동일 패턴 확대를 원하면 알려달라.
