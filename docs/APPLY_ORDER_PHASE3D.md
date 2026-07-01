# APPLY_ORDER_PHASE3D.md

## v3-r10-r3 적용 안내

단일 zip(`axis-lms-v1_2-phase3d-growth-motivation-rival-emblem-v3-r10-r3-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공. r1+r2+r3 변경이 함께 담겨 있어 GitHub main(v3-r9-r4)
기준으로 이 zip 하나면 된다.

1. 압축 해제 후 로컬 저장소 전체 교체(이번 r3는 `TeacherStudentDetail.tsx` 1개만 추가 변경).
2. GitHub Desktop 변경 확인.
3. 커밋 메시지: `Phase 3D v3-r10-r3: Fix TeacherStudentDetail IF record type build error`
4. Push 후 GitHub Actions Build Check 통과 확인.
5. 불변 파일 3종 MD5 무변경.

### 적용 후 확인
- GitHub Actions 빌드 통과(이번 라운드의 핵심 목적).
- 교사 학생 상세 → 성장 상담 요약이 이전과 동일하게 표시되는지(기능 변화 없음).
- r2 개선분(Rival CTA / 결과 추이 넓은 패널 / 학부모 성장 리포트 PC 2컬럼) 유지 확인.

---

## v3-r10-r2 적용 안내

단일 zip(`axis-lms-v1_2-phase3d-growth-motivation-rival-emblem-v3-r10-r2-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공한다.

### 적용 순서

1. zip 압축 해제 후 로컬 저장소 폴더 내용을 전체 교체(수정 7개 파일, 신규/삭제 없음).
   - r1까지 반영된 소스 위에 r2가 얹혀 있으므로, GitHub main이 v3-r9-r4 기준이라면 이 zip
     하나로 r1+r2 변경이 함께 올라간다.
2. GitHub Desktop 변경 확인 — `MODIFIED_FILES_PHASE3D.md` v3-r10-r2 + v3-r10-r1 섹션 대조.
3. 커밋 메시지(GitHub Desktop Summary): 지시서 §7 그대로 사용.
4. Push 후 GitHub Actions Build Check 통과 확인(필수 — 오프라인이라 로컬 `npm run build`
   불가, 대체 검증은 `QA_PHASE3D.md` v3-r10-r2 섹션 참조).
5. 불변 파일 3종 MD5 무변경.

### GitHub Desktop Summary (지시서 §7)

```
Phase 3D v3-r10-r2: Fix Rival CTA, PC dashboard layout, trend panels, and AXIS growth language
```

### 적용 후 수동 확인 권장

- **Rival 화면**: "상세 매치업 보기" 버튼이 매치업 카드 하단에 실제로 보이는지, 클릭 시
  하단 "상세 매치업 · 주차별 성장 기록" 섹션으로 스크롤되는지.
- **학생 테스트(결과 추이)**: 우측 좁은 카드/점 하나가 아니라, 탭 아래 전체 폭 "결과 추이
  분석" 패널에 단원평가·내신대비가 나란히 보이는지. 결과가 1회뿐인 계정에서 점 하나가
  아니라 (첫 기준점/최근 기록/다음 테스트 안내)가 뜨는지.
- **학부모 성장 리포트**: PC에서 좁은 단일 컬럼이 아니라 넓은 2컬럼 대시보드로 펼쳐지는지.
  Rival/Emblem/SP/Tier 명칭 미노출, 상담 원문 미노출, 수납은 "미납 없음" 수준만.
- **학생 성장 진열장**: Hero 전체 폭 + 좌우 균형 2컬럼(한쪽만 길게 비지 않는지).
- **교사/관리자 학생 상세**: "승/패/전적/승률" 대신 성장 참여 언어로 보이는지, 빨강 칼
  아이콘이 사라졌는지.
- **PC 전반**: 학생/학부모/교사/관리자 홈에서 콘텐츠가 좁게 몰리지 않고 카드 끝선·gap이
  정렬돼 보이는지.

---

## v3-r10-r1 적용 안내

단일 zip(`axis-lms-v1_2-phase3d-growth-motivation-rival-emblem-v3-r10-r1-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공한다.

### 적용 순서

1. zip 압축 해제 후 로컬 저장소 폴더 내용을 전체 교체한다(신규 4 + 수정 11 = 15개 파일).
   - 신규 파일이 있으므로 GitHub Desktop에서 4개 파일이 "추가"로 잡히는지 확인:
     `src/lib/rivalMatchupEngine.ts`, `src/components/brand/AxisEmblemBadge.tsx`,
     `src/components/brand/AxisTierMedallion.tsx`, `src/components/growth/RivalMatchupCard.tsx`.
2. GitHub Desktop 변경 사항 확인 — `MODIFIED_FILES_PHASE3D.md` v3-r10-r1 섹션 목록과 대조.
3. 커밋 메시지(GitHub Desktop Summary): 지시서 §7의 Summary/Description을 그대로 사용
   (아래 재수록).
4. Push 후 GitHub Actions Build Check 통과 확인(필수 — 오프라인이라 로컬 `npm run build`
   불가, 대체 검증은 `QA_PHASE3D.md` v3-r10-r1 섹션 참조).
5. 불변 파일 3종 MD5 무변경.

### GitHub Desktop Summary (지시서 §7)

```
Summary:
Phase 3D v3-r10-r1: Rebuild core growth motivation philosophy and UI

Description:
- Rebuilt IF grading philosophy as rule-based growth simulation
- Connected IF results to improvement points, emblems, and growth records
- Reworked Rival into approved me-vs-Rival learning matchup card
- Added VS medallion, dual growth comparison, and comparison lanes
- Rebuilt Emblem system as premium academic achievement records
- Added IF-linked emblem families for calculation, concept, and time improvement
- Reframed Tier/SP as AXIS growth stages rather than game ranks
- Upgraded student growth showcase into PC-first premium gallery
- Preserved parent-facing indirect expression rules
- Preserved student finance exposure prohibition
- Verified build and forbidden-expression checks
```

### 적용 후 수동 확인 권장 (지시서 §7 검색 항목 + 화면 확인)

- **학생 Rival 화면**: "나 vs Rival" 매치업 카드가 즉시 보이는지(좌 나·teal / 중앙 VS
  메달 / 우 Rival 평균·blue), 정확도/꾸준함/집중도 레인·CTA 표시. 닉네임 없는 계정은
  설정 안내가 뜨는지. 실명/반/연락처 비노출.
- **학생 성장 진열장**: PC에서 3존(좌 Hero+갤러리+기록+습관 / 우 IF 요약)으로 넓게 펼쳐
  지는지, 엠블럼이 프리미엄 배지로 보이는지, 미획득이 "다음 성장 목표"로 보이는지.
- **Tier 표시**: 학생 홈/마이페이지/진열장·관리자 진열장에서 게임 랭크(WOOD/GOLD 등)가
  아니라 AXIS 성장 단계(씨앗/기초/집중/전략/숙련/축의 완성)로 뜨는지. Mastery/Axis Master만
  프리미엄 방패인지.
- **엠블럼 배지**: 학생 MyPage·교사 성장 요약·관리자 EmblemManagement에서 🏅 이모지가
  아니라 SVG 배지로 보이는지.
- **교사 학생 상세**: 성장 상담 요약에 배지·단계가 상담용으로 보이는지. **학부모 계정으로는
  Rival/Emblem/SP/Tier 명칭이 어디에도 안 보이는지**(정책 위반 직결).
- **학부모 홈/성장 리포트**: 이번 라운드 코드 미변경 → 회귀 없음 확인 목적 육안 재확인.

---

## v3-r10 적용 안내

단일 zip(`axis-lms-v1_2-phase3d-growth-motivation-rival-emblem-v3-r10-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공한다.

### 적용 순서

1. zip 압축 해제 후 로컬 저장소 폴더 내용을 전체 교체한다(수정 파일 43개 — 신규/삭제
   파일 없음, 전부 기존 파일 in-place 수정).
2. GitHub Desktop에서 변경 사항 확인 — `MODIFIED_FILES_PHASE3D.md` v3-r10 섹션의 파일
   목록과 diff 개수가 대략 일치하는지 확인.
3. 커밋 메시지(GitHub Desktop Summary): 아래 "GitHub Desktop Summary" 그대로 사용.
4. Push 후 GitHub Actions Build Check 통과 확인(필수 조건 — 오프라인 환경이라 로컬
   `npm run build`는 이번에도 불가, 대체 검증은 `QA_PHASE3D.md` v3-r10 섹션 참조).
5. **불변 파일 3종(`universityAnalysisAdapter.ts`/`App.tsx`/`classData.ts`)은 이번에도
   손대지 않았다** — MD5 무변경.

### GitHub Desktop Summary

```
Summary:
Phase 3D v3-r10: Refine growth motivation flow and chart colors

Description:
- Improved bar chart colors to avoid overly deep navy data bars
- Preserved AXIS deep navy as brand/structure color
- Connected IF results to emblem and growth record flow
- Cleaned up student growth showcase UI
- Refined Rival UI toward learning-growth motivation
- Added teacher-facing growth summary structure
- Hid Rival/Emblem/SP/Tier terms from parent-facing screens
- Kept IF Analysis inside test result detail only
- Removed excessive game-like UI direction
- Improved admin screen text contrast (sidebar/tabs/menus/buttons/tables)
- Verified build with GitHub Actions-compatible output
```

### 적용 후 수동 확인 권장 항목 (Phase 지시 §8 기준)

- 로그인 화면 — 이번 라운드 미접촉(회귀 없음 확인용으로만 육안 확인).
- 학생 테스트 상세 → IF 채점 블록 — 사유 막대 색이 red/navy가 아니라 amber/blue/teal로
  보이는지, 사유 3개(계산 실수/개념 부족/시간 부족) 그대로인지.
- 학생 성장 진열장 → "최근 개선 포인트" 카드 — IF 회고를 1회 이상 완료한 학생 계정으로
  로그인해 실제 문구가 뜨는지, 완료 이력이 없는 계정은 기존 안내문이 뜨는지 둘 다 확인.
- Rival 영역(학생) — 칼/불꽃 아이콘이 트로피/화살표 아이콘으로 바뀌었는지, 실명/상대
  식별정보 비노출 그대로인지.
- 교사 학생 상세 성장 탭 — "성장 상담 요약" 섹션이 브리핑 카드 아래 새로 보이는지,
  학부모 계정으로는 동일 정보가 어디에도 안 보이는지(중요 — 정책 위반 여부 직결).
- 학부모 홈/성장 리포트 — 이번 라운드 코드 미변경이므로 회귀 없음 확인 목적으로만
  육안 재확인(Rival/Emblem/SP/Tier 여전히 비노출인지).
- 막대그래프 색상 적용 화면 — 시험 상세(관리자) 점수 분포, 재무통계(관리자) 3개 차트.
- **관리자 화면 대비** — 학생관리/시험관리/성장관리/설정/재무관리/알림관리 목록·상세
  화면에서 회색 텍스트가 이전보다 뚜렷하게 보이는지, 사이드바 선택 메뉴/활성 탭 표시가
  여전히 잘 보이는지(사이드바 자체는 이번에 손대지 않음).

---

## v3-r9-r4 적용 안내

단일 zip(`axis-lms-v1_2-phase3d-if-analysis-engine-detail-flow-v3-r9-r4-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공한다.

### 적용 순서

1. zip 압축 해제 후 로컬 저장소 폴더 내용을 전체 교체한다.
   - `src/assets/brand/axis-hero-dark.png`가 새 이미지로 교체됐는지 확인.
2. GitHub Desktop에서 변경 사항 확인 — 수정 파일 3개(`axis-hero-dark.png`,
   `index.css`, `brandColors.ts`).
3. 커밋 메시지: "Phase 3D v3-r9-r4 login hero image and sidebar navy refresh"
   (별도 GitHub Desktop Summary 지시가 없어 자체 작성함 — 원하는 문구가
   있으면 알려달라).
4. Push 후 GitHub Actions Build Check 결과 확인.
5. **불변 파일 3종은 이번에도 손대지 않았다.**

### 적용 후 수동 확인 권장 항목

- 로그인 화면 히어로 이미지가 중앙에 잘 정렬되어 보이는지(원래 지적 사항).
- 관리자 사이드바 배경색 — 육안으로는 이전과 거의 동일하게 보일 것이다(색차가
  매우 작음, 정상).

---

## v3-r9-r3 적용 안내

단일 zip(`axis-lms-v1_2-phase3d-if-analysis-engine-detail-flow-v3-r9-r3-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공한다. **v3-r9-r2는 반려된 산출물**이므로
GitHub에 반영되지 않았어야 한다 — 혹시 반영했다면 이번 zip으로 덮어쓸 것.

### 적용 순서

1. zip 압축 해제 후 로컬 저장소 폴더 내용을 전체 교체한다.
2. GitHub Desktop에서 변경 사항 확인 — **수정 파일은 `src/index.css` 1개뿐**이다.
   `.axis-sidebar` 배경색 한 줄만 바뀐다.
3. 커밋 메시지: "Phase 3D v3-r9-r3 AXIS navy token cleanup"
4. Push 후 GitHub Actions Build Check 통과 확인(필수 조건).
5. **불변 파일 3종은 이번에도 손대지 않았다.**

### 적용 후 수동 확인 권장 항목

- 좌측 사이드바(관리자 화면) 배경색이 이제 앱의 다른 네이비 요소(버튼, 배지 등)와
  같은 톤으로 보이는지 확인 — v3-r9-r2에서 `--brand-navy` 토큰과 대부분의
  하드코딩은 새 짙은 톤(#040D1E)으로 갱신됐지만, 이 사이드바 배경만 옛
  값(#081F4D, 더 밝음)에 그대로 머물러 있었다. 이번 수정으로 사이드바도
  같은 톤으로 맞춰졌어야 정상이다.

---

## v3-r9-r2 적용 안내

단일 zip(`axis-lms-v1_2-phase3d-if-analysis-engine-detail-flow-v3-r9-r2-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공한다. **v3-r9-r1은 반려된 산출물이므로
GitHub에 반영되지 않았어야 한다** — 이번 zip은 v3-r8 기준으로 다시 만든
것이라 v3-r9-r1을 이미 반영했다면 반드시 이번 zip으로 덮어써야 한다.

### 적용 순서

1. zip 압축 해제 후 로컬 저장소 폴더 내용을 전체 교체한다(`src/assets/brand/`
   이미지 3장 포함 확인 필수 — v3-r9-r1과 동일).
2. GitHub Desktop에서 변경 사항 확인 — 수정 파일 71개(대부분 네이비 색상값
   리터럴 치환), `docs/` 4종 문서. 신규/삭제 파일 없음.
3. 커밋 메시지: "Phase 3D v3-r9-r2 IF engine import boundary and AXIS brand token hotfix"
4. Push 후 **GitHub Actions Build Check 통과가 이번엔 필수 조건**(사용자
   지시 — 로컬 build 검증이 계속 불가능한 환경이라 CI 결과가 유일한 최종
   검증 수단이다).
5. **불변 파일 3종은 이번에도 손대지 않았다.**

### 적용 후 수동 확인 권장 항목

- 앱 전반적으로 네이비 톤이 이전보다 눈에 띄게 짙어졌는지 확인(사이드바,
  버튼, 배지, 포커스 링 등) — 로그인 히어로 이미지의 네이비와 나머지 UI의
  네이비가 이제 훨씬 잘 어울려 보여야 한다.
- 학생 테스트 상세 IF 채점, 학부모/교사 IF 관련 화면(ParentHome, ParentGrowthReport,
  TeacherHome, TeacherStudentDetail, StudentList, ScoreExportPanel) 전부
  이전과 동일하게 동작하는지(이번엔 import 경로만 바꿨으므로 동작 변화가
  없어야 정상).

---

## v3-r9-r1 적용 안내

단일 zip(`axis-lms-v1_2-phase3d-if-analysis-engine-detail-flow-v3-r9-r1-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공한다.

### 적용 순서

1. zip 압축 해제 후 로컬 저장소 폴더 내용을 전체 교체한다.
   - **신규 폴더 `src/assets/brand/`(이미지 3장) 반드시 포함해서 복사할 것** —
     빠뜨리면 로그인 화면과 4개 포털 헤더 배지가 깨진다.
2. GitHub Desktop에서 변경 사항 확인 — 신규 파일 3개(이미지), 수정 파일 10개
   (`AxisMark.tsx`, `AxisWordmark.tsx`, `global.d.ts`, `AdminLayout.tsx`,
   `TeacherLayout.tsx`, `ParentLayout.tsx`, `StudentLayout.tsx`,
   `ifAnalysisEngine.ts`, `LoginPage.tsx`, `StudentGrades.tsx`,
   `ParentGrades.tsx`), `docs/` 4종 문서.
3. 커밋 메시지: "Phase 3D v3-r9-r1 IF analysis engine wiring and AXIS brand hotfix"
4. Push 후 GitHub Actions Build Check 결과 확인.
5. **불변 파일 3종은 이번에도 손대지 않았다.**

### 적용 후 수동 확인 권장 항목

- 로그인 화면: 히어로 이미지가 찌그러짐 없이 잘 표시되는지(반응형 폭 축소 시에도).
- 관리자/교사/학부모/학생 4개 포털 헤더의 소형 A마크 배지가 전부 동일하게
  보이는지.
- 학생 테스트 상세 → IF 채점: 문항 선택 후 결과 카드에 새로 추가된 "보완 포인트"
  제안 문구가 표시되는지, 저장/성장이벤트(SP 지급)가 이전과 동일하게 동작하는지.
- 교사 "담당 학생 성장" 화면의 IF 잠재력 수치가 이전과 동일하게 나오는지(회귀
  확인).

---

## v3-r9 적용 안내

이번에도 단일 zip(`axis-lms-v1_2-phase3d-if-analysis-engine-detail-flow-v3-r9-github-upload.zip`,
내부 루트 `axis-lms-main/`)으로 제공한다 — GitHub Desktop 사용 기준 분할 불필요.

### 적용 순서

1. zip 압축 해제 후 로컬 저장소 폴더 내용을 전체 교체한다(신규 파일
   `src/lib/ifAnalysisEngine.ts` 포함).
2. GitHub Desktop에서 변경 사항 확인 — 수정 파일 2개(`LoginPage.tsx`,
   `TeacherStudentGrowth.tsx`), 신규 파일 1개(`ifAnalysisEngine.ts`), `docs/`
   4종 문서.
3. 커밋 메시지: "Phase 3D v3-r9 IF analysis engine and test detail flow"
4. Push 후 GitHub Actions Build Check 결과 확인.
5. **불변 파일 3종은 이번에도 손대지 않았다.**

### 적용 후 수동 확인 권장 항목

- 로그인 화면: 짙은 네이비 히어로 카드 안 AXIS 워드마크가 잘 보이는지,
  "MATH ACADEMY" 라벨이 우상단에 잘 정렬되는지 확인.
- 학생 테스트 상세 → IF 채점 블록이 여전히 정상 동작하는지(이번엔 로직을
  건드리지 않았지만 회귀 확인 차원에서 권장).
- 교사 "담당 학생 성장" 화면의 "IF 잠재력" 수치가 이전과 동일하게 나오는지
  (계산식 자체는 그대로 옮기기만 했으므로 값이 바뀌면 안 된다).

---

## v3-r8 적용 안내

이번 산출물은 v3-r3 라운드처럼 GitHub 웹 UI 업로드 100개 파일 제한에 걸리지
않는다 — 사용자가 실제 사용하는 방식은 **GitHub Desktop**이며, GitHub Desktop은
git 클라이언트라 파일 개수 제한이 없다. 따라서 이번엔 분할 없이 **단일 zip**
(`axis-lms-v1_2-phase3d-student-test-parent-portal-brand-polish-v3-r8-github-upload.zip`,
내부 루트 `axis-lms-main/`, 총 189개 파일)으로 제공한다.

### 적용 순서

1. zip을 로컬에 압축 해제한다.
2. 기존 로컬 GitHub Desktop 저장소 폴더의 내용을 압축 해제한 `axis-lms-main/`
   내용으로 **전체 교체**한다(신규 파일 3개 포함 — `src/components/brand/`
   폴더가 새로 생기므로 폴더째 복사하면 된다).
3. GitHub Desktop에서 변경 사항을 확인한다 — 이번 커밋에는 수정 파일 39개,
   신규 파일 3개(`src/components/brand/AxisMark.tsx`,
   `src/components/brand/AxisWordmark.tsx`, `src/lib/brandColors.ts`)가
   포함되어야 한다. `docs/` 문서 4종(CHANGES/QA/MODIFIED_FILES/APPLY_ORDER)도
   함께 변경된 것으로 표시된다.
4. 커밋 메시지: "Phase 3D v3-r8 student test parent portal and AXIS brand
   polish" (지시받은 GitHub Desktop Summary 그대로).
5. Push 후 GitHub Actions Build Check(`npm run typecheck && npm run build`)
   결과를 확인한다.
6. **불변 파일 3종은 이번에도 손대지 않았다** — `src/lib/universityAnalysisAdapter.ts`
   (MD5 `1eddaef5`), `src/App.tsx`(MD5 `387bbf48`), `src/lib/classData.ts`
   (MD5 `126d9e5e`) 그대로 유지되므로 별도 확인 불필요.

### 적용 후 수동 확인 권장 항목

- 로그인 화면에서 `AxisWordmark`의 대각선 골드 슬래시가 "X" 글자와 시각적으로
  잘 겹치는지 확인(브라우저 렌더링 없이 좌표를 추정한 값이라 미세 조정이
  필요할 수 있음 — `QA_PHASE3D.md` v3-r8 "알려진 한계" 참조).
- 4개 포털(관리자/교사/학부모/학생) 헤더 배지에 새 AXIS 마크가 정상적으로
  보이는지 확인.
- 상단 요약 카드/배지 등에서 이전에 보라색이었던 요소들이 Navy/Gold로 잘
  바뀌었는지 육안 확인(특히 대학추천 관련 아이콘 = Gold, Rival 관련 아이콘 =
  Navy로 구분되어야 정상).

---

## v3-r3 추가 안내 — GitHub 웹 업로드용 3분할 (100개 파일 제한 대응)

전체 프로젝트(179개 파일)를 GitHub 웹 UI의 "Add file → Upload files"로 한 번에
올리려 하면 파일 개수 제한(약 100개)에 걸린다. 이를 피하기 위해 폴더 경계 기준으로
**3개 zip으로 분할**했다:

| 파일 | 파일 수 | 업로드 대상 경로 | 포함 내용 |
|---|---|---|---|
| `axis-lms-v3-r3-part1-root-docs.zip` | 29개 | 저장소 **루트** | `.github/`, `docs/`, `package.json` 등 루트 설정 파일 전부 |
| `axis-lms-v3-r3-part2-src-core.zip` | 84개 | 저장소 루트(=`src/` 자동 생성) | `src/`(단, `src/pages/` 제외) — App.tsx, contexts, lib, routes 등 |
| `axis-lms-v3-r3-part3-src-pages.zip` | 66개 | 저장소 루트(=`src/pages/` 자동 생성) | `src/pages/`만 |

**업로드 순서(반드시 이 순서로, 매번 새 커밋으로 진행):**

1. GitHub 저장소(빈 저장소 또는 기존 저장소의 루트 화면)에서 "Add file → Upload files".
2. `part1` zip을 로컬에서 압축 해제한 뒤, 나온 폴더/파일 전부(`.github`, `docs`,
   `package.json` 등)를 업로드 화면에 드래그 → 커밋.
3. 다시 "Add file → Upload files"(저장소 루트 화면에서), `part2`를 압축 해제해서 나온
   `src` 폴더 전체를 그대로 드래그 → 커밋. GitHub가 자동으로 `src/App.tsx`,
   `src/lib/...` 등 경로를 만들어준다.
4. 다시 "Add file → Upload files", `part3`를 압축 해제해서 나온 `src` 폴더(안에
   `pages`만 있음)를 그대로 드래그 → 커밋. 기존 `src/` 폴더 안에 `src/pages/...`
   경로가 추가된다(2번에서 만든 `src/` 내용과 충돌하지 않음 — 겹치는 파일이 없다).

3번의 커밋이 끝나면 179개 파일 전체가 저장소에 정확히 원래 구조대로 올라가 있어야
한다. 불변 파일 4종(`App.tsx`, `TeacherExamGrading.tsx`, `universityAnalysisAdapter.ts`,
`classData.ts`)의 MD5가 이 문서 QA 섹션에 적힌 값과 같은지 업로드 후 다시 확인하는
것을 권장한다.

⚠️ 파일 개수가 적은 저장소이거나 GitHub CLI/Git을 쓸 수 있는 환경이라면, 이렇게
분할할 필요 없이 `git clone` → 압축 해제한 전체 내용 복사 → `git add . && git commit
&& git push`가 훨씬 간단하고 안전하다(웹 업로드보다 이 방법을 권장한다).

---

## v3-r3 적용 안내

**버전**: v3-r3 — 이 섹션이 최신이다. v3-r2 이하 적용 안내는 아래에 각각 보존.

### 전제

v3-r2와 동일하게 `-github-upload.zip` 하나만 제공하며, **diff가 아니라 프로젝트 전체
구조를 담은 완전한 패키지**다(이 방식은 v3-r2에서 확정했고 이번에도 유지한다). 이
zip을 풀면 `axis-lms-main/` 폴더 하나가 나오고, 그 안에 Phase 3D v1~v3-r3 누적
수정사항이 전부 반영된 최종 상태가 들어있다. 삭제 파일 관련 이슈는 없다 —
`StudentFinance.tsx`는 v3-r1부터 이미 이 zip 안에 존재하지 않는다.

### 적용 방법

v3-r2 섹션에 적힌 A)/B) 두 방법(저장소 통째로 교체 / 새 저장소로 업로드) 중 하나를
그대로 따르면 된다. 이번 라운드는 코드 몇 개 파일과 문서만 수정됐을 뿐 프로젝트 구조
자체는 바뀌지 않았다.

### 적용 후 필수 검증

1. `npm install`
2. `npm run typecheck`
3. `npm run build`

이 작업 환경은 계속 네트워크가 차단되어 있어 위 3개 명령을 직접 실행하지 못했다 —
로컬 또는 GitHub Actions에서 반드시 1회 실행해 확인해야 한다.

### 적용 후 수동 확인 권장 항목(v3-r3 추가분)

- [ ] 학부모 성장 리포트 "테스트" 탭 → 과목별 보완 필요도 항목에 "목표까지 N%p",
      "이전 대비 ▲/▼ N%p"가 표시되는지 확인.
- [ ] 학부모 성장 리포트 "리포트" 탭 → 주간 학습 리포트에 "전주 대비" 증감이, 그
      아래 "상담용 요약" 카드가 문단 형태로 자연스럽게 표시되는지 확인.
- [ ] `docs/PARENT_PAGE_CONSTITUTION.md`를 열어 Rival/Emblem/SP/Tier 등 구체적 지표명이
      단 한 곳도 등장하지 않는지 확인.
- [ ] 선생님 "내 시험지 관리"에서 학생별 성적 화면(`/teacher/exams/:id/scores`) →
      상단에 "문항별 정답률" 막대그래프가 보이는지(문항별 채점 데이터가 있는 시험에
      한함 — 총점 직접 입력으로 채점된 시험은 이 섹션이 나타나지 않는 것이 정상) 확인.

---

## v3-r2 적용 안내 — GitHub 업로드 zip 구조 명확화

**버전**: v3-r2 — 이 섹션이 최신이다. v3-r1/v3/v2/v1 적용 안내는 아래에 각각 보존.

### ⚠ v3-r1까지의 혼동 정리

v3-r1까지는 `-github-upload.zip`을 "v1 원본 베이스라인 대비 누적 diff(변경/신규 파일만)"
방식으로 만들었다. 이 방식은 두 가지 문제가 있었다:

1. **삭제된 파일(`StudentFinance.tsx`)을 diff zip에 표현할 방법이 없었다** — zip은
   "이 파일을 지워라"라는 지시를 담을 수 없고, 파일이 없다는 사실만으로는 전달되지 않는다.
   적용하는 사람이 문서를 읽고 수동으로 삭제해야 했는데, 이 과정이 누락되기 쉽다.
2. **"패치용인지 전체 업로드용인지"가 zip 자체만 봐서는 불명확했다.**

### v3-r2부터의 원칙 — github-upload.zip = 전체 프로젝트 패키지

**이번 v3-r2부터 `-github-upload.zip`은 diff/패치가 아니라 프로젝트 전체 구조를 담은
완전한 패키지다.** 즉, v3-r1까지 별도로 제공하던 "전체본(v3-r1.zip)"과 "GitHub
업로드용(diff)"의 구분을 없애고, **하나의 zip으로 통합**했다.

**적용 방법 — 아래 둘 중 하나만 선택:**

- **A) 기존 저장소를 통째로 교체**: 저장소의 기존 내용을 전부 지우고(또는 새 브랜치를
  만들어서) 이 zip의 `axis-lms-main/` 폴더 내용을 그대로 덮어쓴다. `node_modules`는
  포함되어 있지 않으므로 `npm install`을 다시 실행해야 한다. **삭제된 파일
  (`StudentFinance.tsx`)은 애초에 이 zip 안에 존재하지 않으므로, "통째로 교체" 방식에서는
  삭제 처리를 신경 쓸 필요가 없다** — 새 zip 내용 자체가 이미 삭제 반영된 최종 상태다.
- **B) 새 저장소로 그대로 업로드**: GitHub에서 새 저장소를 만들고 이 zip 압축을 풀어
  나온 `axis-lms-main/` 폴더 내용을 그대로 커밋하면 끝난다.

**기존 저장소에 부분 패치(diff)만 적용하고 싶다면**(비권장 — 위 두 방법을 우선 권장):
1. 이 zip 안의 내용과 기존 저장소를 direct diff(`diff -rq` 또는 Git 상에서 새 브랜치로
   전체를 올린 뒤 기존 브랜치와 비교)해서 실제 변경분을 직접 뽑아내야 한다.
2. **`src/pages/student/StudentFinance.tsx`는 반드시 수동으로 삭제해야 한다** — 이 zip에는
   애초에 존재하지 않는 파일이므로, diff 도구가 자동으로 삭제를 감지하지 못할 수 있다.
3. 이 방식은 실수 위험이 있으므로 위 A) 또는 B) 방법을 강력히 권장한다.

