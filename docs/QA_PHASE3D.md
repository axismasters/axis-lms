# QA_PHASE3D.md

## v3 검수 결과 (반려 대응 — v2는 GitHub 업로드 금지 상태였음)

**버전**: v3 — 이 섹션이 최신 검수 결과다. v2/v1 검수 결과는 아래에 각각 보존.

### v3 검증 환경

v1/v2와 동일한 8종 의존성 타입 스텁 방식으로 `tsc -p tsconfig.app.json --noEmit`을
**src 전체(약 160개 파일 — 이번에 신규 4개: TeacherMaterials.tsx, TeacherExamScores.tsx,
accountActionLog.ts + 문서 파일)**에 대해 실행했다. lucide-react 스텁은 v3에서 새로
쓴 `UserCog` 아이콘 1개만 추가 등록(재추출 diff로 확인 — 그 외 아이콘은 기존 88개
안에 이미 포함).

### v3 최종 검수 결과 요약

| # | 검수 기준 | 결과 |
|---|---|---|
| 1 | `tsc --noEmit`(전체 src) | **0 errors** |
| 2 | 수정/신규 파일 49개 구문 파싱(TS 파서) | **전부 OK** |
| 3 | 불변 파일 4종 MD5 | **완전 동일** |
| 4 | 학생 화면 금지어(수납/재무/청구/미납/환불/영수증) | **0건**(주석만 존재) |
| 5 | 금지 표현(합격률 등) 실제 UI | **0건** |
| 6 | 상담 기록 원문 노출(학생/보호자) | **0건** |
| 7 | 학생 성적 직접 입력 흐름 | **0건**(변경 없음, v2와 동일하게 유지) |
| 8 | Rules of Hooks(신규 useState 추가 시 조기 return보다 앞에 선언) | **TeacherStudentDetail.tsx 재검토 완료** |
| 9 | TEACHER_PRIVATE 시험 scope 이중 방어(신규 TeacherExamScores.tsx 포함) | **유지 확인** |
| 10 | 로그인 하이픈 정규화 | **적용 확인**(§CHANGES 문서 "부가" 참조) |

### §v3-1. Rules of Hooks 재검토(신규 useState 추가분)

- `TeacherStudentDetail.tsx`: `confirmAction` state를 상담 기록 state들과 함께 조기
  `return notAllowed;`보다 앞에 선언했는지 재확인 — 정상.
- `StudentHome.tsx`: `selectedResult` state를 추가하면서, 이 컴포넌트에 조기 return이
  있는지 전체를 다시 훑어봤다 — 이 컴포넌트는 조기 return이 없어(항상 최종 JSX까지
  진행) 위치와 무관하게 안전하지만, 다른 훅들과 같은 블록(컴포넌트 최상단 변수 선언부)에
  배치해 일관성을 유지했다.

### §v3-2. 불변 파일 MD5 (v3 작업 후 재확인)

```
387bbf48a3d87ff63ce10d6dbc8bf33c  src/App.tsx
3429a4ba81c0500e6596418edc639225  src/pages/teacher/TeacherExamGrading.tsx
1eddaef5cf427e00666be685ea16f32f  src/lib/universityAnalysisAdapter.ts
126d9e5e314de186bf1df0a63b3abf82  src/lib/classData.ts
```
v1/v2와 완전 동일. `TeacherExamGrading.tsx`가 결석 학생을 표시하지 못하고 정정 기능이
없다는 한계를 신규 `TeacherExamScores.tsx`로 보완했을 뿐, 불변 파일 자체는 이번에도
전혀 수정하지 않았다.

### §v3-3. 학생/상담/재무 노출 재검증(v3)

```
grep -rlE "수납|재무|청구|미납|환불|영수증" src/pages/student/ src/layouts/StudentLayout.tsx
→ 매치 파일은 모두 정책 선언 주석뿐(실제 렌더링 텍스트 0건, "금지"/"노출" 키워드가
  포함된 라인만 필터링해도 결과가 남지 않음을 확인)

grep -rln "counselingData|getCounselingRecords" src/pages/student/ src/pages/parent/
→ 0건

grep -rnE "합격률|합격 가능성|합격 보장|안정 합격|불합격" src/ --include="*.tsx" --include="*.ts"
→ 주석(부정문) 외 실제 UI 매치 0건
```

### §v3-4. TeacherExamScores.tsx scope 이중 방어 확인

```ts
const visibleExam = rawExam && (
  rawExam.scope === 'TEACHER_PRIVATE' ? rawExam.ownerTeacherId === currentUser.id : true
) ? rawExam : undefined;
if (!visibleExam) return <NotFoundScreen />;
```
다른 교사의 `TEACHER_PRIVATE` 시험 id를 URL에 직접 넣어 접근을 시도해도 `visibleExam`이
`undefined`가 되어 `NotFoundScreen`으로 차단된다 — `AssessmentList.tsx`/`TeacherExams.tsx`와
동일한 이중 방어 패턴을 그대로 재사용했다.

