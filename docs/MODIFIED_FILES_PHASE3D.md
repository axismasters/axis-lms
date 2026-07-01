# MODIFIED_FILES_PHASE3D.md

## v3-r9 변경분 (IF Analysis Engine 계약 정리 + 로그인 화면 히어로 카드 추가)

**베이스라인**: v3-r8 (GitHub main 반영 완료, Build Check 통과 확인 상태).
신규 파일 1개, 수정 파일 2개. 삭제 파일 없음. 지시대로 화면을 갈아엎지 않고
최소 범위로만 작업했다.

### 신규 파일

| 파일 | 내용 |
|---|---|
| `src/lib/ifAnalysisEngine.ts` | IF Analysis Engine 계약(contract) 정리 파일. `studentIfAnalysis.ts`/`studentIfRecord.ts`의 기존 계산·저장 로직을 다시 구현하지 않고, 미래 엔진(문제은행/엠블럼/라이벌/학부모브리핑/추천 엔진)이 참조할 단일 진입점과 타입을 재노출(re-export)한다. `runIfAnalysisEngine()`(통합 실행), `buildImprovementPoint()`(예상 보완 포인트), `buildGrowthEvent()`(성장 엔진 연결 이벤트), `estimateIfPotentialFromAveragePct()`(교사 화면용 잠재력 추정) 신규 함수 포함. 8개 엔진 확장 방향을 다이어그램 주석으로 명시. |

### 1. IF 채점 위치/구조 확인 (변경 없음 — 이미 지시 기준 충족)

`StudentGrades.tsx`의 `ResultDetailModal`(테스트 성적표 상세 모달) 안에서만 IF
채점 블록이 열리는 구조를 확인했다 — 별도 메뉴/라우트 없음. `IF_REASONS`가
`studentIfAnalysis.ts`에 `['계산 실수', '개념 부족', '시간 부족']` 3개로 고정되어
있음을 재확인. 학생 직접 성적 입력 버튼은 이미 제거된 상태(주석으로 확인).
`ParentGrades.tsx`는 IF를 읽기 전용 요약으로만 표시하고 선택/수정 UI가 없음을
재확인. 이 부분은 이미 v3-r7-r1 이전부터 지시 기준을 충족하고 있어 코드 변경이
필요 없었다.

### 2. 화면 컴포넌트 판단 로직 이동 (금지 기준 위반 1건 발견·수정)

| 파일 | 수정 내용 |
|---|---|
| `src/pages/teacher/TeacherStudentGrowth.tsx` | "IF 상승 가능성" 계산 중 `Math.min(100 - avgPct, 20)` 휴리스틱이 컴포넌트 안에 직접 들어있던 것을 발견 — `ifAnalysisEngine.estimateIfPotentialFromAveragePct()`로 이동하고 컴포넌트에서는 함수 호출만 하도록 수정("화면 컴포넌트에 판단/계산 로직 직접 삽입 금지" 기준 위반 해소). |

### 6. IF Analysis Engine 계약 정리 (이번 Phase 핵심 산출물)

`src/lib/ifAnalysisEngine.ts` 신규 생성. 지시된 입력/출력 계약을 그대로 타입과
함수로 반영했다:
- 입력: 시험 결과(`StudentExamResult`) + 오답 문항(`WrongQuestionInfo[]`) + 학생이
  선택한 IF 이유(문항별) — 기존 `assessmentData.ts`/`studentIfAnalysis.ts` 타입 재사용.
- 출력: IF 요약(`IfAnalysisQuestionResult`) + 사유별 비중(`reasonBreakdown`) +
  예상 보완 포인트(`IfEngineImprovementPoint`, 신규) + 엠블럼/성장 엔진 연결용
  이벤트(`IfEngineGrowthEvent`, `GrowthContext.onIfAnalysisResult` 입력 형식과 동일).
- 엠블럼/라이벌/대학추천은 이번에 구현하지 않고, 연결 가능한 이벤트/타입 계약만
  정리했다(지시 그대로).

### 7. 확장 방향 문서화

`ifAnalysisEngine.ts` 하단에 ASCII 다이어그램 주석으로 8개 엔진(Question
Bank / Test Template / Assessment / IF Analysis / Emblem / Rival / Parent
Briefing / Recommendation)의 연결 관계와 각 엔진의 현재 상태(이미 존재/아직
없음)를 명시했다. 특히 Recommendation Engine(대학추천, 불변 파일)은 IF 데이터를
입력으로 받지 않는다는 점을 명확히 문서화했다 — IF는 학원 자체 테스트 회고이고
대학추천은 실제내신/전국모의 등 공식 성적만 쓰는, 서로 다른 데이터 계열이기 때문이다.

### 로그인 화면 히어로 카드 추가 (세션 중 사용자 추가 요청)

작업 도중 사용자가 로그인 화면 참고 목업 이미지를 첨부하며 "이 형식으로,
이 네이비 색상으로 추가 개발"을 요청해 반영했다. 참고 이미지에서 정밀
샘플링한 짙은 네이비 값(`#000926`)은 이 로그인 히어로 카드에만 적용했고,
앱 전역 기준 브랜드 Navy(`#081F4D`, 브랜드보드에 명시된 값)는 그대로 유지했다
— 자세한 판단 근거는 `CHANGES_PHASE3D.md` v3-r9 섹션과 §GPT 전달 의견 참조.

