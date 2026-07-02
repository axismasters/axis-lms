# QA — Phase 3D v3-r15-r1 (Safe Apply: 내신 대비 운영 가이드 엔진 → 최신 main)

기준: v3-r14-r3(엠블럼 PNG 69개 전수조사 재작업 완료본) → v3-r15-r1 · 성격: 기능 선별
이식(신규 라우트/메뉴 없음, 엠블럼 자산 무변경)

---

## A. 자동 검증 (수행 완료)

| # | 항목 | 방법 | 결과 |
|---|------|------|------|
| A1 | 기준선 확인 | `docs/CHANGES_PHASE3D_v3_r14_r3.md` 존재 + PNG 개수 확인 | ✅ v3-r14-r3 확인, PNG 69개 |
| A2 | 변경 파일 범위 | 원본 업로드 zip 대비 `filecmp.dircmp` 재귀 전수 비교 | ✅ 정확히 5개(신규 4 + 수정 1), 그 외 무변경(추가/삭제/수정 0건) |
| A3 | 엠블럼 자산 무결성 | `src/assets/**` 전체 byte-compare(원본 zip 대비) | ✅ 차이 0건 |
| A4 | 엠블럼 가드 파일 무결성 | MD5 대조(`growthData.ts`/`AxisEmblemImageBadge.tsx`/`AxisTierMedallion.tsx`) | ✅ 3/3 원본과 일치 |
| A5 | 불변 파일 3종 무결성 | md5sum 대조 | ✅ 3/3 일치 |
| A6 | v3-r15 의존 파일 무결성(기준선 이동 검증) | v3-r14-r2(구 기준) vs v3-r14-r3(신 기준) 12개 파일 MD5 대조 | ✅ 12/12 완전 동일 — 엠블럼 재작업이 기능 의존 파일에 영향 없음을 확인 |
| A7 | 신규 파일 4종 내용 일치 | v3-r15 산출물과 MD5 대조 | ✅ 4/4 완전 동일(내용 변경 없이 그대로 이식) |
| A8 | 타입/문법 검증 | 오프라인 스텁 `tsc` 하네스(신규 4종 + `AssessmentDetail.tsx` 스코프) | ✅ 오류 0건 |
| A9 | AI/외부 API 호출 여부 | `grep "fetch("` (신규 파일 4종) | ✅ 0건 |
| A10 | 금지 표현(합격률 등) / 재무 노출 | `grep`(신규 파일 4종) | ✅ 실사용 0건(가드 주석만 존재) |
| A11 | 신규 Provider/Route/사이드바 메뉴 | `grep`(신규 파일 4종, `AdminLayout.tsx`, `layouts/*.tsx`, `routes/*.tsx` 무변경) | ✅ 0건 |
| A12 | 학생/보호자 화면 연결 여부 | `grep -l "examPrepGuide\|ExamPrepGuidePanel" src/pages/student src/pages/parent` | ✅ 0건 |
| A13 | 학부모 화면 Rival/Emblem/SP/Tier 노출(회귀 확인) | `ParentHome.tsx` grep — 이번 작업으로 이 파일을 건드리지 않았음을 전제로 사전 상태 재확인 | ✅ 기존 가드 주석("Rival/Emblem/SP/Tier 등 학생용 게임형 지표는 전혀 참조하지 않는다") 그대로 유지, 무변경 |
| A14 | `npm ci` / `npm run typecheck` / `npm run build` 실제 실행 | 3개 명령 직접 시도(§A8 상세) | ⚠️ 3개 전부 네트워크 정책(`E403`)으로 실패 — 코드/이번 변경과 무관한 환경 제약(§A8 상세) |
| A15 | `.gitignore`의 `*.tsbuildinfo` 등록 확인 | `.gitignore` 파일 확인 | ✅ 이미 등록됨 — 이번 diff 패키지에도 tsbuildinfo 미포함 |

**불변 MD5**
- `universityAnalysisAdapter.ts` = `1eddaef5cf427e00666be685ea16f32f` ✓
- `App.tsx` = `387bbf48a3d87ff63ce10d6dbc8bf33c` ✓
- `classData.ts` = `126d9e5e314de186bf1df0a63b3abf82` ✓

### A8 상세 — tsc 스텁 하네스(오프라인 대체 검증)

`npm ci`가 이 샌드박스에서 `E403 host_not_allowed`(네트워크 정책)로 실패해 실제
`tsc -b`/`vite build`를 끝까지 실행할 수 없다(§A14). v3-r15 때 만든 오프라인 스텁(react/
wouter/lucide-react/sonner/clsx/tailwind-merge/nanoid/xlsx 대응, 배포 패키지에는 미포함)을
그대로 재사용해 `tsc --noEmit`으로 대체 검증했다.