### §v3-5. 로그인 하이픈 정규화 확인

```ts
function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}
// login()에서 저장된 phone과 입력 phone 모두 이 함수로 정규화한 뒤 비교
```
"010-0000-0002"로 저장된 계정에 "01000000002"(하이픈 없음)로 로그인 시도 시에도
정상적으로 일치하는지 코드 추적으로 확인했다(정규화 후 두 값 모두 "01000000002"로
동일해짐).

---

## (v2 검수 결과 — v1 대비, 반려 대응)

**버전**: v2 — 이 섹션이 최신 검수 결과다. v1 검수 결과는 아래 "(v1 원본)" 섹션에 보존.

### 검증 환경 (v2도 동일)

v1과 동일하게 `node_modules`에 8종 의존성 타입 스텁을 심볼릭 링크로 연결해
`tsc -p tsconfig.app.json --noEmit`을 **src 전체(약 155개 파일 — 이번에 신규 3개 포함)**에
대해 실행했다. lucide-react 아이콘 스텁은 v1에서 이미 코드베이스 전체 88개 아이콘을
추출해 만들어 뒀는데, v2에서 새로 쓴 아이콘(MessageSquare, Phone, Lock, LogOut,
ShieldCheck 등)도 전부 그 88개 안에 이미 포함되어 있어 스텁 재작성 없이 그대로 재사용
가능했다(재추출로 diff 0건 확인). 검증 후 심볼릭 링크/스텁 모두 제거.

### v2 최종 검수 결과 요약

| # | 검수 기준 | 결과 |
|---|---|---|
| 1 | `tsc --noEmit` (전체 src, 신규 3파일 포함) | **0 errors** |
| 2 | 수정/신규 파일 26개 구문 파싱(TS 파서) | **전부 OK** |
| 3 | 불변 파일 4종 MD5 | **완전 동일** |
| 4 | 학생 재무 노출(라우트+컴포넌트) | **0건** |
| 5 | 학부모/학생 상담 원문 노출 | **0건** |
| 6 | 학생 성적 직접 입력 흐름 | **0건** |
| 7 | 금지 표현(합격 관련) 실제 UI | **0건**(주석만 존재) |
| 8 | 수능형 템플릿 총점 | **정확히 100점**(30문항, Python으로 재계산 검증) |
| 9 | 학부모 수납 총액성 금액(요약 카드) | **제거 확인**(개별 청구서 금액은 유지 — CHANGES 문서 참조) |

### §v2-1. Rules of Hooks 재검토

`TeacherStudentDetail.tsx`에 상담 기록 관련 `useState` 3개를 추가하면서, 이 컴포넌트가
`studentId` 유효성에 따라 조기 `return notAllowed`를 하는 구조라는 걸 확인하고, 새 상태
훅들을 **반드시 그 조기 return보다 앞에** 선언했다(Hooks 규칙 위반 방지). `tsc`는 이런
런타임 훅-순서 오류를 잡아주지 못하므로 코드 리딩으로 직접 확인했다.

### §v2-2. 로그인/인증 흐름 수동 점검(코드 추적)

- 비인증 상태(`isAuthenticated === false`) → `RoleRoute`가 `/admin`, `/teacher`,
  `/student`, `/parent` 전부 `/`로 리다이렉트 → `RootRedirect`가 `LoginPage` 렌더링.
  확인 방법: `RoleRoute.tsx`/`RoleRoute` 함수 본문 재검토, 조기 `if (!isAuthenticated)
  return <Redirect to="/" />` 확인.
- `login()` 성공 시 `setUserId(found.id)` → `currentUser` `useMemo`가 재계산 →
  `isAuthenticated` true → `RootRedirect`가 `<Redirect to={home} />`로 전환(재렌더링에
  의해 자동 발생, 별도 `navigate()` 호출 불필요) — React 상태 변경에 따른 자연스러운
  리렌더 흐름이므로 별도 e2e 실행 없이도 로직상 안전하다고 판단.
- 원장/부원장 모드 전환 → `setActiveMode('TEACHER_MODE')` + `navigate('/teacher')` 동시
  호출 → `RoleRoute`의 `directorActingAsTeacher` 조건이 `activeMode`를 즉시 반영(같은
  렌더 사이클의 상태이므로 지연 없음).

### §v2-3. 불변 파일 MD5 (v2 작업 후 재확인)