### 전제

`axis-lms-v1_2-phase3d-ui-ux-interaction-exam-template-v3-r2-github-upload.zip`
하나만 제공한다(요청된 산출물 파일명 기준). 이 zip을 풀면 `axis-lms-main/` 폴더 하나가
나오고, 그 안에 프로젝트 전체(v1 베이스라인 + Phase 3D v1~v3-r2 누적 수정사항 전부
반영된 최종 상태)가 들어있다.

### 적용 후 필수 검증

1. `npm install`
2. `npm run typecheck`
3. `npm run build`

세 명령 모두 **반드시 실제 네트워크 접근이 가능한 로컬 환경 또는 GitHub Actions에서
실행**해야 한다. 이 작업 환경 자체는 `registry.npmjs.org` 접근이 막혀 있어 `npm
install`을 실행할 수 없다(상세는 `docs/QA_PHASE3D.md` 참조) — 이는 산출물의 결함이
아니라 이 작업 환경의 네트워크 제약이다.

### 적용 후 수동 확인 권장 항목(v3-r2 추가분)

- [ ] 관리자 학생 목록(`/admin/students`)과 출결현황(`/admin/attendance/status`)
      테이블 모두 헤더가 스크롤 중 고정되는지, 좌우 스크롤이 표 영역 안에서만 발생하고
      페이지 전체가 함께 밀리지 않는지 확인.