| 파일 | 수정 내용 |
|---|---|
| `src/pages/LoginPage.tsx` | 히어로 영역을 참고 이미지 기준으로 재구성: 우상단 "MATH ACADEMY" 라벨 추가, AXIS 워드마크를 짙은 네이비(#000926) 카드 안에 크게 배치(기존 작은 정사각 배지+워드마크 조합 → 카드형으로 변경), 태그라인에 "분석"/"적중" Gold 강조 색상 적용, 카드-폼 사이 골드 구분선 추가, 폼을 감싸던 흰색 카드 래퍼 제거(참고 이미지처럼 페이지 배경 위에 라벨+입력창을 직접 배치), 라벨 문구 "휴대폰번호"→"휴대폰 번호", placeholder를 "010-1234-5678"/"비밀번호를 입력하세요"로 변경, 체크박스 문구에 "(자동 로그인)" 추가, 로그인 버튼을 Navy+Gold 글씨에서 Gold 배경+흰 글씨로 변경(참고 이미지와 동일). 페이지 배경 자체는 계속 밝은 Ivory 톤 유지 — 카드 하나만 다크이므로 "전체 다크 로그인 화면 금지" 원칙은 유지된다. |

### 8. 마지막 검수

이번 라운드부터 **실제 `tsc` 타입체크가 가능함을 발견했다** — 이 컨테이너에
TypeScript 컴파일러가 전역 설치되어 있었다(`npm install` 없이도 `tsc` 명령
자체는 사용 가능). 프로젝트 자체 `node_modules`는 여전히 없어서(레지스트리
차단) `react`/`wouter`/`lucide-react` 등 외부 패키지 타입은 못 찾지만, **문법
오류(TS1xxx)는 진짜로 잡아낼 수 있다.** 상세 결과는 `QA_PHASE3D.md` v3-r9
섹션 참조.


**베이스라인**: v3-r7-r1 (GitHub main 반영 완료, Build Check 통과 확인 상태).
신규 파일 3개, 수정 파일 39개. 삭제 파일 없음.

### 신규 파일

| 파일 | 내용 |
|---|---|
| `src/components/brand/AxisMark.tsx` | AXIS 로고 아이콘 마크(SVG) — 브랜드보드 "LOGO MARK" 기준, 모노라인 "A" + 대각선 골드 슬래시. 사이드바/헤더 배지용. |
| `src/components/brand/AxisWordmark.tsx` | AXIS 전체 워드마크(SVG) — 브랜드보드 "BRAND MARK" 히어로 기준, X 글자를 관통하는 대각선 골드 슬래시. 로그인 화면 히어로용. |
| `src/lib/brandColors.ts` | AXIS 브랜드 공식 색상 상수(NAVY/GOLD/IVORY, HEX + 정밀 OKLCH 값). |

### 1. 브랜드 마크 실제 구현 (사용자 요청 대응)

기존에는 로그인 화면·사이드바 배지가 전부 `GraduationCap`/`BarChart2` 같은 lucide 범용
아이콘을 임시로 쓰고 있었다 — 브랜드보드의 실제 "A + 대각선 골드 슬래시" 마크가 코드에
전혀 구현되어 있지 않았다. `AxisMark`/`AxisWordmark` SVG 컴포넌트를 새로 만들어
로그인 화면과 4개 포털(관리자/교사/학부모/학생) 레이아웃 헤더 배지에 전부 적용했다.

| 파일 | 수정 내용 |
|---|---|
| `src/pages/LoginPage.tsx` | 히어로의 `GraduationCap` 아이콘 + 텍스트 "AXIS"를 `AxisMark`(배지) + `AxisWordmark`(전체 워드마크, X 관통 골드 슬래시)로 교체. 배경색을 근사값 `oklch(0.975 0.01 80)`에서 브랜드보드 Ivory(#F7F4EE)의 정밀 변환값 `oklch(0.968 0.009 84.57)`로 수정. |
| `src/components/AdminLayout.tsx` | 사이드바 상단 배지의 `GraduationCap` → `AxisMark`로 교체(Gold 배경 위 Navy 마크). |
| `src/layouts/TeacherLayout.tsx` | 헤더 배지의 `GraduationCap` → `AxisMark`로 교체(Navy 배경 위 Ivory 마크 + Gold 슬래시), 미사용 `GraduationCap` import 정리(nav 아이콘용은 유지). |
| `src/layouts/ParentLayout.tsx` | 헤더 배지의 `GraduationCap` → `AxisMark`로 교체, 미사용 import 제거. |
| `src/layouts/StudentLayout.tsx` | 헤더 배지의 `BarChart2` → `AxisMark`로 교체(다른 3개 포털과 마크 통일), 미사용 import 제거. |

### 2. 브랜드 색상 토큰 정리 (구 인디고/퍼플 primary 완전 교체)

`--primary` CSS 변수 자체가 여전히 v3-r7-r1 이전의 구 Indigo-600(oklch 276.966, 퍼플·
블루 계열)이었다 — 이전 라운드의 "57개 파일 Navy 전역 치환"은 컴포넌트에 하드코딩된
개별 값들을 고친 것이었고, 정작 디자인 시스템의 뿌리인 `index.css`의 `--primary`/`--ring`/
`--chart-1`/`--sidebar-primary`/`--sidebar-ring` 토큰 자체는 누락되어 있었다. 이번에
근본 토큰을 브랜드보드 기준으로 교체하고, `--brand-navy`/`--brand-gold`/`--brand-ivory`
변수를 신설해 향후 하드코딩 대신 참조할 수 있게 했다. HEX→OKLCH는 sRGB→Linear→
OKLab→OKLCh 표준 공식으로 정밀 계산했다(근사값 사용 금지).

| 파일 | 수정 내용 |
|---|---|
| `src/index.css` | `:root`에 `--brand-navy`/`--brand-gold`/`--brand-ivory` 신설. `--primary`/`--ring`/`--chart-1`/`--sidebar-primary`/`--sidebar-ring`을 구 인디고에서 Navy/Gold로 교체(sidebar-primary는 다크 사이드바 대비를 위해 Gold+Navy 텍스트 조합). `--chart-4`(구 마젠타 310) → Gold-bronze로 교체. `.axis-card-clickable` hover/focus 색상의 잔존 인디고(hue 277)도 정리. |

### 3. 보라색(인디고/바이올렛) 전면 제거

브랜드보드에 없는 보라색 계열이 앱 전역에 약 60곳 넘게 하드코딩되어 있었다(주로 구
Tailwind indigo-600 계열과 그 파생 틴트). 문맥별로 다음 원칙으로 정리했다:
- 대학추천/목표대학 관련 배지·아이콘(학년 배지, GraduationCap 아이콘 등) → **Gold**
- Rival 관련 아이콘·통계(Swords, "Rival 승") → **Navy** (대학추천의 Gold와 시각적으로 구분)
- 링크/활성상태/액션버튼 등 "구 primary" 역할을 하던 인디고 → **Navy**
- 5단계 카테고리 색상(학원평가/내신대비/실제내신/전국모의/수능실전 탭) 중 구 인디고였던
  "학원평가"와 하드코딩 바이올렛(#7C3AED)이었던 "수능실전"만 Navy/Gold로 교체 — 나머지
  3개 탭(녹색/황색/빨강)은 보라색이 아니었으므로 임의 변경하지 않고 그대로 유지.
- 등급(1~9등급) 배지, 엠블럼 등급(STONE~DIAMOND) 배지, 엠블럼 카테고리 배지, 출결
  "조퇴" 상태, 형제자매 아바타 플레이스홀더, IF 분석 사유 색상 등 — 모두 개별 확인 후
  Navy 또는 Gold로 교체.

| 파일 | 수정 내용 |
|---|---|
| `src/lib/phase2dData.ts` | GRADE_TABS 5개 탭 중 "학원평가"(구 인디고 primary 재사용)·"수능실전"(하드코딩 #7C3AED) 색상을 Navy/Gold로 교체. 나머지 3개 탭은 유지. |
| `src/layouts/StudentLayout.tsx` | 학년 배지 색상 Gold로 교체. |
| `src/pages/parent/ParentGrowthReport.tsx` | GraduationCap 아이콘, "시간 부족" IF 사유 색상(#6366F1) Gold로 교체. |
| `src/pages/parent/ParentTargetSummary.tsx` | GraduationCap 아이콘 2곳, 학년 배지, 카드 좌측 보더 Gold로 교체. |
| `src/pages/parent/ParentHome.tsx` | 목표대학 카드 아이콘 배경 틴트 Gold로 교체. |
| `src/pages/teacher/TeacherUniversityData.tsx` | 학년 배지, 카드 좌측 보더 Gold로 교체. |
| `src/pages/teacher/TeacherStudentGrowth.tsx` | 학년 배지 Gold, "Rival 승" 통계 Navy로 교체. |
| `src/pages/teacher/TeacherStudentDetail.tsx` | "담당 학생 빠른 브리핑" 카드 전체(보더/배경/아이콘/제목) 보라색 → Gold로 교체. |
| `src/pages/teacher/TeacherMaterials.tsx` | 자료 유형 뱃지/선택 배경 hue 276(보라) → 262(Navy 계열)로 정합화(텍스트는 이미 Navy였음). |
| `src/pages/teacher/TeacherExams.tsx` | "내 수업"(TEACHER_PRIVATE) 태그 색상 Navy로 교체. |
| `src/pages/teacher/TeacherAttendance.tsx` | 출결 "조퇴" 상태 색상 Navy로 교체. |
| `src/pages/student/StudentAttendance.tsx` / `ParentAttendance.tsx` | 동일하게 "조퇴" 상태 색상 Navy로 교체. |
| `src/pages/student/StudentGrades.tsx` | IF 점수 추이 스파크라인 색상 Gold로 교체. |
| `src/pages/student/StudentRival.tsx` | Rival 아이콘 색상 Navy로 교체. |
| `src/pages/student/StudentGrowthShowcase.tsx` | 학년 배지·목표대학 아이콘 Gold, Rival 통계 Navy로 교체. |
| `src/pages/student/StudentMyPage.tsx` | 학년 배지 Gold, Rival 퀵링크 Navy로 교체. 오타 수정: "성적 진열장" → "성장 진열장"(실제 기능명). |
| `src/pages/student/StudentTargetPreview.tsx` | 아이콘·배지·트렌드 아이콘 전부 Gold로 교체(대학추천 테마 일관 적용). |
| `src/pages/student/StudentHome.tsx` | 학년 배지·대학추천 아이콘 Gold, Rival 퀵링크/아이콘 Navy로 교체. |
| `src/pages/StudentDetail.tsx` | 형제자매 아바타 플레이스홀더, IF 분석 "시간 부족" 사유 색상, "보유 엠블럼" 통계 아이콘 색상을 Navy/Gold로 교체. hover 보더 색상(인디고) Navy로 교체. |
| `src/pages/StudentList.tsx` | 활성 카드 텍스트·"성적" 액션 버튼 색상 및 `hover:bg-indigo-50` 클래스를 Navy 계열로 교체. |
| `src/pages/NotFound.tsx` / `EmployeeDetail.tsx` / `AttendanceStatus.tsx` | 링크/버튼 텍스트 색상(구 인디고 hue 277) Navy로 교체. |
| `src/pages/settings/PermissionSettings.tsx` / `PasswordResetManagement.tsx` | 동일 인디고 계열 텍스트 색상 Navy로 교체. |
| `src/pages/growth/EmblemManagement.tsx` | 숨김 아이콘, "IF연동" 배지 색상(인디고) Navy로 교체. |
| `src/pages/growth/GrowthOverview.tsx` | "숨겨진 엠블럼" 통계 카드, "IF연동" 배지 색상 Navy로 교체. |
| `src/pages/growth/RivalManagement.tsx` | "IF연동" 배지 배경색 Navy 계열로 교체. |
| `src/lib/growthData.ts` | 엠블럼 등급 DIAMOND 색상(보라) → 짙은 Navy로 교체. CATEGORY_BADGE의 SKILL 카테고리(보라) → Navy로 교체. |
| `src/components/StatusBadge.tsx` | GradeBadge 1등급 색상(`bg-indigo-50` 등) → Navy 계열 arbitrary 클래스로 교체. |
| `src/components/ui/input.tsx` / `ui/textarea.tsx` | 포커스 링 색상(`focus:ring-indigo-200`) → Navy 계열로 교체(앱 전역 입력창에 영향). |
| `src/components/ClassFormModal.tsx` / `src/pages/ClassDetail.tsx` | 활성 탭 밑줄 색상(`border-indigo-600`) → Navy로 교체. |
| `src/pages/ClassList.tsx` | 관리 버튼 hover 배경(`hover:bg-indigo-50`) → Navy 톤으로 교체. |
| `src/pages/StudentNew.tsx` | 파일 업로드 드롭존 hover 색상, 로딩 스피너 색상(인디고) → Navy로 교체. |

### 4. 학생 화면 "성적" → "테스트" 표현 정리

내비게이션 메뉴 라벨은 이전 라운드에 이미 "테스트"로 변경되어 있었으나, 화면 내부
텍스트(카드 제목/빈 상태 문구/섹션 제목)에는 "성적"이 다수 남아있었다. 학원 자체
평가(단원평가·내신대비모의고사)를 가리키는 문맥만 "테스트/결과"로 교체했고, 실제
공식 성적 데이터를 가리키는 "실제내신 성적"/"전국연합모의고사 성적"(`StudentTargetPreview.tsx`)
등은 의미가 달라 그대로 유지했다(학원이 자체 실시하는 시험이 아니라 실제 성적표
데이터이므로 "테스트"로 바꾸면 오히려 부정확해진다).

| 파일 | 수정 내용 |
|---|---|
| `src/pages/student/StudentHome.tsx` | "최근 성적" → "최근 테스트", "공개된 성적이 없습니다" → "공개된 테스트 결과가 없습니다", "성적 기반 목표 방향 준비" → "테스트 기반 목표 방향 준비". |
| `src/pages/student/StudentGrades.tsx` | "{탭} 성적 추이" → "{탭} 결과 추이", 빈 상태 문구 "{탭} 성적이 없습니다" → "{탭} 결과가 없습니다", "성적표 상세" → "테스트 결과 상세", 우측 요약 패널 "성적 추이" → "결과 추이". |
| `src/pages/student/StudentGrowthShowcase.tsx` | 탭 라벨 "성적 기록" → "테스트 기록", "최근 성적 변화" → "최근 테스트 변화", "성적 탭"/"성적 화면" → "테스트 탭"/"테스트 화면", "전체 성적 보기" → "전체 테스트 보기". |

### 5. 정책 검증 (변경 없음 — 검증만 수행)

아래 항목은 전수 검색 결과 **이미 정책을 준수하고 있어 코드 변경이 필요 없었다**.
자세한 검증 방법과 검색 범위는 `QA_PHASE3D.md` v3-r8 섹션 참조.

- 금지 표현(합격률/합격가능성/합격보장/안정합격/불합격/수능실전주간루틴 등) — 실제
  렌더링되는 문구 어디에도 없음(전부 정책 주석뿐).
- 학생 화면 재무/수납/청구/미납/환불/영수증 노출 — 없음.
- 학생 직접 성적 입력 UI — 이미 제거된 상태(주석으로 확인: "학생 직접 입력 버튼 제거").
- 학부모 화면 Rival/Emblem/SP/Tier 직접 노출, 상담 기록 원문 노출 — 없음.
- 학부모 화면 총 청구액/총 미납액 과시형 UI — 이미 v2에서 제거되어 상태 중심 표시("미납
  있음"/"미납 없음")만 유지 중.
- 보라색 외 과한 그라데이션/blob/orb 장식 — 없음(기존 그라데이션은 로그인 화면 모서리
  Gold/Navy 은은한 대각선 포인트, 카드 hover 등 절제된 브랜드 톤 사용뿐).

---

## v3-r3 변경분 (추가 개선)


신규/삭제 파일 없음 — 전부 기존 파일 수정.

| 파일 | 수정 내용 |
|---|---|
| `docs/PARENT_PAGE_CONSTITUTION.md` | "Tier까지만 확인 가능" 문구 삭제, 원칙 6번 본문을 지표명 없이 완전 추상화. |
| `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` | "v3-r3 신규 반영" 섹션 추가(목표대비/과목별변화/주간변화/상담용요약 4개 + 문서 정리 1개 = 5개 항목). |
| `src/pages/parent/ParentGrowthReport.tsx` | 과목별 "목표 대비"·"이전 대비 변화" 표시, 리포트 탭에 "전주 대비" 증감 + "상담용 요약" 카드 신규 추가. |
| `src/pages/teacher/TeacherExamScores.tsx` | "문항별 정답률" 막대그래프 신규 추가(담당 학생 채점완료 기준). |

**재검증만 수행(코드 변경 없음)**: `src/pages/StudentList.tsx`, `src/pages/AttendanceStatus.tsx`
(요약 카드 클릭 필터가 v3-r1부터 이미 요구사항을 충족하고 있음을 확인), 선생님 전체
화면의 "채점"/"성적" 관련 표현(v3-r2에서 이미 정리 완료, 신규 위반 없음 확인).

---

## v3-r2 변경분 (v3-r1 반려 대응)

신규/삭제 파일 없음 — 전부 기존 파일 수정.

| 파일 | 수정 내용 |
|---|---|
| `src/pages/StudentList.tsx` | 메인 데이터 테이블을 `.axis-table-scroll`(max-height 620px)로 전환. |
| `src/pages/AttendanceStatus.tsx` | 메인 데이터 테이블을 `.axis-table-scroll`(max-height 620px)로 전환. |
| `src/pages/AssessmentList.tsx` | 행 전체 클릭(`cursor-pointer`+`onClick`) 제거, "상세 보기" `Button`으로 전환. |
| `src/pages/teacher/TeacherHome.tsx` | "최근 성적"→"최근 테스트 결과", "성적 보기"→"학생별 성적 보기". |
| `src/pages/teacher/TeacherStudentDetail.tsx` | "최근 성적"→"최근 테스트 결과", "성적 데이터"→"테스트 결과 데이터", "수업노트 바로가기"→"수업자료에서 수업노트 확인", "수업노트 작성/확인하기"→"수업자료 열기"(링크도 `/teacher/materials?tab=notes`로 갱신). |
| `src/pages/teacher/TeacherGrades.tsx` | "성적 데이터"→"테스트 결과 데이터", "담당 학생 성적 확인"→"담당 학생 테스트 결과 확인". |
| `src/routes/TeacherRoutes.tsx` | 주석 "담당 학생 성적 확인"→"담당 학생 테스트 결과 확인". |
| `src/layouts/TeacherLayout.tsx` | `isActive` 로직의 구 `/teacher/videos` 죽은 코드 제거, "채점 탭"→"시험지 탭" 주석 정리. |
| `src/layouts/ParentLayout.tsx` | "자녀 성장(Emblem/SP/Tier)" 표현 정리. |
| `src/pages/parent/ParentHome.tsx` | 헌법 원칙에 6번째 항목 추가, Rival/Emblem/SP 나열식 주석 4곳 정리. |
| `src/pages/parent/ParentGrowthReport.tsx` | 헤더 주석 정리. |
| `docs/PARENT_PAGE_CONSTITUTION.md` | 5개→6개 원칙 갱신(신규 원칙 추가 + 1·2번 원칙 본문 정확성 수정). |
| `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` | 도입부 원칙 문구 정리. |
| `docs/APPLY_ORDER_PHASE3D.md` | github-upload zip 구조를 diff→전체 프로젝트 패키지로 전환 명시. |

---

## v3-r1 변경분 (v3 반려 대응 + 추가 요구사항)

### v3-r1 신규 파일

| 파일 | 내용 |
|---|---|
| `src/pages/student/StudentRival.tsx` | 학생용 Rival 조회 화면(Foundation, 신규 라우트 연결). |
| `src/lib/parentComments.ts` | 선생님이 학부모용으로 작성하는 공개 코멘트(내부 상담기록과 분리). |
| `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` | 학부모 페이지 체류시간 강화 아이디어 기록. |

### v3-r1 물리 삭제 파일

| 파일 | 사유 |
|---|---|
| `src/pages/student/StudentFinance.tsx` | 어디서도 import되지 않는 것을 확인 후 stub 상태에서 완전 삭제. |

### v3-r1 수정 파일

| 파일 | 수정 내용 |
|---|---|
| `src/routes/StudentRoutes.tsx` | `/student/my`, `/student/target-preview`, `/student/growth`, `/student/rival` 실제 컴포넌트 연결. |
| `src/pages/StudentList.tsx` | 요약 카드 → 클릭 가능 필터 카드(재원/휴원/퇴원/미납), 필터명 라벨, 행 전체 클릭 제거. |
| `src/pages/AttendanceStatus.tsx` | 요약 카드 → 클릭 가능 필터(상태별 + 알림발송 신규 필터), 필터명 라벨. |
| `src/pages/growth/EmblemManagement.tsx` | Hooks 규칙 위반 수정, 팝업 max-height/드래그핸들범위/ESC 수정, 표 wrapper 전환. |
| `src/pages/growth/RivalManagement.tsx` | Hooks 규칙 위반 수정, 표 wrapper 전환. |
| `src/pages/growth/GrowthOverview.tsx` | "상세" 링크→Button 전환, 표 wrapper 전환(학생목록+SP지급이력 2개). |
| `src/pages/settings/PermissionSettings.tsx` | 표 wrapper 전환. |
| `src/pages/teacher/TeacherExamScores.tsx` | 표 wrapper 전환, 결과보기 모달에 평균/최고점 비교 막대 그래프 추가. |
| `src/pages/teacher/TeacherStudents.tsx` | 카드 목록 → 표 형태 전환(sticky header). |
| `src/pages/AssessmentList.tsx`, `AssessmentDetail.tsx` | 표 wrapper 전환(총 4개 표). |
| `src/index.css` | `.axis-table-scroll` 신규 패턴 추가(bounded height + 내부 스크롤 + sticky thead top:0). |
| `src/layouts/TeacherLayout.tsx` | 하단 네비 라벨 "채점"→"시험지". |
| `src/pages/teacher/TeacherExamGradingGuard.tsx` | 타이틀 "채점"→"내 시험지 관리". |
| `src/pages/teacher/TeacherGrades.tsx` | 타이틀 "성적 확인"→"학생별 성적". |
| `src/pages/parent/ParentHome.tsx` | 성장 리포트 카드에서 Tier/Emblem/SP 노출 완전 제거, GrowthContext 의존 제거. |
| `src/pages/parent/ParentGrowthReport.tsx` | **전면 재작성** — 탭(테스트/출결/목표대학/리포트) + 기간필터 + SVG 그래프 + 시험 상세 모달 + 학부모 공개 코멘트, Rival/Emblem/SP 완전 제거. |
| `src/pages/teacher/TeacherStudentDetail.tsx` | "학부모 공개 코멘트 작성" 섹션 신규 추가. |
| `src/pages/student/StudentGrades.tsx` | `ScoreVsAvgBar`에 최고점 막대 추가. |
| `src/utils/dateUtils.ts` | `getLocalDateStr()`에 선택적 Date 인자 추가(하위 호환, 과거 날짜 포맷팅 재사용 목적). |

---

## v3 변경분 (반려 대응 — v2는 GitHub 업로드 금지)

### v3 신규 파일

| 파일 | 내용 |
|---|---|
| `src/pages/teacher/TeacherMaterials.tsx` | 수업영상/학습자료 + 수업노트를 실제 로컬 탭으로 통합한 화면. |
| `src/pages/teacher/TeacherExamScores.tsx` | "내 시험지 관리"에서 시험지 클릭 시 보이는 학생별 성적(조회+정정) 화면. |
| `src/lib/accountActionLog.ts` | 비밀번호/닉네임 초기화 실행 로그(audit mock, localStorage 기반). |

### v3 수정 파일

| 파일 | 수정 내용 |
|---|---|
| `src/pages/teacher/TeacherHome.tsx` | "시험 채점"→"내 시험지", "수업노트" 카드 제거(수업자료 하나로 통합), "채점하기" 바로가기 문구를 "내 시험지 보기"로 조정. |
| `src/pages/teacher/TeacherExams.tsx` | 화면 제목 "채점"→"내 시험지 관리". 시험지 카드 전체 클릭 시 학생별 성적 화면으로 이동(nested-anchor 방지를 위해 outer는 div+navigate, inner "채점하기"만 실제 Link). |
| `src/pages/teacher/TeacherStudents.tsx` | 학생 카드 전체 클릭 제거, "상세보기" 명시적 버튼으로 교체. |
| `src/pages/teacher/TeacherStudentDetail.tsx` | "계정 관리" 섹션 신규(비밀번호/닉네임 초기화 버튼 + 확인 모달 + 감사로그 기록). |
| `src/pages/teacher/TeacherVideos.tsx`, `TeacherNotes.tsx` | `TeacherMaterials.tsx`로 통합되어 더 이상 라우팅되지 않음 — 안전한 빈 stub(`return null`)으로 교체. |
| `src/routes/TeacherRoutes.tsx` | `/teacher/materials` 라우트 추가, `/teacher/videos`·`/teacher/notes`를 해당 탭으로 리다이렉트, `/teacher/exams/:examId/scores` 라우트 추가. |
| `src/pages/StudentDetail.tsx` | 관리자용 "닉네임 초기화" 버튼 추가(기존 "비밀번호 초기화" 옆), 기존 비밀번호 초기화 실행부에 감사로그 기록 추가(v2까지는 로그 없이 toast만 있었음). |
| `src/lib/studentProfile.ts` | `StudentProfileData.lastNicknameChangedAt` 필드, 14일 제한 로직(`canChangeNicknameNow`), 학생용 게이트된 저장(`setStudentNickname` 반환형 변경: `void`→`{ok,reason?}`), 관리자/교사용 `resetStudentNickname` 추가. |
| `src/pages/student/StudentMyPage.tsx` | 닉네임 변경 14일 게이트 적용, 안내 문구 추가, 쿨다운 중 버튼 비활성화 + 남은 일수 표시. |
| `src/lib/rbac.ts` | `student.nicknameReset` 권한 키 추가(6개 직급 배열에 `student.passwordReset`과 동일하게 부여). |
| `src/contexts/AuthContext.tsx` | `canResetNickname(studentId)` 추가. **로그인 하이픈 정규화**(`normalizePhoneDigits`) 추가 — v2 이후 별도 요청으로 반영. |
| `src/pages/settings/PermissionSettings.tsx` | "학생 닉네임 초기화" 권한 매트릭스 행 추가. |
| `src/pages/student/StudentGrades.tsx` | `ResultDetailModal`을 `export`로 전환(StudentHome.tsx에서 재사용). |
| `src/pages/student/StudentHome.tsx` | "최근 성적" 카드 클릭 시 `ResultDetailModal`을 홈에서 바로 열도록 변경(테스트 메뉴 재진입 불필요). |
| `src/pages/parent/ParentTargetSummary.tsx` | "상담 리포트" 표현을 "선생님 안내 필요" 수준으로 조정, 비기능 화살표 아이콘 제거. |
| `src/pages/LoginPage.tsx` | 안내 문구를 "하이픈 없이 입력 가능"으로 갱신. |

---

## v2 변경분 (반려 대응)

### v2 신규 파일

| 파일 | 내용 |
|---|---|
| `src/pages/LoginPage.tsx` | 첫 화면 로그인 페이지(휴대폰번호+비밀번호, 로그인 상태 유지). |
| `src/lib/counselingData.ts` | 상담 기록 데이터 모듈(localStorage 기반, Provider 불필요). |
| `docs/PARENT_PAGE_CONSTITUTION.md` | 학부모 페이지 헌법 5개 원칙 문서. |

### v2 수정 파일

| 파일 | 수정 내용 |
|---|---|
| `src/contexts/AuthContext.tsx` | `isAuthenticated`/`login()`/`logout()`/세션 저장(localStorage·sessionStorage) 추가. `activeMode`(ADMIN_MODE/TEACHER_MODE) + `canSwitchMode` + `setActiveMode()` 추가(원장/부원장 전용). 부원장 데모 계정(`u-vice-director`) 추가. |
| `src/routes/RoleRoute.tsx` | 비인증 시 모든 포털 라우트를 `/`(로그인)로 리다이렉트. `RootRedirect`가 비인증 시 `LoginPage` 직접 렌더링. 원장/부원장이 TEACHER_MODE일 때 `/teacher/**` 접근 허용 로직 추가. |
| `src/components/AdminLayout.tsx` | 사이드바 하단에 로그아웃 버튼 + 원장/부원장 전용 관리자모드/강사모드 토글 추가. |
| `src/layouts/TeacherLayout.tsx` | 헤더에 로그아웃 버튼 추가. 원장/부원장이 강사모드로 들어와 있을 때 "관리자 모드로 돌아가기" 상단 바 추가. |
| `src/layouts/StudentLayout.tsx` | 헤더에 로그아웃 버튼 추가. |
| `src/layouts/ParentLayout.tsx` | 헤더에 로그아웃 버튼 추가. 하단 탭 "성적"→"테스트" 이름 변경, "모의고사" 탭을 "성장" 탭으로 교체(5탭 한도 내에서 헌법 요구 흐름 우선). |
| `src/pages/parent/ParentHome.tsx` | 수납 상태 총액 표시 제거(미납 유무 배지만), "상담 리포트" 죽은 링크 카드 제거, "성장 리포트" 진입 카드 신규 추가(Tier/Emblem/SP 미리보기), "성적"→"테스트" 명칭 통일, 컨테이너 폭 확장(PC 최적화), 상단에 학부모 페이지 헌법 요약 주석 추가. |
| `src/pages/parent/ParentGrades.tsx` | "성적"→"테스트" 명칭 통일, `ParentResultDetailModal` 신규 추가(IF 조회 전용 상세), 카드 클릭 가능하게 전환, 컨테이너 폭 확장. |
| `src/pages/parent/ParentFinance.tsx` | 상단 총 청구/완납/미납 3분할 금액 그리드 제거, 미납 유무 배지로 대체(개별 청구서 금액은 유지), 컨테이너 폭 확장. |
| `src/pages/parent/ParentGrowthReport.tsx` | 컨테이너 폭 확장(PC 최적화)만 — 기능은 기존 그대로(원래 완성되어 있었으나 라우트 미등록으로 접근 불가였음). |
| `src/pages/parent/ParentTargetSummary.tsx` | 컨테이너 폭 확장만. |
| `src/pages/parent/ParentAttendance.tsx`, `ParentMockExams.tsx`, `ParentWeeklyMocks.tsx` | 컨테이너 폭 확장만(`max-w-lg`→`max-w-3xl`). |
| `src/routes/ParentRoutes.tsx` | `/parent/growth`, `/parent/target-summary` 라우트 신규 등록(기존에 페이지는 있었으나 라우트 누락으로 404였음). |
| `src/routes/StudentRoutes.tsx` | `StudentFinance` import/라우트 제거, `/student/finance`→`/student` 강제 리다이렉트로 교체. |
| `src/pages/student/StudentFinance.tsx` | `useFinance()` 호출 없는 완전 inert stub으로 교체. |
| `src/contexts/FinanceContext.tsx` | 학생 재무 차단 관련 주석을 실제 상태와 일치하도록 갱신. |
| `src/pages/teacher/TeacherStudentDetail.tsx` | 상담 기록 섹션 신규 추가(목록 테이블 + 추가 모달, 담당 학생 스코프 내). 컨테이너 폭 확장. |
| `src/pages/StudentDetail.tsx` | "상담 기록" 탭 신규 추가(최고관리자/원장 전용, 조회만). 헤더 주석의 기존 "상담기록 독립 탭 두지 않음" 방침을 갱신. |
| `src/lib/rbac.ts` | `canManageCounseling()`, `canViewAllCounseling()` 헬퍼 함수 추가. |
| `src/lib/assessmentData.ts` | `Exam.createdByMode` 필드 추가(원장/부원장 모드 전환 로깅용, optional). |
| `src/contexts/AssessmentContext.tsx` | `NewExamInput.createdByMode` 추가, `addExam()`이 이를 저장하도록 반영. |
| `src/components/AssessmentFormModal.tsx` | **수능형 템플릿 배점 수정**(30문항 104점 → 30문항 정확히 100점). `addExam()` 호출 시 `createdByMode: activeMode` 전달. |

---

## (v1 원본)

## 신규 파일

| 파일 | 내용 |
|---|---|
| `src/hooks/useDraggableModal.ts` | 팝업 드래그 이동 훅. 중앙 정렬 기본값, Pointer Capture 기반 드래그, 화면 밖 이탈 방지(clamp), 모바일(768px 미만)에서 드래그 비활성화. |

## 수정 파일

| 파일 | 수정 내용 |
|---|---|
| `src/index.css` | Phase 3D 공용 CSS 유틸리티 추가: `.axis-th-sticky`(+`-56`/`-52` 오프셋 모디파이어), `.axis-card-clickable`(hover 그림자/테두리), `.axis-modal-drag-handle`(grab/grabbing 커서). |
| `src/pages/growth/EmblemManagement.tsx` | 테이블 헤더 sticky 적용(top 56px, box-shadow 방식 — border-collapse 대응). 등록/수정 팝업에 드래그 이동 적용, 헤더/바디/푸터 스크롤 분리. 숨김 토글·활성 토글·수정 버튼 클릭 어포던스 강화(Button 컴포넌트 전환). |
| `src/pages/settings/PermissionSettings.tsx` | 권한 매트릭스 테이블 헤더(기능 + 7개 직급 컬럼) sticky 적용(top 56px). |
| `src/components/AssessmentFormModal.tsx` | 수능형(30문항)/내신형 대시(24문항) 기본 템플릿 추가. 문항 추가/삭제 좌우 스테퍼(−/+) 추가, 최소 문항 수 제한, 입력값 손실 가능성 있는 삭제·템플릿 적용 시 확인 모달(AlertDialog) 추가. 문항 삭제 아이콘 버튼 스타일 개선. |
| `src/components/ui/alert-dialog.tsx` | 배경(오버레이) 클릭 핸들러에 `stopPropagation()` 추가 — 상위 `Dialog`에 중첩됐을 때 배경 클릭으로 상위 모달까지 함께 닫히던 버그 수정(공용 컴포넌트 레벨 수정, Phase 3D 작업 중 발견). |
| `src/pages/student/StudentGrades.tsx` | `TestCard`(테스트 카드)에 `axis-card-clickable` 클래스 추가(hover 그림자/테두리). `ResultDetailModal`(시험 성적표 상세) 헤더 고정 + 바디만 스크롤되도록 구조 변경, 닫기 버튼 아이콘 버튼화. |
| `src/pages/AssessmentList.tsx` | 시험 목록 테이블 헤더 sticky 적용(top 56px). 행 끝 "상세" 표시 칩 스타일로 보강. |
| `src/pages/AssessmentDetail.tsx` | 응시자목록/채점현황/결과분석("학생별 결과") 3개 테이블 모두 헤더 sticky 적용(top 56px). "결석 처리/결석 취소", "정정" 텍스트 링크를 Button 컴포넌트로 전환. |
| `src/pages/teacher/TeacherExams.tsx` | "채점하기" 텍스트 링크를 Button 컴포넌트(배경색 있는 실제 버튼)로 전환. |

## 변경하지 않은 것 (명시적 확인)

- 불변 파일 4종: `App.tsx`, `TeacherExamGrading.tsx`, `universityAnalysisAdapter.ts`,
  `classData.ts` — MD5 완전 동일(QA 문서 참조).
- `src/lib/assessmentData.ts`의 `ExamScope`/`EXAM_SCOPE_LABELS`/scope 관련 함수 — 전혀 수정
  없음.
- `TeacherExamGradingGuard.tsx`, `TeacherRoutes.tsx`, `AdminRoutes.tsx` — 라우팅/권한 가드
  구조 미변경.
- `src/pages/student/StudentFinance.tsx` — 기존 stub 상태 그대로 유지.

---

## Phase 3D v3-r4 (parent engagement + risk alerts, 트랜치 1)

### 신규 파일 (NEW)
- `src/lib/observationSignals.ts` — 관찰 필요 신호 산출(순수 함수) + 배지 스타일.
- `src/components/ObservationPanel.tsx` — "확인 필요한 학생" 공유 강조 패널.

### 수정 파일 (MODIFIED)
- `src/index.css` — `.axis-sidebar` 높이 100dvh 고정 + overflow:hidden(모바일 사이드바 잘림 해결).
- `src/components/AdminLayout.tsx` — `<nav>`에 `min-h-0`, `<aside>` `h-full` 제거(높이 CSS 일원화).
- `src/pages/teacher/TeacherHome.tsx` — 담당 학생 기준 ObservationPanel 연결.
- `src/pages/StudentList.tsx` — 관리자 랜딩 상단 전체 학생 기준 ObservationPanel 연결.

### 문서 (DOCS)
- `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` / `docs/CHANGES_PHASE3D.md` / `docs/QA_PHASE3D.md`
  / `docs/MODIFIED_FILES_PHASE3D.md` / `docs/APPLY_ORDER_PHASE3D.md` — v3-r4 섹션 추가.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r4-r1 (briefing insight completion) — v3-r4 반려 후 재작성

기준: GitHub main v3-r3 + 유지 지시 3항목(아래 "유지" 표시). v3-r4 산출물은 미채택.

### 신규 파일 (NEW)
- `src/lib/parentInsightEngine.ts` — 학부모 객관 지표 8종 엔진(AI 호출 없음).
- `src/lib/studentBriefingEngine.ts` — 자동 브리핑 5+1종 엔진(AI 호출 없음).

### 유지(v3-r4에서 그대로 가져옴, 이번 라운드 변경 없음)
- `src/lib/observationSignals.ts` — 단, 이번 라운드에 **확장**됨(아래 MODIFIED 참조).
- `src/components/ObservationPanel.tsx` — 변경 없음.
- `.axis-sidebar` 모바일 스크롤 수정(`src/index.css`, `src/components/AdminLayout.tsx`) —
  변경 없음.

### 수정 파일 (MODIFIED)
- `src/lib/observationSignals.ts` — 신호 3종 추가(결석/지각 증가, 숙제 미제출 증가,
  목표 대비 보완 과목 악화), `computeSubjectGaps()` 신규 헬퍼, `StudentSignalBundle`
  타입 별칭, `AttendanceRecordLite`/`HomeworkItemLite`/`SubjectGapLite` 신규 타입.
- `src/pages/teacher/TeacherHome.tsx` — 확장된 신호 계산을 위해 출결/숙제/과목갭 데이터
  수집 추가(useHomeworkStatus 신규 사용, sessions/getForStudent 활용 확대).
- `src/pages/StudentList.tsx` — 동일 확장(useAttendance/useHomework/useHomeworkStatus
  신규 사용).
- `src/pages/teacher/TeacherStudentDetail.tsx` — "담당 학생 빠른 브리핑" 카드 신규 추가
  (useHomework/useHomeworkStatus 신규 사용, parentInsightEngine/studentBriefingEngine 연결).
- `src/pages/parent/ParentHome.tsx` — "객관 지표"/"상담 전 확인 카드"/"자녀에게 해줄 말"
  3개 섹션 신규 추가(parentInsightEngine/studentBriefingEngine 연결). 기존 표시 로직
  (수강 반/출결 요약/성적/숙제/콘텐츠/수납)은 변경 없음.

### 문서 (DOCS)
- `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` — v3-r4 섹션에 반려 표시 추가, v3-r4-r1 섹션 신규.
- `docs/CHANGES_PHASE3D.md` / `docs/QA_PHASE3D.md` / `docs/MODIFIED_FILES_PHASE3D.md` /
  `docs/APPLY_ORDER_PHASE3D.md` — v3-r4-r1 섹션 추가.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r5 (teacher exam structure cleanup)

기준: v3-r4-r1(GitHub 업로드 승인됨).

### 수정 파일 (MODIFIED) — 16개
- `src/lib/assessmentData.ts` — EXAM_CATEGORIES에서 national-mock/school-record/
  weekly-suneung 제거, TEACHER_CREATABLE_EXAM_CATEGORY_IDS/ADMIN_CREATABLE_EXAM_CATEGORY_IDS 신규.
- `src/lib/phase2dData.ts` — GRADE_TABS 'suneung' 탭·EXAM_TYPE_MAP에서 weekly-suneung 제거.
- `src/components/AssessmentFormModal.tsx` — 시험 종류 선택지 역할별 분리(교사/관리자).
- `src/pages/teacher/TeacherExams.tsx` — candidateExams에 카테고리 필터 추가.
- `src/pages/teacher/TeacherExamScores.tsx` — visibleExam 판정에 카테고리 조건 추가.
- `src/pages/teacher/TeacherGrades.tsx` — gradedExams에 카테고리 필터 추가.
- `src/pages/teacher/TeacherExamGradingGuard.tsx` — 카테고리 가드 추가(불변 파일 자체는 미수정).
- `src/pages/teacher/TeacherHome.tsx` — candidateExams(미채점/최근 성적 위젯)에 카테고리 필터 추가.
- `src/pages/student/StudentMockExams.tsx` — 수능실전 주간 루틴 진입 카드 제거, 미사용 import 정리.
- `src/pages/parent/ParentMockExams.tsx` — 동일.
- `src/pages/student/StudentWeeklyMocks.tsx` — 화면 타이틀 "수능실전모의고사 결과"로 변경.
- `src/pages/parent/ParentWeeklyMocks.tsx` — 화면 타이틀 "자녀 수능실전모의고사 결과"로 변경.
- `src/routes/StudentRoutes.tsx` / `src/routes/ParentRoutes.tsx` — 라우트 주석 정리(코드 주석만).
- `src/lib/teacherMockExamInput.ts` — getMockExamLabel() 표시 문자열 "수능실전모의고사"로 정정.
- `src/pages/teacher/TeacherUniversityData.tsx` — 성적표 헤더/시험 종류 표시 텍스트 정정.

### 문서 (DOCS)
- `docs/CHANGES_PHASE3D.md` / `docs/QA_PHASE3D.md` / `docs/MODIFIED_FILES_PHASE3D.md` /
  `docs/APPLY_ORDER_PHASE3D.md` — v3-r5 섹션 추가.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r6 (employee/emblem/rival/class/score fixes)

기준: v3-r5(GitHub 업로드 승인됨).

### 신규 파일 (NEW)
- `src/lib/scoreExportEngine.ts` — 성적 Excel/PDF 출력 계산 전용 엔진(권한 판정 없음).
- `src/components/ScoreExportPanel.tsx` — 성적 출력 공용 UI(시험/반/학생 선택 + 미리보기
  + Excel/PDF 버튼 + 인쇄 전용 A4 레이아웃).
- `src/pages/ScoreExportPage.tsx` — 관리자 성적 출력 페이지(`/admin/scores/export`).
- `src/pages/teacher/TeacherScoreExport.tsx` — 강사 성적 출력 페이지(`/teacher/scores/export`).
- `src/pages/teacher/TeacherClassRoster.tsx` — 담당반 출석부형 학생 목록
  (`/teacher/classes/:classId`).

### 수정 파일 (MODIFIED)
- `src/pages/EmployeeList.tsx` — `useSearch()` 기반 등록 모달 트리거로 교체(근본 버그 수정),
  계정상태(활성/비활성) 토글 버튼 신규, 계정상태 필터 신규, breadcrumb 경로 오류 수정.
- `src/index.css` — `.axis-modal-drag-enter`(드래그 모달 전용 opacity 애니메이션) 신규,
  성적 출력 인쇄용 A4 스타일(`.axis-print-area`, `@media print`, `@page`) 신규.
- `src/pages/growth/EmblemManagement.tsx` — 모달 패널 클래스를 `modal-enter` →
  `axis-modal-drag-enter`로 교체(드래그-애니메이션 transform 충돌 해결).
- `src/pages/growth/RivalManagement.tsx` — 승/패/종료 버튼 및 종료 확인 모달 버튼에
  hover/active/focus-visible 상태 추가.
- `src/pages/teacher/TeacherClasses.tsx` — 운영중 반 카드를 클릭 가능하게 변경, 반 상세
  (출석부) 화면으로 연결.
- `src/pages/student/StudentGrades.tsx` — `ExamLineTrendChart` 신규 컴포넌트 및 섹션 추가
  (단원평가/내신대비모의고사 분리 선그래프), 기존 막대 그래프 유지.
- `src/lib/rbac.ts` — `canExportAcademyWideScores()` 신규(SUPER_ADMIN/DIRECTOR 전용).
- `src/routes/AdminRoutes.tsx` — `/admin/scores/export` 라우트 등록.
- `src/routes/TeacherRoutes.tsx` — `/teacher/classes/:classId`, `/teacher/scores/export`
  라우트 등록.
- `src/components/AdminLayout.tsx` — `children` 항목에 `requiresFn` 지원 추가, "성적 출력"
  메뉴 게이트를 `assessment.view`(권한 기반) → `canExportAcademyWideScores()`(역할 기반)로
  정밀화.
- `src/pages/teacher/TeacherExams.tsx` — "성적 출력" 진입 카드 링크 추가.
- `package.json` — `xlsx@^0.18.5` 의존성 추가.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r7 (QA architecture layout cleanup)

기준: v3-r6(소스 검수 통과).

### 수정 파일 (MODIFIED) — 25개
- `src/lib/assessmentData.ts` — isPendingGrading/isGradedSubmission 공용 헬퍼 신규.
- `src/contexts/AssessmentContext.tsx` — addExam/markAttended 초기 상태 응시예정→채점중.
- `src/pages/teacher/TeacherHome.tsx` / `TeacherExams.tsx` / `TeacherExamScores.tsx` —
  status 직접 비교 11곳을 공용 헬퍼로 교체.
- `src/layouts/TeacherLayout.tsx` / `StudentLayout.tsx` / `ParentLayout.tsx` — 데스크톱
  상단 내비게이션 신규, 모바일 하단 내비게이션 lg:hidden으로 전환.
- `src/pages/teacher/TeacherClasses.tsx` / `TeacherExams.tsx`(중복, 컨테이너 폭) /
  `src/pages/student/StudentGrades.tsx` / `src/pages/parent/ParentHome.tsx` — 컨테이너
  폭 확장 + 데스크톱 그리드 전환.
- `src/components/AdminLayout.tsx` — 성장관리 하위 메뉴에서 엠블럼관리/라이벌관리 제거.
- `src/pages/StudentDetail.tsx` — 성장/진열장 탭에 라이벌 승/패/종료 버튼 + 종료 확인
  모달 신규.
- `src/pages/growth/GrowthOverview.tsx` — 엠블럼/라이벌 전체 관리 보조 링크 추가,
  학생 상세 링크 `/admin` 접두사 누락 버그 수정.
- `src/pages/ClassList.tsx` / `EmployeeList.tsx` / `AttendanceCheck.tsx` /
  `NotificationHistory.tsx` / `NotificationTemplates.tsx` /
  `src/pages/teacher/TeacherStudentDetail.tsx` / `FinanceUnpaid.tsx` / `FinancePayments.tsx` /
  `FinanceSettlements.tsx` / `FinanceRefunds.tsx` / `FinanceStatistics.tsx` — axis-table-wrap
  → axis-table-scroll 표준 전환(sticky 헤더 수정).

### 문서 (DOCS)
- `docs/CHANGES_PHASE3D.md` / `docs/QA_PHASE3D.md` / `docs/MODIFIED_FILES_PHASE3D.md` /
  `docs/APPLY_ORDER_PHASE3D.md` — v3-r7 섹션 추가.

### 변경 없음(검증만 완료)
- `StudentFinance.tsx`(이미 삭제) / `StudentRoutes.tsx`(이미 일치) — 학생 재무 화면
  상태가 이미 완전히 일치되어 있어 코드 변경 없음.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r7-r1 (v3-r7 반려 대응 완결판)

기준: v3-r6(GitHub main). v3-r7 산출물은 반려.

### 정책 변경
- `TeacherExamGrading.tsx` 불변(MD5 고정) 지정 해제(명시적 지시) — 이제 불변 파일은
  `universityAnalysisAdapter.ts` / `App.tsx` / `classData.ts` 3종.

### 수정 파일 — Assessment 엔진 완성
- `src/pages/teacher/TeacherExamGrading.tsx` — 헬퍼 직접 적용(최초 수정, MD5 변경).
- `src/lib/assessmentData.ts` / `src/contexts/AssessmentContext.tsx` /
  `src/pages/teacher/TeacherExamGradingGuard.tsx` / `src/pages/teacher/TeacherExamScores.tsx`
  — 우회 주석 정리, addExam/markAttended 초기값 원복.
- `src/pages/AssessmentDetail.tsx` / `src/pages/AssessmentList.tsx` — admin 화면에
  남아있던 직접 status 비교 추가 정리.

### 수정 파일 — 성장관리 축소
- `src/pages/growth/GrowthOverview.tsx` — 전면 재작성(SP/엠블럼 지급 UI, 엠블럼/라이벌
  전체관리 버튼 제거).

### 수정 파일 — PC 최적화(6개 핵심 화면)
- `src/pages/teacher/TeacherHome.tsx` / `src/pages/teacher/TeacherExamGrading.tsx`(중복 표기,
  레이아웃 재구성) / `src/pages/teacher/TeacherStudentDetail.tsx` /
  `src/pages/student/StudentHome.tsx` / `src/pages/student/StudentGrades.tsx`(v3-r7 대비
  추가 확장) / `src/pages/parent/ParentHome.tsx`(v3-r7 대비 추가 확장).

### 수정 파일 — 브랜드 톤
- `src/pages/LoginPage.tsx` — 전면 재설계(다크 배경 제거, Ivory/Navy/Gold).
- 57개 파일 — 구 primary color(`oklch(0.511 0.262 276.966)`) → `#081F4D` 전역 치환(292건).
- `src/layouts/TeacherLayout.tsx` / `src/pages/growth/EmblemManagement.tsx` /
  `src/pages/growth/GrowthOverview.tsx` / `src/pages/StudentDetail.tsx` — 근사 골드
  (`#C9A84C`) → 정확한 `#C8A15A`(12건), 근사 네이비 → `#081F4D`(EmblemManagement 3건,
  StudentDetail 2건).

### 확인만 완료(이미 반영되어 있던 상태)
- `src/components/AdminLayout.tsx` / `src/layouts/StudentLayout.tsx` /
  `src/layouts/ParentLayout.tsx` / `src/index.css` — Navy/Gold 사이드바·로고·활성상태
  적용이 이미 되어 있는 상태를 확인(변경 불필요).

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/App.tsx`(387bbf48) ·
  `src/lib/classData.ts`(126d9e5e)
