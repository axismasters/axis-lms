# QA_PHASE3D.md

## v3-r3 검수 결과

**버전**: v3-r3 — v3-r2는 GitHub 업로드 가능 상태로 확정됐고, 이번 라운드는 추가 개선
요청 5개에 대응한다. 이 섹션이 최신 검수 결과다. v3-r2 이하 검수 결과는 아래에 각각 보존.

### 검증 명령 실행 결과

```
npm install
→ npm error code E403
→ npm error 403 Forbidden - GET https://registry.npmjs.org/@tailwindcss%2fvite
```

이번 라운드에도 재시도했으나 이 작업 환경은 여전히 `registry.npmjs.org` 접근이 차단되어
있다. **이는 이 세션 내에서 Claude가 해결할 수 없는 환경 제약이며, 산출물 자체의 결함이
아니다.**

**대체 검증**: 동일한 방식으로 `tsc -p tsconfig.app.json --noEmit`을 src 전체(약 165개
파일)에 대해 실행했다.

```
결과: 0 errors
```

검증 후 심볼릭 링크/스텁 모두 제거, 최종 산출물에는 `node_modules` 미포함.
**실제 서비스 반영 전 로컬 또는 GitHub Actions에서 `npm install && npm run typecheck &&
npm run build`를 반드시 1회 실행해야 한다.**

### v3-r3 항목별 검수

| # | 항목 | 결과 |
|---|---|---|
| 1 | 학부모 페이지 Rival/Emblem/SP/Tier 완전 제거(코드+주석+문서) | **완료 — grep 재검증 0건**(주석 포함, 원칙 설명 문단도 지표명 나열 없이 재작성) |
| 1-2 | `PARENT_PAGE_CONSTITUTION.md` "Tier까지만 확인 가능" 문구 | **삭제 완료**(학생 Rival 화면 정책은 StudentRival.tsx 자체 주석에 이미 정확히 기술되어 정보 손실 없음) |
| 1-3 | 성장 리포트 강화(목표대비/과목별변화/주간변화/상담용요약) | **4개 전부 신규 추가** — 아래 상세 참조 |
| 1-4 | 새 아이디어 기록 | **완료** — `PARENT_PAGE_ENGAGEMENT_IDEAS.md`에 v3-r3 신규 항목 5개 추가 |
| 2 | 관리자 학생 요약 카드 클릭 필터 | **기존 v3-r1 구현이 이미 요구사항 충족 확인**(재검증만 수행, 코드 변경 없음) |
| 3 | 출결 요약 카드 클릭 필터 + 0건 안내 | **기존 v3-r1 구현이 이미 요구사항 충족 확인**(카드는 항상 클릭 가능, 0건 시 명확한 빈 목록 안내 문구 확인) |
| 4 | 선생님 "시험 채점"/단독 "채점" 전수 재검색 | **0건**(불변 파일 1곳 제외) |
| 5 | 시험지별 그래프 강화(문항별 정답률 신규) | **완료** — TeacherExamScores.tsx에 문항별 정답률 막대그래프 신규 추가 |
| 6 | 불변 파일 4종 MD5 | **완전 동일** |
| 6 | 금지 표현(합격 관련) | **grep 재검증 0건** |

### 성장 리포트 강화 상세(항목 1-3)

- **목표 대비**: 과목별 보완 필요도 막대 아래 "목표(90%)까지 N%p" 표시 신규 추가.
- **과목별 변화**: 각 과목 응시 이력을 앞/뒤 절반으로 나눠 "이전 대비 ▲/▼ N%p" 신규 추가
  (표본 2건 미만인 과목은 계산 제외 — 데이터 왜곡 방지).
- **주간 변화**: 리포트 탭에 지난주(8~14일 전) 대비 이번 주 출결율/숙제완료율 증감 표시.
- **상담용 요약**: 리포트 탭에 테스트 평균·직전 대비 변화·보완 필요 과목·이번 달 결석·
  숙제 완료율을 한 문단으로 조합한 "상담용 요약" 카드 신규 추가.