- [ ] 관리자 시험 목록(`/admin/scores`)에서 행을 클릭해도 아무 반응이 없고, "상세 보기"
      버튼을 눌러야만 상세 화면으로 이동하는지 확인.
- [ ] 선생님 화면 전체(홈/담당학생/시험지/학생별성적)에서 "시험 채점"이나 단독 "채점"이
      화면 제목·메뉴명으로 보이지 않는지 확인(단, 실제 채점 화면 안의 "채점하기" 버튼,
      TeacherExamGrading.tsx 자체의 타이틀은 불변 파일 제약으로 예외).
- [ ] 학부모 성장 리포트 화면 소스를 열어 Rival/Emblem/SP/Tier 관련 표현이 실제 UI에도,
      주요 주석에도 남아있지 않은지 확인.

---

## v3-r1 적용 안내 (v3 반려 대응 + 추가 요구사항)

**버전**: v3-r1 — 이 섹션이 최신이다. v3/v2/v1 적용 안내는 아래에 각각 보존.

### 전제

`axis-lms-v1_2-phase3d-ui-ux-interaction-exam-template-v3-r1.zip`은 v3 상태 위에
v3-r1 수정사항이 모두 반영된 완전한 프로젝트 상태다. `-github-upload.zip`은 v1 원본
베이스라인 대비 지금까지의 전체 누적 diff(60개 파일)를 담고 있다.