```
387bbf48a3d87ff63ce10d6dbc8bf33c  src/App.tsx
3429a4ba81c0500e6596418edc639225  src/pages/teacher/TeacherExamGrading.tsx
1eddaef5cf427e00666be685ea16f32f  src/lib/universityAnalysisAdapter.ts
126d9e5e314de186bf1df0a63b3abf82  src/lib/classData.ts
```
v1 검수 시점과 완전 동일 — v2에서도 4개 불변 파일을 전혀 수정하지 않았다. App.tsx를
건드리지 않고 "첫 화면=로그인"과 "원장/부원장 모드 전환"을 모두 구현한 방법은 CHANGES
문서 §7·§8 참조(RootRedirect/RoleRoute만 수정, 기존 "/" 및 각 포털 라우트 재사용).

### §v2-4. 학생 화면 재무 노출 재검증

```
grep -rn "StudentFinance\|student/finance" src/routes/StudentRoutes.tsx
→ /student/finance는 항상 /student로 리다이렉트하는 라우트 1건만 존재. StudentFinance
  컴포넌트를 렌더링하는 경로 0건.
```
`StudentFinance.tsx` 자체도 `useFinance()` 호출을 제거한 완전 stub으로 교체했으므로,
설령 어딘가에서 실수로 다시 import되어도 재무 데이터가 그려질 수 없다(이중 안전망).

### §v2-5. 학부모/학생 상담 원문 노출 재검증

```
grep -rn "consulting|getCounselingRecords|counselingData" src/pages/parent/ src/pages/student/ src/layouts/ParentLayout.tsx src/layouts/StudentLayout.tsx
→ 0건
```
`counselingData.ts`는 `TeacherStudentDetail.tsx`(선생님)와 `StudentDetail.tsx`(관리자
Back Office)에서만 import한다. 학생/보호자 포털 어디에서도 import하지 않는다.

### §v2-6. 수능형 템플릿 100점 재계산 검증

```python
bands = [(1,6,2),(7,14,3),(15,22,4),(23,30,4)]
문항수 = 30, 총점 = 100  # 코드로 직접 재계산해 확인
```

---

## (v1 원본)

## 검수 환경

이 작업 환경은 네트워크가 차단되어 있어 `npm install`을 실행할 수 없다(`npm install`
시도 시 `403 Forbidden - GET https://registry.npmjs.org/...`). 이를 대체하기 위해 실제
`tsconfig.app.json` 설정(strict, moduleResolution: Bundler, paths `@/*` 등) 그대로에
프로젝트 의존성 8종(react, react-dom, wouter, sonner, lucide-react, nanoid, clsx,
tailwind-merge)의 타입 스텁 패키지(각 `package.json` + `.d.ts`)를 만들어 `node_modules`에
심볼릭 링크로 연결한 뒤, **src 전체(약 150개 파일)**에 대해 `tsc -p tsconfig.app.json
--noEmit`을 실행했다. 검증 직후 심볼릭 링크와 스텁은 모두 제거했고, 최종 산출물에는
`node_modules`가 포함되지 않는다.

로컬(실제 node_modules 보유) 환경 또는 GitHub Actions에서 `npm install && npm run build`
1회 실행을 최종 확인 절차로 권장한다(이번 스텁은 어디까지나 대리 검증이며, 실제 패키지
버전의 타입과 100% 동일하지는 않다).

## 최종 검수 결과 요약

| # | 검수 기준 | 결과 |
|---|---|---|
| 1 | `tsc -p tsconfig.app.json --noEmit` (전체 src, 스텁 기반) | **0 errors** |
| 2 | 수정된 9개 파일 + 신규 1개 파일 구문 파싱(TS 파서, 스텁과 무관한 순수 구문 검사) | **전부 OK** |
| 3 | 불변 파일 4종 MD5 (작업 전후 비교) | **완전 동일** |
| 4 | 학생 화면 재무/수납/청구/미납/환불/영수증 노출 | **0건** |
| 5 | 학생 성적 직접 입력 흐름 추가 | **0건** |
| 6 | 합격률/합격 가능성/합격 보장/안정 합격/불합격 표현(실제 UI) | **0건** |
| 7 | Phase 3C 시험 scope/권한 구조 코드 변경 | **없음** |
| 8 | CSS(`index.css`) 중괄호 균형 | **정상** |

---

## §1. tsc 타입체크 (스텁 기반)

최초 시도(단순 ambient `declare module 'x';`)에서는 736개 에러가 났으나, 전부 lucide-react
named export 미정의·useContext 제네릭 미추론 등 스텁 자체의 한계였고 실제 코드 문제가
아니었다(수정 파일에 한정해도 동일 패턴만 반복 — App.tsx, ClassFormModal.tsx 등 이번에
전혀 건드리지 않은 파일에서도 동일 에러가 발생해 스텁 한계임을 확인).