### 학부모 페이지 Rival/Emblem/SP/Tier 최종 재검증

```
grep -rn "Rival|Emblem|엠블럼|라이벌|Tier|티어|useGrowth|totalSP|GrowthContext" src/pages/parent/*.tsx src/layouts/ParentLayout.tsx docs/PARENT_PAGE_CONSTITUTION.md
→ 0건(v3-r2까지 남아있던 "원칙 설명 문단 안의 지표명 1회 언급"까지 전부 제거,
  이제 어떤 지표명도 직접 등장하지 않는다)
```

### 관리자/출결 요약 카드 재검증(항목 2, 3)

코드를 다시 읽어 다음을 확인했다(수정 없이 검증만):
- `StudentList.tsx`의 `SummaryFilterCard`는 학생 수와 무관하게 항상 렌더링되고 항상
  클릭 가능하다. `active` 상태는 현재 `fStatus`/`fUnpaid` 값과 정확히 일치할 때만
  켜진다. 필터 결과가 0명이면 "조건에 맞는 학생이 없습니다." 안내가 표시된다.
- `AttendanceStatus.tsx`의 `SUMMARY_CARDS`도 값이 0이어도 동일하게 항상 렌더링·클릭
  가능하며, "알림 발송 건수" 카드를 눌러도 발송 기록이 없으면 "조회 조건에 해당하는
  출결 이력이 없습니다." 안내가 표시된다.
- 두 화면 모두 카드에 `axis-card-clickable` 클래스(hover 시 그림자·테두리 변화)가
  적용되어 있어 클릭 가능 UI임이 시각적으로 드러난다.

### 선생님 "채점" 표현 최종 재검색

```
grep -rn "시험 채점" src/
→ 1건, TeacherExamGradingGuard.tsx의 정책 설명 주석("공통 시험 채점은 기존과 동일하게
  허용")뿐 — 화면 제목/메뉴명이 아니라 "채점 권한 정책"을 설명하는 서술문이라 허용 범위.

단독 "채점" 재검색(채점하기/채점완료/미채점/정정/IF채점 등 허용 문맥 제외)
→ TeacherExamGrading.tsx(불변 파일) title="채점" 2곳만 남음.
→ AssessmentFormModal.tsx의 "자동채점"/"수동채점"은 문항 채점 방식을 가리키는 기술
  용어이며 메뉴/제목이 아니므로 허용 범위로 판단.
```

### 불변 파일 MD5 (v3-r3 작업 후 재확인)

```
387bbf48a3d87ff63ce10d6dbc8bf33c  src/App.tsx
3429a4ba81c0500e6596418edc639225  src/pages/teacher/TeacherExamGrading.tsx
1eddaef5cf427e00666be685ea16f32f  src/lib/universityAnalysisAdapter.ts
126d9e5e314de186bf1df0a63b3abf82  src/lib/classData.ts
```

---

## v3-r2 검수 결과 (v3-r1 반려 대응)

**버전**: v3-r2 — 이 섹션이 최신 검수 결과다. v3-r1/v3/v2/v1 검수 결과는 아래에 각각 보존.

### 검증 명령 실행 결과

```
npm install
→ npm error code E403
→ npm error 403 Forbidden - GET https://registry.npmjs.org/@tailwindcss%2fvite
```

v3-r1과 동일하게 재시도했으나 이 작업 환경은 여전히 `registry.npmjs.org` 접근이
차단되어 있다. **이 환경 제약은 산출물의 결함이 아니며, 이 대화 세션 안에서 Claude가
직접 해결할 수 있는 문제가 아니다.** `npm install`이 실패하므로 같은 환경에서
`npm run typecheck`/`npm run build`도 실행할 수 없다.

