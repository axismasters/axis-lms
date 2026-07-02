# CHANGES — Phase 3D v3-r11 (Growth Motivation Final QA / Residual Cleanup)

AXIS LMS v1.2 · React/TypeScript/Vite/Tailwind/wouter
기준 베이스: **v3-r10-r3**
성격: **잔여 정리(QA/Cleanup)** — 신규 기능 없음, r10-r3 구조 되돌림 없음.

---

## 0. 요약

성장동기 시스템(Rival·Emblem·SP·Tier)의 잔여 문제 3종을 정리했다.

1. **게임식/전투 언어 잔재 정리** — 화면에 보이는 "승/패·승률·연승·연패·챔피언·대결·리벤지·전적" 등 전투 표현을 AXIS 성장 언어(성장 우위/보완/성장 우위 비율/연속 상승·보완 흐름/성장 매치업/성장 하이라이트/재도전)로 통일.
2. **학부모 화면 목적을 잘못 설명하는 주석 정리** — `자녀 성장 리포트`를 `Tier/Emblem/SP/IF 요약`으로 오기술한 라우트 주석을 실제 목적(테스트 변화·출결 흐름·학습 습관·보완 필요도·선생님 공개 코멘트)에 맞게 재작성.
3. **PC 레이아웃 잔재 1건** — 교사 "학생 성장 현황" 화면이 데스크톱에서도 `max-w-lg`로 갇혀 있던 것을 반응형(`lg:max-w-6xl`)으로 확장하고, 학생 성장 카드 목록을 데스크톱 2컬럼으로 정리.

**범위 원칙**: 데이터 필드명(`rivalWins`/`rivalLosses`/`winRate`/`streak`/`winCondition`/`loseCondition`/`spReward.win|loss|draw`)은 유지하고 **화면에 보이는 텍스트만** relabel. 헌법 하드밴(전투언어의 학생·학부모 노출)은 물론, 관리자 화면 표현까지 성장 언어로 통일해 브랜드 일관성을 확보.

---

## 1. 게임/전투 언어 정리 (§4.1)

### 1-1. `src/lib/growthData.ts`
- `RivalRelation.streak` 필드 주석: `// 양수: 연승, 음수: 연패` → `// 양수: 연속 상승 흐름, 음수: 보완 흐름 (내부 비교 데이터)` (필드 자체는 유지)
- 구 RIVAL 엠블럼 4종의 **이름/설명/조건문** 성장 언어로 재작명 (id·category·material·requiredCount 등 데이터 키는 유지):
  - `emb-012` 첫 승리 → **첫 성장 비교** (desc: 성장 매치업에서 첫 성장 우위 / cond: 성장 매치업 1회 우위)
  - `emb-013` 연승 질주 → **연속 상승 흐름** (desc: 성장 매치업 3회 연속 상승 / cond: 성장 매치업 3회 연속 우위)
  - `emb-014` 라이벌 챔피언 → **성장 하이라이트** (desc: 성장 매치업 누적 10회 우위 / cond: 성장 매치업 누적 10회 이상 우위)
  - `emb-023` 리벤지 성공 → **재도전 성장** (desc: 보완 흐름에서 상승 흐름으로 전환 / cond: 보완 흐름 후 3회 연속 상승)
- SP 원장(MOCK_SP_LOGS) 사유 문자열 2건을 위 개명에 맞춰 갱신:
  - `spl-003` "엠블럼 획득: 라이벌 챔피언" → "엠블럼 획득: 성장 하이라이트"
  - `spl-009` "엠블럼 획득: 첫 승리" → "엠블럼 획득: 첫 성장 비교"

### 1-2. `src/pages/growth/RivalManagement.tsx` (관리자 전용)
- 화면 설명문 "승패 기록을 관리" → "성장 비교 기록을 관리"
- 테이블 헤더 `승 / 패 / 승률 / 연승·연패` → `성장 우위 / 보완 / 성장 우위 비율 / 연속 흐름`
- streak 셀 표시 `N연승 / N연패` → `N회 연속 상승 / N회 보완 흐름`
- (데이터: `profile.rivalWins`·`rivalLosses`·`relation.winRate`·`relation.streak` 그대로 사용, 라벨만 변경)

### 1-3. `src/pages/growth/RivalSeasonManagement.tsx` (관리자 전용)
- 섹션 타이틀 "승패 기준" → "성장 비교 기준", 조건 라벨 `WIN/LOSE/무승부` → `우위/보완/대등`
- 보상 라벨 `SP 승리/패배/무` → `SP 우위/보완/대등`, `연승 보너스/복수 보너스` → `연속 상승 보너스/재도전 보너스`
- 시즌 생성 폼: SP 입력 라벨 `승리/패배/무승부` → `우위/보완/대등`, `연승/복수 성공 보너스 설명` → `연속 상승/재도전 성공 보너스 설명`
- 폼 기본값 문자열 및 "기록 보관 안내"의 "승패 기록" → "성장 비교 기록"

### 1-4. `src/lib/rivalSeasonData.ts` (RivalSeasonManagement 표시 데이터)
- `streakBonus`/`revengeBonus`/`emblemCondition` 표시 문자열 및 주석의 연승→연속 상승, 복수→재도전, 패배→보완, 승률→성장 우위 비율, `Rival Conqueror`/`Fall Champion` → `성장 하이라이트`로 통일 (`winCondition`/`loseCondition`/`drawCondition`/`spReward` 필드 및 값은 유지)

### 1-5. `src/pages/growth/ShowcasePolicyManagement.tsx`
- 정책 항목 설명 "진열장 내 Rival 탭에 승패 요약 표시" → "…성장 비교 요약 표시"