### 파일 적용 순서

**1단계 — CSS/유틸(다른 파일이 의존)**
1. `src/index.css`(`.axis-table-scroll` 신규 패턴)
2. `src/utils/dateUtils.ts`(`getLocalDateStr` 인자 추가)

**2단계 — 데이터 레이어**
3. `src/lib/parentComments.ts`(신규)
4. `src/lib/studentProfile.ts`, `src/lib/rbac.ts`, `src/lib/accountActionLog.ts`(v3 유지분 재확인)

**3단계 — 라우트/레이아웃**
5. `src/routes/StudentRoutes.tsx`(신규 라우트 4개 연결 — `StudentRival.tsx`보다 반드시 나중에 적용)
6. `src/layouts/TeacherLayout.tsx`(네비 라벨 수정)

**4단계 — 페이지(위 레이어에 의존)**
7. `src/pages/student/StudentRival.tsx`(신규 — 5번보다 먼저 존재해야 함)
8. `src/pages/student/StudentFinance.tsx` **삭제**(레포에서 파일 자체를 제거)
9. `src/pages/StudentList.tsx`, `src/pages/AttendanceStatus.tsx`(필터 카드)
10. `src/pages/growth/EmblemManagement.tsx`, `RivalManagement.tsx`, `GrowthOverview.tsx`
11. `src/pages/settings/PermissionSettings.tsx`
12. `src/pages/teacher/TeacherExamScores.tsx`, `TeacherStudents.tsx`, `TeacherExamGradingGuard.tsx`, `TeacherGrades.tsx`
13. `src/pages/AssessmentList.tsx`, `AssessmentDetail.tsx`
14. `src/pages/parent/ParentHome.tsx`, `ParentGrowthReport.tsx`(전면 재작성본)
15. `src/pages/teacher/TeacherStudentDetail.tsx`(학부모 공개 코멘트 작성 UI)
16. `src/pages/student/StudentGrades.tsx`