**대체 검증**(v1부터 유지해온 방식): 실제 `tsconfig.app.json` 설정 그대로에 프로젝트
의존성 8종 타입 스텁을 만들어 `node_modules`에 연결한 뒤 `tsc -p tsconfig.app.json
--noEmit`을 src 전체(약 165개 파일)에 대해 실행했다.

```
결과: 0 errors
```

검증 후 심볼릭 링크/스텁은 모두 제거했고 최종 산출물에는 `node_modules`가 포함되지
않는다.

**⚠️ 실제 서비스 반영 전 반드시 로컬 또는 GitHub Actions에서 `npm install && npm run
typecheck && npm run build`를 1회 실행해 확인해야 한다.** `docs/APPLY_ORDER_PHASE3D.md`
의 v3-r2 섹션에 이 절차를 명시했다.

### v3-r2 항목별 재검수

| # | 항목 | 결과 |
|---|---|---|
| 1 | `StudentList.tsx`/`AttendanceStatus.tsx` 메인 테이블 `axis-table-scroll` 전환 | **완료, grep 재검증 — axis-table-wrap 잔여 0건** |
| 2 | `AssessmentList.tsx` 행 전체 클릭 제거 + "상세 보기" 버튼 | **완료 — tr의 onClick/cursor-pointer 제거, Button 컴포넌트로 전환** |
| 3 | 선생님 페이지 용어 6종 교체 | **완료** — TeacherHome/TeacherStudentDetail/TeacherGrades/TeacherRoutes/TeacherLayout 전수 확인 |
| 4 | 학부모 페이지 Rival/Emblem/SP/Tier 주석·문서 정리 | **완료** — 소스 코드 주석 + 헌법 문서(6번째 원칙 추가) + 아이디어 문서 정리 |
| 5 | github-upload zip 구조 명확화 | **완료** — v3-r2부터 diff 방식을 버리고 전체 프로젝트 패키지 1종으로 통합, `APPLY_ORDER_PHASE3D.md`에 명시 |
| 6 | 불변 파일 4종 MD5 | **완전 동일** |

### 선생님 문구 교체 세부 확인

```
최근 성적 → 최근 테스트 결과           (TeacherHome.tsx, TeacherStudentDetail.tsx)
성적 보기 → 학생별 성적 보기            (TeacherHome.tsx)
성적 데이터 → 테스트 결과 데이터        (TeacherStudentDetail.tsx, TeacherGrades.tsx)
담당 학생 성적 확인 → 담당 학생 테스트 결과 확인  (TeacherGrades.tsx, TeacherRoutes.tsx)
수업노트 바로가기 → 수업자료에서 수업노트 확인    (TeacherStudentDetail.tsx)
수업노트 작성/확인하기 → 수업자료 열기            (TeacherStudentDetail.tsx, 링크도 /teacher/materials?tab=notes로 갱신)
```

재검증 결과, 남아있는 "채점"/"성적" 표현은 전부 다음 두 경우뿐임을 grep으로 확인했다:
1. 실제 채점 행위를 뜻하는 동사적 표현(채점하기/채점완료/미채점/"채점이 완료되면" 등) —
   지시사항이 명시적으로 유지를 허용한 표현.
2. `TeacherExamGrading.tsx`(불변 파일)의 `title="채점"` — 파일 자체를 수정할 수 없어
   유일하게 남은 예외(§GPT 전달 의견 참조, v3-r1부터 동일하게 안내 중).

### 학부모 페이지 문구 정리 세부 확인

```
grep -rn "Rival|Emblem|엠블럼|라이벌|useGrowth|totalSP|TIER_LABELS|TIER_COLORS" src/pages/parent/*.tsx src/layouts/ParentLayout.tsx
→ 0건(주석 포함 완전 제거 확인 — v3-r1까지는 주석에 일부 남아있었음)
```

- `src/layouts/ParentLayout.tsx`: "자녀 성장(Emblem/SP/Tier) 확인 흐름" → 단순화.
- `src/pages/parent/ParentHome.tsx`: 헌법 원칙에 6번째 항목("학생용 게임형 지표 미노출")
  추가, 관련 주석 4곳 단순화.