이후 실제 `node_modules/<pkg>/package.json` + `index.d.ts` 구조로 스텁을 재구성(각 패키지
실제 export 형태를 최대한 근접하게 재현 — react는 named export + `export as namespace
React`, lucide-react는 프로젝트에서 실제 import되는 88개 아이콘 이름을 코드베이스 전체
grep으로 추출해 각각 타입 선언)한 뒤 재실행한 결과 **0 errors**.

## §2. 구문 전용 파서 검사

TypeScript의 `createSourceFile` API로 스텁·모듈 해석과 무관하게 순수 구문(괄호/태그 짝,
JSX 구조)만 검사. 수정된 모든 파일(`EmblemManagement.tsx`, `PermissionSettings.tsx`,
`AssessmentFormModal.tsx`, `alert-dialog.tsx`, `StudentGrades.tsx`, `AssessmentList.tsx`,
`AssessmentDetail.tsx`, `useDraggableModal.ts`, `TeacherExams.tsx`) 전부 통과.

이 과정에서 sticky header 적용을 위해 `<div>` 래퍼를 추가하다가 실제로 2건의 JSX 중첩
버그를 발견해 수정했다(`AssessmentDetail.tsx`의 `SubmissionsTab`, 결과분석 탭 "학생별
결과" 테이블 — 각각 래퍼 div를 열고 닫는 짝이 맞지 않았던 것을 구문 검사로 발견 →
`</div>` 위치 수정으로 해결).

## §3. 불변 파일 MD5 재검증

```
387bbf48a3d87ff63ce10d6dbc8bf33c  src/App.tsx
3429a4ba81c0500e6596418edc639225  src/pages/teacher/TeacherExamGrading.tsx
1eddaef5cf427e00666be685ea16f32f  src/lib/universityAnalysisAdapter.ts
126d9e5e314de186bf1df0a63b3abf82  src/lib/classData.ts
```

작업 시작 전 값과 완전히 동일 — 4개 불변 파일 모두 손대지 않았음을 확인.

## §4. 학생 재무 노출 검수

```
grep -rlE "재무|수납|청구|미납|환불|영수증" src/pages/student/ src/layouts/StudentLayout.tsx
```
매치된 6개 파일(`StudentFinance.tsx`, `StudentGrades.tsx`, `StudentGrowthShowcase.tsx`,
`StudentMyPage.tsx`, `StudentHome.tsx`, `StudentLayout.tsx`) 모두 확인한 결과, 전부 기존
주석("수납/재무 노출 금지" 같은 정책 선언 자체)이었고 실제 렌더링되는 UI 텍스트/컴포넌트는
없음. `StudentFinance.tsx`는 기존 정책대로 stub 상태 그대로 유지(이번에 손대지 않음).

## §5. 금지 표현 검수

```
grep -rnE "합격률|합격\s*가능성|합격\s*보장|안정\s*합격|불합격" src/ --include="*.tsx" --include="*.ts"
```
전체 12건 매치 모두 `universityAnalysisAdapter.ts`/`universityAnalysisClient.ts`의 기존
주석(부정문 — "~를 포함하지 않는다")이며, 이번 Phase 3D에서 수정한 파일에는 해당 표현이
전혀 등장하지 않는다.

## §6. Phase 3C 구조 변경 여부

`AssessmentFormModal.tsx`에서 `scope`, `ownerTeacherId`, `ADMIN_SELECTABLE_SCOPES`,
`isTeacherMode` 관련 기존 로직은 한 줄도 수정하지 않았다(추가한 것은 템플릿 생성 함수와
문항 추가/삭제 UI뿐). `TeacherExamGradingGuard.tsx`, `AssessmentList.tsx`의 scope 필터링
로직(`e.scope !== 'TEACHER_PRIVATE'`), `AssessmentDetail.tsx`의 TEACHER_PRIVATE 접근 차단
로직 모두 미변경.

## §7. 모바일 터치 타겟 관련 메모

이번에 추가한 아이콘 버튼들은 대부분 32px(h-8 w-8) 크기로 통일했다. WCAG 권장 44px보다는
작지만, 이 화면들(엠블럼 관리·권한 설정·시험 등록·관리자 시험 목록)은 데이터 밀도가 높은
관리자/교사용 테이블·모달이라 기존 코드베이스 전반의 밀도(예: 기존 아이콘 버튼들도 대부분
28~32px)와 일관성을 맞췄다. 순수 모바일 사용 빈도가 높은 `TeacherExams.tsx`의 "채점하기"
버튼은 기존과 동일하게 충분한 높이(h-7, 세로 패딩 포함 시 약 32px+터치 여유)를 유지했다.