**5단계 — 문서**
17. `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md`(신규) + 갱신된 문서 4종 병합.

### 적용 후 수동 확인 권장 항목(v3-r1 추가분)

- [ ] `npm install && npm run typecheck && npm run build`를 실제 네트워크 접근 가능한
      환경(로컬 또는 GitHub Actions)에서 반드시 1회 실행 — 이 작업 환경은 계속
      네트워크가 차단되어 있어 스텁 기반 tsc 검증만 완료된 상태다.
- [ ] 학생 계정으로 로그인 → 하단 네비 5탭(홈/테스트/진열장/Rival/마이) 전부 정상
      진입되는지, 404나 "다음 단계에서 구현됩니다" placeholder가 뜨지 않는지 확인.
- [ ] 관리자 학생 목록에서 "재원" 카드 클릭 → 목록이 재원 학생만 보이는지, 카드가
      active 표시되는지, 다시 클릭하면 해제되는지 확인.
- [ ] 출결현황에서 "알림 발송 건수" 카드 클릭 → 알림 발송된 기록만 보이는지 확인.
- [ ] 엠블럼관리 팝업을 열고 ESC 키를 눌러 닫히는지, 제목을 드래그해도 X 버튼이 여전히
      클릭되는지 확인.
- [ ] 학부모 계정으로 로그인 → "성장 리포트" 진입 → 4개 탭(테스트/출결/목표대학/리포트)
      전부 정상 동작하는지, 화면 어디에도 Rival/Emblem/SP 관련 표현이 없는지 확인.