- `src/pages/parent/ParentGrowthReport.tsx`: 헤더 주석 단순화.
- `docs/PARENT_PAGE_CONSTITUTION.md`: 5개 원칙 → 6개 원칙으로 갱신(신규 원칙 추가),
  1번·2번 원칙 본문에서 Tier/Emblem/SP 나열식 표현 제거.
- `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md`: 도입부 원칙 문구 단순화.
- ⚠️ `docs/CHANGES_PHASE3D.md`/`MODIFIED_FILES_PHASE3D.md`/`QA_PHASE3D.md`의 **과거
  라운드(v3-r1 이하) 기록**에는 "Tier/Emblem/SP를 제거했다"는 서술이 그대로 남아있다.
  이는 실제로 일어난 과거 작업(무엇을 제거했는지)을 설명하는 이력 기록이라 의도적으로
  남겨뒀다 — 무엇을 제거했는지 설명하려면 그 이름을 한 번은 언급해야 하기 때문이다.
  현재 시점의 정책 문서(헌법, 아이디어 문서)와 소스 코드 주석만 간결화 대상으로 삼았다.

### 불변 파일 MD5 (v3-r2 작업 후 재확인)

```
387bbf48a3d87ff63ce10d6dbc8bf33c  src/App.tsx
3429a4ba81c0500e6596418edc639225  src/pages/teacher/TeacherExamGrading.tsx
1eddaef5cf427e00666be685ea16f32f  src/lib/universityAnalysisAdapter.ts
126d9e5e314de186bf1df0a63b3abf82  src/lib/classData.ts
```

---

## v3-r1 검수 결과 (v3 반려 대응 + 추가 요구사항)

**버전**: v3-r1 — 이 섹션이 최신 검수 결과다. v3/v2/v1 검수 결과는 아래에 각각 보존.

### 검증 명령 실행 결과

```
npm install
→ npm error code E403
→ npm error 403 Forbidden - GET https://registry.npmjs.org/@tailwindcss%2fvite
```
이 작업 환경은 v1 시점부터 지금까지 계속 `registry.npmjs.org`에 대한 네트워크 접근이
차단되어 있다(모든 패키지가 아니라 특정 패키지에서 403이 발생 — 사내/샌드박스 레지스트리
정책으로 추정). `npm install`이 실패하므로 `npm run typecheck`/`npm run build`도 이
환경에서는 실행할 수 없다.

**대체 검증**: v1부터 유지해온 방식대로, 실제 `tsconfig.app.json` 설정 그대로에 프로젝트
의존성 8종의 타입 스텁을 만들어 `node_modules`에 연결한 뒤 `tsc -p tsconfig.app.json
--noEmit`을 **src 전체(약 165개 파일)**에 대해 실행했다.

```
결과: 0 errors
```

이번 라운드에 새로 쓴 아이콘(Flame)도 스텁에 반영해 재검증했다. 검증 후 심볼릭 링크/스텁은
모두 제거했고 최종 산출물에는 `node_modules`가 포함되지 않는다.

⚠️ **로컬(실제 node_modules 보유) 환경 또는 GitHub Actions에서 `npm install && npm run
typecheck && npm run build` 1회 실행을 최종 확인 절차로 반드시 권장한다.** 이 스텁 검증은
타입 수준의 오류만 잡아낼 수 있고, 실제 패키지 버전 차이·번들러 설정 문제·런타임 오류는
잡아내지 못한다.

### v3-r1 항목별 검수

