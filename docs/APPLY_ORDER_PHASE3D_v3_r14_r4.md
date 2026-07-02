# APPLY ORDER — Phase 3D v3-r14-r4 (Student Growth / Rival / Emblem Premium UI Cleanup)

기준: v3-r14-r3(엠블럼 PNG 69개 전수조사 재작업본) + v3-r15-r1(내신 대비 운영 가이드
엔진, 이미 반영됨) 위에 적용.

## 1) 사전 확인

- `src/assets/emblems/` PNG 개수가 **69개**인지 확인.
- v3-r15-r1 파일 5종이 이미 반영되어 있는지 확인(examPrepGuideTypes.ts /
  examPrepGuideEngine.ts / examPrepGuideStore.ts / ExamPrepGuidePanel.tsx /
  AssessmentDetail.tsx의 `mock-school` 탭 분기).
- 불변 파일 3종 MD5 확인:
  - `src/lib/universityAnalysisAdapter.ts` = `1eddaef5cf427e00666be685ea16f32f`
  - `src/App.tsx` = `387bbf48a3d87ff63ce10d6dbc8bf33c`
  - `src/lib/classData.ts` = `126d9e5e314de186bf1df0a63b3abf82`

## 2) 파일 반영 (순서 무관 — 서로 독립적인 화면 6개)

1. `src/components/growth/RivalMatchupCard.tsx`
2. `src/pages/student/StudentRival.tsx`
3. `src/pages/student/StudentGrowthShowcase.tsx`
4. `src/pages/student/StudentMyPage.tsx`
5. `src/pages/growth/RivalManagement.tsx`
6. `src/pages/growth/GrowthOverview.tsx`

## 3) 반영 직후 필수 재확인

- [ ] `src/assets/emblems/**` — 이번 반영 전후로 diff 0건(추가/삭제/수정 없음).
- [ ] `src/lib/growthData.ts` / `AxisEmblemImageBadge.tsx` / `AxisTierMedallion.tsx` — MD5
      반영 전후 동일.
- [ ] `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` — 로컬에서 `npm run
      typecheck`/`build`를 실행했다면 이 두 파일이 재생성될 수 있다. `git status`에서
      추적되지 않는지(`.gitignore`의 `*.tsbuildinfo`) 확인하고, 실수로 `git add -f` 하지
      않는다.
- 위 중 하나라도 어긋나면 되돌리고 재작업한다(지시서 원칙).

## 4) 빌드/검증

- `npm install`
- `npm run typecheck` (`tsc -b --noEmit`)
- `npm run build` (`tsc -b && vite build`)
- GitHub Desktop → Commit(Summary: `Phase 3D v3-r14-r4: refine student growth rival
  emblem premium PC UI`) → Push → **GitHub Actions Build Check 그린 확인**

## 5) 반영 후 수동 확인 포인트(요약 — 전체 체크리스트는 QA 문서)

- `/student/rival` — PC 폭(≥1280px)에서 매치업 카드가 좌/VS/우 3열로 나란히 서고, 주간
  추이 차트가 항상 보이는지.
- 브라우저 폭을 900~1023px 사이로 좁혀도 텍스트/아바타가 눌리거나 잘리지 않는지(md
  미만에서는 세로로 쌓이는 것이 정상 동작).
- `/student/rival`의 "유사 수준 비교" 막대그래프 높이가 값 비율대로 정상적으로 그려지는지.
- `/student/growth`, `/student/my`의 엠블럼 이미지가 잘리거나 흐려 보이지 않고 이전보다
  크게/선명하게 보이는지.
- `/growth/rivals`(관리자)에 칼 아이콘이나 강한 빨간 배지가 남아있지 않은지.
- `/growth/overview`(관리자) 통계 카드 색이 AXIS 톤(네이비/골드/틸/앰버)으로 통일됐는지.