- **스코프 체크**(신규 4개 파일 + `AssessmentDetail.tsx` + 실제 import 체인): **오류 0건**.
- 참고로 v3-r15 때와 동일하게, `AssessmentDetail.tsx`의 **기존(미변경) 코드**에서
  `studentMap.get(...)` 관련 스텁 근사 오류 5건이 프로젝트 전체 스코프 체크에서 나타나지만,
  이는 `@types/react` 없이 제네릭 추론을 완전히 재현하지 못하는 하네스 한계이며 이번
  변경과 무관하다(§ 기존 v3-r15 QA 문서 A3-1과 동일 성격, 재확인만 함).
- **"npm run build 통과"를 이 세션에서 재확인했다고 주장하지 않는다.** 최종 확인은 GitHub
  Actions에서 이루어져야 한다.

### A14 상세 — `npm ci` / `npm run typecheck` / `npm run build` 실행 로그 요약

| 명령 | 실패 지점 | 원인 |
|------|-----------|------|
| `npm ci` | `GET https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz` | `403 Forbidden`(네트워크 egress 차단) |
| `npm run typecheck` | `src/routes/RoleRoute.tsx` 등 `TS2307`(`wouter` 모듈 못 찾음), `TS2875`(`react/jsx-runtime` 못 찾음) | `node_modules` 부재(`npm ci` 실패의 직접 결과) — 실패 지점은 전부 이번 5개 파일과 무관한 기존 파일 |
| `npm run build` | 위와 동일(1단계 `tsc -b`에서 이미 실패) | 동일 |


---

## B. 수동 QA 체크리스트 (GitHub Actions 빌드 후 스테이징 확인 권장)

### B1. 엠블럼 회귀 확인 (이번 Phase의 최우선 검수 항목)

- [ ] 성장관리 > 엠블럼관리(`/growth/emblems`) 화면에서 v3-r14-r3 재작업분 PNG가 이번
      작업 이전과 동일하게 보이는지(특히 재작업 대상이었던 `habit_*`/`if_*`/`tier_*` 6+6종)
- [ ] 학생 마이페이지 · 진열장(`StudentMyPage`, `StudentGrowthShowcase`) 엠블럼 이미지가
      정상 표시되는지(잘림/오염 없음)
- [ ] 엠블럼 OFF 설정 시 기존과 동일하게 전부 비노출되는지(v3-r14-r1 하드닝 회귀 없음)

### B2. 진입 경로 / 노출 범위

- [ ] `/scores` → 카테고리가 **내신대비모의고사**인 시험 상세로 진입 → "내신 대비 가이드"
      탭이 보이는지
- [ ] 단원평가/입학테스트/인증평가/수능실전모의고사 시험 상세에는 이 탭이 보이지 않는지
- [ ] **(신규)** 비내신 시험 상세 URL에 `?tab=prep`을 직접 붙여 접근 → 탭 버튼 목록에
      "내신 대비 가이드"가 없고, 콘텐츠 영역이 비지 않고 "기본정보" 탭 내용이 표시되는지
- [ ] 사이드바 메뉴 구조가 기존과 동일한지(신규 메뉴 없음)

### B3. 입력 → 자동 생성 → 수정 → 승인 → 승인 취소

- [ ] 필수 입력값을 비운 채 "자동 생성"을 누르면 검증 오류가 표시되고 생성되지 않는지
- [ ] 모든 값을 채우고 생성하면 회차별 표/일정 요약/통계 카드가 나타나는지
- [ ] 회차별 "진도/활동 내용"·"숙제" 칸을 수정하면 즉시 반영되고, 새로고침 후에도
      유지되는지(localStorage)
- [ ] "승인"을 누르면 입력값·회차별 문구가 읽기 전용으로 바뀌는지
- [ ] "승인 취소"를 누르면 "자동 생성됨" 상태로 돌아가고 기존 내용이 보존되는지

### B4. 권한 / 회귀

- [ ] `assessment.grade` 권한이 없는 계정은 입력/생성/승인 버튼이 숨겨지고 조회만 가능한지
- [ ] 기본정보/응시자목록/채점현황/결과분석 4개 탭이 이번 변경 이전과 동일하게 동작하는지
- [ ] 학생/보호자 화면에 이번 기능으로 인한 변화가 전혀 없는지