### 1-6. `src/pages/settings/PermissionSettings.tsx`
- 권한 매트릭스 feature 라벨 "라이벌 관계/승패 관리" → "라이벌 관계/성장 비교 관리" (권한 키 `growth.rivalManage`는 유지)

### 1-7. `src/lib/studentBriefingEngine.ts` (교사 상담 브리핑)
- 브리핑 문장 "Rival 전적 N승 N패로…" → "Rival 성장 비교에서 N회 우위 · N회 보완 흐름으로…" (`rivalWins`/`rivalLosses` 입력값 유지)

### 1-8. `src/pages/growth/GrowthOverview.tsx` (관리자, 주석)
- 화면 목적을 설명하는 내부 주석 2곳의 "라이벌 승패" → "라이벌 성장 비교"로 통일 (동작 변화 없음)

---

## 2. 학부모 화면 주석 정리 (§4.2)

### `src/routes/ParentRoutes.tsx`
- `/parent/growth` 라우트 주석을 실제 목적에 맞게 재작성:
  - 변경 전: `자녀 성장 리포트 (Tier/Emblem/SP/IF 요약)` — 학부모 화면 목적을 게임형 지표로 오기술
  - 변경 후: `자녀 성장 리포트 — 테스트 변화 · 출결 흐름 · 학습 습관 · 보완 필요도 · 선생님 공개 코멘트 요약. Rival/Emblem/SP/Tier 등 학생용 게임형 지표는 학부모 화면에 노출하지 않는다.`

> 확인: 학부모 페이지(`src/pages/parent/*`) 전반에는 Rival/Emblem/SP/Tier 실렌더링이 없으며, 남은 언급은 전부 "노출 금지/미포함"을 명시한 가드 주석이다(정상).

---

## 3. PC 레이아웃 잔재 정리 (§4.3)

### `src/pages/teacher/TeacherStudentGrowth.tsx` ("학생 성장 현황")
- 본문 wrapper `max-w-lg mx-auto` → `max-w-lg lg:max-w-6xl mx-auto` (모바일 폭 유지, 데스크톱 확장)
- 학생 성장 카드 목록 `space-y-3` → `space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3` (데스크톱에서 한 열로 길게 내려가던 것을 2컬럼으로)

> 대상 화면 전수 점검 결과, 이외의 `max-w-*`/`mx-auto`는 전부 정상(모바일 좁게·데스크톱 `lg:max-w-6xl` 반응형, 모달, 빈 상태/권한거부 카드)으로 확인되어 손대지 않음.

---

## 4. 헌법/불변 준수

- 불변 파일 MD5 3종 **변경 없음(검증 완료)**:
  - `src/lib/universityAnalysisAdapter.ts` = `1eddaef5cf427e00666be685ea16f32f`
  - `src/App.tsx` = `387bbf48a3d87ff63ce10d6dbc8bf33c`
  - `src/lib/classData.ts` = `126d9e5e314de186bf1df0a63b3abf82`
- 학생 화면 금융/수납 노출: 0건 (재확인)
- 학생/학부모 화면 전투언어·게임지표 실노출: 0건 (재확인)
- 금지표현(합격률/합격 가능성/합격 보장/안정 합격/불합격): UI 노출 0건 — 관련 문자열은 전부 "…는 포함하지 않는다" 가드 주석 (`universityAnalysisAdapter.ts`(불변)/`assessmentData.ts`/`universityAnalysisClient.ts`)

---

## 5. §GPT(개발 총괄)에게 전달할 의견

1. **RivalSeason 승/패 운영 데이터 모델은 이번에 "언어만" 정리, 구조는 미변경.**
   `winCondition`/`loseCondition`/`drawCondition`/`spReward.win|loss|draw` 등은 "성장 비교" 세션 설정의 핵심 운영 필드라 이름을 바꾸면 계약 변경이 된다. v3-r11은 잔여 정리 범위이므로 **표시 텍스트만** 성장 언어로 통일했다. 원하면 향후 전용 패스에서 필드 시맨틱까지 "우위/보완/대등" 모델로 완전 재언어화할 수 있다(관리자 전용이라 학생/학부모 영향 없음).

2. **구 RIVAL 엠블럼(emb-012/013/014/023)은 학생 화면에서 이미 비노출.**
   `StudentGrowthShowcase`의 갤러리 필터가 `e.family` 존재를 요구하는데(`emblems.filter(e => e.active && e.family && e.family !== 'LIFE')`), 구 엠블럼에는 `family` 필드가 없어 학생 진열장에서 제외된다. 이번 개명은 주로 **관리자 EmblemManagement/GrowthOverview 카탈로그 표시**를 위한 것. 향후 구 엠블럼을 신규 카탈로그 체계로 흡수(또는 명시적 폐기)할지 결정 필요.

3. **오프라인 타입 검증 하네스 사용.**
   네트워크 제한(레지스트리 접근 불가)으로 `npm run build` 로컬 실행이 불가하여, 프로젝트 밖(`_check/`, zip 미포함)에 스텁 기반 `tsc` 하네스를 두고 회귀만 diff한다. baseline 57건은 전부 Finance/Assessment 등 **비대상 파일**의 스텁 한계 false positive(실 CI `@types` 하에서는 사라짐)이며, 이번 편집으로 **신규 오류 0건**을 확인했다. 최종 신뢰 검증은 GitHub Actions Build Check로 확정 바람.

4. **내부 전용 주석 일부는 의도적으로 유지.**
   `rivalMatchupEngine.ts`/`ifAnalysisEngine.ts`/`rbac.ts`/`AdminLayout.tsx`의 "승패" 언급은 내부 로직/권한을 정확히 기술하는 주석이라(UI·학부모 오해와 무관) 이번 범위에서 건드리지 않았다. 브랜드 일관성 차원에서 정리를 원하면 후속 소규모 패스로 가능.
