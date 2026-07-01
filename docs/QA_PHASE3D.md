# QA_PHASE3D.md

## v3-r9-r4 검수 결과

**버전**: v3-r9-r4 — 정식 반려 사이클이 아니라, 사용자가 채팅에서 직접 이미지와
지시를 준 즉시 반영 hotfix. 베이스라인 v3-r9-r3.

### 검증 명령 실행 결과

```
$ tsc -p tsconfig.app.json --noEmit 2>&1 | wc -l
379   (계속 동일)
$ tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "error TS1[0-9]{3}" | wc -l
0
```

### 색상 변경 근거(정량)

```
기존 --brand-navy: #040D1E (v3-r9-r2, 이전 이미지 세트 샘플)
신규 --brand-navy: #040E1F (v3-r9-r4, 이번 이미지 재샘플)
RGB 유클리드 거리: 1.41   (사람 눈 구분 임계값 통상 5~10 이상 — 사실상 동일색)
```

이 차이가 무의미한 수준이라, v3-r9-r2에서 이미 전역 치환된 67개 파일의
하드코딩 리터럴은 이번엔 재치환하지 않았다 — 토큰(`--brand-navy`,
`AXIS_NAVY_OKLCH`)만 최신값으로 갱신했다. 사이드바는 v3-r9-r3에서 이미
토큰 참조로 바뀌어 있었으므로 이 갱신만으로 정상 반영된다.

### 정책 검증 결과

| 항목 | 결과 |
|---|---|
| 로그인 히어로 이미지 중앙정렬 개선 | 반영(새 이미지로 교체) |
| 관리자 사이드바 네이비 갱신 | 반영(토큰 경유로 자동 반영, 사이드바 코드 자체는 무변경) |
| IF 엔진 import 구조 후퇴 여부 | 후퇴 없음(미접촉) |
| 임의 SVG 마크 회귀 여부 | 없음(이미지 기반 유지) |
| 전체 화면 네이비 도배 여부 | 아님(적용 범위 무변경, 값만 미세 조정) |
| 불변 파일 3종 MD5 | 변경 없음 |

---

## v3-r9-r3 검수 결과

**버전**: v3-r9-r3 — v3-r9-r2 반려 대응(사유: 브랜드 네이비 잔여 하드코딩,
IF 엔진 부분은 통과 판정 받음).

### 네이비 잔여값 재검색 (확장자 제한 없이)

```
$ grep -rn "#081F4D" src        ← v3-r9-r2에서는 --include="*.tsx" --include="*.ts"로
                                    제한했던 게 문제였다. 이번엔 제한 없이 재실행.

수정 전: src/index.css:166 background-color: #081F4D;  (.axis-sidebar)
수정 후: 실제 UI 코드 0건 (주석 3곳만 남음 — 전부 변경 이력 설명용)
```

```
$ grep -rn "oklch(0.254 0.090 262.09)" src   → 0건 (구 oklch 리터럴도 재확인)
$ find src -name "*.css"                      → src/index.css 1개뿐 (다른 CSS 파일 없음, 누락 가능성 없음 확인)
```

### 검증 명령 실행 결과

```
$ tsc -p tsconfig.app.json --noEmit 2>&1 | wc -l
379   (계속 동일)

$ tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "error TS1[0-9]{3}" | wc -l
0
```

### 정책 검증 결과

| 항목 | 결과 |
|---|---|
| 브랜드 네이비 잔여 하드코딩(`#081F4D`, 확장자 무관 전체 검색) | **해소 확인**(UI 코드 0건) |
| IF 엔진 import 구조 후퇴 여부 | 후퇴 없음(이번에 `ifAnalysisEngine.ts` 외 파일 전혀 미접촉) |
| `studentIfAnalysis.ts`/`studentIfRecord.ts` 직접 import 재사용 여부 | 재사용 없음(재확인만, 변경 없음) |
| 로그인 히어로/실제 마크 이미지 → 임의 SVG 교체 여부 | 교체 없음(변경 없음) |
| 전체 화면 네이비 도배 여부 | 아님 — 이번 변경은 `.axis-sidebar` 배경색 리터럴을 토큰 참조로 바꾼 것뿐, 적용 범위 확장 없음 |
| 학생 재무 노출 | 없음 |
| IF 이유 3개(계산 실수/개념 부족/시간 부족) | 유지 |
| 금지 표현 5종 | 미발견 |
| 불변 파일 3종 MD5 | 변경 없음 |

이번 라운드는 수정 파일이 `src/index.css` 1개뿐인 최소 범위 hotfix였다 —
지시받은 개발 순서(1~4단계)를 그대로 따랐고 그 이상 손대지 않았다.

---

## v3-r9-r2 검수 결과

**버전**: v3-r9-r2 — v3-r9-r1 반려 대응 hotfix(사유: IF 엔진 단일 진입점 미완성).
베이스라인은 v3-r8 + v3-r9-r1의 로그인 히어로/브랜드 마크 부분(유지 지시).

### IF 단일 진입점 전수 재검증

```
$ grep -rln "from '@/lib/studentIfAnalysis'\|from '@/lib/studentIfRecord'" src \
    --include="*.tsx" --include="*.ts" | grep -v "ifAnalysisEngine.ts\|studentIfRecord.ts\|studentIfAnalysis.ts"

(결과 없음 — src/lib/ifAnalysisEngine.ts 외에는 직접 import하는 파일이 전무함)
```

수정 전 이 명령의 결과는 정확히 6개 파일(StudentList.tsx, ScoreExportPanel.tsx,
TeacherStudentDetail.tsx, TeacherHome.tsx, ParentHome.tsx, ParentGrowthReport.tsx)
이었고, 지시받은 목록과 정확히 일치했다. 수정 후 재실행 결과 0건 — "단일
진입점" 원칙이 실제로 완성됐음을 기계적으로 확인했다.

### 검증 명령 실행 결과

```
$ tsc -p tsconfig.app.json --noEmit 2>&1 | wc -l
379   (v3-r8/v3-r9/v3-r9-r1과 완전히 동일)

$ tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "error TS1[0-9]{3}" | wc -l
0     (문법 오류 없음, 71개 파일 대규모 색상 치환 이후에도 동일)
```

### 정책 검증 결과

