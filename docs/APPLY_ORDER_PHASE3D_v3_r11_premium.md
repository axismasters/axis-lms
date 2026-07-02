# APPLY ORDER — Phase 3D v3-r11 (Premium Growth UI / Emblem / PC Layout Cleanup)

기준: v3-r10-r3 + 선행 v3-r11(growth-motivation-cleanup) 위에 적용.
컴포넌트 신설(AxisEmblemPlaque)이 있으므로 **순서가 중요**하다 — 아래 순서를 지킬 것.

## 1) 사전 확인
- 선행 v3-r11(growth-motivation-cleanup) 10개 파일이 이미 반영되어 있는지 확인
  (`APPLY_ORDER_PHASE3D_v3_r11.md` 참고). 아직이면 그것부터 먼저 적용.
- 불변 파일 MD5 3종 확인.

## 2) 신규 파일 먼저 추가
1. `src/components/brand/AxisEmblemPlaque.tsx` (신규 — 다른 파일이 이걸 import함)

## 3) 기존 파일 반영
2. `src/components/brand/AxisEmblemBadge.tsx` (전면 재작성)
3. `src/components/growth/RivalMatchupCard.tsx`
4. `src/pages/student/StudentGrowthShowcase.tsx` (AxisEmblemPlaque를 import — 반드시 2번
   이후 적용)
5. `src/pages/parent/ParentGrowthReport.tsx`
6. `src/pages/growth/RivalSeasonManagement.tsx`
7. `src/pages/growth/ShowcasePolicyManagement.tsx`

## 4) 빌드/검증
- `npm install`
- `npm run typecheck`
- `npm run build`
- GitHub Desktop → Commit → Push → **GitHub Actions Build Check 그린 확인**

## 5) 배포 후 스모크 (스테이징)
- `QA_PHASE3D_v3_r11_premium.md`의 B1~B6 수동 체크리스트 수행.
- 특히 **성장 진열장 대표/보유/다음목표 3섹션**과 **엠블럼 배지가 20px 초소형에서도 뭉개지지
  않는지**를 최우선 확인.

## 롤백
- 이번 패스 7개 변경 + 1개 신규 파일을 되돌리면(신규 파일은 삭제) 선행 v3-r11
  (growth-motivation-cleanup) 상태로 완전 원복. 데이터 계약/스키마 변경 없음.