| # | 항목 | 결과 |
|---|---|---|
| 1 | 학생 라우트 복구(/student/my, /target-preview, /growth, /rival) | **전부 실제 컴포넌트에 연결 확인** |
| 2 | 학생 화면 헌법(재무/수납 금지어, IF 조회전용, 금지표현) | **grep 재검증 0건**, `StudentFinance.tsx` 물리 삭제 확인 |
| 3 | 관리자 학생 목록 요약카드 클릭 필터 | **필터 동작 + active 표시 + 필터명 라벨 + 행 클릭 제거 확인** |
| 4 | 출결현황 요약카드 클릭 필터 | **상태별 필터 + 알림발송 필터 + active 표시 확인** |
| 5 | 클릭 가능 UI 전수 정리 | GrowthOverview "상세" 링크를 Button으로 전환 등 주요 지점 수정 (상세 범위는 아래 §GPT 의견 참조) |
| 6 | 테이블 wrapper 재구조화(8개 대상) | **8개 전부 `.axis-table-scroll`(bounded height + 내부 스크롤 + sticky thead top:0)로 전환 확인** |
| 7 | 엠블럼 팝업(max-height/ESC/드래그-X버튼 분리) | **적용 확인** — 드래그 핸들을 제목 영역에만 한정, ESC 리스너 추가, `calc(100vh - 48px)` 적용 |
| 8 | Hooks 규칙(EmblemManagement/RivalManagement/GrowthOverview) | EmblemManagement·RivalManagement 위반 발견 후 수정, **GrowthOverview는 원래부터 위반 없음 확인** |
| 9 | 학부모 페이지 Rival/Emblem/SP 미노출 | **grep 재검증 — 주석 제외 실제 코드 매치 0건** |
| 10 | 선생님 페이지 용어 정리 | `TeacherLayout.tsx` 하단 네비 "채점"→"시험지"(가장 노출도 높은 지점) 등 수정 — 불변 파일 `TeacherExamGrading.tsx`의 "채점" 타이틀은 정책상 예외(§GPT 의견 참조) |
| 11 | 시험지별 그래프 강화 | 학생/학부모/선생님 3개 화면 모두에 점수 비교 막대 그래프 추가 확인 |
| 12 | 불변 파일 4종 MD5 | **완전 동일**(아래 §참조) |

### 불변 파일 MD5 (v3-r1 작업 후 재확인)

```
387bbf48a3d87ff63ce10d6dbc8bf33c  src/App.tsx
3429a4ba81c0500e6596418edc639225  src/pages/teacher/TeacherExamGrading.tsx
1eddaef5cf427e00666be685ea16f32f  src/lib/universityAnalysisAdapter.ts
126d9e5e314de186bf1df0a63b3abf82  src/lib/classData.ts
```

### 학생 화면 금지어 재검증

```
grep -rnE "수납|재무|청구|미납|환불|영수증" src/pages/student/ src/layouts/StudentLayout.tsx
→ 0건(주석 제외)
grep -rnE "합격률|합격 가능성|합격 보장|안정 합격|불합격" src/ --include="*.tsx" --include="*.ts"
→ 0건(주석 제외)
```

### 학부모 화면 Rival/Emblem/SP 미노출 재검증

```
grep -rn "Rival|Emblem|엠블럼|라이벌|useGrowth|totalSP|TIER_LABELS|TIER_COLORS" src/pages/parent/*.tsx
→ 주석 1건(정책 설명 문구)만 매치, 실제 코드 노출 0건
```

### 신규 라우트 동작 확인(코드 추적)

- `/student/my` → `StudentMyPage` 컴포넌트 직접 연결 확인(StudentRoutes.tsx)
- `/student/target-preview` → `StudentTargetPreview` 컴포넌트 직접 연결 확인
- `/student/growth` → `StudentGrowthShowcase` 컴포넌트 직접 연결 확인(기존 placeholder 제거)
- `/student/rival` → 신규 `StudentRival.tsx` 연결 확인
- 학생 하단 네비게이션 5탭(홈/테스트/진열장/Rival/마이) 전부 실제 라우트에 대응하는지
  `StudentLayout.tsx`의 `STUDENT_NAV` 배열과 교차 확인 — 5개 전부 일치.

---

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