- [ ] 선생님 학생상세에서 "학부모 공개 코멘트 작성" → 저장 후 같은 학생의 학부모
      성장 리포트 "리포트" 탭에 바로 나타나는지 확인.
- [ ] 시험지 결과 상세(선생님/학생/학부모 3개 화면 모두)에서 점수 비교 막대 그래프가
      표시되는지 확인.

---

## v3 적용 안내 (반려 대응 — v2는 GitHub 업로드 금지)

**버전**: v3 — 이 섹션이 최신이다. v2/v1 적용 안내는 아래에 각각 보존.

### 전제 (v3)

이 zip(`axis-lms-v1_2-phase3d-ui-ux-interaction-exam-template-v3.zip`)은 Phase 3D v2
상태(반려됨, 미배포) 위에 v3 수정사항이 모두 반영된 **완전한 프로젝트 상태**다.
`-github-upload.zip`은 **Phase 3C v2 베이스라인 대비 v1+v2+v3 전체 누적 diff**다(v2가
실제로는 한 번도 GitHub에 올라간 적이 없으므로, v3만의 증분이 아니라 처음부터의 전체
변경분을 담았다 — 총 49개 파일).

### GitHub 적용 순서 (신규/핵심 변경만 발췌 — 나머지는 MODIFIED_FILES 문서 참조)

**1단계 — 데이터/유틸 레이어**
1. `src/lib/rbac.ts` (`student.nicknameReset` 추가)
2. `src/lib/studentProfile.ts` (`lastNicknameChangedAt`, 14일 게이트, `resetStudentNickname`)
3. `src/lib/accountActionLog.ts` (신규)
4. `src/lib/counselingData.ts`, `src/lib/assessmentData.ts` (v2와 동일, 변경 없음)

**2단계 — Context**
5. `src/contexts/AuthContext.tsx` (`canResetNickname` + 로그인 하이픈 정규화 — 라우트
   파일들보다 반드시 먼저 적용)

**3단계 — 페이지**
6. `src/pages/student/StudentMyPage.tsx`, `StudentGrades.tsx`(`ResultDetailModal` export),
   `StudentHome.tsx`(신규 import 반영이므로 5번보다 먼저 적용하면 안 됨 — `StudentGrades.tsx`가
   먼저 적용되어 있어야 `StudentHome.tsx`의 import가 깨지지 않는다)
7. `src/pages/teacher/TeacherMaterials.tsx`(신규), `TeacherExamScores.tsx`(신규),
   `TeacherVideos.tsx`/`TeacherNotes.tsx`(stub 교체), `TeacherHome.tsx`, `TeacherExams.tsx`,
   `TeacherStudents.tsx`, `TeacherStudentDetail.tsx`
8. `src/pages/StudentDetail.tsx`, `src/pages/settings/PermissionSettings.tsx`
9. `src/pages/parent/ParentTargetSummary.tsx`
10. `src/pages/LoginPage.tsx`

**4단계 — 라우트**
11. `src/routes/TeacherRoutes.tsx`(`TeacherMaterials`/`TeacherExamScores` import가
    6~7단계 파일에 의존하므로 반드시 그 이후에 적용)

### 적용 후 수동 확인 권장 항목 (v3 추가분)

- [ ] 휴대폰번호를 하이픈 없이("01000000002") 입력해도 로그인이 되는지 확인.
- [ ] 강사 홈에서 "내 시험지" 카드 라벨과 "내 시험지 관리" 화면 제목이 보이는지, "수업자료"
      카드가 하나만 있고 "수업노트" 카드가 따로 없는지 확인.
- [ ] "수업자료" 화면에서 수업영상/수업노트 탭을 눌러도 페이지 전환 없이(URL이 안 바뀌고)
      즉시 내용만 바뀌는지 확인. 구 URL `/teacher/videos`, `/teacher/notes`로 직접
      접속해도 정상적으로 이동하는지 확인.
- [ ] 담당 학생 목록에서 카드를 클릭했을 때는 아무 반응이 없고, "상세보기" 버튼을 눌렀을
      때만 상세 페이지로 이동하는지 확인.
- [ ] 강사 학생 상세에서 "비밀번호 초기화"/"닉네임 초기화" 버튼을 눌러 확인 모달 → 실행까지
      진행해보고, 닉네임 초기화 후 해당 학생 계정으로 로그인해 마이페이지에서 즉시 새
      닉네임을 설정할 수 있는지 확인.
- [ ] 학생 계정으로 닉네임을 한 번 설정한 뒤 곧바로 다시 변경을 시도하면 "N일 남았습니다"
      안내와 함께 수정 버튼이 비활성화되는지 확인.
- [ ] 강사가 "내 시험지 관리"에서 시험지를 클릭 → 학생별 성적 화면에서 학생명/채점상태/
      점수/응시결시/결과보기/채점 또는 정정이 모두 보이는지, 다른 선생님의 개인 시험지
      id로 URL을 직접 조작해도 접근이 막히는지 확인.
- [ ] 학생 홈 "최근 성적" 카드를 클릭하면 "테스트" 메뉴를 거치지 않고 바로 성적표 상세
      (IF 요약 포함)가 열리는지 확인.
- [ ] 학부모 "목표대학 추천" 화면에서 더 이상 "상담 리포트"라는 표현이나 클릭되지 않는
      화살표 아이콘이 보이지 않는지 확인.

---

## (v2 적용 안내 — v1 대비, 반려 대응)

**버전**: v2 — 이 섹션이 최신이다. v1 적용 안내는 아래 "(v1 원본)" 섹션에 보존.

### 전제 (v2)

이 zip(`axis-lms-v1_2-phase3d-ui-ux-interaction-exam-template-v2.zip`)은 Phase 3D v1
상태 위에 v2(반려 대응) 수정사항이 모두 반영된 **완전한 프로젝트 상태**다.
`-github-upload.zip`은 v1 대비 v2에서 변경/신규된 파일만 추린 diff 패키지다.

### GitHub 적용 순서 (v2 파일 덮어쓰기 순서, 의존 관계 고려)

**1단계 — 데이터/유틸 레이어 (다른 파일이 의존)**
1. `src/lib/rbac.ts` (`canManageCounseling`/`canViewAllCounseling` 추가)
2. `src/lib/counselingData.ts` (신규)
3. `src/lib/assessmentData.ts` (`Exam.createdByMode` 필드 추가)
4. `src/contexts/FinanceContext.tsx` (주석만 갱신, 로직 변경 없음)

**2단계 — Context (라우트/레이아웃이 의존)**
5. `src/contexts/AuthContext.tsx` (`isAuthenticated`/`login`/`logout`/`activeMode` 추가 —
   반드시 라우트 파일들보다 먼저 적용)
6. `src/contexts/AssessmentContext.tsx` (`NewExamInput.createdByMode` 반영)

**3단계 — 페이지 (Context에 의존)**
7. `src/pages/LoginPage.tsx` (신규)
8. `src/pages/student/StudentFinance.tsx` (stub 교체)
9. `src/pages/parent/ParentHome.tsx`, `ParentGrades.tsx`, `ParentFinance.tsx`,
   `ParentGrowthReport.tsx`, `ParentTargetSummary.tsx`, `ParentAttendance.tsx`,
   `ParentMockExams.tsx`, `ParentWeeklyMocks.tsx`
10. `src/pages/teacher/TeacherStudentDetail.tsx`
11. `src/pages/StudentDetail.tsx`
12. `src/components/AssessmentFormModal.tsx` (수능형 템플릿 100점 수정 + activeMode 전달)