| 항목 | 결과 |
|---|---|
| IF 엔진 단일 진입점(ifAnalysisEngine.ts 외 직접 import 없음) | **완성 확인**(위 grep 결과 0건) |
| 로그인 실제 AXIS 히어로 이미지 유지 | 유지(변경 없음) |
| 임의 SVG 마크로 회귀 여부 | 회귀 없음(`AxisMark`/`AxisWordmark` 계속 `<img>` 기반) |
| 네이비 전체 화면 도배 여부 | 아님 — 적용 범위(버튼/배지/사이드바/포커스링/강조선)는 v3-r8과 동일, 값만 갱신 |
| 색상값 임의 생성 여부 | 아님 — 실제 이미지 픽셀 샘플링값(#040D1E) 사용, 산출 과정 문서화 |
| IF 이유 3개 초과 | 없음 |
| IF 별도 메뉴/라우트 | 없음 |
| 학생 성적 직접 입력 | 없음 |
| 학생 화면 재무 노출 | 없음 |
| 학부모 IF 수정 기능 | 없음 |
| 화면 컴포넌트 IF 판단/계산/누적 로직 직접 보유 | 없음(v3-r9-r1에서 이미 제거한 `getIfCumulativeSummaryLocal` 재확인, 신규 발견 없음) |
| 외부 AI API 호출(OpenAI/Claude/Gemini) | 없음 |
| 금지 표현(합격률 등 5종) | 미발견(정책 주석만) |
| 불변 파일 3종 MD5 | 변경 없음 |

### 알려진 한계

- 네이비 리터럴 치환은 정확히 `#081F4D`와 `oklch(0.254 0.090 262.09)` 두 문자열
  패턴만 대상으로 했다. 혹시 이 두 패턴과 다르게 표기된(예: 대소문자, 공백 차이)
  네이비 값이 남아있을 가능성은 이론상 있으나, 재검색 결과 두 패턴 모두 0건으로
  확인됐다.
- 이번 색상 갱신은 "메인 네이비"만 다뤘고, 그 파생 옅은 배경 틴트(`#E7EBF3`
  등)는 색조 차이가 육안으로 거의 구분되지 않아 그대로 뒀다 — 실제 화면에서
  메인 색과 옅은 틴트가 나란히 보일 때 위화감이 있으면 다음 라운드에 알려달라.

---

## v3-r9-r1 검수 결과

**버전**: v3-r9-r1 — v3-r9 반려 대응 hotfix. 베이스라인은 v3-r8(Build Check
통과 확인 상태)이며, v3-r9에서 만든 로그인 딥 네이비 히어로 방향만 유지한 채
다시 작업했다.

### 검증 명령 실행 결과

```
$ tsc -p tsconfig.app.json --noEmit 2>&1 | wc -l
379   (v3-r8/v3-r9와 완전히 동일)

$ tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "error TS1[0-9]{3}" | wc -l
0     (문법 오류 없음)
```

신규 이미지 import(`axis-hero-dark.png`, `axis-mark-icon.png`,
`axis-wordmark-light.png`) 관련 타입 에러도 없었다 — `global.d.ts`에 추가한
`declare module '*.png'` 선언이 정상 작동함을 확인했다.

### 정책 검증 결과

| 항목 | 결과 |
|---|---|
| 로그인 히어로 되돌림 여부 | 되돌리지 않음 — 이미지1로 교체해 오히려 더 강화됨 |
| 딥 네이비 유지 여부 | 유지(이미지 자체에 내장된 톤 그대로) |
| 전체 화면 네이비 여부 | 아님 — 페이지 배경은 계속 Ivory, 카드형 이미지만 다크 |
| 허접한 임의 마크 유지 여부 | **해소** — SVG 재해석을 걷어내고 실제 브랜드 이미지로 교체 |
| IF 별도 메뉴화(`/student/if` 등) | 없음(확인) |
| IF 이유 3개 초과 | 없음(`IF_REASONS` 3개 고정 유지) |
| 학생 성적 직접 입력 | 없음 |
| 학생 화면 재무/수납/청구/미납/환불/영수증 노출 | 없음 |
| 학부모 IF 수정 기능 | 없음(읽기 전용 유지) |
| 선생님 수동 입력 기능 신설 | 없음 |
| 외부 AI API 호출 추가 | 없음 |
| 화면 컴포넌트 IF 판단/계산 로직 직접 삽입 | **1건 추가 발견·제거**(`getIfCumulativeSummaryLocal`) |
| v3-r8 업무 화면 레이아웃 대규모 재작업 | 없음 — 헤더 배지 마크업만 단순화(색상 div 제거), 업무 화면 구조/레이아웃 자체는 무변경 |
| 금지 표현(합격률 등 5종) | 미발견(정책 주석만) |
| 불변 파일 3종 MD5 | 변경 없음 |

### 알려진 한계

- 이미지 처리(배경 투명화, 정사각 패딩)는 코드로 재현 가능한 결정적 처리이지만,
  브라우저에서 실제 렌더링했을 때 마크 이미지의 해상도(164×164, 소형 배지에는
  충분하지만 더 큰 사이즈로 확대해서 쓰면 흐려질 수 있음)는 육안 확인이 필요하다.
- `axis-wordmark-light.png`는 이번 라운드에 실제로 사용하는 화면이 없다(로그인은
  히어로 이미지 통짜를 쓰고, 헤더 배지는 소형 마크만 쓴다) — 향후 밝은 배경에
  전체 워드마크가 필요한 화면이 생기면 바로 쓸 수 있도록 컴포넌트만 준비해뒀다.

---

## v3-r9 검수 결과

**버전**: v3-r9 — v3-r8 GitHub Actions Build Check 통과 확인 완료 상태에서 시작.

### 검증 방법론 개선 — 실제 tsc 문법 검사

이전 라운드까지는 `npm install`이 레지스트리 차단으로 실패해 괄호 균형 검사
같은 대리 검증만 가능했다. 이번에 확인해보니 **이 컨테이너에 TypeScript
컴파일러가 전역 설치되어 있었다**(`/home/claude/.npm-global/lib/node_modules/typescript`,
v6.0.3) — `npm install` 없이 `tsc` 명령 자체는 바로 쓸 수 있다.

```
$ tsc -p tsconfig.app.json --noEmit 2>&1 | wc -l
379   (v3-r8 베이스라인과 v3-r9 결과물 동일)

$ tsc -p tsconfig.app.json --noEmit 2>&1 | grep -oE "error TS[0-9]+" | sort | uniq -c
    235 error TS2307   (Cannot find module — react/wouter/lucide-react 등, node_modules 없어서 발생)
    112 error TS2875   (jsx-runtime 모듈 없음 — 위와 동일 원인)
     25 error TS2503   (Cannot find namespace 'React' — 위와 동일 원인)
      4 error TS2339   (Property does not exist — 아래 확인)
      2 error TS2322   (Type not assignable — 아래 확인)
      1 error TS2559

문법 오류(TS1xxx 계열): 0건
```

TS2339/2322/2559(7건)는 v3-r8 베이스라인에서 정확히 동일한 파일·라인으로
이미 존재했음을 대조 확인했다(`App.tsx`, `ErrorBoundary.tsx`, `ClassList.tsx`,
`TeacherExamScores.tsx` — 전부 이번 라운드에 손대지 않은 파일). React 타입을
못 찾는 환경에서 발생하는 연쇄적 타입 추론 저하로 보이며, 실제 `node_modules`가
설치된 환경(GitHub Actions)에서는 재현되지 않을 가능성이 높다 — 그래도 혹시
모르니 GitHub Actions 결과에서 이 4개 파일 관련 에러가 뜨면 알려달라, 별도로
확인하겠다.

**결론**: 이번 라운드에서 수정/신규 생성한 파일(`ifAnalysisEngine.ts`,
`LoginPage.tsx`, `TeacherStudentGrowth.tsx`)에서 새로 발생한 에러는 0건이다
(v3-r8 대비 전체 에러 라인 수가 379줄로 완전히 동일).

### 정책 검증 결과

| 항목 | 결과 |
|---|---|
| IF 채점이 테스트 성적표 상세 안에서만 열리는지 | ✔ 확인(`StudentGrades.tsx`의 `ResultDetailModal` 내부, 별도 라우트 없음) |
| IF 이유 3개 고정(계산 실수/개념 부족/시간 부족) | ✔ 확인(`IF_REASONS` 상수, 초과 없음) |
| 학생 성적 직접 입력 UI | 미발견(이미 제거된 상태) |
| 학부모 IF 선택/수정 가능 여부 | 불가능(읽기 전용 요약만, `ParentGrades.tsx` 확인) |
| 학부모 IF와 선생님 상담 기록 원문 연결 여부 | 연결 없음 |
| 선생님 화면 IF 수동 입력 기능 신설 여부 | 신설 없음(자동 브리핑 엔진만 사용) |
| 화면 컴포넌트 판단/계산 로직 직접 삽입 | **1건 발견(TeacherStudentGrowth.tsx) → 수정 완료** |
| 외부 AI API 호출 추가 여부 | 없음 |
| 문제은행/엠블럼/라이벌/대학추천 확장을 막는 폐쇄형 구조 여부 | 없음(엔진 계약 파일에 연결 지점 명시) |
| v3-r8 브랜드/레이아웃 대규모 재작업 여부 | 없음(로그인 화면 히어로만 사용자 요청으로 부분 수정, 나머지 레이아웃 무변경) |
| 금지 표현(합격률/합격가능성/합격보장/안정합격/불합격) | 실 UI 텍스트에서 미발견 |
| 불변 파일 3종 MD5 | 이번 라운드 미접촉 — 변경 없음 |

### 알려진 한계

- 로그인 히어로 카드의 네이비 값(`#000926`)은 참고 이미지에서 픽셀 샘플링한
  값이며, 카드 배경 588개 샘플 중 588개가 동일해 신뢰도는 높지만 이미지
  자체의 압축/렌더링에 따라 실제 의도한 값과 미세하게 다를 수 있다.
- `AxisWordmark`를 더 큰 사이즈(height 56)로 쓰는 건 이번이 처음이라, 실제
  브라우저에서 대각선 슬래시와 "X" 글자 정렬이 여전히 잘 맞는지 육안 확인이
  필요하다(v3-r8 QA에서 남긴 한계와 동일 사유).

---

## v3-r8 검수 결과

**버전**: v3-r8 — v3-r7-r1 GitHub Actions Build Check 통과 확인 완료 상태에서 시작.

### 검증 명령 실행 결과

이번 작업 환경도 이전과 동일하게 `registry.npmjs.org` 접근이 차단되어 있어
`npm install`/`npm run typecheck`/`npm run build`를 직접 실행할 수 없었다.
**이는 이 세션 내에서 Claude가 해결할 수 없는 환경 제약이며, 산출물 자체의
결함이 아니다.** 최종 판정은 GitHub Actions Build Check 결과로 확인해야 한다.

**대체 검증 1 — 괄호 균형 검사**: 이번 라운드에서 수정/신규 생성한 파일이 속한
디렉토리(`src/components`, `src/layouts`, `src/pages`, `src/lib`, `src/index.css`)
전체 136개 파일에 대해 `(`/`)`, `{`/`}`, `[`/`]` 개수 일치 여부를 확인했다.

```
검사 파일 수: 136
⚠ 불균형 발견:
  src/lib/financeData.ts     — 미수정 파일. v3-r7-r1 원본에도 동일 불균형 존재(사전 결함, 이번 무관).
  src/lib/notificationData.ts — 미수정 파일. 위와 동일.
  src/pages/LoginPage.tsx     — 이번에 수정한 파일. v3-r7-r1 원본과 불균형 수치 동일(72:73) —
                                 본문 한글 텍스트("...번호 뒤 4자리)" 등)에 포함된 괄호 때문에
                                 발생하는 이 검사법 자체의 오탐이며, 이번 수정으로 새로 생긴
                                 문제 아님.
  src/pages/StudentDetail.tsx — 위와 동일 사유(1523:1532, 원본과 수치 동일).
✔ 그 외 132개 파일 전부 균형 정상
```

즉 이번 라운드에서 **새로 발생한 불균형은 0건**이다(4건 모두 v3-r7-r1 원본에
이미 존재하던 것과 수치가 정확히 일치함을 개별 대조 확인했다).

**대체 검증 2 — 치환 전/후 괄호 개수 대조**: 순수 문자열 치환(색상 값, 라벨
텍스트)만 수행한 핵심 파일 3개(`StudentHome.tsx`, `StudentGrades.tsx`,
`StudentGrowthShowcase.tsx`)는 수정 전/후 `(`/`)`/`{`/`}` 개수가 정확히
동일함을 확인했다 — 구조적 변경 없이 값만 바뀌었다는 뜻.

**대체 검증 3 — import/사용처 정합성**: 신규 컴포넌트 `AxisMark`/`AxisWordmark`가
사용된 5개 파일 전부에서 import 문과 실제 JSX 사용이 1:1로 일치함을 grep으로
확인했다.

### 정책 검증 결과

| 항목 | 결과 |
|---|---|
| 금지 표현(합격률/합격가능성/합격보장/안정합격/불합격/수능실전주간루틴 등 13종) | 실 UI 텍스트에서 미발견(전부 정책 주석) |
| 학생 화면 재무/수납/청구/미납/환불/영수증 노출 | 미발견 |
| 학생 직접 성적 입력 UI | 미발견(이미 제거 상태) |
| 학부모 화면 Rival/Emblem/SP/Tier 직접 노출 | 미발견 |
| 학부모 화면 상담 기록 원문 노출 | 미발견 |
| 학부모 화면 총액 과시형 UI(총 청구액/총 미납액) | 미발견(v2에서 이미 제거, 상태 중심 표시만 존재) |
| 전체 다크 로그인 화면 | 미발견(Ivory 배경 유지, 이번에 정확한 브랜드 Ivory 값으로 보정) |
| 보라색 하드코딩(hex + oklch hue 260~320) | **발견 → 전부 교체**(약 60곳, 상세는 `MODIFIED_FILES_PHASE3D.md` 참조) |
| 과한 그라데이션/blob/orb | 미발견(기존 그라데이션 3곳 모두 절제된 브랜드 톤 포인트) |
| 임의 색상 팔레트 신규 생성 | 신규 팔레트 생성 없음 — 기존 보라색만 브랜드 Navy/Gold로 치환, 비보라색 카테고리 색상은 유지 |
| 불변 파일 3종 MD5 (universityAnalysisAdapter.ts / App.tsx / classData.ts) | 이번 라운드 미접촉 — 변경 없음 |

### 알려진 한계 / 다음 라운드 확인 필요 사항

- `AxisWordmark`의 대각선 슬래시 위치(`x1=148 y1=122 x2=234 y2=2`, viewBox
  `0 0 400 130`)는 SVG `<text>` 요소의 실제 렌더링 폭을 브라우저 없이 추정한
  값이다. 실제 브라우저에서 "X" 글자 위치와 슬래시가 정확히 겹치는지 시각
  확인이 필요하다 — 어긋나 보이면 `x1`/`x2` 값만 조정하면 된다.
- npm 레지스트리 접근이 계속 차단되어 있어 로컬 `npm run build`를 이 세션에서
  단 한 번도 실제로 실행해보지 못했다. GitHub Actions 결과를 다음 라운드
  시작 시 반드시 공유해달라.

---

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

---

# QA — Phase 3D v3-r4 (parent engagement + risk alerts, 트랜치 1)

## 빌드/타입체크 실행 결과

- `npm install` → **실패**. 네트워크 제한 환경(오프라인)으로 레지스트리 접근이 403(Forbidden)
  차단됨(`GET https://registry.npmjs.org/...`). 따라서 `npm run typecheck`(`tsc -b`)와
  `npm run build`(`tsc -b && vite build`)를 이 환경에서 실행할 수 없음.
- → 확정된 대체 절차대로 진행: **로컬(네트워크 가능 환경)에서 `npm install` 후
  `npm run typecheck` / `npm run build` 실행 필요**. 아래 대리 검증을 통과했으나, 최종
  타입/빌드 확인은 로컬에서 반드시 1회 수행할 것.

## 대리 검증(surrogate validation) — 통과

- **불변 파일 MD5 유지 확인**: universityAnalysisAdapter.ts `1eddaef5`,
  TeacherExamGrading.tsx `3429a4ba`, App.tsx `387bbf48`, classData.ts `126d9e5e` — 전부 불변.
- **괄호/중괄호/대괄호 균형**: 변경·생성 6개 파일 전부 잔여 스택 0.
- **tsconfig 확인**: `noUnusedLocals:false`(미사용 import는 에러 아님), `strict:true`.
  신규 추가 import/심볼은 전부 실제 사용됨.
- **타입 호환**: `loadIfRecords()`(StudentIfRecord[])는 `ObservationInput.ifRecords`
  (IfRecordLite[])에 구조적으로 대입 가능(examDate/missedPoints/isComplete 포함).
  `getPublishedResultsForStudent()`는 StudentExamResult[] 그대로 사용.

## 기능 QA 체크리스트(로컬 확인 권장)

1. 모바일 폭(≤768px)에서 관리자 좌측 드로어를 연다 → 메뉴가 많아도 하단 사용자/모드전환/DEV
   영역이 잘리지 않고, 가운데 메뉴 영역만 스크롤되는지.
2. 데스크톱에서 사이드바 하단 고정·메뉴 스크롤이 기존과 동일하게 동작하는지(회귀 없음).
3. 선생님 홈: "오늘의 관찰 필요 학생" 패널이 인사 카드 아래 표시되고, [상세 보기]가
   `/teacher/students/:id`로 이동하는지. 담당 학생 기준으로만 계산되는지.
4. 관리자 학생목록 상단: "확인 필요한 학생" 패널이 요약카드 위에 표시되고, [상세 보기]가
   `/admin/students/:id`로 이동하는지. 접근 권한 밖 학생이 섞이지 않는지.
5. 신호가 없는 계정(신규/데이터 없음)에서 패널이 빈 상태 문구로 정상 표시되는지.
6. 배지/이유 문구에 금지어(위험/문제 학생, 경고, 탈락, 불합격, 합격 관련)가 없는지.

## 알려진 이슈 / 개발 총괄(GPT) 권고

- **불변 파일 제목 충돌**: `TeacherExamGrading.tsx`가 `title="채점"`을 하드코딩하는데, 이는
  "단독 채점을 화면 제목으로 쓰지 않는다"는 v3-r4 문구 정책과 충돌한다. 그러나 이 파일은
  MD5 불변 대상이라 이번 라운드에 변경하지 않았다(불변 정책 우선).
  → 권고안 2가지 중 택1:
    (a) 다음 라운드에 이 파일의 불변 잠금을 일시 해제하고 `title`만 `"내 시험지 관리"`로
        교체(가장 정책 부합).
    (b) 이 화면은 "내 시험지 관리 → 채점하기"로 진입하는 **실제 채점 액션 화면**이므로
        제목 "채점"을 액션 화면 예외로 명시 허용(정책 문서에 예외 1줄 추가).
  개인적으로는 (a)를 권장한다 — 정책의 일관성이 유지되고, 변경 범위가 title 한 줄로 작다.

## 트랜치 2 검증 예정 항목

학부모 객관지표 카드/자녀에게 해줄 말/자동 브리핑/출결·숙제 위험신호/시험 그래프 심화/
테이블 UI 심화 감사는 트랜치 2에서 구현 및 QA 예정(미구현 상태를 문서에 명시).

---

# QA — Phase 3D v3-r4-r1 (briefing insight completion)

## v3-r4 반려 반영

이전 산출물(`...v3-r4-github-upload.zip`)은 반려되어 GitHub에 업로드하지 않았다. 이번
zip은 v3-r3 기준에서 다시 시작해 유지 지시받은 3가지(observationSignals.ts,
ObservationPanel.tsx, 관리자 모바일 사이드바 수정)만 반영한 상태 위에 이번 라운드
필수 항목을 새로 쌓았다.

## 빌드/타입체크 실행 결과

- `npm install`이 이 환경(오프라인)에서 403으로 차단되어 `npm run typecheck` /
  `npm run build`를 실행할 수 없음(v3-r4와 동일한 환경 제약). **로컬에서
  `npm install && npm run typecheck && npm run build` 1회 필수 실행.**

## 대리 검증(surrogate validation) — 통과

- 불변 파일 MD5 유지: universityAnalysisAdapter.ts `1eddaef5`, TeacherExamGrading.tsx
  `3429a4ba`, App.tsx `387bbf48`, classData.ts `126d9e5e` — 전부 불변.
- 변경/생성 10개 파일(`index.css`, `AdminLayout.tsx`, `observationSignals.ts`,
  `ObservationPanel.tsx`, `parentInsightEngine.ts`, `studentBriefingEngine.ts`,
  `TeacherHome.tsx`, `StudentList.tsx`, `TeacherStudentDetail.tsx`, `ParentHome.tsx`)
  전체 괄호/중괄호/대괄호 균형 통과.
- tsconfig `noUnusedLocals:false`(미사용 import 에러 아님), `strict:true`. 신규
  추가 심볼(bundle 필드 등)은 property shorthand로 전부 실사용 확인.
- 타입 호환: `AttendanceRecordLite.status`는 `AttendanceRecord.status`(AttendanceStatus)와
  동일 타입. `HomeworkItemLite`는 `Homework.createdAt`+`HomeworkStatus.status`에서
  파생. `computeSubjectGaps()`의 `getSubject` 리졸버는 `Exam.subject?: string`과 호환.
- AI API 호출 금지 검증: `parentInsightEngine.ts`/`studentBriefingEngine.ts`/
  `observationSignals.ts`에 fetch/OpenAI/Claude/Gemini 호출 0건(주석 설명만 검출).
- 금지 표현/게임형 지표 노출 검증: 변경 파일 전체에서 합격 관련·위험/문제 학생·
  Rival/Emblem/SP/Tier 매치는 전부 금지 원칙을 설명하는 주석뿐, 실제 렌더링 노출 0건.

## 기능 QA 체크리스트(로컬 확인 권장)

1. **위험 신호 확장** — 결석/지각이 최근 2주 새 늘어난 더미 학생, 숙제 미제출이 늘어난
   학생, 목표 대비 과목이 나빠진 학생이 있다면 관리자/선생님 알림판에 해당 배지
   (학습 리듬 확인 / 확인 필요)로 뜨는지.
2. **선생님 담당 학생 상세** — `/teacher/students/:id`에서 "담당 학생 빠른 브리핑" 카드가
   보이고, teacherBriefing 문장·하이라이트 칩·확인할 지점이 실제 데이터와 맞는지.
3. **학부모 홈** — `/parent` 진입 시 "객관 지표"(8종) · "상담 전 확인 카드" · "자녀에게
   해줄 말" 3개 섹션이 성장 리포트 카드 아래에 순서대로 보이는지. 자녀가 여러 명이면
   선택 변경 시 지표가 함께 바뀌는지.
4. **낙인/압박 문구 금지** — "자녀에게 해줄 말"에 부정적 표현이 없고 항상 격려/협력
   톤인지(여러 학생 케이스로 확인).
5. **AI 미사용** — 네트워크 요청 탭(dev tools)에서 브리핑/인사이트 카드 렌더링 시
   외부 API 호출이 전혀 없는지(즉시 렌더링되어야 함 — 로딩 스피너 없음).
6. **회귀 없음** — 기존 ParentHome 표시 항목(수강 반/출결 요약/성적 카드/숙제/콘텐츠/
   수납 상태)이 이전과 동일하게 보이는지(새 섹션은 추가만 되고 기존 로직은 그대로임).

## 알려진 이슈(v3-r4에서 이월, 변경 없음)

- `TeacherExamGrading.tsx`의 `title="채점"` — 불변 파일이라 이번에도 미변경. 권고안은
  이전 QA 섹션(v3-r4) 참조: title만 교체하는 (a)안을 권장.

## 다음 라운드 예정

시험지별 그래프 심화, 테이블 UI 심화 감사, ParentGrowthReport.tsx 중복 연결 여부 검토.

---

# QA — Phase 3D v3-r5 (teacher exam structure cleanup)

## 빌드/타입체크 실행 결과

- 이 환경은 여전히 오프라인이라 `npm install`이 403으로 차단되어 `npm run typecheck` /
  `npm run build`를 실행할 수 없음. **로컬에서 `npm install && npm run typecheck &&
  npm run build` 1회 필수 실행.**

## 대리 검증(surrogate validation) — 통과

- 불변 파일 MD5 유지: universityAnalysisAdapter.ts `1eddaef5`, TeacherExamGrading.tsx
  `3429a4ba`(래퍼만 수정, 파일 자체는 무변경), App.tsx `387bbf48`, classData.ts
  `126d9e5e` — 전부 불변.
- 변경 16개 파일 전체 괄호/중괄호/대괄호 균형 통과.
- `national-mock`/`school-record`/`weekly-suneung` site-wide 재검색 — weekly-suneung
  잔여 참조 0건, national-mock/school-record는 의도된 정상 유지 지점(phase2dData.ts
  학생 성적 탭, TeacherUniversityData.tsx 성적 입력 탭 — 둘 다 Assessment Engine과
  무관)뿐임을 확인.
- `EXAM_CATEGORIES.find(...).label` 논-null 사용처(StudentMockExams.tsx,
  ParentMockExams.tsx) — 대상 categoryId(mock-school/mock-suneung)가 카탈로그에
  그대로 남아있어 undefined 접근 위험 없음.
- 타입 호환: `TEACHER_CREATABLE_EXAM_CATEGORY_IDS`/`ADMIN_CREATABLE_EXAM_CATEGORY_IDS`는
  `as const` 튜플이며, `readonly string[]` 타입 변수에 대입 가능(구조적 호환) —
  `.includes(e.categoryId)` 호출부는 `as readonly string[]` 캐스팅으로 명시.

## 기능 QA 체크리스트(로컬 확인 권장)

1. **관리자 시험 등록** — `/admin/scores`(AssessmentList.tsx)에서 "시험 등록" 클릭 시
   시험 종류 드롭다운에 입학테스트/단원평가/인증평가/내신대비모의고사 4개만 뜨고
   수능실전모의고사가 빠졌는지.
2. **교사 시험 만들기** — `/teacher/exams`에서 "내 시험 만들기" 클릭 시 시험 종류
   드롭다운에 단원평가/내신대비모의고사 2개만 뜨는지(입학테스트/인증평가/수능실전모의고사
   전부 안 보여야 함).
3. **교사 시험 목록/홈** — 기존에 입학테스트·인증평가·수능실전모의고사 카테고리로 만들어진
   더미 시험이 있다면(exam-002 입학테스트, exam-003/005~008 수능실전모의고사)
   `/teacher/exams`(미채점/전체 탭), `/teacher/grades`(학생별 성적), `/teacher/home`
   (미채점 시험/최근 테스트 결과 위젯) 어디에도 나타나지 않는지.
4. **URL 직접 접근 방어** — 교사 계정으로 `/teacher/exams/{수능실전모의고사examId}/scores`,
   `/teacher/exams/{입학테스트examId}/grading`에 직접 접근 시 "이 화면에서 채점할 수
   없는 시험입니다" 안내가 뜨는지(빈 화면/에러 아님).
5. **학생 화면** — `/student/mock-exams`(모의고사 결과)에 "수능실전 주간 루틴" 카드가
   더 이상 없는지. 직접 URL `/student/weekly-mocks`로 진입 시 화면 상단 타이틀이
   "수능실전모의고사 결과"로 뜨는지.
6. **학부모 화면** — `/parent/mock-exams`에 동일 카드가 없는지, `/parent/weekly-mocks`
   진입 시 타이틀이 "자녀 수능실전모의고사 결과"로 뜨는지.
7. **성적 입력 화면** — `/teacher/university-data`(대학추천 데이터) 수능실전 탭에서
   "시험 종류" 표시가 "수능실전모의고사"로, 성적표 헤더가 "수능실전모의고사 성적표
   입력"으로 보이는지.
8. **학생 목표대학 미리보기** — `/student/target-preview`에서 최근 모의고사 라벨이
   "OOOO년 OO월 수능실전모의고사 (고3)" 형태로(구 "수능실전" 단독 표기 아님) 표시되는지.
9. **회귀 없음** — 단원평가/내신대비모의고사 시험은 교사 화면(시험 만들기·목록·채점·
   성적)에서 이전과 동일하게 정상 동작하는지. 학생/학부모의 기존 성적 조회(전국모의/
   실제내신 탭 포함)에 변화가 없는지.

## 알려진 이슈(이월, 변경 없음)

- `TeacherExamGrading.tsx`의 `title="채점"` — 불변 파일이라 이번에도 미변경.

## 설계 결정 메모

- `StudentWeeklyMocks.tsx`/`ParentWeeklyMocks.tsx` 페이지·라우트 자체는 삭제하지
  않았다 — "수능실전주간루틴"은 시험 종류가 아니라 mock-suneung 결과를 회차순으로
  누적 조회하는 화면일 뿐이라는 지시를 그대로 반영해, 진입 메뉴만 제거하고 화면
  타이틀만 정정했다. 필요 시 다음 라운드에 완전히 제거하거나 `/teacher/university-data`
  "성적 입력 → 내부 분석" 흐름에 명시적으로 재연결할 수 있다.

---

# QA — Phase 3D v3-r6 (employee/emblem/rival/class/score fixes)

## 빌드/타입체크 실행 결과

- 이 환경은 여전히 오프라인이라 `npm install`이 403으로 차단되어 `npm run typecheck` /
  `npm run build`를 실행할 수 없음. **이번 라운드는 `package.json`에 신규 의존성
  `xlsx@^0.18.5`가 추가되었으므로, 로컬에서 `npm install && npm run typecheck &&
  npm run build`를 반드시 1회 실행해야 한다(신규 패키지 설치 확인 포함).**

## 대리 검증(surrogate validation) — 통과

- 불변 파일 MD5 유지: universityAnalysisAdapter.ts `1eddaef5`, TeacherExamGrading.tsx
  `3429a4ba`, App.tsx `387bbf48`, classData.ts `126d9e5e` — 전부 불변.
- 변경/생성 18개 파일 전체 괄호 균형 통과.
- `xlsx` import(`import * as XLSX from 'xlsx'`)는 `scoreExportEngine.ts` 1개 파일에서만
  사용 — 화면(ScoreExportPanel/ScoreExportPage/TeacherScoreExport)은 전부 엔진 함수
  호출만 하고 xlsx를 직접 import하지 않음(요청된 "출력/계산 로직은 엔진으로 분리, 화면은
  결과 표시와 버튼만" 원칙 준수).

## 기능 QA 체크리스트(로컬 확인 권장)

1. **직원 등록** — `/admin/employees`에서 "직원 등록" 클릭 → 모달이 안정적으로 열리는지
   (연속으로 여러 번 열고 닫아도 동일하게 열리는지 — 기존 버그는 간헐적으로 안 열렸음).
   등록 완료 시 목록에 즉시 반영되는지.
2. **직원 활성/비활성** — 목록에서 "비활성화" 클릭 → 배지가 즉시 "비활성"으로 바뀌고,
   "활성화" 버튼으로 다시 전환되는지. 계정상태 필터로 활성/비활성만 걸러지는지. 퇴직
   처리된 직원에는 토글 버튼이 없는지.
3. **엠블럼 수정 팝업 드래그** — `/admin/growth/emblems`에서 "수정" 클릭 → 제목 영역을
   눌러 드래그하면 팝업이 실제로 화면상에서 이동하는지(기존 버그: 내부 상태는 바뀌지만
   화면에는 안 움직였음). 화면 가장자리로 끌어도 완전히 밖으로 나가지 않는지. X/취소/ESC
   모두 정상 닫히는지.
4. **라이벌 승/패/종료** — `/admin/growth/rivals`에서 승/패/종료 버튼에 마우스 오버 시
   밝기 변화, 클릭 시 살짝 눌리는 효과, 키보드 탭 이동 시 포커스 링이 보이는지. 클릭 시
   숫자(승/패/연승연패)가 즉시 갱신되는지.
5. **담당반 학생 목록** — `/teacher/classes`에서 운영중 반 카드 클릭 → 출석부 형태 표가
   뜨는지(학생명/수강상태/출결요약/최근테스트/숙제상태/상세버튼 6컬럼). PC 폭에서 표가
   안정적으로 보이는지, 좁은 화면에서 가로 스크롤로 대응되는지. 담당 반이 아닌 classId를
   URL에 직접 입력하면 접근 차단되는지.
6. **학생 성적 추이 선그래프** — `/student/grades`(테스트) 상단에 "성적 추이" 섹션에
   단원평가/내신대비모의고사 선그래프 2개가 뜨는지. 점에 마우스 올리면 시험일·시험명·
   점수가 보이는지. 기존 탭 안의 막대 그래프도 그대로 남아있는지. 데이터 없는 학생은
   빈 상태 안내가 뜨는지.
7. **관리자 성적 출력** — `/admin/scores/export`(사이드바 "시험 및 성적 관리 > 성적
   출력")에서 시험 선택 → 반/학생 선택(선택 사항) → 미리보기 표에 10개 컬럼이 모두
   채워지는지 → "Excel 다운로드" 클릭 시 .xlsx 파일이 받아지는지 → "PDF로 인쇄" 클릭 시
   브라우저 인쇄 대화상자가 뜨고 미리보기가 A4 형식(시험별로 나뉜 표)인지. STAFF 계정으로
   로그인 시 사이드바에 "성적 출력" 메뉴 자체가 안 보이는지(기존에는 보이고 클릭하면
   막히는 불일치가 있었음).
8. **강사 성적 출력** — `/teacher/scores/export`(내 시험지 관리 화면의 "성적 출력" 카드)
   에서 시험 목록에 단원평가/내신대비모의고사만 뜨고 입학테스트/인증평가/수능실전모의고사가
   전혀 안 보이는지. 다른 교사의 개인 시험이나 담당 아닌 반의 시험이 안 보이는지. 학생/반
   선택지도 담당 범위로만 제한되는지.

## v3-r5 유지 확인(다시 섞이지 않았는지)

- 강사 시험 생성/목록/채점/성적 출력 어디에도 입학테스트/인증평가/실제내신성적/
  전국모의고사/수능실전주간루틴이 노출되지 않음을 이번 라운드 신규 화면(TeacherScoreExport)
  까지 포함해 재확인.

## 알려진 이슈(이월, 변경 없음)

- `TeacherExamGrading.tsx`의 `title="채점"` — 불변 파일이라 이번에도 미변경.

## 다음 라운드 예정

- Excel/PDF 출력의 "학생별 개별 성적표"(현재는 시험별 일람표) 포맷 추가 여부 검토.
- 담당반 학생 목록에 출결 상세/숙제 상세로의 딥링크 추가 검토.

---

# QA — Phase 3D v3-r7 (QA architecture layout cleanup)

## 빌드/타입체크 실행 결과

- 이 환경은 오프라인이라 `npm install`/`npm run typecheck`/`npm run build`를 실행할 수
  없다. **지시사항에 명시된 대로 이번에는 GitHub Actions Build Check가 최종 검증
  기준이다** — 로컬/CI에서 `npm run typecheck && npm run build`가 반드시 통과해야 한다.
  신규 npm 의존성은 이번 라운드에 추가되지 않았다(v3-r6의 `xlsx`만 유지).

## 대리 검증(surrogate validation) — 통과

- 불변 파일 MD5 유지: universityAnalysisAdapter.ts `1eddaef5`, TeacherExamGrading.tsx
  `3429a4ba`(전혀 수정하지 않음 — addExam/markAttended 쪽에서 우회 해결), App.tsx
  `387bbf48`, classData.ts `126d9e5e`.
- 변경 25개 파일 전체, 주석/문자열을 건너뛰는 정밀 괄호 검증기로 재확인 통과(단순
  카운터가 StudentDetail.tsx의 한글 주석 `"1) 기본정보 탭 (+ 운영메모 로그)"` 안의 `)`를
  코드 괄호로 오인해 오탐을 낸 사례를 발견 → 이후 전체 검증을 정밀 검증기로 전환).
- 금지 표현/수능실전주간루틴/입학테스트·인증평가 관리자 전용 유지 전수 재검색 통과.

## 기능 QA 체크리스트(로컬 확인 권장)

1. **새 시험 즉시 채점 가능** — 교사 계정으로 `/teacher/exams`에서 "내 시험 만들기"로
   단원평가 또는 내신대비모의고사를 새로 만든다 → 바로 `/teacher/exams/{id}/grading`
   (불변 채점 화면)에 진입해 "채점 대기" 목록에 담당 학생이 전부 뜨는지(예전에는 여기가
   비어 있었음). 점수 입력 후 저장 → `/teacher/exams/{id}/scores`에서 "채점완료"로
   바뀌는지 → 학생 계정으로 `/student/grades`에서 해당 결과가 뜨는지.
2. **PC 데스크톱 레이아웃** — 브라우저 창을 1024px 이상으로 넓혀서 교사/학생/학부모
   화면에 진입 → 하단 탭이 사라지고 상단에 가로 메뉴가 뜨는지. 1024px 미만으로 좁히면
   다시 하단 탭으로 돌아오는지. `/teacher/classes`, `/teacher/exams`가 넓은 화면에서
   카드가 2열로 배치되는지. `/student/grades`의 성적 추이 그래프 2개가 데스크톱에서
   나란히 보이는지.
3. **성장관리 메뉴** — 관리자 사이드바 "성장관리"를 펼쳤을 때 성장현황/Rival 시즌 관리/
   진열장 노출 정책 3개만 보이는지(엠블럼관리/라이벌관리 없음). `/admin/growth/overview`
   상단에 "엠블럼 전체 관리"/"라이벌 전체 관리" 보조 버튼으로 여전히 이동 가능한지.
   학생별 "상세" 버튼이 `/admin/students/{id}?tab=growth`로 정상 이동하는지(예전에는
   `/admin` 접두사가 빠져 있었음). 학생 상세 "성장/진열장" 탭의 "현재 라이벌" 카드에서
   승/패/종료 버튼으로 그 학생의 라이벌 기록을 바로 조작할 수 있는지.
4. **테이블 헤더 고정** — `/admin/classes`, `/admin/employees`, 재무관리 5개 화면
   (수납/환불/미납/정산/통계), 학생 상세의 반 목록/출결 기록/성적 기록/상담 기록, 교사
   학생 상세의 상담 기록 표에서 목록을 스크롤할 때 컬럼 헤더가 상단에 고정되어 있는지
   (예전에는 스크롤하면 헤더가 같이 사라졌음).
5. **학생 재무 화면** — `/student/finance`로 직접 URL 접근 시 `/student`(홈)로
   리다이렉트되는지, 학생 화면 어디에도 재무/수납 관련 텍스트가 없는지.

## 다음 라운드 후보

- Teacher/Student/Parent 데스크톱 상단 내비게이션을 필요 시 좌측 사이드바로 확장할지
  검토(현재는 리스크가 낮은 상단 가로 내비게이션으로 구현).
- 학생 상세 성장 탭에 엠블럼 활성/숨김 토글까지 인라인으로 옮길지 검토(현재는 SP/엠블럼
  지급 + 라이벌 승패종료까지만 이동, 엠블럼 활성화 토글은 여전히 EmblemManagement.tsx
  전용).

---

# QA — Phase 3D v3-r7-r1 (v3-r7 반려 대응 완결판)

## 빌드/타입체크

- 여전히 오프라인 환경이라 로컬 `npm install`/`npm run typecheck`/`npm run build` 실행
  불가. **GitHub Actions Build Check가 최종 검증 기준**이며, 이번 라운드는 특히
  `TeacherExamGrading.tsx` 직접 수정 + 대규모 색상 전역 치환(65개+ 파일)이 있었으므로
  빌드 통과 여부를 반드시 확인해야 한다.

## 대리 검증 통과 내역

- 불변 파일 3종 MD5 무변경. `TeacherExamGrading.tsx`는 명시적 지시로 변경(신규 MD5
  `f44508fa`) — 이 파일도 앞으로는 일반 파일과 동일하게 자유롭게 수정 가능(불변 지정
  해제).
- 65개 이상 파일 괄호 균형 통과(LoginPage.tsx 1건은 한글 "예)" 표기로 인한 브레이스
  카운터 오탐으로 확인, 태그 균형 교차검증 통과).
- 화면 레벨 `status ===` 직접 비교 0건, 금지 표현 0건.

## 반려 사유 3가지 대응 확인

1. **"Assessment 상태 헬퍼가 TeacherExamGrading.tsx에 적용되지 않았다"** → 이제 해당
   파일이 `isPendingGrading()`/`isGradedSubmission()`을 직접 import해서 사용한다. 우회
   주석도 전부 제거했다.
2. **"성장관리 운영 기능이 관리자 성장현황에 계속 남아 있다"** → `GrowthOverview.tsx`에서
   SP/엠블럼 지급 버튼·모달과 엠블럼/라이벌 "전체 관리" 바로가기까지 전부 제거. 이제
   순수 현황 요약 + 학생 상세 진입만 제공.
3. **"PC 최적화가 핵심 화면까지 충분히 반영되지 않았다"** → 지시된 6개 화면
   (TeacherHome/TeacherExamGrading/TeacherStudentDetail/StudentHome/StudentGrades/
   ParentHome) 전부 `lg:max-w-5xl`~`7xl` + 실질적 2컬럼(메인/요약 패널) 그리드로 재구성.

## 기능 QA 체크리스트(로컬 확인 권장)

1. **새 시험 즉시 채점** — `/teacher/exams`에서 새 시험 생성 → `/teacher/exams/:id/grading`
   (직접 수정한 화면)의 채점 대기 목록에 즉시 노출되는지.
2. **성장현황 화면** — `/admin/growth/overview`에 SP/엠블럼 지급 버튼이 전혀 없는지,
   "엠블럼 전체 관리"/"라이벌 전체 관리" 버튼도 없는지. "상세" 버튼만 있고 클릭 시
   `/admin/students/{id}?tab=growth`로 이동하는지. 그 학생 상세 화면의 "현재 라이벌"
   카드에서 승/패/종료가 여전히 가능한지.
3. **PC 데스크톱 레이아웃** — 1024px 이상 화면에서 6개 화면(교사 홈/채점/학생상세, 학생
   홈/테스트, 학부모 홈) 전부 좌우 2컬럼으로 보이는지, 1024px 미만에서는 세로 단일
   스택으로 정상 복귀하는지.
4. **브랜드 톤** — `/`(로그인 화면)이 밝은 아이보리 배경인지(다크 화면 아님), 버튼/로고가
   Navy+Gold 조합인지. 관리자 사이드바는 Navy이지만 메인 콘텐츠 영역은 밝은지(사이드바
   폭만 어둡고 나머지는 밝아야 함 — 전체 다크 아님). 앱 전반의 버튼/활성 탭 색이 기존
   퍼플-블루가 아니라 Navy로 바뀌었는지.

## 다음 라운드 후보

- `TeacherExamGrading.tsx`의 `gradedBy`(채점자 식별)를 이름 문자열 비교 대신 계정 ID
  기반으로 개선할지 검토(현재는 기존 방식 유지 — 이번 라운드 범위 밖으로 판단해 보류).
- 브랜드 톤 2차: `#7C3AED`(대학추천/목표대학 관련 보라 계열), 티어/과목/상태 뱃지 색상
  체계는 이번 라운드에서 건드리지 않음(브랜드 아이덴티티 컬러가 아니라 카테고리 구분용
  색상으로 판단) — 필요 시 후속 라운드에서 명시적으로 논의.
