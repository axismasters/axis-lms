# MODIFIED FILES — Phase 3D v3-r11

기준: v3-r10-r3 → v3-r11 · 원본 대비 `diff -rq`로 확정 · **총 10개 파일 변경, 신규/삭제 없음**

| # | 파일 | 변경 유형 | 요약 | MD5 (v3-r11) |
|---|------|-----------|------|--------------|
| 1 | `src/lib/growthData.ts` | 데이터/주석 | streak 주석, RIVAL 엠블럼 4종 이름·설명·조건, SP 사유 2건 성장 언어화 | `c923e1e60e57a221db6880e690d27e9e` |
| 2 | `src/lib/rivalSeasonData.ts` | 데이터/주석 | 시즌 streakBonus/revengeBonus/emblemCondition 표시 문자열 성장 언어화 | `8249a07df563aca35d9780f7d8ef298b` |
| 3 | `src/lib/studentBriefingEngine.ts` | 문자열 | 교사 브리핑 "전적 N승 N패" → "성장 비교 N회 우위·N회 보완 흐름" | `71795c2a0b076c70ca5281717a65eda7` |
| 4 | `src/pages/growth/GrowthOverview.tsx` | 주석 | 내부 주석 "라이벌 승패" → "라이벌 성장 비교" (동작 불변) | `895d76dd297fb5f567b2c776a81de2ba` |
| 5 | `src/pages/growth/RivalManagement.tsx` | UI 문자열 | 설명문/테이블 헤더/streak 셀 라벨 성장 언어화 | `6336eac03003929a926193cd23586b66` |
| 6 | `src/pages/growth/RivalSeasonManagement.tsx` | UI 문자열 | 기준/보상/폼 라벨·기본값·안내문 성장 언어화 | `be72435ecd21948849db07d747cdc9ce` |
| 7 | `src/pages/growth/ShowcasePolicyManagement.tsx` | UI 문자열 | 정책 설명 "승패 요약" → "성장 비교 요약" | `03975fba41401b775c71a9c3ce1d6ef5` |
| 8 | `src/pages/settings/PermissionSettings.tsx` | UI 문자열 | 권한 feature 라벨 "승패 관리" → "성장 비교 관리" | `fe054e8bc39f6545de996b74dbab5bb1` |
| 9 | `src/pages/teacher/TeacherStudentGrowth.tsx` | 레이아웃 | 본문 데스크톱 확장(lg:max-w-6xl) + 학생 카드 2컬럼 | `0c1f0b2372b2fdbd790b410ea386cd27` |
| 10 | `src/routes/ParentRoutes.tsx` | 주석 | `/parent/growth` 목적 오기술 주석 재작성(§4.2) | `c80c5ee1cdee555b946805fc1671934c` |

## 불변 파일 (변경 없음 — MD5 유지 확인)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

> 참고: 검증 하네스(`_check/`)는 프로젝트 밖에 위치하며 본 배포 zip에 포함되지 않는다.