**4단계 — 라우트/레이아웃 (LoginPage와 AuthContext에 의존 — 반드시 위 단계 이후 적용)**
13. `src/routes/RoleRoute.tsx` (`LoginPage` import — 7번보다 반드시 나중)
14. `src/routes/StudentRoutes.tsx`
15. `src/routes/ParentRoutes.tsx`
16. `src/components/AdminLayout.tsx`
17. `src/layouts/TeacherLayout.tsx`, `StudentLayout.tsx`, `ParentLayout.tsx`

**5단계 — 문서**
18. `docs/PARENT_PAGE_CONSTITUTION.md`(신규) + 갱신된 문서 4종 병합.

### 적용 후 수동 확인 권장 항목 (v2 추가분)

- [ ] 로그아웃 상태에서 `/`, `/admin`, `/teacher`, `/student`, `/parent`를 각각 직접
      URL로 접속해도 전부 로그인 페이지로 가는지 확인.
- [ ] 원장 계정(010-0000-0002 / 0002)으로 로그인 → 자동으로 `/admin`으로 이동하는지 확인.
- [ ] 원장/부원장 계정에서 "강사 모드" 전환 → `/teacher`로 이동하고 상단에 "관리자 모드로
      돌아가기" 바가 보이는지, 다시 눌러 관리자모드로 복귀되는지 확인.
- [ ] "로그인 상태 유지" 체크 후 로그인 → 브라우저 새로고침해도 로그인이 유지되는지,
      미체크 상태에서는 탭을 완전히 닫았다 새로 열면 로그인이 풀리는지 확인.
- [ ] 시험등록에서 "수능형" 템플릿 적용 → 만점이 정확히 100점으로 표시되는지 확인.
- [ ] 학부모로 로그인 → 홈 화면에 총 청구/납부 금액이 전혀 보이지 않고 미납 유무 배지만
      보이는지, "상담 리포트" 카드가 더 이상 없는지, "성장 리포트" 카드를 누르면
      `/parent/growth`(Tier/Emblem/SP 화면)로 정상 진입되는지 확인.
- [ ] 학부모 "테스트" 탭에서 카드를 눌러 상세를 열고, IF 요약이 조회 전용으로만 보이는지
      (선택/수정 버튼이 없는지) 확인.
- [ ] 강사로 로그인 → 담당 학생 상세에서 "상담 기록 추가"로 기록을 남긴 뒤, 원장 계정으로
      해당 학생의 관리자 상세 화면 "상담 기록" 탭에서 방금 작성한 기록이 조회되는지 확인.
      학생/학부모 계정으로는 이 정보에 접근할 방법이 전혀 없는지도 함께 확인.
- [ ] `/student/finance`로 직접 URL 접속 시 `/student`로 즉시 리다이렉트되는지 확인.

⚠️ v1에서 지적했던 "수능형 104점 문제"는 v2에서 코드 레벨로 완전히 해결했다(더 이상
경고 필요 없음). 새로 남은 확인 필요 항목은 `CHANGES_PHASE3D.md`의 "§GPT 전달 의견"
섹션 참조(채점 기록 activeMode 미반영 등).

---

## (v1 원본)

## 전제

이 zip(`axis-lms-v1_2-phase3d-ui-ux-interaction-exam-template-v1.zip`)은 Phase 3C v2
베이스라인 위에 Phase 3D(UI/UX 개선) 수정사항이 모두 반영된 **완전한 프로젝트 상태(full
package)**다. `-github-upload.zip`은 이 상태에서 Phase 3C 대비 변경/신규 파일만 추린 diff
패키지다(node_modules 미포함, 단일 루트 구조).

## GitHub 적용 순서

### A. full package를 그대로 사용하는 경우

1. 기존 저장소 내용을 전부 이 zip 내용으로 교체(또는 새 브랜치로 체크아웃 후 전체 복사).
2. `npm install` 실행(이 작업 환경에서는 네트워크 제한으로 로컬 스텁 검증만 수행 —
   실제 설치는 GitHub Actions 또는 로컬 개발 환경에서 필수 수행).
3. `npm run typecheck`(`tsc -b --noEmit`) 통과 확인 — 로컬 스텁 기반 검증에서는 0 errors.
4. `npm run build` 통과 확인.
5. 통과하면 커밋.

### B. github-upload(diff) 패키지를 기존 저장소에 적용하는 경우

1. 기존 저장소가 Phase 3C v2 상태인지 먼저 확인.
2. 파일 덮어쓰기 순서(의존 관계 고려):
   1. `src/components/ui/alert-dialog.tsx` (다른 파일이 새 동작에 의존하지는 않지만, 공용
      컴포넌트이므로 먼저 적용해 이후 `AssessmentFormModal.tsx` 적용 시 함께 검증되도록)
   2. `src/hooks/useDraggableModal.ts` (신규 파일 — `EmblemManagement.tsx`가 의존하므로
      반드시 그보다 먼저 추가)
   3. `src/index.css` (신규 CSS 클래스 — 이후 적용되는 모든 페이지 파일이 참조)
   4. `src/pages/growth/EmblemManagement.tsx`
   5. `src/pages/settings/PermissionSettings.tsx`
   6. `src/components/AssessmentFormModal.tsx`
   7. `src/pages/student/StudentGrades.tsx`
   8. `src/pages/AssessmentList.tsx`
   9. `src/pages/AssessmentDetail.tsx`
   10. `src/pages/teacher/TeacherExams.tsx`
3. `npm install && npm run typecheck && npm run build` 실행.
4. `docs/` 폴더에 신규 문서 4종(`CHANGES_PHASE3D.md`, `QA_PHASE3D.md`,
   `MODIFIED_FILES_PHASE3D.md`, `APPLY_ORDER_PHASE3D.md`) 병합.

## 적용 후 수동 확인 권장 항목

- [ ] 엠블럼관리(`/growth/emblems`) 팝업을 열고 제목 영역을 드래그해 이동 → 화면 밖으로
      완전히 나가지 않는지, 모바일 폭에서는 드래그가 비활성화되는지 확인.
- [ ] 엠블럼관리·권한설정·시험및성적관리(목록/상세)·내시험지관리 각 표를 스크롤해 헤더가
      고정되는지, 컬럼 정렬이 깨지지 않는지 확인.
- [ ] 시험등록(관리자) 또는 내 시험 만들기(교사)에서 "수능형"/"내신형 대시" 템플릿 버튼을
      눌러 문항이 자동 생성되는지, 정답이 입력된 상태에서 다시 누르면 확인 모달이 뜨는지
      확인.
- [ ] 문항 구성에서 스테퍼(−/+)로 문항을 추가/삭제하고, 정답이 입력된 마지막 문항을
      삭제하려 할 때 확인 모달이 뜨는지, 그리고 그 확인 모달의 배경을 클릭했을 때 확인
      모달만 닫히고 시험등록 모달 전체는 닫히지 않는지 확인(§ AlertDialog 버그 수정 검증).
- [ ] 학생 화면 테스트 카드에 마우스를 올렸을 때 그림자/테두리가 바뀌는지, 성적표 상세
      팝업에서 내용을 스크롤해도 제목/닫기 버튼이 항상 보이는지 확인.

⚠️ 위 §"수능형 템플릿 배점 104점 vs 100점 불일치" 관련 원장님 확인 필요 —
`CHANGES_PHASE3D.md` §"적용 우선순위 3" 참조.

---

## Phase 3D v3-r4 (트랜치 1) — 적용 순서

전체 프로젝트 zip을 GitHub Desktop으로 업로드하므로 개별 적용 순서는 참고용이다.
개별 반영 시 권장 순서:
1. `src/lib/observationSignals.ts` (신규, 의존 없음)
2. `src/components/ObservationPanel.tsx` (신규, 1에 의존)
3. `src/index.css` + `src/components/AdminLayout.tsx` (사이드바 수정, 독립)
4. `src/pages/teacher/TeacherHome.tsx` + `src/pages/StudentList.tsx` (2에 의존)
5. `docs/*` 문서 갱신

적용 후 로컬에서 `npm install && npm run typecheck && npm run build` 1회 실행 필수.

---

## Phase 3D v3-r4-r1 — 적용 순서

전체 프로젝트 zip을 GitHub Desktop으로 업로드하므로 개별 적용 순서는 참고용이다.
1. `src/lib/observationSignals.ts` (확장 — computeSubjectGaps, 신규 타입, 신호 3종)
2. `src/lib/parentInsightEngine.ts` (신규, 1에 의존)
3. `src/lib/studentBriefingEngine.ts` (신규, 1·2에 의존)
4. `src/components/ObservationPanel.tsx` (유지, 변경 없음)
5. `src/index.css` + `src/components/AdminLayout.tsx` (유지, 변경 없음)
6. `src/pages/teacher/TeacherHome.tsx` / `src/pages/StudentList.tsx` (1에 의존, 확장)
7. `src/pages/teacher/TeacherStudentDetail.tsx` (1·2·3에 의존, 신규 카드)
8. `src/pages/parent/ParentHome.tsx` (1·2·3에 의존, 신규 섹션 3개)
9. `docs/*` 문서 갱신

적용 후 로컬에서 `npm install && npm run typecheck && npm run build` 1회 실행 필수.

---

## Phase 3D v3-r5 — 적용 순서

전체 프로젝트 zip을 GitHub Desktop으로 업로드하므로 개별 적용 순서는 참고용이다.
1. `src/lib/assessmentData.ts` (카탈로그 정리 + 신규 상수, 다른 모든 변경의 기반)
2. `src/lib/phase2dData.ts` (weekly-suneung 제거)
3. `src/components/AssessmentFormModal.tsx` (1에 의존)
4. `src/pages/teacher/TeacherExams.tsx` / `TeacherExamScores.tsx` / `TeacherGrades.tsx` /
   `TeacherExamGradingGuard.tsx` / `TeacherHome.tsx` (1에 의존, 병렬 적용 가능)
5. `src/pages/student/StudentMockExams.tsx` / `src/pages/parent/ParentMockExams.tsx`
6. `src/pages/student/StudentWeeklyMocks.tsx` / `src/pages/parent/ParentWeeklyMocks.tsx`
7. `src/routes/StudentRoutes.tsx` / `src/routes/ParentRoutes.tsx` (주석만)
8. `src/lib/teacherMockExamInput.ts` / `src/pages/teacher/TeacherUniversityData.tsx`
9. `docs/*` 문서 갱신

적용 후 로컬에서 `npm install && npm run typecheck && npm run build` 1회 실행 필수.

---

## Phase 3D v3-r6 — 적용 순서

전체 프로젝트 zip을 GitHub Desktop으로 업로드하므로 개별 적용 순서는 참고용이다.
1. `package.json` (xlsx 의존성 — 다른 모든 것의 전제조건, 적용 후 `npm install` 필요)
2. `src/lib/scoreExportEngine.ts` (신규, 의존 없음)
3. `src/lib/rbac.ts` (canExportAcademyWideScores 추가)
4. `src/index.css` (드래그 모달 애니메이션 + 인쇄 스타일)
5. `src/components/ScoreExportPanel.tsx` (2에 의존)
6. `src/pages/ScoreExportPage.tsx` / `src/pages/teacher/TeacherScoreExport.tsx` (5에 의존)
7. `src/routes/AdminRoutes.tsx` / `src/routes/TeacherRoutes.tsx` (6, TeacherClassRoster에 의존)
8. `src/pages/teacher/TeacherClassRoster.tsx` (신규)
9. `src/components/AdminLayout.tsx` (3에 의존)
10. `src/pages/EmployeeList.tsx` / `src/pages/growth/EmblemManagement.tsx`(4에 의존) /
    `src/pages/growth/RivalManagement.tsx` / `src/pages/teacher/TeacherClasses.tsx` /
    `src/pages/teacher/TeacherExams.tsx` / `src/pages/student/StudentGrades.tsx`
11. `docs/*` 문서 갱신

적용 후 로컬에서 `npm install`(신규 xlsx 패키지 설치 확인) `&& npm run typecheck &&
npm run build` 1회 실행 필수.

---

## Phase 3D v3-r7 — 적용 순서

전체 프로젝트 zip을 GitHub Desktop으로 업로드하므로 개별 적용 순서는 참고용이다.
1. `src/lib/assessmentData.ts` (공용 헬퍼, 다른 모든 것의 전제조건)
2. `src/contexts/AssessmentContext.tsx` (1에 의존)
3. `src/pages/teacher/TeacherHome.tsx` / `TeacherExams.tsx` / `TeacherExamScores.tsx` (1에 의존)
4. `src/layouts/TeacherLayout.tsx` / `StudentLayout.tsx` / `ParentLayout.tsx` (독립)
5. `src/pages/teacher/TeacherClasses.tsx` / `TeacherExams.tsx`(폭 조정) /
   `src/pages/student/StudentGrades.tsx` / `src/pages/parent/ParentHome.tsx` (4에 의존)
6. `src/components/AdminLayout.tsx` (독립)
7. `src/pages/StudentDetail.tsx` / `src/pages/growth/GrowthOverview.tsx` (6에 의존)
8. `src/pages/ClassList.tsx` 외 테이블 표준화 대상 11개 파일 (독립, 병렬 적용 가능)
9. `docs/*` 문서 갱신

적용 후 로컬/CI에서 `npm run typecheck && npm run build` 통과 필수(이번 라운드는 GitHub
Actions Build Check가 최종 검증 기준).

---

## Phase 3D v3-r7-r1 — 적용 순서

전체 프로젝트 zip을 GitHub Desktop으로 업로드하므로 개별 적용 순서는 참고용이다.
1. `src/lib/assessmentData.ts` (헬퍼 주석 정리)
2. `src/contexts/AssessmentContext.tsx` (1에 의존, 초기값 원복)
3. `src/pages/teacher/TeacherExamGrading.tsx`(불변 해제, 헬퍼 적용 + 레이아웃) /
   `TeacherExamGradingGuard.tsx` / `TeacherExamScores.tsx` / `AssessmentDetail.tsx` /
   `AssessmentList.tsx` (1에 의존)
4. `src/pages/growth/GrowthOverview.tsx` (독립, 재작성)
5. `src/pages/teacher/TeacherHome.tsx` / `TeacherStudentDetail.tsx` /
   `src/pages/student/StudentHome.tsx` / `StudentGrades.tsx` /
   `src/pages/parent/ParentHome.tsx` (레이아웃 재구성, 독립)
6. `src/pages/LoginPage.tsx` (독립, 전면 재설계)
7. 57개 파일 전역 색상 치환 (독립, 병렬 적용 가능)
8. `docs/*` 문서 갱신

적용 후 `npm run typecheck && npm run build` 통과 필수 — GitHub Actions Build Check가
최종 검증 기준.
